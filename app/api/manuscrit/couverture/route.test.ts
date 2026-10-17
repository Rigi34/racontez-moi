import { describe, it, expect, vi, beforeEach } from "vitest";

// Isole la route de ses dépendances : le client Supabase (session,
// abonnement), le
// chargement des fragments+photos, et la compilation Typst (intérieur +
// couverture) — déjà testées indépendamment ailleurs.
const {
  getUserMock,
  chargerFragmentsAvecPhotosMock,
  compilerInterieurMock,
  compilerCouvertureMock,
  lirePersonnalisationLivreMock,
  abonnementMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  abonnementMock: vi.fn(),
  chargerFragmentsAvecPhotosMock: vi.fn(),
  compilerInterieurMock: vi.fn(),
  compilerCouvertureMock: vi.fn(),
  lirePersonnalisationLivreMock: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
    from: vi.fn((table: string) => {
      if (table !== "abonnements") throw new Error(`table inattendue : ${table}`);
      const chaine = { select: () => chaine, eq: () => chaine, maybeSingle: abonnementMock };
      return chaine;
    }),
  })),
}));

vi.mock("@/lib/photos", () => ({ chargerFragmentsAvecPhotos: chargerFragmentsAvecPhotosMock }));
vi.mock("@/lib/manuscrit", () => ({
  compilerInterieur: compilerInterieurMock,
  compilerCouverture: compilerCouvertureMock,
}));
vi.mock("@/lib/profil-narrateur", () => ({ lirePersonnalisationLivre: lirePersonnalisationLivreMock }));

const { GET } = await import("./route");

const USER = { id: "user-abc" };
const FRAGMENTS_AVEC_PHOTOS = [
  { texte: "Un souvenir.", photos: [] },
  { texte: "Un autre souvenir.", photos: [{ id: "p1", extension: "jpg", buffer: Buffer.from("x") }] },
];

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: USER } });
  abonnementMock.mockResolvedValue({ data: { status: "active" } });
  chargerFragmentsAvecPhotosMock.mockResolvedValue({ fragments: FRAGMENTS_AVEC_PHOTOS, photosManquantes: 0 });
  compilerInterieurMock.mockReturnValue({ buffer: Buffer.from("interieur"), nombrePages: 42 });
  compilerCouvertureMock.mockResolvedValue(Buffer.from("couverture"));
  lirePersonnalisationLivreMock.mockResolvedValue({ titre: "Mes Mémoires", sousTitre: "Racontez-moi", couleurCle: "petrole" });
});

describe("GET /api/manuscrit/couverture", () => {
  it("refuse sans authentification", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const res = await GET();

    expect(res.status).toBe(401);
    expect(chargerFragmentsAvecPhotosMock).not.toHaveBeenCalled();
  });

  // A-2026-09-12-04 : la couverture était accessible sans paiement.
  it("refuse sans abonnement", async () => {
    abonnementMock.mockResolvedValue({ data: null });

    const res = await GET();

    expect(res.status).toBe(403);
    expect(chargerFragmentsAvecPhotosMock).not.toHaveBeenCalled();
    expect(compilerCouvertureMock).not.toHaveBeenCalled();
  });

  it("refuse un abonnement non actif (remboursé)", async () => {
    abonnementMock.mockResolvedValue({ data: { status: "rembourse" } });

    const res = await GET();

    expect(res.status).toBe(403);
    expect(compilerCouvertureMock).not.toHaveBeenCalled();
  });

  it("refuse si aucun fragment", async () => {
    chargerFragmentsAvecPhotosMock.mockResolvedValue({ fragments: [], photosManquantes: 0 });

    const res = await GET();

    expect(res.status).toBe(400);
    expect(compilerInterieurMock).not.toHaveBeenCalled();
  });

  // Régression du 23/09/2026 : la route passait fragments.map(f => f.texte)
  // (un tableau de chaînes) à compilerInterieur, qui attend des objets
  // {texte, photos}[] — plantait sur `for (const photo of fragment.photos)`.
  it("passe à compilerInterieur les objets {texte, photos} tels que chargés, jamais un tableau de chaînes", async () => {
    await GET();

    expect(compilerInterieurMock).toHaveBeenCalledTimes(1);
    const [fragmentsRecus] = compilerInterieurMock.mock.calls[0];
    expect(fragmentsRecus).toBe(FRAGMENTS_AVEC_PHOTOS);
    expect(fragmentsRecus.every((f: { photos: unknown }) => Array.isArray(f.photos))).toBe(true);
  });

  it("génère la couverture avec le nombre de pages de l'intérieur et renvoie un PDF", async () => {
    const res = await GET();
    const body = Buffer.from(await res.arrayBuffer());

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("x-nombre-pages-interieur")).toBe("42");
    expect(compilerCouvertureMock).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ titre: "Mes Mémoires", sousTitre: "Racontez-moi", couleurCle: "petrole" })
    );
    expect(body.toString()).toBe("couverture");
  });

  // A-2026-09-12-06 : le détail de l'erreur reste dans les logs serveur.
  it("renvoie 500 sans détail interne si la compilation échoue, et journalise l'erreur", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    compilerInterieurMock.mockImplementation(() => {
      throw new Error("Typst: erreur de test");
    });

    const res = await GET();
    const bodyJson = await res.json();

    expect(res.status).toBe(500);
    expect(bodyJson).toEqual({ error: "Échec de la génération de la couverture." });
    expect(JSON.stringify(bodyJson)).not.toContain("Typst");
    expect(consoleErrorSpy).toHaveBeenCalledWith("Génération couverture échouée:", expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
});
