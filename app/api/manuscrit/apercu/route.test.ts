import { describe, it, expect, vi, beforeEach } from "vitest";

// Isole la route de ses dépendances : le client Supabase (session,
// abonnement, commande), le chargement des fragments+photos, et la
// compilation Typst — déjà testées indépendamment ailleurs.
const {
  getUserMock,
  abonnementMock,
  commandeMock,
  chargerFragmentsAvecPhotosMock,
  compilerInterieurMock,
  lirePersonnalisationLivreMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  abonnementMock: vi.fn(),
  commandeMock: vi.fn(),
  chargerFragmentsAvecPhotosMock: vi.fn(),
  compilerInterieurMock: vi.fn(),
  lirePersonnalisationLivreMock: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({ verifierQuota: vi.fn().mockResolvedValue(true), MESSAGE_LIMITE_APERCU: "limite" }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
    from: vi.fn((table: string) => {
      const resultats: Record<string, () => unknown> = {
        abonnements: abonnementMock,
        commandes_livre: commandeMock,
      };
      if (!resultats[table]) throw new Error(`table inattendue : ${table}`);
      const chaine = { select: () => chaine, eq: () => chaine, in: () => chaine, maybeSingle: resultats[table] };
      return chaine;
    }),
  })),
}));

vi.mock("@/lib/photos", () => ({ chargerFragmentsAvecPhotos: chargerFragmentsAvecPhotosMock }));
vi.mock("@/lib/manuscrit", () => ({ compilerInterieur: compilerInterieurMock }));
vi.mock("@/lib/profil-narrateur", () => ({ lirePersonnalisationLivre: lirePersonnalisationLivreMock }));

const { GET } = await import("./route");
const { verifierQuota } = await import("@/lib/rate-limit");

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "user-abc" } } });
  abonnementMock.mockResolvedValue({ data: { status: "active" } });
  commandeMock.mockResolvedValue({ data: null });
  chargerFragmentsAvecPhotosMock.mockResolvedValue({ fragments: [{ texte: "Un souvenir.", photos: [] }], photosManquantes: 0 });
  compilerInterieurMock.mockReturnValue({ buffer: Buffer.from("interieur"), nombrePages: 42 });
  lirePersonnalisationLivreMock.mockResolvedValue({ titre: "Mes Mémoires", sousTitre: "Racontez-moi" });
});

describe("GET /api/manuscrit/apercu", () => {
  it("refuse sans abonnement actif", async () => {
    abonnementMock.mockResolvedValue({ data: null });

    const res = await GET();

    expect(res.status).toBe(403);
    expect(compilerInterieurMock).not.toHaveBeenCalled();
  });

  it("renvoie le PDF d'aperçu", async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(compilerInterieurMock).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ apercu: true }));
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
    expect(bodyJson).toEqual({ error: "Échec de la compilation du manuscrit." });
    expect(JSON.stringify(bodyJson)).not.toContain("Typst");
    expect(consoleErrorSpy).toHaveBeenCalledWith("Assemblage manuscrit échoué:", expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
});

describe("GET /api/manuscrit/apercu — plafond quotidien (16/11/2026)", () => {
  it("renvoie 429 avec un message lisible quand le plafond est atteint, sans compiler", async () => {
    vi.mocked(verifierQuota).mockResolvedValueOnce(false);
    compilerInterieurMock.mockClear();
    const res = await GET();
    expect(res.status).toBe(429);
    expect(await res.text()).toBe("limite");
    expect(compilerInterieurMock).not.toHaveBeenCalled();
  });
});
