// Compilation partagée de l'intérieur et de la couverture — utilisée par
// l'aperçu (/api/manuscrit/apercu, /couverture) et par la vraie commande
// Lulu (/api/commande/livre), pour ne jamais faire diverger ce que le
// narrateur a validé en BAT de ce qui part réellement à l'impression.

import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { genererSourceTypst, assemblerFragments } from "./typst";
import { genererSourceCouverture } from "./couverture";
import { dimensionsCouverture } from "./lulu";

export type ManuscritCompile = { buffer: Buffer; nombrePages: number };

export function compilerInterieur(fragmentsTextes: string[]): ManuscritCompile {
  const compiler = NodeCompiler.create();
  const corps = assemblerFragments(fragmentsTextes);

  // Deux passes : la première donne la pagination réelle, nécessaire pour
  // choisir la bonne gouttière (lib/typst.ts, gouttiereMm) avant la
  // compilation finale.
  const premiereSource = genererSourceTypst(corps, { titre: "Mes Mémoires" });
  const premierResultat = compiler.compile({ mainFileContent: premiereSource });
  if (premierResultat.hasError()) throw new Error("Typst (passe 1): " + JSON.stringify(premierResultat.takeError()));
  const nombrePages = premierResultat.result!.numOfPages;

  const sourceFinale = genererSourceTypst(corps, { titre: "Mes Mémoires", nombrePagesLivreEstime: nombrePages });
  const resultatFinal = compiler.compile({ mainFileContent: sourceFinale });
  if (resultatFinal.hasError()) throw new Error("Typst (passe 2): " + JSON.stringify(resultatFinal.takeError()));

  return { buffer: Buffer.from(compiler.pdf(resultatFinal.result!)), nombrePages };
}

export async function compilerCouverture(nombrePages: number): Promise<Buffer> {
  const dims = await dimensionsCouverture(nombrePages);
  const compiler = NodeCompiler.create();
  const source = genererSourceCouverture("Mes Mémoires", "Racontez-moi", dims);
  const resultat = compiler.compile({ mainFileContent: source });
  if (resultat.hasError()) throw new Error("Typst couverture: " + JSON.stringify(resultat.takeError()));
  return Buffer.from(compiler.pdf(resultat.result!));
}
