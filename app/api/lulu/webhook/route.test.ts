import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { signatureMock } = vi.hoisted(() => ({ signatureMock: vi.fn() }));
vi.mock("@/lib/lulu", async (orig) => ({
  ...(await orig<typeof import("@/lib/lulu")>()),
  signatureWebhookLuluValide: signatureMock,
}));

import { POST } from "./route";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

function requete(charge: unknown) {
  return new NextRequest("https://racontez-moi.com/api/lulu/webhook", {
    method: "POST",
    body: JSON.stringify(charge),
    headers: { "Lulu-HMAC-SHA256": "sig" },
  });
}

beforeEach(() => {
  signatureMock.mockReset().mockReturnValue(true);
  fetchMock.mockReset().mockResolvedValue(new Response("{}", { status: 201 }));
});

describe("POST /api/lulu/webhook", () => {
  it("refuse une signature invalide sans envoyer d'e-mail", async () => {
    signatureMock.mockReturnValue(false);
    const res = await POST(requete({ topic: "PRINT_JOB_STATUS_CHANGED", data: { id: 1, status: { name: "REJECTED" } } }));
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("n'envoie rien pour un statut normal", async () => {
    const res = await POST(requete({ topic: "PRINT_JOB_STATUS_CHANGED", data: { id: 1, status: { name: "SHIPPED" } } }));
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envoie une alerte à Régis quand Lulu rejette la commande", async () => {
    const res = await POST(
      requete({ topic: "PRINT_JOB_STATUS_CHANGED", data: { id: 1234, status: { name: "REJECTED", messages: { error: "<b>fichier</b> invalide" } } } })
    );
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    const envoi = JSON.parse(init.body);
    expect(envoi.to).toEqual([{ email: "regis@coherencelab.fr" }]);
    expect(envoi.subject).toContain("1234");
    expect(envoi.subject).toContain("REJECTED");
    expect(envoi.htmlContent).not.toContain("<b>fichier</b>");
  });

  it("renvoie 500 si l'e-mail échoue, pour que Lulu réessaie", async () => {
    fetchMock.mockResolvedValue(new Response("panne", { status: 500 }));
    const res = await POST(requete({ topic: "PRINT_JOB_STATUS_CHANGED", data: { id: 1, status: { name: "ERROR" } } }));
    expect(res.status).toBe(500);
  });

  it("ignore les autres sujets", async () => {
    const res = await POST(requete({ topic: "AUTRE", data: { id: 1, status: { name: "REJECTED" } } }));
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
