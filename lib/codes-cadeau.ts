import type { SupabaseClient } from "@supabase/supabase-js";

// Alphabet volontairement sans caractères ambigus (0/O, 1/I/L) — le code
// est destiné à être recopié à la main depuis un certificat imprimé.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function genererCodeCadeau(): string {
  const bloc = () =>
    Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
  return `${bloc()}-${bloc()}`;
}

// Quelques tentatives suffisent : l'espace de codes (32^8) rend une
// collision quasi impossible, mais l'unicité reste garantie par la
// contrainte unique en base plutôt que supposée ici — même logique que
// commandes_livre (verrou applicatif + contrainte unique comme vrai
// garde-fou contre une double écriture concurrente).
export async function creerCodeCadeau(
  supabase: SupabaseClient,
  donnees: {
    stripe_session_id: string;
    destinataire_prenom: string;
    offrant_nom: string;
    message: string | null;
  }
): Promise<string | null> {
  for (let tentative = 0; tentative < 5; tentative++) {
    const code = genererCodeCadeau();
    const { error } = await supabase.from("codes_cadeau").insert({ code, ...donnees });
    if (!error) return code;
    if (error.message.includes("codes_cadeau_stripe_session_id_key")) return null;
    if (!error.message.includes("codes_cadeau_code_key")) throw new Error("Création du code cadeau échouée: " + error.message);
  }
  throw new Error("Impossible de générer un code cadeau unique après plusieurs tentatives.");
}

// Remboursement d'un achat-cadeau (garantie, CGV art. 6) : rend le code
// inutilisable et, s'il était déjà activé, coupe l'accès qu'il avait ouvert
// (abonnement identifié par stripe_customer_id = "cadeau:<code>", cf.
// /api/cadeau/activer). Renvoie un message d'erreur plutôt que de lever, pour
// que le webhook réponde 500 et que Stripe retente — jamais un 200 silencieux.
export async function revoquerCodeCadeau(
  supabase: SupabaseClient,
  stripeSessionId: string
): Promise<string | null> {
  const { data: ligne, error } = await supabase
    .from("codes_cadeau")
    .update({ statut: "rembourse" })
    .eq("stripe_session_id", stripeSessionId)
    .select("code")
    .maybeSingle();
  if (error) return "Révocation du code cadeau échouée: " + error.message;
  if (!ligne) return null;

  const { error: erreurAbonnement } = await supabase
    .from("abonnements")
    .update({ status: "rembourse", updated_at: new Date().toISOString() })
    .eq("stripe_customer_id", `cadeau:${ligne.code}`);
  if (erreurAbonnement) return "Révocation de l'accès cadeau échouée: " + erreurAbonnement.message;
  return null;
}
