// Nettoyage Storage lors de la suppression d'un compte — corrige
// A-2026-09-12-05 (trouvé le 12/09/2026 : la suppression de compte ne
// touchait jamais Storage, laissant photos et manuscrits orphelins
// indéfiniment). Architecture validée en Phase 4 : lister récursivement,
// supprimer, puis reliser pour confirmer plutôt que de faire confiance au
// seul résultat de la suppression — jamais appelé avec un préfixe autre
// que le user.id de la session authentifiée (cf. app/api/compte/supprimer).

import type { SupabaseClient } from "@supabase/supabase-js";

const TAILLE_PAGE = 100;

// .list() ne descend que d'un niveau — les chemins réels ont plusieurs
// segments sous le préfixe user_id (photos: user_id/fragment_id/fichier ;
// manuscrits: user_id/commande_id/fichier), d'où la récursion. Une entrée
// de dossier a id === null, une entrée de fichier a un id non nul (cf.
// @supabase/storage-js, FileObject) — c'est le seul moyen fiable de
// distinguer les deux dans la réponse de list().
async function listerRecursivement(client: SupabaseClient, bucket: string, prefixe: string): Promise<string[]> {
  const chemins: string[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await client.storage.from(bucket).list(prefixe, { limit: TAILLE_PAGE, offset });
    if (error) throw new Error(`Listage Storage échoué (${bucket}/${prefixe}): ${error.message}`);
    if (!data?.length) break;

    for (const entree of data) {
      const cheminComplet = `${prefixe}/${entree.name}`;
      if (entree.id === null) {
        chemins.push(...(await listerRecursivement(client, bucket, cheminComplet)));
      } else {
        chemins.push(cheminComplet);
      }
    }

    if (data.length < TAILLE_PAGE) break;
    offset += TAILLE_PAGE;
  }

  return chemins;
}

// Vide tout ce qui se trouve sous `${userId}` dans un bucket, puis reliste
// pour confirmer un résultat vide — un objet créé entre le listage et la
// suppression (course rare) resterait sinon invisible sans cette seconde
// passe. Idempotente par construction : un préfixe déjà vide ne déclenche
// aucun appel remove() et renvoie immédiatement `videe: true`.
export async function viderPrefixeUtilisateur(
  client: SupabaseClient,
  bucket: string,
  userId: string
): Promise<{ videe: boolean; supprimes: number }> {
  const chemins = await listerRecursivement(client, bucket, userId);

  for (let i = 0; i < chemins.length; i += TAILLE_PAGE) {
    const lot = chemins.slice(i, i + TAILLE_PAGE);
    const { error } = await client.storage.from(bucket).remove(lot);
    if (error) throw new Error(`Suppression Storage échouée (${bucket}/${userId}): ${error.message}`);
  }

  const restants = await listerRecursivement(client, bucket, userId);
  return { videe: restants.length === 0, supprimes: chemins.length };
}
