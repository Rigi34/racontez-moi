import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { compilerInterieur, compilerCouverture } from "@/lib/manuscrit";

// Génère la couverture (recto + dos + quatrième) aux dimensions exactes
// attendues par Lulu pour la pagination réelle de ce narrateur.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

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
    const { nombrePages } = compilerInterieur(fragments.map((f) => f.texte));
    const pdfBuffer = await compilerCouverture(nombrePages);

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
