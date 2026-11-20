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

describe("envoyerEmailCodeCadeau", () => {
  it("envoie le code et les deux liens du certificat, cliquables, prénom échappé en HTML", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 201 }));

    const { envoyerEmailCodeCadeau } = await import("./email-client");
    expect(await envoyerEmailCodeCadeau("offrant@example.com", "ABCD2345", "Mamie <Jo>")).toBe(true);

    const corps = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(corps.to).toEqual([{ email: "offrant@example.com" }]);
    expect(corps.textContent).toContain("Voici le code d'activation pour Mamie <Jo> : ABCD2345");
    expect(corps.htmlContent).toContain('<a href="https://racontez-moi.com/api/cadeau/certificat/ABCD2345/pdf">');
    expect(corps.htmlContent).toContain('<a href="https://racontez-moi.com/activer">');
    expect(corps.htmlContent).toContain("Mamie &lt;Jo&gt;");
    expect(corps.htmlContent).not.toContain("<Jo>");
  });

  it("sans prénom, une formule neutre", async () => {
    const { texteCodeCadeau } = await import("./email-client");
    expect(texteCodeCadeau("ABCD2345", " ")).toContain("pour la personne à qui vous l'offrez : ABCD2345");
  });
});

describe("envoyerEmailBienvenueCadeau", () => {
  it("ne parle ni de relevé bancaire ni de remboursement", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 201 }));

    const { envoyerEmailBienvenueCadeau } = await import("./email-client");
    expect(await envoyerEmailBienvenueCadeau("recoit@example.com")).toBe(true);

    const corps = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(corps.textContent).toContain("Votre cadeau est activé");
    expect(corps.textContent).not.toContain("relevé");
    expect(corps.textContent).not.toContain("remboursé");
  });
});
