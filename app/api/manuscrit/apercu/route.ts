import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { compilerInterieur } from "@/lib/manuscrit";

// Assemblage réel du manuscrit — première brique du pipeline complet du
// livre, nécessaire pour vendre l'offre tout-compris (129€ + livre couleur
// relié, ~179€, décidé le 23 juillet après vérification du coût réel Lulu).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  // Un fragment marqué "à revoir" n'a pas sa place dans un aperçu
  // d'impression — brouillon/validé passent, seul le rejet explicite du
  // narrateur exclut un fragment.
  const { data: fragments } = await supabase
    .from("fragments")
    .select("texte")
    .eq("user_id", user.id)
    .neq("statut", "a_revoir")
    .order("created_at", { ascending: true });

  if (!fragments?.length) {
    return NextResponse.json({ error: "Aucun fragment à assembler pour l'instant." }, { status: 400 });
  }

  try {
    const { buffer, nombrePages } = compilerInterieur(fragments.map((f) => f.texte));
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
