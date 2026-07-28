// Constantes de la collecte photo (décision du 23 juillet 2026, chapitre
// 5.3/11.4 de l'étude HÉRITAGE 2026 : 300 DPI minimum à la taille
// d'impression, contrôlé à l'envoi plutôt qu'à l'assemblage final pour
// pouvoir redemander une photo tout de suite).

// Résolution minimale sur le plus petit côté — heuristique, pas un calcul
// exact : 1000px sur le plus petit côté couvre confortablement une photo
// insérée à 8cm de large (largeur retenue dans l'assemblage Typst, cf.
// lib/typst.ts) en 300 DPI (300 × 8 / 2.54 ≈ 945px) avec une marge de
// sécurité.
export const RESOLUTION_MIN_PX = 1000;

// 3 à 6 photos par "chapitre" dans la proposition initiale — transposé ici
// en "par fragment", l'unité la plus proche qui existe réellement dans
// cette architecture (pas de découpage en chapitres fixes, cf. décision du
// 22 juillet de garder le cycle adaptatif 17-sections).
export const PHOTOS_MAX_PAR_FRAGMENT = 6;
export const PHOTOS_MAX_TOTAL = 80;

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FragmentAvecPhotos } from "./manuscrit";

// Charge les fragments d'un narrateur avec leurs photos déjà téléchargées
// (octets en mémoire, pas des URLs) — prêt à passer directement à
// compilerInterieur(). Partagé entre l'aperçu et la vraie commande Lulu
// pour ne jamais faire diverger ce qui est prévisualisé de ce qui est
// imprimé (même logique que compilerInterieur/compilerCouverture).
export async function chargerFragmentsAvecPhotos(
  supabase: SupabaseClient,
  userId: string
): Promise<FragmentAvecPhotos[]> {
  const { data: fragments } = await supabase
    .from("fragments")
    .select("id, texte")
    .eq("user_id", userId)
    .neq("statut", "a_revoir")
    .order("created_at", { ascending: true });

  if (!fragments?.length) return [];

  const { data: photos } = await supabase
    .from("photos")
    .select("id, fragment_id, chemin_stockage")
    .in("fragment_id", fragments.map((f) => f.id));

  const photosParFragment = new Map<string, { id: string; chemin_stockage: string }[]>();
  for (const photo of photos ?? []) {
    const liste = photosParFragment.get(photo.fragment_id) ?? [];
    liste.push(photo);
    photosParFragment.set(photo.fragment_id, liste);
  }

  return Promise.all(
    fragments.map(async (fragment) => {
      const photosFragment = photosParFragment.get(fragment.id) ?? [];
      const photosTelechargees = await Promise.all(
        photosFragment.map(async (photo) => {
          const { data, error } = await supabase.storage.from("photos").download(photo.chemin_stockage);
          if (error || !data) {
            throw new Error(`Téléchargement de la photo ${photo.id} échoué : ${error?.message ?? "réponse vide"}`);
          }
          const extension = photo.chemin_stockage.split(".").pop() ?? "jpg";
          return { id: photo.id, extension, buffer: Buffer.from(await data.arrayBuffer()) };
        })
      );
      return { texte: fragment.texte, photos: photosTelechargees };
    })
  );
}
