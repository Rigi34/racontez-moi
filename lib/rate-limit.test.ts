import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import {
  verifierQuota,
  LIMITES_QUOTIDIENNES,
  verifierQuotaAnonyme,
  extraireIp,
  LIMITES_QUOTIDIENNES_ANONYME,
} from "./rate-limit";

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

function mockRequest(xff: string | null): NextRequest {
  return {
    headers: { get: (name: string) => (name === "x-forwarded-for" ? xff : null) },
  } as unknown as NextRequest;
}

describe("extraireIp", () => {
  it("retourne la valeur du header x-forwarded-for", () => {
    expect(extraireIp(mockRequest("203.0.113.4"))).toBe("203.0.113.4");
  });

  it("prend le premier segment si plusieurs IP sont chaînées", () => {
    expect(extraireIp(mockRequest("203.0.113.4, 70.41.3.18, 150.172.238.178"))).toBe("203.0.113.4");
  });

  it("retire les espaces autour du premier segment", () => {
    expect(extraireIp(mockRequest(" 203.0.113.4 ,70.41.3.18"))).toBe("203.0.113.4");
  });

  it('retourne "unknown" si le header est absent', () => {
    expect(extraireIp(mockRequest(null))).toBe("unknown");
  });

  it('retourne "unknown" si le header est vide', () => {
    expect(extraireIp(mockRequest(""))).toBe("unknown");
  });
});

describe("verifierQuotaAnonyme", () => {
  it("retourne true quand la RPC autorise", async () => {
    const supabase = mockSupabase([{ autorise: true, compteur: 1 }]);
    await expect(verifierQuotaAnonyme(supabase, "203.0.113.4", "contact")).resolves.toBe(true);
  });

  it("retourne false quand la RPC refuse (quota dépassé)", async () => {
    const supabase = mockSupabase([{ autorise: false, compteur: 6 }]);
    await expect(verifierQuotaAnonyme(supabase, "203.0.113.4", "contact")).resolves.toBe(false);
  });

  it("appelle la RPC avec l'IP, la route et le seuil correspondant", async () => {
    const supabase = mockSupabase([{ autorise: true, compteur: 1 }]);
    await verifierQuotaAnonyme(supabase, "203.0.113.4", "certificat_apercu");
    expect(supabase.rpc).toHaveBeenCalledWith("incrementer_et_verifier_usage_anonyme", {
      p_ip: "203.0.113.4",
      p_route: "certificat_apercu",
      p_limite: LIMITES_QUOTIDIENNES_ANONYME.certificat_apercu,
    });
  });

  it("fail-closed : lève une exception si la RPC échoue (réseau/base)", async () => {
    const supabase = mockSupabase(null, { message: "connexion refusée" });
    await expect(verifierQuotaAnonyme(supabase, "203.0.113.4", "contact")).rejects.toThrow(/connexion refusée/);
  });

  it("fail-closed : retourne false si la réponse est vide ou inattendue", async () => {
    const supabase = mockSupabase([]);
    await expect(verifierQuotaAnonyme(supabase, "203.0.113.4", "contact")).resolves.toBe(false);
  });
});
