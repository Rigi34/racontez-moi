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
import * as Sentry from "@sentry/nextjs";
import type { FragmentAvecPhotos } from "./manuscrit";

export type FragmentsAvecPhotosResultat = {
  fragments: FragmentAvecPhotos[];
  // Nombre de photos référencées en base mais introuvables dans Storage,
  // exclues du document plutôt que de faire échouer toute la génération
  // (cf. A3, 23/09/2026 — incohérence DB/Storage possible via un vrai
  // chemin de code : app/api/photos/[id]/route.ts supprime l'objet Storage
  // avant la ligne DB, une panne transitoire entre les deux laisse une
  // référence orpheline).
  photosManquantes: number;
};

// Charge les fragments d'un narrateur avec leurs photos déjà téléchargées
// (octets en mémoire, pas des URLs) — prêt à passer directement à
// compilerInterieur(). Partagé entre l'aperçu et la vraie commande Lulu
// pour ne jamais faire diverger ce qui est prévisualisé de ce qui est
// imprimé (même logique que compilerInterieur/compilerCouverture).
export async function chargerFragmentsAvecPhotos(
  supabase: SupabaseClient,
  userId: string
): Promise<FragmentsAvecPhotosResultat> {
  const { data: fragments } = await supabase
    .from("fragments")
    .select("id, texte, session_id")
    .eq("user_id", userId)
    .neq("statut", "a_revoir")
    .order("created_at", { ascending: true });

  if (!fragments?.length) return { fragments: [], photosManquantes: 0 };

  // Section de vie de chaque séance (02/10/2026) : elle détermine le
  // chapitre du livre (lib/livre.ts). Une séance sans section (la toute
  // première, question fixe) ou introuvable retombe sur le chapitre A.
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, section_ouverture")
    .in("id", [...new Set(fragments.map((f) => f.session_id))]);
  const sectionParSession = new Map((sessions ?? []).map((s) => [s.id, s.section_ouverture as string | null]));

  const { data: photos } = await supabase
    .from("photos")
    .select("id, fragment_id, chemin_stockage, largeur_px, hauteur_px")
    .in("fragment_id", fragments.map((f) => f.id));

  const photosParFragment = new Map<
    string,
    { id: string; chemin_stockage: string; largeur_px: number; hauteur_px: number }[]
  >();
  for (const photo of photos ?? []) {
    const liste = photosParFragment.get(photo.fragment_id) ?? [];
    liste.push(photo);
    photosParFragment.set(photo.fragment_id, liste);
  }

  let photosManquantes = 0;

  const fragmentsAvecPhotos = await Promise.all(
    fragments.map(async (fragment) => {
      const photosFragment = photosParFragment.get(fragment.id) ?? [];
      const photosTelechargees = await Promise.all(
        photosFragment.map(async (photo) => {
          const { data, error } = await supabase.storage.from("photos").download(photo.chemin_stockage);
          if (error || !data) {
            // A3 : ne fait plus échouer tout le document pour une seule
            // photo Storage manquante — exclue silencieusement du point de
            // vue du document, mais journalisée pour investigation (id
            // opaques uniquement, aucune donnée personnelle).
            photosManquantes += 1;
            const contexte = {
              photo_id: photo.id,
              fragment_id: fragment.id,
              user_id: userId,
              chemin_stockage: photo.chemin_stockage,
            };
            console.error("Photo Storage introuvable, exclue du document:", contexte, error?.message);
            Sentry.captureException(new Error(`Téléchargement de la photo ${photo.id} échoué : ${error?.message ?? "réponse vide"}`), {
              extra: contexte,
            });
            return null;
          }
          const extension = photo.chemin_stockage.split(".").pop() ?? "jpg";
          return {
            id: photo.id,
            extension,
            buffer: Buffer.from(await data.arrayBuffer()),
            largeurPx: photo.largeur_px,
            hauteurPx: photo.hauteur_px,
          };
        })
      );
      return {
        texte: fragment.texte,
        section: sectionParSession.get(fragment.session_id) ?? null,
        photos: photosTelechargees.filter((p): p is NonNullable<typeof p> => p !== null),
      };
    })
  );

  return { fragments: fragmentsAvecPhotos, photosManquantes };
}
