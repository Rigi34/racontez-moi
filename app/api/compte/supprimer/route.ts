import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { stripe } from "@/lib/stripe";
import { viderPrefixeUtilisateur } from "@/lib/nettoyage-storage";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { data: abonnement } = await supabase
    .from("abonnements")
    .select("stripe_subscription_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (abonnement?.stripe_subscription_id && abonnement.status === "active") {
    await stripe.subscriptions.cancel(abonnement.stripe_subscription_id).catch((e) =>
      console.error("Annulation abonnement Stripe échouée lors de la suppression de compte:", e)
    );
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Trou trouvé le 12/09/2026 (A-2026-09-12-05) : la suppression de compte
  // n'a jamais nettoyé Storage — photos et manuscrits restaient orphelins
  // indéfiniment. Storage n'étant pas transactionnel avec Postgres, le seul
  // ordre sûr est de nettoyer et vérifier AVANT de supprimer le compte : si
  // un objet résiste, le compte reste intact et récupérable pour qu'une
  // nouvelle tentative reprenne le nettoyage, plutôt que de perdre le lien
  // entre l'utilisateur et ses fichiers (préfixe toujours construit depuis
  // user.id de la session, jamais une valeur cliente).
  let photos: { videe: boolean; supprimes: number };
  let manuscrits: { videe: boolean; supprimes: number };
  try {
    [photos, manuscrits] = await Promise.all([
      viderPrefixeUtilisateur(serviceClient, "photos", user.id),
      viderPrefixeUtilisateur(serviceClient, "manuscrits", user.id),
    ]);
  } catch (e) {
    console.error("Nettoyage Storage échoué lors de la suppression de compte:", user.id, e);
    return NextResponse.json({ error: "Erreur lors de la suppression. Réessayez." }, { status: 500 });
  }

  if (!photos.videe || !manuscrits.videe) {
    console.error("Nettoyage Storage incomplet, suppression du compte annulée:", user.id, {
      photos_videe: photos.videe,
      manuscrits_videe: manuscrits.videe,
    });
    return NextResponse.json({ error: "Erreur lors de la suppression. Réessayez." }, { status: 500 });
  }

  // Toutes les tables (sessions, fragments, tours_conversation,
  // profil_narrateur, abonnements) référencent auth.users avec ON DELETE
  // CASCADE — supprimer le compte suffit à tout effacer côté base.
  const { error } = await serviceClient.auth.admin.deleteUser(user.id);
  if (error) {
    // "Utilisateur introuvable" = un appel précédent a déjà réussi (retry
    // après un timeout réseau côté client, par ex.) — traiter comme un
    // succès plutôt que de bloquer, cohérent avec l'idempotence attendue
    // de toute la route. Comportement examiné dynamiquement en TEST lors
    // des scénarios D et I de la campagne A–J du 20/09/2026 : D a montré
    // qu'un simple rejeu séquentiel avec la même session n'atteint jamais
    // cette branche (auth.getUser() échoue avant, avec 401, dès que le
    // compte n'existe plus) ; I, avec deux suppressions réellement
    // concurrentes, a produit deux réponses 200 là où une seule suppression
    // réelle est possible — signe (déduit, pas observé directement) que
    // cette branche 404 a bien été empruntée par l'une des deux requêtes.
    if (error.status !== 404) {
      console.error("Suppression de compte échouée:", user.id, error);
      return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
    }
  }

  await supabase.auth.signOut();
  return NextResponse.json({
    ok: true,
    photos_supprimees: photos.supprimes,
    manuscrits_supprimes: manuscrits.supprimes,
  });
}
