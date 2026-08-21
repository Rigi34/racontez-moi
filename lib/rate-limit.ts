import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

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

// Plafonds quotidiens sur les routes anonymes qui déclenchent un coût réel
// (Brevo pour "contact", compilation Typst + sharp pour
// "certificat_apercu") — A5, 21/08/2026. Clé de comptage : IP, pas
// user_id (routes non authentifiées). "contact" reste bas car un visiteur
// légitime envoie rarement plus d'un message par jour ; "certificat_apercu"
// est plus permissif car l'utilisateur clique plusieurs fois sur "voir
// l'aperçu" en ajustant le texte avant de payer (cf.
// app/offrir/FormulaireCadeau.tsx). Valeurs proposées, pas définitives.
export const LIMITES_QUOTIDIENNES_ANONYME = {
  contact: 5,
  certificat_apercu: 20,
} as const;

export type RouteLimiteeAnonyme = keyof typeof LIMITES_QUOTIDIENNES_ANONYME;

// Extrait l'IP cliente depuis x-forwarded-for. Sur Vercel (hors trusted
// proxy Enterprise, non activé ici), ce header est écrasé par la
// plateforme et n'est pas falsifiable par le client (vérifié dans la doc
// Vercel le 21/08/2026 — https://vercel.com/docs/headers/request-headers).
// Repli sur un seau partagé "unknown" si le header est absent : ça ne peut
// que durcir la limite pour ce cas dégradé, jamais la contourner.
export function extraireIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (!xff) return "unknown";
  return xff.split(",")[0].trim() || "unknown";
}

// Même contrat que verifierQuota, mais côté anonyme : pas de garde
// auth.uid() possible côté RPC (cf. supabase/migrations/0020_usage_anonyme.sql),
// et même choix fail-closed (une erreur de vérification bloque l'appel
// coûteux plutôt que de le laisser passer sans plafond vérifié).
export async function verifierQuotaAnonyme(
  supabase: SupabaseClient,
  ip: string,
  route: RouteLimiteeAnonyme
): Promise<boolean> {
  const { data, error } = await supabase.rpc("incrementer_et_verifier_usage_anonyme", {
    p_ip: ip,
    p_route: route,
    p_limite: LIMITES_QUOTIDIENNES_ANONYME[route],
  });

  if (error) {
    throw new Error(`Vérification du quota anonyme (${route}) échouée: ${error.message}`);
  }

  return data?.[0]?.autorise ?? false;
}
