import { describe, it, expect, vi, beforeEach } from "vitest";

// B2/B3 (23/09/2026) : les messages d'erreur de résolution insuffisante et
// de fichier illisible ont été reformulés sans jargon technique (pixels) —
// ce test fige le nouveau texte pour éviter une régression silencieuse.
const {
  getUserMock,
  fragmentMaybeSingleMock,
  countTotalMock,
  countFragmentMock,
  uploadMock,
  insertSingleMock,
  removeMock,
  createSignedUrlMock,
  imageSizeMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  fragmentMaybeSingleMock: vi.fn(),
  countTotalMock: vi.fn(),
  countFragmentMock: vi.fn(),
  uploadMock: vi.fn(),
  insertSingleMock: vi.fn(),
  removeMock: vi.fn(),
  createSignedUrlMock: vi.fn(),
  imageSizeMock: vi.fn(),
}));

vi.mock("image-size", () => ({ imageSize: imageSizeMock }));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
    from: vi.fn((table: string) => {
      if (table === "fragments") {
        return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: fragmentMaybeSingleMock }) }) }) };
      }
      if (table === "photos") {
        return {
          select: (_cols: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.count === "exact") {
              return {
                eq: (col: string) => (col === "user_id" ? countTotalMock() : countFragmentMock()),
              };
            }
            throw new Error("select inattendu sur photos");
          },
          insert: () => ({ select: () => ({ single: insertSingleMock }) }),
        };
      }
      throw new Error(`Table inattendue dans le mock: ${table}`);
    }),
    storage: {
      from: vi.fn(() => ({ upload: uploadMock, remove: removeMock, createSignedUrl: createSignedUrlMock })),
    },
  })),
}));

const { POST } = await import("./route");
const { typeReel, TAILLE_MAX_OCTETS } = await import("@/lib/photos");

const USER = { id: "user-abc" };

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: USER } });
  fragmentMaybeSingleMock.mockResolvedValue({ data: { id: "frag-1" } });
  countTotalMock.mockResolvedValue({ count: 0 });
  countFragmentMock.mockResolvedValue({ count: 0 });
  uploadMock.mockResolvedValue({ error: null });
  insertSingleMock.mockResolvedValue({ data: { id: "photo-1", created_at: "2026-09-23T00:00:00Z" }, error: null });
  removeMock.mockResolvedValue({ data: [], error: null });
  createSignedUrlMock.mockResolvedValue({ data: { signedUrl: "https://signed.example/x" } });
  imageSizeMock.mockReturnValue({ width: 2000, height: 1500 });
});

const DEBUT_JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0x10];

function requeteAvecFichier(type: string, nom = "photo.jpg", octets: number[] = DEBUT_JPEG) {
  const form = new FormData();
  form.append("fichier", new File([new Uint8Array(octets)], nom, { type }));
  form.append("fragment_id", "frag-1");
  return new Request("http://localhost/api/photos", { method: "POST", body: form });
}

describe("POST /api/photos", () => {
  it("accepte une photo valide (200)", async () => {
    // @ts-expect-error NextRequest surcouche Request, suffisant ici
    const res = await POST(requeteAvecFichier("image/jpeg"));
    expect(res.status).toBe(200);
  });

  it("B3 — message simple, sans détail technique, si le fichier n'est pas une image décodable", async () => {
    imageSizeMock.mockImplementation(() => {
      throw new Error("format inconnu");
    });

    // @ts-expect-error NextRequest surcouche Request, suffisant ici
    const res = await POST(requeteAvecFichier("image/jpeg"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe(
      "Ce fichier n'a pas pu être ouvert comme image — vérifiez qu'il s'agit bien d'une photo au format JPG, PNG ou WebP."
    );
  });

  it("B2 — message de résolution insuffisante sans jargon pixel", async () => {
    imageSizeMock.mockReturnValue({ width: 600, height: 800 });

    // @ts-expect-error NextRequest surcouche Request, suffisant ici
    const res = await POST(requeteAvecFichier("image/jpeg"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe(
      "Cette photo n'a pas une définition suffisante pour un rendu net dans le livre imprimé — essayez une version plus grande, idéalement la photo originale plutôt qu'une capture d'écran ou une image déjà réduite."
    );
    expect(body.error).not.toMatch(/\d+px/);
  });
});

// Constat I-3 (27/10/2026) : signature réelle et taille contrôlées avant tout
// décodage par image-size.
describe("POST /api/photos — contrôle du fichier", () => {
  it("refuse un fichier annoncé JPEG dont le contenu n'est pas une image acceptée, sans le décoder", async () => {
    const enTeteHeif = [0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63];
    // @ts-expect-error NextRequest surcouche Request, suffisant ici
    const res = await POST(requeteAvecFichier("image/jpeg", "photo.jpg", enTeteHeif));

    expect(res.status).toBe(400);
    expect(imageSizeMock).not.toHaveBeenCalled();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("enregistre le type réel, pas celui annoncé par le navigateur", async () => {
    const enTetePng = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    // @ts-expect-error NextRequest surcouche Request, suffisant ici
    const res = await POST(requeteAvecFichier("image/jpeg", "photo.jpg", enTetePng));

    expect(res.status).toBe(200);
    expect(uploadMock).toHaveBeenCalledWith(expect.stringMatching(/\.png$/), expect.anything(), { contentType: "image/png" });
  });

  it("reconnaît le WebP", () => {
    const webp = [0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50];
    expect(typeReel(new Uint8Array(webp))).toBe("image/webp");
  });

  it("refuse une photo de plus de 20 Mo avant de la lire", async () => {
    const form = new FormData();
    const lourd = new File([new Uint8Array(TAILLE_MAX_OCTETS + 1)], "lourde.jpg", { type: "image/jpeg" });
    form.append("fichier", lourd);
    form.append("fragment_id", "frag-1");

    // @ts-expect-error NextRequest surcouche Request, suffisant ici
    const res = await POST(new Request("http://localhost/api/photos", { method: "POST", body: form }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/20 Mo/);
    expect(fragmentMaybeSingleMock).not.toHaveBeenCalled();
  });
});
