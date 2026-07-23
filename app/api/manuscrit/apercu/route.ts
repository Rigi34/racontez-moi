import { NextResponse } from "next/server";
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { createClient } from "@/utils/supabase/server";
import { genererSourceTypst, assemblerFragments } from "@/lib/typst";

// Assemblage réel du manuscrit — première brique du pipeline complet du
// livre (chantier ouvert depuis le spike Typst de juin, jamais relié à de
// vraies données utilisateur jusqu'ici). Compile en deux passes : la
// première donne le nombre de pages réel, nécessaire pour choisir la bonne
// gouttière (lib/typst.ts, gouttiereMm) avant la compilation finale.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  // Un fragment marqué "à revoir" n'a pas sa place dans un aperçu
  // d'impression — brouillon/validé passent, seul le rejet explicite du
  // narrateur exclut un fragment.
  const { data: fragments } = await supabase
    .from("fragments")
    .select("texte, created_at")
    .eq("user_id", user.id)
    .neq("statut", "a_revoir")
    .order("created_at", { ascending: true });

  if (!fragments?.length) {
    return NextResponse.json({ error: "Aucun fragment à assembler pour l'instant." }, { status: 400 });
  }

  const corps = assemblerFragments(fragments.map((f) => f.texte));
  const compiler = NodeCompiler.create();

  try {
    // Première passe : gouttière par défaut (petit livre), juste pour
    // connaître la pagination réelle.
    const premiereSource = genererSourceTypst(corps, { titre: "Mes Mémoires" });
    const premierResultat = compiler.compile({ mainFileContent: premiereSource });
    if (premierResultat.hasError()) {
      throw new Error(JSON.stringify(premierResultat.takeError()));
    }
    const nombrePages = premierResultat.result!.numOfPages;

    // Seconde passe : gouttière recalculée sur la vraie pagination.
    const sourceFinale = genererSourceTypst(corps, {
      titre: "Mes Mémoires",
      nombrePagesLivreEstime: nombrePages,
    });
    const resultatFinal = compiler.compile({ mainFileContent: sourceFinale });
    if (resultatFinal.hasError()) {
      throw new Error(JSON.stringify(resultatFinal.takeError()));
    }
    const pdfBuffer = Buffer.from(compiler.pdf(resultatFinal.result!));

    return new NextResponse(pdfBuffer, {
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
