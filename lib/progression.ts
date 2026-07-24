// Progression affichée en haut de /seance (pages estimées, chapitre en
// cours) — décision du 24 juillet 2026 (refonte de l'interface de séance).
// L'estimation de pages n'est PAS la pagination réelle du livre (celle-ci
// vient de la double passe Typst, cf. lib/manuscrit.ts, trop coûteuse pour
// tourner à chaque chargement de page) : c'est une approximation à partir
// du nombre de mots, cohérente avec la mise en page réelle (Libertinus
// Serif 11pt, format 6x9in — cf. lib/typst.ts), affichée avec un "~" pour
// ne jamais la faire passer pour un décompte définitif.

import type { SupabaseClient } from "@supabase/supabase-js";
import { lireProfil } from "./profil-narrateur";
import { SECTIONS_APRES_OUVERTURE } from "./banque-questions";

const MOTS_PAR_PAGE = 300;

export type Progression = {
  pagesEstimees: number;
  pourcentageCouverture: number; // 0-100, part du cycle de 16 sections déjà couverte
};

export async function calculerProgression(supabase: SupabaseClient, userId: string): Promise<Progression> {
  const [{ data: fragments }, profil] = await Promise.all([
    supabase.from("fragments").select("texte").eq("user_id", userId).neq("statut", "a_revoir"),
    lireProfil(supabase, userId),
  ]);

  const nombreMots = (fragments ?? []).reduce((total, f) => total + f.texte.trim().split(/\s+/).filter(Boolean).length, 0);
  const pagesEstimees = Math.max(1, Math.round(nombreMots / MOTS_PAR_PAGE));

  const pourcentageCouverture = Math.round(
    (Math.min(profil.sections_couvertes.length, SECTIONS_APRES_OUVERTURE.length) / SECTIONS_APRES_OUVERTURE.length) * 100
  );

  return { pagesEstimees, pourcentageCouverture };
}
