import { describe, it, expect, vi, beforeEach } from "vitest";

// Isole la route de ses dépendances : le client Supabase (session,
// abonnement, fragments, commande) et la génération EPUB.
const {
  getUserMock,
  abonnementMock,
  commandeMock,
  fragmentsMock,
  epubMock,
  lirePersonnalisationLivreMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  abonnementMock: vi.fn(),
  commandeMock: vi.fn(),
  fragmentsMock: vi.fn(),
  epubMock: vi.fn(),
  lirePersonnalisationLivreMock: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
    from: vi.fn((table: string) => {
      if (table === "fragments") {
        // select().eq().neq().order() est attendu directement.
        const chaine = { select: () => chaine, eq: () => chaine, neq: () => chaine, order: fragmentsMock };
        return chaine;
      }
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

vi.mock("epub-gen-memory", () => ({ default: epubMock }));
vi.mock("@/lib/profil-narrateur", () => ({ lirePersonnalisationLivre: lirePersonnalisationLivreMock }));

const { GET } = await import("./route");

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "user-abc" } } });
  abonnementMock.mockResolvedValue({ data: { status: "active" } });
  commandeMock.mockResolvedValue({ data: null });
  fragmentsMock.mockResolvedValue({ data: [{ texte: "Un souvenir." }] });
  epubMock.mockResolvedValue(Buffer.from("epub"));
  lirePersonnalisationLivreMock.mockResolvedValue({ titre: "Mes Mémoires" });
});

describe("GET /api/manuscrit/epub", () => {
  it("refuse sans abonnement actif", async () => {
    abonnementMock.mockResolvedValue({ data: { status: "rembourse" } });

    const res = await GET();

    expect(res.status).toBe(403);
    expect(epubMock).not.toHaveBeenCalled();
  });

  it("renvoie l'EPUB", async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/epub+zip");
  });

  // A-2026-09-12-06 : le détail de l'erreur reste dans les logs serveur.
  it("renvoie 500 sans détail interne si la génération échoue, et journalise l'erreur", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    epubMock.mockRejectedValue(new Error("epub: erreur de test"));

    const res = await GET();
    const bodyJson = await res.json();

    expect(res.status).toBe(500);
    expect(bodyJson).toEqual({ error: "Échec de la génération de l'EPUB." });
    expect(JSON.stringify(bodyJson)).not.toContain("erreur de test");
    expect(consoleErrorSpy).toHaveBeenCalledWith("Génération EPUB échouée:", expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
});
