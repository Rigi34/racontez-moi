import { describe, it, expect, vi, beforeEach } from "vitest";

// Isole la route de ses dépendances externes : le client RLS standard
// (@/utils/supabase/server), le client service_role (@supabase/supabase-js,
// utilisé tel quel ici — pas de wrapper interne), Stripe, et le nettoyage
// Storage (déjà testé indépendamment dans lib/nettoyage-storage.test.ts).
const {
  getUserMock,
  signOutMock,
  abonnementMaybeSingleMock,
  cancelSubscriptionMock,
  deleteUserMock,
  viderPrefixeUtilisateurMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  signOutMock: vi.fn(),
  abonnementMaybeSingleMock: vi.fn(),
  cancelSubscriptionMock: vi.fn(),
  deleteUserMock: vi.fn(),
  viderPrefixeUtilisateurMock: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: getUserMock, signOut: signOutMock },
    from: vi.fn(() => ({
      select: () => ({ eq: () => ({ maybeSingle: abonnementMaybeSingleMock }) }),
    })),
  })),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: { admin: { deleteUser: deleteUserMock } },
  })),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: { subscriptions: { cancel: cancelSubscriptionMock } },
}));

vi.mock("@/lib/nettoyage-storage", () => ({
  viderPrefixeUtilisateur: viderPrefixeUtilisateurMock,
}));

const { POST } = await import("./route");

const USER = { id: "user-abc", email: "narrateur@example.com" };

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: USER } });
  abonnementMaybeSingleMock.mockResolvedValue({ data: null });
  cancelSubscriptionMock.mockResolvedValue({});
  deleteUserMock.mockResolvedValue({ error: null });
  viderPrefixeUtilisateurMock.mockResolvedValue({ videe: true, supprimes: 0 });
  signOutMock.mockResolvedValue({});
});

describe("POST /api/compte/supprimer", () => {
  it("refuse sans authentification", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const res = await POST();

    expect(res.status).toBe(401);
    expect(viderPrefixeUtilisateurMock).not.toHaveBeenCalled();
    expect(deleteUserMock).not.toHaveBeenCalled();
  });

  it("A — nettoie Storage (photos et manuscrits) avant de supprimer le compte, avec le user_id de la session", async () => {
    viderPrefixeUtilisateurMock.mockResolvedValue({ videe: true, supprimes: 3 });

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(viderPrefixeUtilisateurMock).toHaveBeenCalledWith(expect.anything(), "photos", "user-abc");
    expect(viderPrefixeUtilisateurMock).toHaveBeenCalledWith(expect.anything(), "manuscrits", "user-abc");
    expect(viderPrefixeUtilisateurMock).toHaveBeenCalledTimes(2);
    expect(deleteUserMock).toHaveBeenCalledWith("user-abc");
    expect(body).toEqual({ ok: true, photos_supprimees: 3, manuscrits_supprimes: 3 });
  });

  it("B — n'appelle jamais deleteUser si le nettoyage photos est incomplet", async () => {
    viderPrefixeUtilisateurMock.mockImplementation((_client: unknown, bucket: string) =>
      Promise.resolve(bucket === "photos" ? { videe: false, supprimes: 2 } : { videe: true, supprimes: 0 })
    );

    const res = await POST();

    expect(res.status).toBe(500);
    expect(deleteUserMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("B — n'appelle jamais deleteUser si le nettoyage manuscrits est incomplet", async () => {
    viderPrefixeUtilisateurMock.mockImplementation((_client: unknown, bucket: string) =>
      Promise.resolve(bucket === "manuscrits" ? { videe: false, supprimes: 0 } : { videe: true, supprimes: 1 })
    );

    const res = await POST();

    expect(res.status).toBe(500);
    expect(deleteUserMock).not.toHaveBeenCalled();
  });

  it("n'appelle jamais deleteUser si le nettoyage Storage lève une exception", async () => {
    viderPrefixeUtilisateurMock.mockRejectedValue(new Error("Listage Storage échoué"));

    const res = await POST();

    expect(res.status).toBe(500);
    expect(deleteUserMock).not.toHaveBeenCalled();
  });

  it("C — un deleteUser déjà effectué (404) est traité comme un succès, pas une erreur (idempotence)", async () => {
    deleteUserMock.mockResolvedValue({ error: { status: 404, message: "User not found" } });

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(signOutMock).toHaveBeenCalled();
  });

  it("remonte une erreur si deleteUser échoue pour une raison autre que 404", async () => {
    deleteUserMock.mockResolvedValue({ error: { status: 500, message: "Erreur serveur" } });

    const res = await POST();

    expect(res.status).toBe(500);
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("D — le préfixe de suppression provient toujours de la session serveur, jamais d'une valeur cliente", async () => {
    // Aucune entrée client (POST() ne reçoit aucun paramètre) : le seul
    // user.id disponible pour construire le préfixe est celui renvoyé par
    // auth.getUser(), jamais une valeur passée par l'appelant.
    await POST();

    for (const appel of viderPrefixeUtilisateurMock.mock.calls) {
      expect(appel[2]).toBe(USER.id);
    }
  });

  it("l'annulation Stripe reste best-effort et ne bloque pas la suppression", async () => {
    abonnementMaybeSingleMock.mockResolvedValue({
      data: { stripe_subscription_id: "sub_123", status: "active" },
    });
    cancelSubscriptionMock.mockRejectedValue(new Error("Stripe indisponible"));

    const res = await POST();

    expect(res.status).toBe(200);
    expect(deleteUserMock).toHaveBeenCalled();
  });
});
