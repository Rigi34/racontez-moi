import { describe, it, expect, vi } from "vitest";
import { chargerJsonAvecReessai } from "./charger-json";

const reponse = (status: number, corps: unknown = {}) =>
  new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });

describe("chargerJsonAvecReessai", () => {
  it("renvoie les données dès la première réussite", async () => {
    const fetcher = vi.fn().mockResolvedValue(reponse(200, { photos: [1] }));
    expect(await chargerJsonAvecReessai("/x", { delaiMs: 0, fetcher })).toEqual({ photos: [1] });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("réessaie une fois après un 401 (session en cours de renouvellement)", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(reponse(401)).mockResolvedValueOnce(reponse(200, { ok: true }));
    expect(await chargerJsonAvecReessai("/x", { delaiMs: 0, fetcher })).toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("réessaie après une erreur réseau", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error("réseau")).mockResolvedValueOnce(reponse(200, { ok: 1 }));
    expect(await chargerJsonAvecReessai("/x", { delaiMs: 0, fetcher })).toEqual({ ok: 1 });
  });

  it("renvoie null après deux échecs, sans troisième tentative", async () => {
    const fetcher = vi.fn().mockResolvedValue(reponse(500));
    expect(await chargerJsonAvecReessai("/x", { delaiMs: 0, fetcher })).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
