// Sélection adaptative dans la banque de 205 questions (chapitre 6, étude
// HÉRITAGE 2026) — remplace la génération 100% dynamique de la question
// d'ouverture des séances suivantes (décision du 22 juillet 2026). La toute
// première séance d'un narrateur reste QUESTION_INITIALE (cf. lib/prompts.ts,
// thématiquement section A) ; cette sélection ne s'applique donc qu'à
// partir de la 2e séance, sur les sections B à Q.

import type { SupabaseClient } from "@supabase/supabase-js";

// P (lignée/transmission) placée en dernier plutôt que Q (argent/matériel) —
// correction du 29/07/2026 suite à l'audit des 14 ouvrages de référence :
// terminer un cycle sur l'inventaire matériel juste après le bilan de vie
// (section O) est un anticlimax narratif documenté par la littérature
// (Rainer, Gornick, Zinsser, Erikson) ; la transmission intergénérationnelle
// referme mieux le cycle.
export const SECTIONS_APRES_OUVERTURE = ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "Q", "P"];

// Nombre de questions visées par section avant de considérer une section
// comme "faite" et de passer à la suivante (1 question nucléaire [N] + 3 de
// contexte) — cf. étude de cadence du 26/07/2026. Valeur fixe et unique,
// volontairement indépendante de toute durée de parcours choisie (aucune
// durée n'est imposée à l'entrée) : dénominateur connu d'avance, sert aussi
// au calcul de progression (lib/progression.ts).
export const QUESTIONS_CIBLE_PAR_SECTION = 4;

export type QuestionBanque = { numero: number; section: string; titre_section: string; texte: string; est_nucleaire: boolean };

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
    .eq("section", prochaineSection);

  if (!data?.length) return null;

  const contexte = data.filter((q) => !q.est_nucleaire);
  const nucleaire = data.filter((q) => q.est_nucleaire);
  const contextePosesCount = contexte.filter((q) => dejaPosees.has(q.texte)).length;
  const nucleaireDejaPosee = nucleaire.some((q) => dejaPosees.has(q.texte));

  // La question [N] est réservée à la dernière place du quota de section (1
  // nucléaire + 3 de contexte, QUESTIONS_CIBLE_PAR_SECTION) — jamais
  // proposée avant que les questions de contexte n'aient été posées, pour
  // rester le point d'ancrage émotionnel de clôture voulu (décision du
  // 26/07/2026). Bug corrigé le 29/07/2026 : un filtre est_nucleaire=false
  // l'excluait purement et simplement de toute sélection, quel que soit
  // l'avancement dans la section.
  let pool: typeof data;
  if (contextePosesCount < QUESTIONS_CIBLE_PAR_SECTION - 1 && contexte.some((q) => !dejaPosees.has(q.texte))) {
    pool = contexte.filter((q) => !dejaPosees.has(q.texte));
  } else if (!nucleaireDejaPosee && nucleaire.length) {
    pool = nucleaire;
  } else {
    // Quota déjà atteint ou section épuisée dans les deux catégories (tour
    // suivant du cycle) : on retombe sur les questions non encore posées,
    // puis sur l'ensemble si tout a déjà été utilisé.
    const nonPosees = data.filter((q) => !dejaPosees.has(q.texte));
    pool = nonPosees.length ? nonPosees : data;
  }

  const choisie = pool[Math.floor(Math.random() * pool.length)];
  return {
    numero: choisie.numero,
    section: choisie.section,
    titre_section: choisie.titre_section,
    texte: choisie.texte,
    est_nucleaire: choisie.est_nucleaire,
  };
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
