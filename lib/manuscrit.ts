// Compilation partagée de l'intérieur et de la couverture — utilisée par
// l'aperçu (/api/manuscrit/apercu, /couverture) et par la vraie commande
// Lulu (/api/commande/livre), pour ne jamais faire diverger ce que le
// narrateur a validé en BAT de ce qui part réellement à l'impression.

import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { genererSourceTypst, assemblerFragments } from "./typst";
import { genererSourceCouverture } from "./couverture";
import { dimensionsCouverture } from "./lulu";

export type ManuscritCompile = { buffer: Buffer; nombrePages: number };

export type FragmentAvecPhotos = {
  texte: string;
  // Une photo par id + son contenu binaire déjà téléchargé depuis Supabase
  // Storage — le compilateur Typst ne peut pas aller chercher une URL lui-
  // même, il lui faut les octets en mémoire (cf. NodeCompiler.mapShadow).
  photos: { id: string; extension: string; buffer: Buffer }[];
};

// mapShadow() exige le chemin absolu réel du fichier sur le système, car il
// dépose un fichier "fantôme" à cet emplacement précis. Mais une image
// référencée depuis le source Typst avec un chemin commençant par "/" est
// résolue relativement à la racine du workspace (process.cwd() ici) — passer
// le même chemin absolu aux deux endroits double donc le préfixe (vérifié
// empiriquement : "/root/.../__shadow_photos__/x.png" référencé dans le
// source devient recherché à "<cwd>/root/.../__shadow_photos__/x.png").
function cheminAbsoluShadowPhoto(photoId: string, extension: string): string {
  return `${process.cwd()}/__shadow_photos__/${photoId}.${extension}`;
}

function cheminTypstPhoto(photoId: string, extension: string): string {
  return `/__shadow_photos__/${photoId}.${extension}`;
}

export function compilerInterieur(fragments: FragmentAvecPhotos[]): ManuscritCompile {
  const compiler = NodeCompiler.create();

  for (const fragment of fragments) {
    for (const photo of fragment.photos) {
      compiler.mapShadow(cheminAbsoluShadowPhoto(photo.id, photo.extension), photo.buffer);
    }
  }

  const corps = assemblerFragments(
    fragments.map((f) => ({
      texte: f.texte,
      cheminsShadowPhotos: f.photos.map((p) => cheminTypstPhoto(p.id, p.extension)),
    }))
  );

  // Deux passes : la première donne la pagination réelle, nécessaire pour
  // choisir la bonne gouttière (lib/typst.ts, gouttiereMm) avant la
  // compilation finale.
  const premiereSource = genererSourceTypst(corps, { titre: "Mes Mémoires" });
  const premierResultat = compiler.compile({ mainFileContent: premiereSource });
  if (premierResultat.hasError()) {
    const diags = compiler.fetchDiagnostics(premierResultat.takeError()!);
    throw new Error("Typst (passe 1): " + JSON.stringify(diags));
  }
  const nombrePages = premierResultat.result!.numOfPages;

  const sourceFinale = genererSourceTypst(corps, { titre: "Mes Mémoires", nombrePagesLivreEstime: nombrePages });
  const resultatFinal = compiler.compile({ mainFileContent: sourceFinale });
  if (resultatFinal.hasError()) {
    const diags = compiler.fetchDiagnostics(resultatFinal.takeError()!);
    throw new Error("Typst (passe 2): " + JSON.stringify(diags));
  }

  return { buffer: Buffer.from(compiler.pdf(resultatFinal.result!)), nombrePages };
}

export async function compilerCouverture(nombrePages: number): Promise<Buffer> {
  const dims = await dimensionsCouverture(nombrePages);
  const compiler = NodeCompiler.create();
  const source = genererSourceCouverture("Mes Mémoires", "Racontez-moi", dims);
  const resultat = compiler.compile({ mainFileContent: source });
  if (resultat.hasError()) {
    const diags = compiler.fetchDiagnostics(resultat.takeError()!);
    throw new Error("Typst couverture: " + JSON.stringify(diags));
  }
  return Buffer.from(compiler.pdf(resultat.result!));
}
