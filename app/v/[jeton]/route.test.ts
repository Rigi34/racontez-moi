import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

// Écoute publique par QR code (chantier VOIX-CHOISIE) : interrupteur, format
// du jeton vérifié avant toute requête, plafond par IP, extrait actif
// uniquement, URL signée courte.
const { quotaMock, maybeSingleMock, signedUrlMock, eqMock } = vi.hoisted(() => ({
  quotaMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  signedUrlMock: vi.fn(),
  eqMock: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({ extraireIp: () => "1.2.3.4", verifierQuotaAnonyme: quotaMock }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: () => ({
      select: () => ({
        eq: (col: string, val: unknown) => {
          eqMock(col, val);
          return { eq: (c2: string, v2: unknown) => { eqMock(c2, v2); return { maybeSingle: maybeSingleMock }; } };
        },
      }),
    }),
    storage: { from: () => ({ createSignedUrl: signedUrlMock }) },
  })),
}));

const { GET } = await import("./route");

const JETON = "AbCdEfGhIjKlMnOpQrStUv";
const appel = (jeton: string) =>
  GET(new Request(`http://localhost/v/${jeton}`) as unknown as NextRequest, { params: Promise.resolve({ jeton }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_VOIX_CHOISIE", "1");
  quotaMock.mockResolvedValue(true);
  maybeSingleMock.mockResolvedValue({ data: { chemin_stockage: "u/f/x.webm" } });
  signedUrlMock.mockResolvedValue({ data: { signedUrl: "https://stockage.example/signed" } });
});
afterEach(() => vi.unstubAllEnvs());

describe("GET /v/[jeton]", () => {
  it("répond « indisponible » tant que l'interrupteur est coupé, sans toucher la base", async () => {
    vi.stubEnv("NEXT_PUBLIC_VOIX_CHOISIE", "");
    const res = await appel(JETON);
    expect(res.status).toBe(404);
    expect(quotaMock).not.toHaveBeenCalled();
    expect(maybeSingleMock).not.toHaveBeenCalled();
  });

  it("rejette un jeton mal formé avant toute requête", async () => {
    const res = await appel("pas-un-jeton");
    expect(res.status).toBe(404);
    expect(quotaMock).not.toHaveBeenCalled();
  });

  it("applique le plafond quotidien par IP (429)", async () => {
    quotaMock.mockResolvedValue(false);
    const res = await appel(JETON);
    expect(res.status).toBe(429);
    expect(maybeSingleMock).not.toHaveBeenCalled();
  });

  it("ne sert que les extraits actifs, et renvoie « indisponible » sinon", async () => {
    maybeSingleMock.mockResolvedValue({ data: null });
    const res = await appel(JETON);
    expect(res.status).toBe(404);
    expect(eqMock).toHaveBeenCalledWith("jeton", JETON);
    expect(eqMock).toHaveBeenCalledWith("actif", true);
  });

  it("redirige vers une URL signée de 10 minutes, sans mise en cache", async () => {
    const res = await appel(JETON);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://stockage.example/signed");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(signedUrlMock).toHaveBeenCalledWith("u/f/x.webm", 600);
  });
});
