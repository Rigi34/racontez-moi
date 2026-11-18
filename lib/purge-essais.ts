import type { SupabaseClient, User } from "@supabase/supabase-js";
import { viderPrefixeUtilisateur } from "./nettoyage-storage";
import { BUCKET_VOIX } from "./voix";

// Décision B de Régis (contre-audit Grok du 18/11/2026) : un compte d'essai
// gratuit abandonné est supprimé 30 jours après sa création s'il n'a jamais
// payé. « Compte d'essai » = compte anonyme (aucune adresse e-mail) : sans
// e-mail, personne ne peut plus jamais s'y reconnecter une fois le
// navigateur fermé ou changé, ses données ne servent donc plus à personne.
// Un compte créé avec une adresse e-mail n'est jamais touché ici, même
// sans paiement : la personne peut revenir.
export const DELAI_PURGE_JOURS = 30;
const LOT_MAX = 200; // borne le temps d'une exécution ; le reste passe le lendemain

export function estEssaiAPurger(u: User, maintenant: number): boolean {
  if (!u.is_anonymous || u.email) return false;
  const cree = Date.parse(u.created_at);
  return Number.isFinite(cree) && maintenant - cree > DELAI_PURGE_JOURS * 24 * 3600 * 1000;
}

export async function purgerEssaisAbandonnes(
  service: SupabaseClient,
  maintenant = Date.now()
): Promise<{ examines: number; supprimes: number; echecs: number }> {
  const candidats: string[] = [];
  let examines = 0;
  for (let page = 1; candidats.length < LOT_MAX; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Liste des comptes impossible: ${error.message}`);
    examines += data.users.length;
    for (const u of data.users) if (estEssaiAPurger(u, maintenant)) candidats.push(u.id);
    if (data.users.length < 1000) break;
  }

  let supprimes = 0;
  let echecs = 0;
  for (const id of candidats.slice(0, LOT_MAX)) {
    try {
      // Jamais un compte qui a payé, même anonyme (cas théorique).
      const { data: abonnement, error: erreurLecture } = await service
        .from("abonnements")
        .select("user_id")
        .eq("user_id", id)
        .maybeSingle();
      if (erreurLecture || abonnement) continue;

      // Même ordre que /api/compte/supprimer : fichiers d'abord, compte
      // ensuite (les tables suivent par ON DELETE CASCADE). Un bucket absent
      // d'un environnement ne bloque pas.
      for (const bucket of ["photos", "manuscrits", BUCKET_VOIX]) {
        const r = await viderPrefixeUtilisateur(service, bucket, id).catch((e) => {
          if (/not found/i.test(String(e))) return { videe: true, supprimes: 0 };
          throw e;
        });
        if (!r.videe) throw new Error(`Fichiers restants dans ${bucket}`);
      }
      const { error } = await service.auth.admin.deleteUser(id);
      if (error) throw new Error(error.message);
      supprimes++;
    } catch (e) {
      echecs++;
      console.error("Purge des essais : suppression échouée", id, e);
    }
  }
  return { examines, supprimes, echecs };
}
