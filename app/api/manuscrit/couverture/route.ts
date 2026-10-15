import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { compilerInterieur, compilerCouverture } from "@/lib/manuscrit";
import { chargerFragmentsAvecPhotos } from "@/lib/photos";
import { lirePersonnalisationLivre } from "@/lib/profil-narrateur";

// Génère la couverture (recto + dos + quatrième) aux dimensions exactes
// attendues par Lulu pour la pagination réelle de ce narrateur.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  // A-2026-09-12-04 : cette route ne vérifiait que l'authentification, pas
  // le paiement — même contrôle que apercu/ et epub/ (trou du 11/09/2026).
  const { data: abonnement } = await supabase
    .from("abonnements")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (abonnement?.status !== "active") {
    return NextResponse.json({ error: "Le Parcours n'est pas actif sur ce compte." }, { status: 403 });
  }

  // Trouvé le 23/09/2026 (test E2E réel) : cette route construisait
  // fragments avec un simple .map(f => f.texte), un tableau de chaînes,
  // alors que compilerInterieur attend des objets {texte, photos}[]
  // (cf. apercu/route.ts, commande/livre/route.ts) — plantait
  // systématiquement sur `for (const photo of fragment.photos)`.
  const { fragments } = await chargerFragmentsAvecPhotos(supabase, user.id);

  if (!fragments.length) {
    return NextResponse.json({ error: "Aucun fragment à assembler pour l'instant." }, { status: 400 });
  }

  try {
    const { titre, sousTitre, couleurCle } = await lirePersonnalisationLivre(supabase, user.id);
    const { nombrePages } = compilerInterieur(fragments, { titre, sousTitre });
    const pdfBuffer = await compilerCouverture(nombrePages, { titre, sousTitre, couleurCle });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=mes-memoires-couverture.pdf",
        "X-Nombre-Pages-Interieur": String(nombrePages),
      },
    });
  } catch (error) {
    // A-2026-09-12-06 : le détail reste dans les logs serveur, jamais dans
    // la réponse au client.
    console.error("Génération couverture échouée:", error);
    return NextResponse.json({ error: "Échec de la génération de la couverture." }, { status: 500 });
  }
}
