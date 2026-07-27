// Profil narrateur : mémoire de suivi par utilisateur (périodes couvertes,
// ancrages sensoriels déjà sollicités, sujets esquivés). Alimente le prompt
// système du moteur de questions pour éviter la répétition et respecter les
// esquives, plutôt que de reposer un jeu de questions figé.

import type { SupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type ProfilNarrateur = {
  periodes_couvertes: string[];
  ancrages_sensoriels_utilises: string[];
  profondeur_par_periode: Record<string, string>;
  sujets_esquives: string[];
};

const PROFIL_DEFAUT: ProfilNarrateur = {
  periodes_couvertes: [],
  ancrages_sensoriels_utilises: [],
  profondeur_par_periode: {},
  sujets_esquives: [],
};

export async function lireProfil(supabase: SupabaseClient, userId: string): Promise<ProfilNarrateur> {
  const { data } = await supabase
    .from("profil_narrateur")
    .select("periodes_couvertes, ancrages_sensoriels_utilises, profondeur_par_periode, sujets_esquives")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return PROFIL_DEFAUT;
  return {
    periodes_couvertes: data.periodes_couvertes ?? [],
    ancrages_sensoriels_utilises: data.ancrages_sensoriels_utilises ?? [],
    profondeur_par_periode: data.profondeur_par_periode ?? {},
    sujets_esquives: data.sujets_esquives ?? [],
  };
}

export function resumerProfilPourPrompt(profil: ProfilNarrateur): string {
  const lignes: string[] = [];

  if (profil.periodes_couvertes.length) {
    lignes.push(
      `Périodes déjà explorées : ${profil.periodes_couvertes.join(", ")}. Privilégie une période encore peu couverte plutôt que de revenir toujours sur la même.`
    );
  }
  if (profil.ancrages_sensoriels_utilises.length) {
    lignes.push(
      `Ancrages sensoriels déjà sollicités : ${profil.ancrages_sensoriels_utilises.join(", ")}. Varie le sens convoqué plutôt que de répéter toujours le même.`
    );
  }
  if (profil.sujets_esquives.length) {
    lignes.push(
      `Sujets que cette personne a esquivés jusqu'ici : ${profil.sujets_esquives.join(", ")}. N'y reviens pas frontalement — laisse-les de côté sauf si elle les amène elle-même.`
    );
  }

  if (!lignes.length) return "";
  return `\n\nCe que tu sais déjà de ce narrateur :\n${lignes.map((l) => `— ${l}`).join("\n")}`;
}

const SYSTEM_EXTRACTION = `Tu analyses un échange d'entretien mémoriel pour mettre à jour un profil de suivi.
Réponds UNIQUEMENT en JSON strict, rien d'autre :
{"periode": "...", "ancrages_sensoriels": ["..."], "profondeur": "..."}

periode = UNE valeur parmi : "enfance", "adolescence", "vie_adulte", "age_mur", "non_precise"
ancrages_sensoriels = sous-ensemble de ["odeur", "lumiere", "son", "texture", "gout"], liste vide si aucun n'est présent
profondeur = UNE valeur parmi : "superficiel" (anecdote de surface), "moyen", "profond" (émotion ou détail intime révélé)`;

export async function mettreAJourProfil(
  supabase: SupabaseClient,
  userId: string,
  echange: string
): Promise<void> {
  let extraction: { periode: string; ancrages_sensoriels: string[]; profondeur: string };
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      system: SYSTEM_EXTRACTION,
      messages: [{ role: "user", content: echange.slice(0, 2000) }],
    });
    const brut = (message.content[0] as { type: string; text: string }).text.trim();
    extraction = JSON.parse(brut.replace(/^```json\s*|\s*```$/g, ""));
  } catch (e) {
    console.error("mettreAJourProfil: extraction échouée", e);
    return;
  }

  const profil = await lireProfil(supabase, userId);

  const periodes = new Set(profil.periodes_couvertes);
  if (extraction.periode && extraction.periode !== "non_precise") periodes.add(extraction.periode);

  const ancrages = new Set(profil.ancrages_sensoriels_utilises);
  for (const a of extraction.ancrages_sensoriels ?? []) ancrages.add(a);

  const profondeurParPeriode = { ...profil.profondeur_par_periode };
  if (extraction.periode && extraction.periode !== "non_precise") {
    profondeurParPeriode[extraction.periode] = extraction.profondeur;
  }

  const { error } = await supabase.from("profil_narrateur").upsert(
    {
      user_id: userId,
      periodes_couvertes: Array.from(periodes),
      ancrages_sensoriels_utilises: Array.from(ancrages),
      profondeur_par_periode: profondeurParPeriode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) console.error("mettreAJourProfil: upsert échoué", error.message);
}
