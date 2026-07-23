import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { compilerInterieur, compilerCouverture } from "@/lib/manuscrit";
import { creerCommandeImpression, PAGES_MINIMUM_RELIE, type AdresseLivraison } from "@/lib/lulu";

// Déclenchement de la vraie commande d'impression — dernière brique du
// pipeline (toujours sandbox Lulu tant que Régis n'a pas de compte
// production avec carte bancaire, cf. lib/lulu.ts). Le narrateur vient de
// valider son BAT côté client — cette route ne redemande pas confirmation,
// elle exécute.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const [{ data: abonnement }, { data: adresseRow }, { data: commandeExistante }] = await Promise.all([
    supabase.from("abonnements").select("status, livre_paye").eq("user_id", user.id).maybeSingle(),
    supabase.from("adresses_livraison").select("nom, adresse, ville, code_postal, pays, telephone").eq("user_id", user.id).maybeSingle(),
    supabase.from("commandes_livre").select("id, statut").eq("user_id", user.id).in("statut", ["en_cours", "confirmee"]).maybeSingle(),
  ]);

  if (abonnement?.status !== "active") {
    return NextResponse.json({ error: "Le Parcours n'est pas actif sur ce compte." }, { status: 403 });
  }
  // Le forfait création (129€) n'inclut pas le livre — paiement séparé
  // requis (décision du 23 juillet 2026) avant toute vraie commande Lulu.
  if (!abonnement.livre_paye) {
    return NextResponse.json({ error: "Le paiement du livre imprimé est requis avant de commander." }, { status: 402 });
  }
  if (!adresseRow) {
    return NextResponse.json({ error: "Adresse de livraison manquante." }, { status: 400 });
  }
  if (commandeExistante) {
    return NextResponse.json({ error: "Une commande existe déjà pour ce livre." }, { status: 409 });
  }

  const { data: fragments } = await supabase
    .from("fragments")
    .select("texte")
    .eq("user_id", user.id)
    .neq("statut", "a_revoir")
    .order("created_at", { ascending: true });

  if (!fragments?.length) {
    return NextResponse.json({ error: "Aucun fragment à assembler." }, { status: 400 });
  }

  // Contrainte physique du relié (vérifiée en direct auprès de l'API Lulu,
  // pas une supposition) : en dessous de ce seuil de pages, impossible de
  // relier le livre — à vérifier avant de créer une commande, pas après.
  const { nombrePages: nombrePagesPrevu } = compilerInterieur(fragments.map((f) => f.texte));
  if (nombrePagesPrevu < PAGES_MINIMUM_RELIE) {
    return NextResponse.json(
      {
        error: `Votre manuscrit fait ${nombrePagesPrevu} page${nombrePagesPrevu > 1 ? "s" : ""} — il en faut au moins ${PAGES_MINIMUM_RELIE} pour un livre relié. Continuez vos séances.`,
      },
      { status: 400 }
    );
  }

  // Verrou applicatif avant l'appel Lulu — la contrainte unique en base
  // (commandes_livre_une_par_user) reste le vrai garde-fou contre une
  // double commande en cas de course entre deux requêtes simultanées.
  const { data: commandeCreee, error: erreurInsertion } = await supabase
    .from("commandes_livre")
    .insert({ user_id: user.id, statut: "en_cours" })
    .select("id")
    .single();
  if (erreurInsertion || !commandeCreee) {
    return NextResponse.json({ error: "Une commande existe déjà pour ce livre." }, { status: 409 });
  }

  try {
    const { buffer: interieurBuffer, nombrePages } = compilerInterieur(fragments.map((f) => f.texte));
    const couvertureBuffer = await compilerCouverture(nombrePages);

    const dossier = `${user.id}/${commandeCreee.id}`;
    const [{ error: erreurUploadInterieur }, { error: erreurUploadCouverture }] = await Promise.all([
      supabase.storage.from("manuscrits").upload(`${dossier}/interieur.pdf`, interieurBuffer, {
        contentType: "application/pdf",
        upsert: true,
      }),
      supabase.storage.from("manuscrits").upload(`${dossier}/couverture.pdf`, couvertureBuffer, {
        contentType: "application/pdf",
        upsert: true,
      }),
    ]);
    if (erreurUploadInterieur || erreurUploadCouverture) {
      throw new Error("Upload Storage échoué: " + JSON.stringify({ erreurUploadInterieur, erreurUploadCouverture }));
    }

    const uneHeure = 60 * 60;
    const [{ data: urlInterieur }, { data: urlCouverture }] = await Promise.all([
      supabase.storage.from("manuscrits").createSignedUrl(`${dossier}/interieur.pdf`, uneHeure),
      supabase.storage.from("manuscrits").createSignedUrl(`${dossier}/couverture.pdf`, uneHeure),
    ]);
    if (!urlInterieur || !urlCouverture) throw new Error("Génération des URLs signées échouée.");

    const adresse: AdresseLivraison = {
      name: adresseRow.nom,
      street1: adresseRow.adresse,
      city: adresseRow.ville,
      country_code: adresseRow.pays,
      postcode: adresseRow.code_postal,
      phone_number: adresseRow.telephone,
    };

    const commandeLulu = await creerCommandeImpression(
      adresse,
      user.email!,
      urlInterieur.signedUrl,
      urlCouverture.signedUrl
    );

    await supabase
      .from("commandes_livre")
      .update({ statut: "confirmee", lulu_print_job_id: String(commandeLulu.id), nombre_pages: nombrePages })
      .eq("id", commandeCreee.id);

    return NextResponse.json({ ok: true, nombre_pages: nombrePages });
  } catch (error) {
    console.error("Commande livre échouée:", error);
    await supabase.from("commandes_livre").update({ statut: "echouee" }).eq("id", commandeCreee.id);
    return NextResponse.json({ error: "Échec de la commande. Réessayez, ou contactez-nous." }, { status: 500 });
  }
}
