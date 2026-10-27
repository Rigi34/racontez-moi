import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Audit de clôture du 27/10/2026, constat B-3 : quand Whisper n'entend que
// du silence, il produit souvent « Merci. ». Le filtre l'écartait, puis le
// repli sur le texte brut le réinjectait.
const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({ auth: { getUser: getUserMock } })),
}));
vi.mock("@/lib/rate-limit", () => ({ verifierQuotaNarrateur: vi.fn().mockResolvedValue(true) }));

const { POST } = await import("./route");

const fetchMock = vi.fn();

function requete() {
  const form = new FormData();
  form.append("audio", new Blob(["audio"], { type: "audio/webm" }), "recording.webm");
  return new Request("http://localhost/api/transcribe", { method: "POST", body: form }) as unknown as Parameters<typeof POST>[0];
}

function reponseGroq(corps: unknown) {
  return new Response(JSON.stringify(corps), { status: 200, headers: { "content-type": "application/json" } });
}

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/transcribe", () => {
  it("renvoie un texte vide quand tous les segments sont jugés non parlés", async () => {
    fetchMock.mockResolvedValue(
      reponseGroq({ text: "Merci.", segments: [{ start: 0.4, text: " Merci.", no_speech_prob: 0.9, compression_ratio: 1 }] })
    );

    const res = await POST(requete());

    expect(res.status).toBe(200);
    expect((await res.json()).text).toBe("");
  });

  it("garde les segments fiables et écarte les autres", async () => {
    fetchMock.mockResolvedValue(
      reponseGroq({
        text: "Mon grand-père taillait le figuier. Merci.",
        segments: [
          { start: 1.2, text: " Mon grand-père taillait le figuier.", no_speech_prob: 0.05, compression_ratio: 1.1 },
          { start: 6, text: " Merci.", no_speech_prob: 0.92, compression_ratio: 1 },
        ],
      })
    );

    const res = await POST(requete());
    const data = await res.json();

    expect(data.text).toBe("Mon grand-père taillait le figuier.");
    expect(data.duree_silence_ms).toBe(1200);
  });
});
