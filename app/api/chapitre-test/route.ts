import { NextResponse } from "next/server";
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { genererSourceTypst, assemblerFragments } from "@/lib/typst";
import { FRAGMENTS_TEST_CHAPITRE } from "@/lib/contenu-test-chapitre";

// Chapitre test — spike de faisabilité gabarit Lulu (fond perdu, marges, gouttière,
// typographie française). Contenu fictif écrit pour ce test, pas du vrai contenu utilisateur.
export async function GET() {
  const start = Date.now();
  try {
    const fragmentsAplatis = FRAGMENTS_TEST_CHAPITRE.flatMap((f) =>
      f.split(/\n\n—\n\n/)
    );
    const corps = assemblerFragments(fragmentsAplatis);
    const source = genererSourceTypst(corps, {
      titre: "Chapitre test — Le Parcours",
    });

    const compiler = NodeCompiler.create();
    const result = compiler.pdf({ mainFileContent: source });
    const pdfBuffer = Buffer.from(result);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=chapitre-test.pdf",
        "X-Compile-Time-Ms": String(Date.now() - start),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Échec de compilation Typst.", details: String(error) },
      { status: 500 }
    );
  }
}
