// Sélection adaptative dans la banque de 205 questions (chapitre 6, étude
// HÉRITAGE 2026) — remplace la génération 100% dynamique de la question
// d'ouverture des séances suivantes (décision du 22 juillet 2026). La toute
// première séance d'un narrateur reste QUESTION_INITIALE (cf. lib/prompts.ts,
// thématiquement section A) ; cette sélection ne s'applique donc qu'à
// partir de la 2e séance, sur les sections B à Q.

import type { SupabaseClient } from "@supabase/supabase-js";

export const SECTIONS_APRES_OUVERTURE = ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q"];

export type QuestionBanque = { numero: number; section: string; titre_section: string; texte: string };

export async function prochaineQuestionBanque(
  supabase: SupabaseClient,
  sectionsCouvertes: string[]
): Promise<QuestionBanque | null> {
  const prochaineSection =
    SECTIONS_APRES_OUVERTURE.find((s) => !sectionsCouvertes.includes(s)) ??
    // Toutes les sections déjà couvertes au moins une fois (narrateur très
    // engagé) : on recommence le cycle plutôt que de ne plus rien proposer.
    SECTIONS_APRES_OUVERTURE[0];

  const { data } = await supabase
    .from("banque_questions")
    .select("numero, section, titre_section, texte, est_nucleaire")
    .eq("section", prochaineSection)
    .eq("est_nucleaire", false);

  if (!data?.length) return null;

  const choisie = data[Math.floor(Math.random() * data.length)];
  return { numero: choisie.numero, section: choisie.section, titre_section: choisie.titre_section, texte: choisie.texte };
}

// Titre lisible pour la toute première séance (section A, thématiquement
// "Racines et petite enfance") — la question elle-même reste fixe
// (QUESTION_INITIALE, cf. lib/prompts.ts), seul le titre affiché en chapitre
// vient de la banque.
export const TITRE_SECTION_A = "Racines et petite enfance";

export async function titreSection(supabase: SupabaseClient, section: string): Promise<string | null> {
  const { data } = await supabase
    .from("banque_questions")
    .select("titre_section")
    .eq("section", section)
    .limit(1)
    .maybeSingle();
  return data?.titre_section ?? null;
}
