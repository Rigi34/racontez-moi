import { describe, it, expect, vi, beforeEach } from "vitest";

// Cible uniquement le comportement de la Correction B (Phase 5) :
// réutilisation d'une commande "echouee" au lieu d'un nouveau dossier à
// chaque tentative, et nettoyage Storage si un seul des deux uploads
// réussit. Le reste du pipeline (compilation Typst, appel Lulu) est
// mocké — déjà hors périmètre de cette correction.
const {
  getUserMock,
  abonnementMaybeSingleMock,
  adresseMaybeSingleMock,
  commandeExistanteMaybeSingleMock,
  commandeEchoueeMaybeSingleMock,
  insertSingleMock,
  updateSingleMock,
  updateFinalMock,
  uploadMock,
  removeMock,
  createSignedUrlMock,
  chargerFragmentsAvecPhotosMock,
  compilerInterieurMock,
  compilerCouvertureMock,
  lirePersonnalisationLivreMock,
  creerCommandeImpressionMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  abonnementMaybeSingleMock: vi.fn(),
  adresseMaybeSingleMock: vi.fn(),
  commandeExistanteMaybeSingleMock: vi.fn(),
  commandeEchoueeMaybeSingleMock: vi.fn(),
  insertSingleMock: vi.fn(),
  updateSingleMock: vi.fn(),
  updateFinalMock: vi.fn(),
  uploadMock: vi.fn(),
  removeMock: vi.fn(),
  createSignedUrlMock: vi.fn(),
  chargerFragmentsAvecPhotosMock: vi.fn(),
  compilerInterieurMock: vi.fn(),
  compilerCouvertureMock: vi.fn(),
  lirePersonnalisationLivreMock: vi.fn(),
  creerCommandeImpressionMock: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
    from: vi.fn((table: string) => {
      if (table === "abonnements") {
        return { select: () => ({ eq: () => ({ maybeSingle: abonnementMaybeSingleMock }) }) };
      }
      if (table === "adresses_livraison") {
        return { select: () => ({ eq: () => ({ maybeSingle: adresseMaybeSingleMock }) }) };
      }
      if (table === "commandes_livre") {
        return {
          // .select("id, statut").eq(...).in(...).maybeSingle() — commande active existante
          // .select("id").eq(...).eq(...).order(...).limit(...).maybeSingle() — commande echouee
          select: () => ({
            eq: () => ({
              in: () => ({ maybeSingle: commandeExistanteMaybeSingleMock }),
              eq: () => ({ order: () => ({ limit: () => ({ maybeSingle: commandeEchoueeMaybeSingleMock }) }) }),
            }),
          }),
          insert: () => ({ select: () => ({ single: insertSingleMock }) }),
          update: (payload: { statut: string }) =>
            payload.statut === "en_cours"
              ? { eq: () => ({ select: () => ({ single: updateSingleMock }) }) }
              : { eq: updateFinalMock },
        };
      }
      throw new Error(`Table inattendue dans le mock: ${table}`);
    }),
    storage: {
      from: vi.fn(() => ({ upload: uploadMock, remove: removeMock, createSignedUrl: createSignedUrlMock })),
    },
  })),
}));

vi.mock("@/lib/photos", () => ({ chargerFragmentsAvecPhotos: chargerFragmentsAvecPhotosMock }));
vi.mock("@/lib/manuscrit", () => ({
  compilerInterieur: compilerInterieurMock,
  compilerCouverture: compilerCouvertureMock,
}));
vi.mock("@/lib/profil-narrateur", () => ({ lirePersonnalisationLivre: lirePersonnalisationLivreMock }));
vi.mock("@/lib/lulu", () => ({
  creerCommandeImpression: creerCommandeImpressionMock,
  PAGES_MINIMUM_RELIE: 24,
}));

const { POST } = await import("./route");

const USER = { id: "user-abc", email: "narrateur@example.com" };

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: USER } });
  abonnementMaybeSingleMock.mockResolvedValue({ data: { status: "active" } });
  adresseMaybeSingleMock.mockResolvedValue({
    data: { nom: "Monique D.", adresse: "1 rue X", ville: "Paris", code_postal: "75001", pays: "FR", telephone: "0600000000" },
  });
  commandeExistanteMaybeSingleMock.mockResolvedValue({ data: null });
  commandeEchoueeMaybeSingleMock.mockResolvedValue({ data: null });
  insertSingleMock.mockResolvedValue({ data: { id: "cmd-nouvelle" }, error: null });
  updateSingleMock.mockResolvedValue({ data: { id: "cmd-echouee-1" }, error: null });
  updateFinalMock.mockResolvedValue({ data: null, error: null });
  uploadMock.mockResolvedValue({ error: null });
  removeMock.mockResolvedValue({ data: [], error: null });
  createSignedUrlMock.mockResolvedValue({ data: { signedUrl: "https://signed.example/x" } });
  chargerFragmentsAvecPhotosMock.mockResolvedValue([{ texte: "Un souvenir.", photos: [] }]);
  compilerInterieurMock.mockReturnValue({ buffer: Buffer.from("pdf"), nombrePages: 60 });
  compilerCouvertureMock.mockResolvedValue(Buffer.from("cover"));
  lirePersonnalisationLivreMock.mockResolvedValue({ titre: "Mes Mémoires", sousTitre: "Racontez-moi", couleurCle: "petrole" });
  creerCommandeImpressionMock.mockResolvedValue({ id: "lulu-job-1" });
});

describe("POST /api/commande/livre", () => {
  it("F — en l'absence de commande echouee, crée une nouvelle commande (comportement inchangé)", async () => {
    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(insertSingleMock).toHaveBeenCalled();
    expect(updateSingleMock).not.toHaveBeenCalled();
  });

  it("F — réutilise la commande echouee existante (même dossier) plutôt que d'en créer une nouvelle", async () => {
    commandeEchoueeMaybeSingleMock.mockResolvedValue({ data: { id: "cmd-echouee-1" } });

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(updateSingleMock).toHaveBeenCalled();
    expect(insertSingleMock).not.toHaveBeenCalled();
    // Le dossier Storage réutilisé doit porter l'id de la commande
    // échouée récupérée, pas un nouvel id.
    expect(uploadMock).toHaveBeenCalledWith(
      "user-abc/cmd-echouee-1/interieur.pdf",
      expect.anything(),
      expect.anything()
    );
  });

  it("E/G — supprime les deux fichiers si l'upload de la couverture échoue (rollback, pas d'orphelin)", async () => {
    uploadMock.mockImplementation((chemin: string) =>
      chemin.endsWith("couverture.pdf")
        ? Promise.resolve({ error: { message: "échec réseau" } })
        : Promise.resolve({ error: null })
    );

    const res = await POST();

    expect(res.status).toBe(500);
    expect(removeMock).toHaveBeenCalledWith(["user-abc/cmd-nouvelle/interieur.pdf", "user-abc/cmd-nouvelle/couverture.pdf"]);
    expect(updateFinalMock).toHaveBeenCalledWith("id", "cmd-nouvelle");
  });

  it("E/G — supprime les deux fichiers si l'upload de l'intérieur échoue (rollback, pas d'orphelin)", async () => {
    uploadMock.mockImplementation((chemin: string) =>
      chemin.endsWith("interieur.pdf")
        ? Promise.resolve({ error: { message: "échec réseau" } })
        : Promise.resolve({ error: null })
    );

    const res = await POST();

    expect(res.status).toBe(500);
    expect(removeMock).toHaveBeenCalledWith(["user-abc/cmd-nouvelle/interieur.pdf", "user-abc/cmd-nouvelle/couverture.pdf"]);
  });

  it("ne supprime rien de Storage si les deux uploads réussissent", async () => {
    const res = await POST();

    expect(res.status).toBe(200);
    expect(removeMock).not.toHaveBeenCalled();
  });

  it("conserve les contrôles existants : refuse sans abonnement actif", async () => {
    abonnementMaybeSingleMock.mockResolvedValue({ data: { status: "incomplete" } });

    const res = await POST();

    expect(res.status).toBe(403);
    expect(insertSingleMock).not.toHaveBeenCalled();
  });

  it("conserve les contrôles existants : refuse si une commande active existe déjà", async () => {
    commandeExistanteMaybeSingleMock.mockResolvedValue({ data: { id: "cmd-active", statut: "en_cours" } });

    const res = await POST();

    expect(res.status).toBe(409);
    expect(insertSingleMock).not.toHaveBeenCalled();
    expect(commandeEchoueeMaybeSingleMock).not.toHaveBeenCalled();
  });
});
