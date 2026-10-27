import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { creerCodeCadeau, revoquerCodeCadeau } from "./codes-cadeau";

const DONNEES = {
  stripe_session_id: "cs_test_123",
  destinataire_prenom: "Alice",
  offrant_nom: "Bob",
  message: null,
};

// Chaque appel simule une tentative d'insert : { error: null } pour un
// succès, ou une erreur avec un message contenant l'un des noms de
// contrainte réellement vérifiés par creerCodeCadeau.
function mockSupabaseInsert(...resultats: ({ error: null } | { error: { message: string } })[]) {
  const insert = vi.fn();
  for (const r of resultats) insert.mockResolvedValueOnce(r);
  return { from: vi.fn(() => ({ insert })) } as unknown as SupabaseClient;
}

describe("creerCodeCadeau", () => {
  it("retourne un code au format attendu dès le premier insert réussi", async () => {
    const supabase = mockSupabaseInsert({ error: null });
    const code = await creerCodeCadeau(supabase, DONNEES);
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);
  });

  it("retourne null si une ligne existe déjà pour cette session Stripe (webhook rejoué)", async () => {
    const supabase = mockSupabaseInsert({
      error: { message: 'duplicate key value violates unique constraint "codes_cadeau_stripe_session_id_key"' },
    });
    await expect(creerCodeCadeau(supabase, DONNEES)).resolves.toBeNull();
  });

  it("retente sur collision de code puis réussit", async () => {
    const supabase = mockSupabaseInsert(
      { error: { message: 'duplicate key value violates unique constraint "codes_cadeau_code_key"' } },
      { error: { message: 'duplicate key value violates unique constraint "codes_cadeau_code_key"' } },
      { error: null }
    );
    const code = await creerCodeCadeau(supabase, DONNEES);
    expect(code).not.toBeNull();
  });

  it("abandonne après 5 collisions de code consécutives", async () => {
    const supabase = mockSupabaseInsert(
      ...Array.from({ length: 5 }, () => ({
        error: { message: 'duplicate key value violates unique constraint "codes_cadeau_code_key"' },
      }))
    );
    await expect(creerCodeCadeau(supabase, DONNEES)).rejects.toThrow(
      "Impossible de générer un code cadeau unique après plusieurs tentatives."
    );
  });

  it("propage immédiatement une erreur inattendue, sans retry", async () => {
    const supabase = mockSupabaseInsert({ error: { message: "connexion perdue" } });
    await expect(creerCodeCadeau(supabase, DONNEES)).rejects.toThrow("Création du code cadeau échouée: connexion perdue");
  });
});

// Chaîne update().eq().select().maybeSingle() pour codes_cadeau, puis
// update().eq() pour abonnements.
function mockSupabaseRevocation(
  code: { data: { code: string } | null; error: { message: string } | null },
  abonnement: { error: { message: string } | null } = { error: null }
) {
  const eqAbonnement = vi.fn().mockResolvedValue(abonnement);
  const updateAbonnement = vi.fn(() => ({ eq: eqAbonnement }));
  const updateCode = vi.fn(() => ({ eq: () => ({ select: () => ({ maybeSingle: vi.fn().mockResolvedValue(code) }) }) }));
  const supabase = {
    from: vi.fn((table: string) => (table === "codes_cadeau" ? { update: updateCode } : { update: updateAbonnement })),
  } as unknown as SupabaseClient;
  return { supabase, updateCode, updateAbonnement, eqAbonnement };
}

describe("revoquerCodeCadeau", () => {
  it("passe le code à rembourse et coupe l'accès qu'il avait ouvert", async () => {
    const m = mockSupabaseRevocation({ data: { code: "ABCD-EFGH" }, error: null });
    await expect(revoquerCodeCadeau(m.supabase, "cs_test_123")).resolves.toBeNull();
    expect(m.updateCode).toHaveBeenCalledWith({ statut: "rembourse" });
    expect(m.updateAbonnement).toHaveBeenCalledWith(expect.objectContaining({ status: "rembourse" }));
    expect(m.eqAbonnement).toHaveBeenCalledWith("stripe_customer_id", "cadeau:ABCD-EFGH");
  });

  it("ne fait rien de plus si aucun code ne correspond à la session", async () => {
    const m = mockSupabaseRevocation({ data: null, error: null });
    await expect(revoquerCodeCadeau(m.supabase, "cs_inconnue")).resolves.toBeNull();
    expect(m.updateAbonnement).not.toHaveBeenCalled();
  });

  it("renvoie une erreur si la mise à jour du code échoue", async () => {
    const m = mockSupabaseRevocation({ data: null, error: { message: "contrainte" } });
    await expect(revoquerCodeCadeau(m.supabase, "cs_test_123")).resolves.toMatch(/contrainte/);
  });

  it("renvoie une erreur si la coupure de l'accès échoue", async () => {
    const m = mockSupabaseRevocation({ data: { code: "ABCD-EFGH" }, error: null }, { error: { message: "réseau" } });
    await expect(revoquerCodeCadeau(m.supabase, "cs_test_123")).resolves.toMatch(/réseau/);
  });
});
