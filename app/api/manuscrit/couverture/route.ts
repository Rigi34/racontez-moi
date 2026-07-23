import { NextResponse } from "next/server";
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { createClient } from "@/utils/supabase/server";
import { assemblerFragments, genererSourceTypst } from "@/lib/typst";
import { genererSourceCouverture } from "@/lib/couverture";
import { dimensionsCouverture } from "@/lib/lulu";

// Génère la couverture (recto + dos + quatrième) aux dimensions exactes
// attendues par Lulu pour la pagination réelle de ce narrateur — recompile
// d'abord l'intérieur (silencieusement, sans le renvoyer) pour connaître le
// nombre de pages, seule donnée nécessaire à la demande de dimensions.
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
    const compiler = NodeCompiler.create();
    const corps = assemblerFragments(fragments.map((f) => f.texte));
    const sourceInterieur = genererSourceTypst(corps, { titre: "Mes Mémoires" });
    const resultatInterieur = compiler.compile({ mainFileContent: sourceInterieur });
    if (resultatInterieur.hasError()) throw new Error(JSON.stringify(resultatInterieur.takeError()));
    const nombrePages = resultatInterieur.result!.numOfPages;

    const dims = await dimensionsCouverture(nombrePages);
    const sourceCouverture = genererSourceCouverture("Mes Mémoires", "Racontez-moi", dims);
    const resultatCouverture = compiler.compile({ mainFileContent: sourceCouverture });
    if (resultatCouverture.hasError()) throw new Error(JSON.stringify(resultatCouverture.takeError()));
    const pdfBuffer = Buffer.from(compiler.pdf(resultatCouverture.result!));

    return new NextResponse(pdfBuffer, {
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
