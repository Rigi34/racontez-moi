import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

// Chantier VOIX-CHOISIE : conservation d'un extrait de voix sur choix
// explicite du narrateur. Ces tests figent les garde-fous serveur :
// interrupteur, compte réel, consentement, format, taille, propriété du
// fragment, et conservation du jeton (QR déjà imprimé) au remplacement.
const {
  getUserMock,
  fragmentMaybeSingleMock,
  ancienMaybeSingleMock,
  uploadMock,
  removeMock,
  insertMock,
  insertSingleMock,
  updateSingleMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  fragmentMaybeSingleMock: vi.fn(),
  ancienMaybeSingleMock: vi.fn(),
  uploadMock: vi.fn(),
  removeMock: vi.fn(),
  insertMock: vi.fn(),
  insertSingleMock: vi.fn(),
  updateSingleMock: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
    from: vi.fn((table: string) => {
      if (table === "fragments") {
        return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: fragmentMaybeSingleMock }) }) }) };
      }
      if (table === "extraits_voix") {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: ancienMaybeSingleMock }) }) }),
          insert: (ligne: unknown) => {
            insertMock(ligne);
            return { select: () => ({ single: insertSingleMock }) };
          },
          update: () => ({ eq: () => ({ select: () => ({ single: updateSingleMock }) }) }),
        };
      }
      throw new Error(`Table inattendue dans le mock: ${table}`);
    }),
    storage: { from: vi.fn(() => ({ upload: uploadMock, remove: removeMock })) },
  })),
}));

const { POST } = await import("./route");
const { VERSION_CONSENTEMENT_VOIX, TAILLE_MAX_OCTETS } = await import("@/lib/voix");

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_VOIX_CHOISIE", "1");
  getUserMock.mockResolvedValue({ data: { user: { id: "user-abc", is_anonymous: false } } });
  fragmentMaybeSingleMock.mockResolvedValue({ data: { id: "frag-1" } });
  ancienMaybeSingleMock.mockResolvedValue({ data: null });
  uploadMock.mockResolvedValue({ error: null });
  removeMock.mockResolvedValue({ error: null });
  insertSingleMock.mockResolvedValue({ data: { id: "extrait-1" }, error: null });
  updateSingleMock.mockResolvedValue({ data: { id: "extrait-ancien" }, error: null });
});
afterEach(() => vi.unstubAllEnvs());

function requete({ type = "audio/webm;codecs=opus", taille = 10, consentement = VERSION_CONSENTEMENT_VOIX as string | null } = {}) {
  const form = new FormData();
  form.append("audio", new File([new Uint8Array(taille)], "voix", { type }));
  form.append("fragment_id", "frag-1");
  if (consentement !== null) form.append("consentement", consentement);
  return new Request("http://localhost/api/voix", { method: "POST", body: form }) as unknown as NextRequest;
}

describe("POST /api/voix", () => {
  it("n'existe pas tant que l'interrupteur est coupé (404), sans rien écrire", async () => {
    vi.stubEnv("NEXT_PUBLIC_VOIX_CHOISIE", "");
    const res = await POST(requete());
    expect(res.status).toBe(404);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("refuse un compte anonyme d'essai gratuit (403)", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "anon", is_anonymous: true } } });
    const res = await POST(requete());
    expect(res.status).toBe(403);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("exige le consentement côté serveur, dans sa version exacte", async () => {
    expect((await POST(requete({ consentement: null }))).status).toBe(400);
    expect((await POST(requete({ consentement: "voix-v0" }))).status).toBe(400);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("refuse un format non audio et un fichier trop volumineux", async () => {
    expect((await POST(requete({ type: "image/png" }))).status).toBe(400);
    expect((await POST(requete({ taille: TAILLE_MAX_OCTETS + 1 }))).status).toBe(400);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("refuse un fragment qui n'appartient pas au narrateur (404)", async () => {
    fragmentMaybeSingleMock.mockResolvedValue({ data: null });
    const res = await POST(requete());
    expect(res.status).toBe(404);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("conserve l'extrait dans le dossier du narrateur, avec un jeton de 22 caractères et la version du consentement", async () => {
    const res = await POST(requete());
    expect(res.status).toBe(200);
    const [chemin] = uploadMock.mock.calls[0];
    expect(chemin).toMatch(/^user-abc\/frag-1\/[0-9a-f-]+\.webm$/);
    const ligne = insertMock.mock.calls[0][0];
    expect(ligne.jeton).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(ligne.version_consentement).toBe(VERSION_CONSENTEMENT_VOIX);
    expect(ligne.type_mime).toBe("audio/webm");
  });

  it("remplace l'extrait existant du fragment sans changer de jeton (QR déjà imprimé valable) et supprime l'ancien fichier", async () => {
    ancienMaybeSingleMock.mockResolvedValue({ data: { id: "extrait-ancien", chemin_stockage: "user-abc/frag-1/ancien.webm" } });
    const res = await POST(requete({ type: "audio/mp4" }));
    expect(res.status).toBe(200);
    expect(insertMock).not.toHaveBeenCalled();
    expect(removeMock).toHaveBeenCalledWith(["user-abc/frag-1/ancien.webm"]);
  });

  it("annule l'envoi si l'écriture en base échoue (pas de fichier orphelin)", async () => {
    insertSingleMock.mockResolvedValue({ data: null, error: { message: "échec" } });
    const res = await POST(requete());
    expect(res.status).toBe(500);
    const [chemin] = uploadMock.mock.calls[0];
    expect(removeMock).toHaveBeenCalledWith([chemin]);
  });
});
