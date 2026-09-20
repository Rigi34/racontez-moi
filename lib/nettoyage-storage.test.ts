import { describe, it, expect, vi } from "vitest";
import { viderPrefixeUtilisateur } from "./nettoyage-storage";

// Fichier factice minimal — seul `id` compte pour distinguer un fichier
// (id non nul) d'un dossier (id === null, cf. @supabase/storage-js).
function fichier(nom: string) {
  return { name: nom, id: `id-${nom}`, updated_at: null, created_at: null, last_accessed_at: null, metadata: null };
}
function dossier(nom: string) {
  return { name: nom, id: null, updated_at: null, created_at: null, last_accessed_at: null, metadata: null };
}

function creerClientFake(reponsesList: Record<string, unknown[][]>) {
  // Une file de réponses par préfixe exact — chaque appel à list(prefixe, ...)
  // consomme la réponse suivante de la file, simule la pagination page par page.
  const files = new Map(Object.entries(reponsesList).map(([k, v]) => [k, [...v]]));
  const listMock = vi.fn((prefixe: string) => {
    const file = files.get(prefixe) ?? [];
    const page = file.shift() ?? [];
    return Promise.resolve({ data: page, error: null });
  });
  const removeMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
  return {
    storage: { from: vi.fn(() => ({ list: listMock, remove: removeMock })) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _listMock: listMock as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _removeMock: removeMock as any,
  };
}

describe("viderPrefixeUtilisateur", () => {
  it("préfixe déjà vide : ne supprime rien, renvoie videe=true", async () => {
    const client = creerClientFake({ "user-1": [[]] });

    const resultat = await viderPrefixeUtilisateur(client as never, "photos", "user-1");

    expect(resultat).toEqual({ videe: true, supprimes: 0 });
    expect(client._removeMock).not.toHaveBeenCalled();
  });

  it("supprime les fichiers trouvés directement sous le préfixe", async () => {
    const client = creerClientFake({
      "user-1": [[fichier("a.jpg"), fichier("b.jpg")], []],
    });

    const resultat = await viderPrefixeUtilisateur(client as never, "photos", "user-1");

    expect(resultat).toEqual({ videe: true, supprimes: 2 });
    expect(client._removeMock).toHaveBeenCalledWith(["user-1/a.jpg", "user-1/b.jpg"]);
  });

  it("descend récursivement dans les sous-dossiers (fragment_id, commande_id)", async () => {
    const client = creerClientFake({
      "user-1": [[dossier("fragment-A")], []],
      "user-1/fragment-A": [[fichier("photo.jpg")], []],
    });

    const resultat = await viderPrefixeUtilisateur(client as never, "photos", "user-1");

    expect(resultat).toEqual({ videe: true, supprimes: 1 });
    expect(client._removeMock).toHaveBeenCalledWith(["user-1/fragment-A/photo.jpg"]);
  });

  it("un objet restant après suppression fait échouer la vérification finale (videe=false)", async () => {
    // Simule une course : un objet apparaît entre le listage initial (qui
    // ne voit que a.jpg et le supprime) et la reliste de vérification (qui
    // trouve b.jpg, jamais traité par le passage de suppression).
    const client = creerClientFake({
      "user-1": [[fichier("a.jpg")], [fichier("b.jpg")]],
    });

    const resultat = await viderPrefixeUtilisateur(client as never, "photos", "user-1");

    expect(resultat.videe).toBe(false);
  });

  it("propage une erreur de listage sans tenter de suppression", async () => {
    const listMock = vi.fn(() => Promise.resolve({ data: null, error: { message: "boom" } }));
    const client = { storage: { from: vi.fn(() => ({ list: listMock, remove: vi.fn() })) } };

    await expect(viderPrefixeUtilisateur(client as never, "photos", "user-1")).rejects.toThrow(/Listage Storage échoué/);
  });
});
