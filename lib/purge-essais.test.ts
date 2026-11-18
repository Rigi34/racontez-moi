import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient, User } from "@supabase/supabase-js";

const viderMock = vi.hoisted(() => vi.fn());
vi.mock("./nettoyage-storage", () => ({ viderPrefixeUtilisateur: viderMock }));
vi.mock("./voix", () => ({ BUCKET_VOIX: "voix" }));

const { estEssaiAPurger, purgerEssaisAbandonnes } = await import("./purge-essais");

const MAINTENANT = Date.parse("2026-11-18T12:00:00Z");
const JOUR = 24 * 3600 * 1000;

function compte(id: string, ageJours: number, extra: Partial<User> = {}): User {
  return {
    id,
    is_anonymous: true,
    email: "",
    created_at: new Date(MAINTENANT - ageJours * JOUR).toISOString(),
    ...extra,
  } as User;
}

describe("estEssaiAPurger", () => {
  it("purge un compte anonyme de plus de 30 jours", () => {
    expect(estEssaiAPurger(compte("a", 31), MAINTENANT)).toBe(true);
  });
  it("garde un compte anonyme de moins de 30 jours", () => {
    expect(estEssaiAPurger(compte("a", 29), MAINTENANT)).toBe(false);
  });
  it("ne touche jamais un compte avec une adresse e-mail", () => {
    expect(estEssaiAPurger(compte("a", 90, { is_anonymous: false, email: "x@example.com" }), MAINTENANT)).toBe(false);
  });
});

describe("purgerEssaisAbandonnes", () => {
  let deleteUser: ReturnType<typeof vi.fn>;
  let abonnements: Record<string, boolean>;

  function service(users: User[]) {
    deleteUser = vi.fn().mockResolvedValue({ error: null });
    return {
      auth: { admin: { listUsers: vi.fn().mockResolvedValue({ data: { users }, error: null }), deleteUser } },
      from: () => ({
        select: () => ({
          eq: (_c: string, id: string) => ({
            maybeSingle: () => Promise.resolve({ data: abonnements[id] ? { user_id: id } : null, error: null }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    abonnements = {};
    viderMock.mockResolvedValue({ videe: true, supprimes: 0 });
  });

  it("supprime les essais abandonnés et garde les autres", async () => {
    const s = service([compte("vieux", 40), compte("recent", 3), compte("inscrit", 90, { is_anonymous: false, email: "x@example.com" })]);

    const bilan = await purgerEssaisAbandonnes(s, MAINTENANT);

    expect(bilan.supprimes).toBe(1);
    expect(deleteUser).toHaveBeenCalledTimes(1);
    expect(deleteUser).toHaveBeenCalledWith("vieux");
  });

  it("ne supprime jamais un compte qui a un abonnement", async () => {
    abonnements = { vieux: true };
    const s = service([compte("vieux", 40)]);

    const bilan = await purgerEssaisAbandonnes(s, MAINTENANT);

    expect(bilan.supprimes).toBe(0);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("garde le compte si des fichiers résistent", async () => {
    viderMock.mockResolvedValue({ videe: false, supprimes: 0 });
    const s = service([compte("vieux", 40)]);

    const bilan = await purgerEssaisAbandonnes(s, MAINTENANT);

    expect(bilan.echecs).toBe(1);
    expect(deleteUser).not.toHaveBeenCalled();
  });
});
