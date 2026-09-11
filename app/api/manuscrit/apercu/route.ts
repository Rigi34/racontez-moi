import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { compilerInterieur } from "@/lib/manuscrit";
import { chargerFragmentsAvecPhotos } from "@/lib/photos";
import { lirePersonnalisationLivre } from "@/lib/profil-narrateur";

// Assemblage réel du manuscrit — première brique du pipeline complet du
// livre, nécessaire pour l'offre tout-compris à 155€ (décision du 28
// juillet 2026, prix fixe unique, livre relié couleur inclus).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  // Trou trouvé le 11/09/2026 : cette route ne vérifiait que
  // l'authentification, pas le paiement — n'importe quel compte pouvait
  // récupérer le PDF sans avoir payé Le Parcours.
  const { data: abonnement } = await supabase
    .from("abonnements")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (abonnement?.status !== "active") {
    return NextResponse.json({ error: "Le Parcours n'est pas actif sur ce compte." }, { status: 403 });
  }

  // Un fragment marqué "à revoir" n'a pas sa place dans un aperçu
  // d'impression — brouillon/validé passent, seul le rejet explicite du
  // narrateur exclut un fragment. chargerFragmentsAvecPhotos exclut déjà
  // "à revoir" et télécharge les photos associées.
  const fragments = await chargerFragmentsAvecPhotos(supabase, user.id);

  if (!fragments.length) {
    return NextResponse.json({ error: "Aucun fragment à assembler pour l'instant." }, { status: 400 });
  }

  // Garantie (décision de Régis, 11/09/2026) : tampon "APERÇU" tant que la
  // commande d'impression n'a pas été validée — une fois commandé, le
  // narrateur a droit au fichier définitif, sans tampon.
  const { data: commandeExistante } = await supabase
    .from("commandes_livre")
    .select("id")
    .eq("user_id", user.id)
    .in("statut", ["en_cours", "confirmee"])
    .maybeSingle();

  try {
    const { titre } = await lirePersonnalisationLivre(supabase, user.id);
    const { buffer, nombrePages } = compilerInterieur(fragments, { titre, apercu: !commandeExistante });
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=mes-memoires-apercu.pdf",
        "X-Nombre-Fragments": String(fragments.length),
        "X-Nombre-Pages": String(nombrePages),
      },
    });
  } catch (error) {
    console.error("Assemblage manuscrit échoué:", error);
    return NextResponse.json(
      { error: "Échec de la compilation du manuscrit.", details: String(error) },
      { status: 500 }
    );
  }
}
