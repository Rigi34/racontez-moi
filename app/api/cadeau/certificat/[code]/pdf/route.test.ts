import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// A-2026-09-12-03 : plafond quotidien par IP sur le certificat cadeau par
// code, vérifié avant la recherche du code et avant toute compilation.
const { quotaMock, maybeSingleMock, pdfMock } = vi.hoisted(() => ({
  quotaMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  pdfMock: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({ extraireIp: () => "1.2.3.4", verifierQuotaAnonyme: quotaMock }));
vi.mock("@/lib/certificat", () => ({ compilerCertificatPdf: pdfMock }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }) }),
  })),
}));

const { GET } = await import("./route");
const appel = (code: string) =>
  GET(new Request(`http://localhost/api/cadeau/certificat/${code}/pdf`) as unknown as NextRequest, {
    params: Promise.resolve({ code }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  quotaMock.mockResolvedValue(true);
  maybeSingleMock.mockResolvedValue({ data: { destinataire_prenom: "Monique", offrant_nom: "Paul", message: null } });
  pdfMock.mockReturnValue(new Uint8Array([37, 80, 68, 70]));
});

describe("GET /api/cadeau/certificat/[code]/pdf", () => {
  it("429 au-delà du plafond, sans chercher le code ni compiler", async () => {
    quotaMock.mockResolvedValue(false);
    const res = await appel("ABCD2345");
    expect(res.status).toBe(429);
    expect(quotaMock).toHaveBeenCalledWith(expect.anything(), "1.2.3.4", "certificat_code");
    expect(maybeSingleMock).not.toHaveBeenCalled();
    expect(pdfMock).not.toHaveBeenCalled();
  });

  it("fail-closed : 500 si la vérification du quota échoue", async () => {
    quotaMock.mockRejectedValue(new Error("base injoignable"));
    const res = await appel("ABCD2345");
    expect(res.status).toBe(500);
    expect(pdfMock).not.toHaveBeenCalled();
  });

  it("sous le plafond : sert le PDF du code", async () => {
    const res = await appel("ABCD2345");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(pdfMock).toHaveBeenCalledTimes(1);
  });
});
