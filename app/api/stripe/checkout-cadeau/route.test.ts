import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { sessionsCreateMock } = vi.hoisted(() => ({
  sessionsCreateMock: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: { checkout: { sessions: { create: sessionsCreateMock } } },
}));

const { POST } = await import("./route");

function requete(origin: string) {
  return new Request("http://localhost/api/stripe/checkout-cadeau", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({ destinataire_prenom: "Jeanne", offrant_nom: "Paul" }),
  }) as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionsCreateMock.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test_xyz" });
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://racontez-moi.com");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/stripe/checkout-cadeau", () => {
  // Constat B-1 de l'audit de clôture (27/10/2026) : l'adresse de retour
  // reprenait l'en-tête Origin, ce qui permettait de détourner session_id
  // (et donc le code cadeau affiché sur /offrir/merci) vers un autre site.
  it("n'utilise jamais une origine étrangère dans les adresses de retour", async () => {
    await POST(requete("https://site-piege.example"));

    const params = sessionsCreateMock.mock.calls[0][0];
    expect(params.success_url).toBe("https://racontez-moi.com/offrir/merci?session_id={CHECKOUT_SESSION_ID}");
    expect(params.cancel_url).toBe("https://racontez-moi.com/offrir?cadeau=annule");
  });

  it("garde l'origine du site", async () => {
    await POST(requete("https://racontez-moi.com"));

    expect(sessionsCreateMock.mock.calls[0][0].success_url).toMatch(/^https:\/\/racontez-moi\.com\/offrir\/merci/);
  });
});
