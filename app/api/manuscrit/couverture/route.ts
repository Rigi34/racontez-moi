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

  // Trouvé le 23/09/2026 (test E2E réel) : cette route construisait
  // fragments avec un simple .map(f => f.texte), un tableau de chaînes,
  // alors que compilerInterieur attend des objets {texte, photos}[]
  // (cf. apercu/route.ts, commande/livre/route.ts) — plantait
  // systématiquement sur `for (const photo of fragment.photos)`.
  const fragments = await chargerFragmentsAvecPhotos(supabase, user.id);

  if (!fragments.length) {
    return NextResponse.json({ error: "Aucun fragment à assembler pour l'instant." }, { status: 400 });
  }

  try {
    const { titre, sousTitre, couleurCle } = await lirePersonnalisationLivre(supabase, user.id);
    const { nombrePages } = compilerInterieur(fragments, { titre });
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
    console.error("Génération couverture échouée:", error);
    return NextResponse.json(
      { error: "Échec de la génération de la couverture.", details: String(error) },
      { status: 500 }
    );
  }
}
