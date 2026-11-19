import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const purgeMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/purge-essais", () => ({ purgerEssaisAbandonnes: purgeMock }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => ({})) }));

const { GET } = await import("./route");

function requete(auth?: string) {
  return new Request("http://localhost/api/cron/purge-essais", {
    headers: auth ? { authorization: auth } : {},
  }) as unknown as Parameters<typeof GET>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  purgeMock.mockResolvedValue({ examines: 1, supprimes: 0, echecs: 0 });
});
afterEach(() => vi.unstubAllEnvs());

describe("GET /api/cron/purge-essais", () => {
  it("refuse tout si CRON_SECRET n'est pas configuré", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const res = await GET(requete("Bearer "));
    expect(res.status).toBe(401);
    expect(purgeMock).not.toHaveBeenCalled();
  });

  it("refuse un mauvais secret", async () => {
    vi.stubEnv("CRON_SECRET", "bon-secret");
    const res = await GET(requete("Bearer mauvais"));
    expect(res.status).toBe(401);
    expect(purgeMock).not.toHaveBeenCalled();
  });

  it("lance la purge avec le bon secret", async () => {
    vi.stubEnv("CRON_SECRET", "bon-secret");
    const res = await GET(requete("Bearer bon-secret"));
    expect(res.status).toBe(200);
    expect(purgeMock).toHaveBeenCalledTimes(1);
  });
});
