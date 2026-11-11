import { describe, it, expect, vi, beforeEach } from "vitest";
import { envoyerEmailBienvenuePaiement } from "./email-client";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

beforeEach(() => {
  fetchMock.mockReset();
});

describe("envoyerEmailBienvenuePaiement", () => {
  it("envoie depuis bonjour@racontez-moi.com au client, en texte et en HTML", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 201 }));

    const ok = await envoyerEmailBienvenuePaiement("client@example.com");

    expect(ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    const corps = JSON.parse(init.body);
    expect(corps.sender.email).toBe("bonjour@racontez-moi.com");
    expect(corps.replyTo.email).toBe("bonjour@racontez-moi.com");
    expect(corps.to).toEqual([{ email: "client@example.com" }]);
    expect(corps.subject).toBe("Bienvenue dans Racontez-moi");
    expect(corps.textContent).toContain("COHÉRENCE* RACONTEZ");
    expect(corps.htmlContent).toContain('<a href="https://racontez-moi.com/tableau-de-bord">');
  });

  it("renvoie false sans lever d'erreur si Brevo refuse ou si le réseau échoue", async () => {
    fetchMock.mockResolvedValueOnce(new Response("refus", { status: 400 }));
    expect(await envoyerEmailBienvenuePaiement("client@example.com")).toBe(false);

    fetchMock.mockRejectedValueOnce(new Error("réseau"));
    expect(await envoyerEmailBienvenuePaiement("client@example.com")).toBe(false);
  });
});
