import { describe, it, expect, vi, beforeEach } from "vitest";

// A3 (23/09/2026) : une photo référencée en base mais introuvable dans
// Storage ne doit plus faire échouer tout le document — elle est exclue,
// comptée dans photosManquantes, et journalisée (console + Sentry) avec un
// contexte suffisant pour investiguer, sans donnée personnelle.
const { captureExceptionMock } = vi.hoisted(() => ({ captureExceptionMock: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ captureException: captureExceptionMock }));

import { chargerFragmentsAvecPhotos } from "./photos";

type FragmentRow = { id: string; texte: string };
type PhotoRow = { id: string; fragment_id: string; chemin_stockage: string; largeur_px: number; hauteur_px: number };

function creerSupabaseFake(fragments: FragmentRow[], photos: PhotoRow[], downloadImpl: (chemin: string) => Promise<{ data: Blob | null; error: { message: string } | null }>) {
  return {
    from: (table: string) => {
      if (table === "fragments") {
        return {
          select: () => ({
            eq: () => ({
              neq: () => ({
                order: () => Promise.resolve({ data: fragments }),
              }),
            }),
          }),
        };
      }
      if (table === "photos") {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: photos }),
          }),
        };
      }
      throw new Error(`Table inattendue dans le mock: ${table}`);
    },
    storage: {
      from: () => ({ download: downloadImpl }),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("chargerFragmentsAvecPhotos", () => {
  it("retourne un tableau vide et 0 photo manquante sans fragment", async () => {
    const supabase = creerSupabaseFake([], [], async () => ({ data: null, error: null }));

    const resultat = await chargerFragmentsAvecPhotos(supabase, "user-1");

    expect(resultat).toEqual({ fragments: [], photosManquantes: 0 });
  });

  it("télécharge normalement une photo présente dans Storage", async () => {
    const fragments = [{ id: "frag-1", texte: "Un souvenir." }];
    const photos = [{ id: "photo-1", fragment_id: "frag-1", chemin_stockage: "user-1/frag-1/a.jpg", largeur_px: 2000, hauteur_px: 1500 }];
    const blob = { arrayBuffer: async () => new TextEncoder().encode("contenu").buffer } as unknown as Blob;
    const supabase = creerSupabaseFake(fragments, photos, async () => ({ data: blob, error: null }));

    const resultat = await chargerFragmentsAvecPhotos(supabase, "user-1");

    expect(resultat.photosManquantes).toBe(0);
    expect(resultat.fragments).toHaveLength(1);
    expect(resultat.fragments[0].photos).toHaveLength(1);
    expect(resultat.fragments[0].photos[0]).toMatchObject({ id: "photo-1", extension: "jpg", largeurPx: 2000, hauteurPx: 1500 });
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("A3 : exclut une photo introuvable dans Storage sans faire échouer le fragment ni le document", async () => {
    const fragments = [{ id: "frag-1", texte: "Un souvenir." }];
    const photos = [{ id: "photo-manquante", fragment_id: "frag-1", chemin_stockage: "user-1/frag-1/orpheline.jpg", largeur_px: 2000, hauteur_px: 1500 }];
    const supabase = creerSupabaseFake(fragments, photos, async () => ({ data: null, error: { message: "Object not found" } }));

    const resultat = await chargerFragmentsAvecPhotos(supabase, "user-1");

    expect(resultat.photosManquantes).toBe(1);
    expect(resultat.fragments).toHaveLength(1);
    expect(resultat.fragments[0].photos).toHaveLength(0);
    expect(resultat.fragments[0].texte).toBe("Un souvenir.");
  });

  it("A3 : journalise l'anomalie via Sentry avec un contexte opaque, sans donnée personnelle", async () => {
    const fragments = [{ id: "frag-1", texte: "Un souvenir." }];
    const photos = [{ id: "photo-manquante", fragment_id: "frag-1", chemin_stockage: "user-1/frag-1/orpheline.jpg", largeur_px: 2000, hauteur_px: 1500 }];
    const supabase = creerSupabaseFake(fragments, photos, async () => ({ data: null, error: { message: "Object not found" } }));

    await chargerFragmentsAvecPhotos(supabase, "user-1");

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    const [erreur, options] = captureExceptionMock.mock.calls[0];
    expect(erreur).toBeInstanceOf(Error);
    expect(options.extra).toEqual({
      photo_id: "photo-manquante",
      fragment_id: "frag-1",
      user_id: "user-1",
      chemin_stockage: "user-1/frag-1/orpheline.jpg",
    });
  });

  it("A3 : plusieurs photos manquantes sur des fragments différents sont toutes comptées et exclues", async () => {
    const fragments = [
      { id: "frag-1", texte: "Premier souvenir." },
      { id: "frag-2", texte: "Deuxième souvenir." },
    ];
    const photos = [
      { id: "photo-manquante-1", fragment_id: "frag-1", chemin_stockage: "user-1/frag-1/a.jpg", largeur_px: 2000, hauteur_px: 1500 },
      { id: "photo-manquante-2", fragment_id: "frag-2", chemin_stockage: "user-1/frag-2/b.jpg", largeur_px: 2000, hauteur_px: 1500 },
    ];
    const supabase = creerSupabaseFake(fragments, photos, async () => ({ data: null, error: { message: "Object not found" } }));

    const resultat = await chargerFragmentsAvecPhotos(supabase, "user-1");

    expect(resultat.photosManquantes).toBe(2);
    expect(resultat.fragments[0].photos).toHaveLength(0);
    expect(resultat.fragments[1].photos).toHaveLength(0);
  });
});
