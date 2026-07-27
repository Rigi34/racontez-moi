// Sélection adaptative dans la banque de 205 questions (chapitre 6, étude
// HÉRITAGE 2026) — remplace la génération 100% dynamique de la question
// d'ouverture des séances suivantes (décision du 22 juillet 2026). La toute
// première séance d'un narrateur reste QUESTION_INITIALE (cf. lib/prompts.ts,
// thématiquement section A) ; cette sélection ne s'applique donc qu'à
// partir de la 2e séance, sur les sections B à Q.

import type { SupabaseClient } from "@supabase/supabase-js";

export const SECTIONS_APRES_OUVERTURE = ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q"];

// Nombre de questions visées par section avant de considérer une section
// comme "faite" et de passer à la suivante (1 question nucléaire [N] + 3 de
// contexte) — cf. étude de cadence du 26/07/2026. Valeur fixe et unique,
// volontairement indépendante de toute durée de parcours choisie (aucune
// durée n'est imposée à l'entrée) : dénominateur connu d'avance, sert aussi
// au calcul de progression (lib/progression.ts).
export const QUESTIONS_CIBLE_PAR_SECTION = 4;

export type QuestionBanque = { numero: number; section: string; titre_section: string; texte: string };

// Questions distinctes déjà posées par section, dérivées de l'historique
// réel des séances (sessions.section_ouverture/question_ouverture) plutôt
// que d'un compteur séparé à maintenir en double — une seule source de
// vérité, réutilisée pour choisir la prochaine section ET pour la
// progression affichée au narrateur.
export async function questionsDistinctesParSection(
  supabase: SupabaseClient,
  userId: string,
  options?: { statuts?: string[] }
): Promise<Map<string, Set<string>>> {
  let query = supabase
    .from("sessions")
    .select("section_ouverture, question_ouverture")
    .eq("user_id", userId)
    .not("section_ouverture", "is", null);
  if (options?.statuts) query = query.in("status", options.statuts);
  const { data } = await query;

  const parSection = new Map<string, Set<string>>();
  for (const s of data ?? []) {
    if (!s.section_ouverture || !s.question_ouverture) continue;
    const ensemble = parSection.get(s.section_ouverture) ?? new Set<string>();
    ensemble.add(s.question_ouverture);
    parSection.set(s.section_ouverture, ensemble);
  }
  return parSection;
}

export async function prochaineQuestionBanque(
  supabase: SupabaseClient,
  userId: string
): Promise<QuestionBanque | null> {
  // Toutes les séances (y compris passées/abandonnées) comptent ici, pour ne
  // pas reproposer immédiatement la même question dans une section — mais
  // pas pour la progression (cf. lib/progression.ts, qui ne garde que les
  // séances "completed").
  const parSection = await questionsDistinctesParSection(supabase, userId);

  const prochaineSection =
    SECTIONS_APRES_OUVERTURE.find((s) => (parSection.get(s)?.size ?? 0) < QUESTIONS_CIBLE_PAR_SECTION) ??
    // Toutes les sections ont atteint leur quota (narrateur très engagé) :
    // on repart pour un nouveau tour plutôt que de ne plus rien proposer.
    SECTIONS_APRES_OUVERTURE[0];

  const dejaPosees = parSection.get(prochaineSection) ?? new Set<string>();

  const { data } = await supabase
    .from("banque_questions")
    .select("numero, section, titre_section, texte, est_nucleaire")
    .eq("section", prochaineSection)
    .eq("est_nucleaire", false);

  if (!data?.length) return null;

  // Évite de reposer une question déjà posée dans cette section tant que
  // toutes n'ont pas été utilisées au moins une fois.
  const candidates = data.filter((q) => !dejaPosees.has(q.texte));
  const pool = candidates.length ? candidates : data;

  const choisie = pool[Math.floor(Math.random() * pool.length)];
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
