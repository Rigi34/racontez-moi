import { describe, it, expect, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { composerFragment, finitParUnePonctuation, genererResumeSession } from "./redaction";

function mockAnthropic(texte: string, stopReason: string = "end_turn") {
  const create = vi.fn().mockResolvedValue({
    content: [{ type: "text", text: texte }],
    stop_reason: stopReason,
  });
  return { messages: { create } } as unknown as Anthropic;
}

const TOURS = [
  { question: "Où êtes-vous né ?", reponse: "À Lyon, en 1950." },
  { question: "Quel souvenir sensoriel gardez-vous de cette ville ?", reponse: "L'odeur du pain chaud le matin." },
];

describe("composerFragment", () => {
  it("retourne le texte du fragment, sans espaces superflus", async () => {
    const client = mockAnthropic("  Un fragment littéraire composé.  ");
    const fragment = await composerFragment(client, { tours: TOURS });
    expect(fragment).toBe("Un fragment littéraire composé.");
  });

  it("formate la question d'ouverture différemment des relances dans le prompt", async () => {
    const client = mockAnthropic("Un fragment.");
    await composerFragment(client, { tours: TOURS });
    const contenu = (client.messages.create as ReturnType<typeof vi.fn>).mock.calls[0][0].messages[0].content;
    expect(contenu).toContain("Question : Où êtes-vous né ?");
    expect(contenu).toContain("Réponse initiale : À Lyon, en 1950.");
    expect(contenu).toContain('Relance ("Quel souvenir sensoriel gardez-vous de cette ville ?")');
  });

  it("inclut l'instruction de régénération ciblée quand elle est fournie", async () => {
    const client = mockAnthropic("Un fragment.");
    await composerFragment(client, { tours: TOURS, instruction: "Rends le ton plus léger." });
    const contenu = (client.messages.create as ReturnType<typeof vi.fn>).mock.calls[0][0].messages[0].content;
    expect(contenu).toContain("Rends le ton plus léger.");
  });

  it("n'ajoute aucun bloc d'instruction quand elle est absente", async () => {
    const client = mockAnthropic("Un fragment.");
    await composerFragment(client, { tours: TOURS });
    const contenu = (client.messages.create as ReturnType<typeof vi.fn>).mock.calls[0][0].messages[0].content;
    expect(contenu).not.toContain("a demandé à recomposer");
  });

  it("rejette la réponse (throw) au lieu de renvoyer un fragment tronqué quand stop_reason = max_tokens", async () => {
    const erreurSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = mockAnthropic("fragment coupé en pl", "max_tokens");

    await expect(composerFragment(client, { tours: TOURS })).rejects.toThrow(/max_tokens/);

    expect(erreurSpy).toHaveBeenCalledWith(
      "composerFragment: réponse tronquée par max_tokens",
      expect.objectContaining({ tours: TOURS.length })
    );
    erreurSpy.mockRestore();
  });
});

describe("genererResumeSession", () => {
  it("retourne le résumé retourné par le modèle", async () => {
    const client = mockAnthropic("Enfance à Lyon, odeur du pain chaud.");
    const resume = await genererResumeSession(client, { tours: TOURS });
    expect(resume).toBe("Enfance à Lyon, odeur du pain chaud.");
  });

  it("recompose une fois un fragment qui finit en pleine phrase", async () => {
    const erreurSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const create = vi
      .fn()
      .mockResolvedValueOnce({ content: [{ type: "text", text: "Avant que tout" }], stop_reason: "end_turn" })
      .mockResolvedValueOnce({ content: [{ type: "text", text: "Avant que tout change." }], stop_reason: "end_turn" });
    const client = { messages: { create } } as unknown as Anthropic;

    expect(await composerFragment(client, { tours: TOURS })).toBe("Avant que tout change.");
    expect(create).toHaveBeenCalledTimes(2);
    erreurSpy.mockRestore();
  });

  it("rejette un fragment encore inachevé après la seconde tentative", async () => {
    const erreurSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = mockAnthropic("à un passage vers");

    await expect(composerFragment(client, { tours: TOURS })).rejects.toThrow(/inachevé/);
    expect(client.messages.create).toHaveBeenCalledTimes(2);
    erreurSpy.mockRestore();
  });
});

describe("finitParUnePonctuation", () => {
  it.each(["Fin.", "Fin…", "Vraiment ?", "Il disait : « Viens. »", "(Je crois.)"])("accepte %s", (t) => {
    expect(finitParUnePonctuation(t)).toBe(true);
  });
  it.each(["avant que tout", "qu'on n'aurait pas pu", "un passage vers —"])("refuse %s", (t) => {
    expect(finitParUnePonctuation(t)).toBe(false);
  });
});
