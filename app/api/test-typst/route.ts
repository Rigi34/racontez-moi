import { NextResponse } from "next/server";
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";

const DOCUMENT_TEST = `
#set page(width: 15cm, height: 22cm, margin: 2cm)
#set text(lang: "fr", font: "Libertinus Serif", size: 11pt)

= Spike Typst — chapitre test

Ceci est un essai de compilation. Il vérifie les guillemets français automatiques
#quote[comme celui-ci], les espaces insécables avant~: les deux-points, et un
paragraphe assez long pour observer le comportement des veuves et orphelines
sur plusieurs lignes de texte justifié, condition normale d'un chapitre de
mémoire imprimé.
`;

export async function GET() {
  const start = Date.now();
  try {
    const compiler = NodeCompiler.create();
    const result = compiler.pdf({ mainFileContent: DOCUMENT_TEST });
    const pdfBuffer = Buffer.from(result);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=spike-typst.pdf",
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
