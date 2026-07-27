// Progression affichée en haut de /seance (pages estimées, chapitre en
// cours) — décision du 24 juillet 2026 (refonte de l'interface de séance).
// L'estimation de pages n'est PAS la pagination réelle du livre (celle-ci
// vient de la double passe Typst, cf. lib/manuscrit.ts, trop coûteuse pour
// tourner à chaque chargement de page) : c'est une approximation à partir
// du nombre de mots, cohérente avec la mise en page réelle (Libertinus
// Serif 11pt, format 6x9in — cf. lib/typst.ts), affichée avec un "~" pour
// ne jamais la faire passer pour un décompte définitif.

import type { SupabaseClient } from "@supabase/supabase-js";
import { SECTIONS_APRES_OUVERTURE, QUESTIONS_CIBLE_PAR_SECTION, questionsDistinctesParSection } from "./banque-questions";

const MOTS_PAR_PAGE = 300;

export type Progression = {
  pagesEstimees: number;
  // 0-100 — moyenne, sur les 16 sections, de l'avancement fractionnel de
  // chacune (questions distinctes posées / QUESTIONS_CIBLE_PAR_SECTION,
  // plafonné à 1) plutôt qu'une couverture binaire section faite/pas faite
  // (décision du 26/07/2026, suite à la revue de Claude Pro : avance à
  // chaque séance plutôt que par paliers de 1/16).
  pourcentageCouverture: number;
};

export async function calculerProgression(supabase: SupabaseClient, userId: string): Promise<Progression> {
  const [{ data: fragments }, parSection] = await Promise.all([
    supabase.from("fragments").select("texte").eq("user_id", userId).neq("statut", "a_revoir"),
    questionsDistinctesParSection(supabase, userId, { statuts: ["completed"] }),
  ]);

  const nombreMots = (fragments ?? []).reduce((total, f) => total + f.texte.trim().split(/\s+/).filter(Boolean).length, 0);
  const pagesEstimees = Math.max(1, Math.round(nombreMots / MOTS_PAR_PAGE));

  const avancementTotal = SECTIONS_APRES_OUVERTURE.reduce((total, section) => {
    const nombreQuestions = parSection.get(section)?.size ?? 0;
    return total + Math.min(nombreQuestions, QUESTIONS_CIBLE_PAR_SECTION) / QUESTIONS_CIBLE_PAR_SECTION;
  }, 0);

  const pourcentageCouverture = Math.round((avancementTotal / SECTIONS_APRES_OUVERTURE.length) * 100);

  return { pagesEstimees, pourcentageCouverture };
}
