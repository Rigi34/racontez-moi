import type { SupabaseClient } from "@supabase/supabase-js";

// Plafonds quotidiens sur les routes qui déclenchent un appel API facturé
// (Anthropic pour "seance", Groq Whisper pour "transcribe") — valeurs
// proposées à l'introduction d'A4, pas des chiffres produit définitifs.
// Base du calcul : une séance complète (question d'ouverture + 2 relances +
// fragment) déclenche 3 requêtes sur chacune des deux routes, donc 30/jour
// ≈ 10 séances complètes/jour par narrateur.
export const LIMITES_QUOTIDIENNES = {
  seance: 30,
  transcribe: 30,
} as const;

export type RouteLimitee = keyof typeof LIMITES_QUOTIDIENNES;

// Incrémente le compteur du jour pour (userId, route) et vérifie le seuil en
// une seule opération atomique côté base (voir
// supabase/migrations/0019_usage_api.sql pour la garantie d'atomicité).
// Fail-closed délibéré : si la vérification elle-même échoue (erreur RPC),
// on ne peut pas garantir l'absence de dépassement, donc on bloque plutôt
// que de laisser passer un appel facturé sans plafond vérifié — contraire au
// choix de repli habituel du code existant (ex. retrieverTechniques dans
// lib/retrieval.ts, qui échoue ouvert car son échec ne coûte rien).
export async function verifierQuota(
  supabase: SupabaseClient,
  userId: string,
  route: RouteLimitee
): Promise<boolean> {
  const { data, error } = await supabase.rpc("incrementer_et_verifier_usage", {
    p_user_id: userId,
    p_route: route,
    p_limite: LIMITES_QUOTIDIENNES[route],
  });

  if (error) {
    throw new Error(`Vérification du quota (${route}) échouée: ${error.message}`);
  }

  return data?.[0]?.autorise ?? false;
}
