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
