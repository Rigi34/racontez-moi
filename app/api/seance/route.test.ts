import { describe, it, expect, vi, beforeEach } from "vitest";

// Audit de clôture du 27/10/2026, constat B-5 : les écritures qui portent le
// récit ne doivent plus échouer en silence. Ces tests couvrent l'étape
// "fragment" (souvenir composé), la plus coûteuse à perdre.
const {
  getUserMock,
  sessionLueMock,
  sessionsUpdateMock,
  fragmentsSingleMock,
  toursInsertMock,
  anthropicCreateMock,
  abonnementLuMock,
  nombreFragmentsMock,
  sessionsInsertMock,
} = vi.hoisted(() => ({
  abonnementLuMock: vi.fn(),
  nombreFragmentsMock: vi.fn(),
  sessionsInsertMock: vi.fn(),
  getUserMock: vi.fn(),
  anthropicCreateMock: vi.fn(),
  sessionLueMock: vi.fn(),
  sessionsUpdateMock: vi.fn(),
  fragmentsSingleMock: vi.fn(),
  toursInsertMock: vi.fn(),
}));

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: anthropicCreateMock };
  },
}));

// Lecture de sessions : chaîne eq/not/order/limit quelconque terminée par
// maybeSingle (séance en cours, ou dernière séance close pour le contexte).
function chaineLecture() {
  const chaine: Record<string, unknown> = { maybeSingle: sessionLueMock };
  for (const m of ["eq", "not", "order", "limit"]) chaine[m] = () => chaine;
  return chaine;
}

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
    rpc: vi.fn(),
    from: vi.fn((table: string) => {
      if (table === "sessions") {
        return {
          select: chaineLecture,
          update: (valeurs: unknown) => ({ eq: () => sessionsUpdateMock(valeurs) }),
          insert: () => ({ select: () => ({ single: sessionsInsertMock }) }),
        };
      }
      if (table === "fragments") {
        return {
          insert: () => ({ select: () => ({ single: fragmentsSingleMock }) }),
          select: () => ({ eq: nombreFragmentsMock }),
        };
      }
      if (table === "tours_conversation") return { insert: toursInsertMock };
      if (table === "abonnements") return { select: () => ({ eq: () => ({ maybeSingle: abonnementLuMock }) }) };
      throw new Error(`Table inattendue dans le mock: ${table}`);
    }),
  })),
}));

vi.mock("@/lib/rate-limit", () => ({ verifierQuotaNarrateur: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/banque-questions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/banque-questions")>()),
  prochaineQuestionBanque: vi.fn().mockResolvedValue(null),
  titreSection: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/progression", () => ({ calculerProgression: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/embeddings", () => ({ embedText: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/retrieval", () => ({ retrieverTechniques: vi.fn().mockResolvedValue([]) }));
vi.mock("@/lib/redaction", () => ({
  composerFragment: vi.fn().mockResolvedValue("Le souvenir composé."),
  genererResumeSession: vi.fn().mockResolvedValue("Résumé."),
}));
vi.mock("@/lib/profil-narrateur", () => ({
  lireProfil: vi.fn().mockResolvedValue(null),
  resumerProfilPourPrompt: vi.fn(),
  mettreAJourProfil: vi.fn().mockResolvedValue(undefined),
  lirePourQui: vi.fn(),
  enregistrerPourQui: vi.fn(),
  lirePrenom: vi.fn(),
  enregistrerPrenom: vi.fn(),
  extrairePrenom: vi.fn().mockResolvedValue(""),
}));

const { POST } = await import("./route");

const TRANSCRIPT = [
  { role: "narrateur", text: "Le figuier de la cour." },
  { role: "relance", text: "Qui s'en occupait ?" },
  { role: "narrateur", text: "Mon grand-père." },
  { role: "relance", text: "Que vous disait-il ?" },
];

function requeteFragment() {
  return new Request("http://localhost/api/seance", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ step: "fragment", session_id: "s-1", reponseRelance2: "De ne jamais cueillir trop tôt." }),
  }) as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  sessionLueMock.mockResolvedValue({
    data: { id: "s-1", transcript: TRANSCRIPT, status: "in_progress", question_ouverture: null, section_ouverture: "A" },
  });
  sessionsUpdateMock.mockResolvedValue({ error: null });
  fragmentsSingleMock.mockResolvedValue({ data: { id: "frag-1" }, error: null });
  toursInsertMock.mockResolvedValue({ error: null });
  abonnementLuMock.mockResolvedValue({ data: null });
  nombreFragmentsMock.mockResolvedValue({ count: 0 });
  sessionsInsertMock.mockResolvedValue({ data: { id: "s-nouvelle" }, error: null });
});

describe("POST /api/seance — étape fragment", () => {
  it("enregistre le souvenir et clôt la séance", async () => {
    const res = await POST(requeteFragment());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ fragment: "Le souvenir composé.", fragment_id: "frag-1" });
    expect(sessionsUpdateMock).toHaveBeenLastCalledWith(expect.objectContaining({ status: "completed" }));
  });

  it("répond 500 sans clore la séance si le souvenir n'a pas pu être enregistré", async () => {
    fragmentsSingleMock.mockResolvedValue({ data: null, error: { message: "connexion perdue" } });

    const res = await POST(requeteFragment());

    expect(res.status).toBe(500);
    expect(sessionsUpdateMock).not.toHaveBeenCalledWith(expect.objectContaining({ status: "completed" }));
  });

  it("répond 500 avant toute rédaction si la réponse du narrateur n'a pas pu être sauvegardée", async () => {
    sessionsUpdateMock.mockResolvedValueOnce({ error: { message: "connexion perdue" } });

    const res = await POST(requeteFragment());

    expect(res.status).toBe(500);
    expect(fragmentsSingleMock).not.toHaveBeenCalled();
  });

  it("renvoie le souvenir même si la clôture échoue (il est déjà enregistré)", async () => {
    sessionsUpdateMock
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "connexion perdue" } });

    const res = await POST(requeteFragment());

    expect(res.status).toBe(200);
    expect((await res.json()).fragment_id).toBe("frag-1");
  });
});

function requeteRelance2() {
  return new Request("http://localhost/api/seance", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ step: "relance2", session_id: "s-1", reponseRelance: "Mon grand-père." }),
  }) as unknown as Parameters<typeof POST>[0];
}

// Constat I-4 (erreur « relance2 ») : une panne Anthropic remontait en
// exception nue ; le narrateur voyait le même message que pour un quota.
describe("POST /api/seance — étape relance2", () => {
  beforeEach(() => {
    sessionLueMock.mockResolvedValue({
      data: { id: "s-1", transcript: TRANSCRIPT.slice(0, 2), status: "in_progress", question_est_nucleaire: false },
    });
  });

  it("renvoie la deuxième relance", async () => {
    anthropicCreateMock.mockResolvedValue({ content: [{ type: "text", text: " Que vous disait-il ? " }] });

    const res = await POST(requeteRelance2());

    expect(res.status).toBe(200);
    expect((await res.json()).relance).toBe("Que vous disait-il ?");
  });

  it("répond 502 avec un message clair si Anthropic échoue, la réponse étant déjà sauvegardée", async () => {
    anthropicCreateMock.mockRejectedValue(new Error("overloaded_error"));

    const res = await POST(requeteRelance2());

    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/bien enregistrée/);
    expect(sessionsUpdateMock).toHaveBeenCalledTimes(1);
  });
});

function requeteStart() {
  return new Request("http://localhost/api/seance", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ step: "start" }),
  }) as unknown as Parameters<typeof POST>[0];
}

// Constat I-5, décision de Régis du 27/10/2026 : une seule séance offerte.
describe("POST /api/seance — étape start, séance offerte", () => {
  beforeEach(() => {
    sessionLueMock.mockResolvedValue({ data: null });
  });

  it("ouvre la première séance d'un compte sans Parcours", async () => {
    const res = await POST(requeteStart());

    expect(res.status).toBe(200);
    expect((await res.json()).session_id).toBe("s-nouvelle");
  });

  it("refuse une deuxième séance (402) à un compte sans Parcours qui a déjà un souvenir", async () => {
    nombreFragmentsMock.mockResolvedValue({ count: 1 });

    const res = await POST(requeteStart());

    expect(res.status).toBe(402);
    expect((await res.json()).code).toBe("seance_offerte_terminee");
    expect(sessionsInsertMock).not.toHaveBeenCalled();
  });

  it("ouvre une nouvelle séance pour un Parcours actif, quel que soit le nombre de souvenirs", async () => {
    nombreFragmentsMock.mockResolvedValue({ count: 12 });
    abonnementLuMock.mockResolvedValue({ data: { status: "active" } });

    const res = await POST(requeteStart());

    expect(res.status).not.toBe(402);
    expect(sessionsInsertMock).toHaveBeenCalled();
  });

  it("laisse reprendre une séance en cours même sans Parcours", async () => {
    nombreFragmentsMock.mockResolvedValue({ count: 1 });
    sessionLueMock.mockResolvedValue({
      data: { id: "s-1", transcript: [], question_ouverture: "Q ?", section_ouverture: "A" },
    });

    const res = await POST(requeteStart());

    expect(res.status).toBe(200);
    expect((await res.json()).session_id).toBe("s-1");
  });
});
