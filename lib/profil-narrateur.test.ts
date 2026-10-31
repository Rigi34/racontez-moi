import { describe, it, expect, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";

vi.mock("@anthropic-ai/sdk", () => ({ default: class {} }));

const { extrairePrenom } = await import("./profil-narrateur");

function modele(texte: string) {
  const create = vi.fn().mockResolvedValue({ content: [{ type: "text", text: texte }] });
  return { client: { messages: { create } } as unknown as Anthropic, create };
}

// Test vocal du 31/10/2026 : la phrase dictée entière s'affichait comme prénom.
describe("extrairePrenom", () => {
  it("garde une réponse courte telle quelle, sans appeler le modèle", async () => {
    const { client, create } = modele("");
    expect(await extrairePrenom(client, " Régis. ")).toBe("Régis");
    expect(await extrairePrenom(client, "Jean-Pierre")).toBe("Jean-Pierre");
    expect(create).not.toHaveBeenCalled();
  });

  it("confie une phrase au modèle et n'en garde que le prénom", async () => {
    const { client, create } = modele("Régis");
    const phrase = "Alors j'aimerais qu'on m'appelle par mon prénom, Régis, c'est comme ça qu'on m'appelle.";
    expect(await extrairePrenom(client, phrase)).toBe("Régis");
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("ne garde jamais une phrase, même si le modèle en renvoie une", async () => {
    const { client } = modele("Il voudrait qu'on l'appelle Régis");
    expect(await extrairePrenom(client, "Une longue phrase sans prénom clair dedans.")).toBe("");
  });

  it("renvoie une chaîne vide quand le modèle ne trouve aucun prénom", async () => {
    const { client } = modele("AUCUN");
    expect(await extrairePrenom(client, "Je ne sais pas trop, comme vous voulez.")).toBe("");
  });

  it("renvoie une chaîne vide si l'appel au modèle échoue", async () => {
    const erreurSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const create = vi.fn().mockRejectedValue(new Error("panne"));
    const client = { messages: { create } } as unknown as Anthropic;
    expect(await extrairePrenom(client, "Appelez-moi comme vous voulez, vraiment.")).toBe("");
    erreurSpy.mockRestore();
  });
});
