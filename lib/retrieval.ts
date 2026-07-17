// Retrieval pgvector sur la bibliothèque de référence (14 ouvrages ingérés).
// Utilisé côté génération de questions pour ancrer les relances dans les
// techniques d'entretien mémoriel documentées, plutôt que du free-style pur.

import type { SupabaseClient } from "@supabase/supabase-js";
import { embedText } from "./embeddings";

export type TagFonction =
  | "technique_sensorielle"
  | "structure_recit"
  | "type_question"
  | "signal_hesitation";

export type ChunkReference = {
  id: string;
  ouvrage: string;
  texte: string;
  tag_fonction: TagFonction;
  tag_theme: string | null;
  similarity: number;
};

export async function retrieverTechniques(
  supabase: SupabaseClient,
  texte: string,
  tagFonction: TagFonction | null = null,
  matchCount = 3
): Promise<ChunkReference[]> {
  const embedding = await embedText(texte);
  if (!embedding) return [];

  const { data, error } = await supabase.rpc("match_livres_reference", {
    query_embedding: embedding,
    match_tag_fonction: tagFonction,
    match_count: matchCount,
  });

  if (error) {
    console.error("retrieverTechniques:", error.message);
    return [];
  }
  return data ?? [];
}
