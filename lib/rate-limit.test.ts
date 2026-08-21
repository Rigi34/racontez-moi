import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { verifierQuota, LIMITES_QUOTIDIENNES } from "./rate-limit";

// Tests du wrapper TypeScript uniquement (client Supabase mocké) — la
// logique de la RPC elle-même (incrément atomique, seuil) est testée
// séparément contre du vrai SQL dans tests/usage-api-rpc.test.ts.

function mockSupabase(data: unknown, error: { message: string } | null = null) {
  return { rpc: vi.fn().mockResolvedValue({ data, error }) } as unknown as SupabaseClient;
}

describe("verifierQuota", () => {
  it("retourne true quand la RPC autorise", async () => {
    const supabase = mockSupabase([{ autorise: true, compteur: 5 }]);
    await expect(verifierQuota(supabase, "user-1", "seance")).resolves.toBe(true);
  });

  it("retourne false quand la RPC refuse (quota dépassé)", async () => {
    const supabase = mockSupabase([{ autorise: false, compteur: 31 }]);
    await expect(verifierQuota(supabase, "user-1", "seance")).resolves.toBe(false);
  });

  it("appelle la RPC avec le user_id, la route et le seuil correspondant", async () => {
    const supabase = mockSupabase([{ autorise: true, compteur: 1 }]);
    await verifierQuota(supabase, "user-1", "transcribe");
    expect(supabase.rpc).toHaveBeenCalledWith("incrementer_et_verifier_usage", {
      p_user_id: "user-1",
      p_route: "transcribe",
      p_limite: LIMITES_QUOTIDIENNES.transcribe,
    });
  });

  it("fail-closed : lève une exception si la RPC échoue (réseau/base)", async () => {
    const supabase = mockSupabase(null, { message: "connexion refusée" });
    await expect(verifierQuota(supabase, "user-1", "seance")).rejects.toThrow(/connexion refusée/);
  });

  it("fail-closed : retourne false si la réponse est vide ou inattendue", async () => {
    const supabase = mockSupabase([]);
    await expect(verifierQuota(supabase, "user-1", "seance")).resolves.toBe(false);
  });
});
