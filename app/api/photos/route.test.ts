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

function requeteAvecFichier(type: string, nom = "photo.jpg") {
  const form = new FormData();
  form.append("fichier", new File([new Uint8Array([1, 2, 3])], nom, { type }));
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
