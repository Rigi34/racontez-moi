// Compilation partagée de l'intérieur et de la couverture — utilisée par
// l'aperçu (/api/manuscrit/apercu, /couverture) et par la vraie commande
// Lulu (/api/commande/livre), pour ne jamais faire diverger ce que le
// narrateur a validé en BAT de ce qui part réellement à l'impression.

import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { genererLivreTypst, assemblerFragments, largeurTexteMm } from "./typst";
import { organiserEnChapitres } from "./livre";
import { genererSourceCouverture, PALETTE_COUVERTURE, COULEUR_COUVERTURE_DEFAUT } from "./couverture";
import { dimensionsCouverture } from "./lulu";

export type ManuscritCompile = { buffer: Buffer; nombrePages: number };

export type FragmentAvecPhotos = {
  texte: string;
  // Section de vie de la séance d'origine (sessions.section_ouverture),
  // qui détermine le chapitre du livre (lib/livre.ts). Absente ou null :
  // première séance, rattachée au chapitre « Racines et petite enfance ».
  section?: string | null;
  // Une photo par id + son contenu binaire déjà téléchargé depuis Supabase
  // Storage — le compilateur Typst ne peut pas aller chercher une URL lui-
  // même, il lui faut les octets en mémoire (cf. NodeCompiler.mapShadow).
  // largeurPx/hauteurPx : dimensions réelles enregistrées à l'upload (cf.
  // lib/photos.ts), nécessaires à genererBlocPhotos pour déterminer
  // l'orientation et dimensionner la mise en page (cf. lib/typst.ts, B1).
  photos: { id: string; extension: string; buffer: Buffer; largeurPx: number; hauteurPx: number }[];
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

export function compilerInterieur(
  fragments: FragmentAvecPhotos[],
  opts?: {
    titre?: string;
    sousTitre?: string;
    apercu?: boolean;
    // Texte du colophon (page 2). Défaut : mention Racontez-moi standard.
    mention?: string;
    // Phrase de citation par section de vie (cf. ChapitreTypst.citation).
    citations?: Record<string, string>;
  }
): ManuscritCompile {
  const compiler = NodeCompiler.create();
  const titre = opts?.titre ?? "Mes Mémoires";

  for (const fragment of fragments) {
    for (const photo of fragment.photos) {
      compiler.mapShadow(cheminAbsoluShadowPhoto(photo.id, photo.extension), photo.buffer);
    }
  }

  // Chapitres par section de vie, photo d'ouverture éventuelle (02/10/2026,
  // cf. lib/livre.ts) — le texte des fragments n'est jamais modifié.
  const chapitres = organiserEnChapitres(
    fragments.map((f) => ({
      texte: f.texte,
      section: f.section,
      photos: f.photos.map((p) => ({
        chemin: cheminTypstPhoto(p.id, p.extension),
        largeurPx: p.largeurPx,
        hauteurPx: p.hauteurPx,
      })),
    }))
  );

  const source = (nombrePagesLivreEstime?: number) =>
    genererLivreTypst(
      chapitres.map((c) => ({
        titre: c.titre,
        photoOuverture: c.photoOuverture,
        citation: opts?.citations?.[c.section] ?? null,
        corps: assemblerFragments(c.fragments, { largeurTexteMm: largeurTexteMm(nombrePagesLivreEstime ?? 20) }),
      })),
      { titre, sousTitre: opts?.sousTitre, mention: opts?.mention, nombrePagesLivreEstime, apercu: opts?.apercu }
    );

  // Deux passes : la première donne la pagination réelle, nécessaire pour
  // choisir la bonne gouttière (lib/typst.ts, gouttiereMm) avant la
  // compilation finale.
  const premierResultat = compiler.compile({ mainFileContent: source() });
  if (premierResultat.hasError()) {
    const diags = compiler.fetchDiagnostics(premierResultat.takeError()!);
    throw new Error("Typst (passe 1): " + JSON.stringify(diags));
  }
  const pagesPasse1 = premierResultat.result!.numOfPages;

  const resultatFinal = compiler.compile({ mainFileContent: source(pagesPasse1) });
  if (resultatFinal.hasError()) {
    const diags = compiler.fetchDiagnostics(resultatFinal.takeError()!);
    throw new Error("Typst (passe 2): " + JSON.stringify(diags));
  }
  // Nombre de pages du fichier RÉELLEMENT produit (passe 2) — c'est lui qui
  // fixe la largeur du dos de couverture chez Lulu. La gouttière plus large
  // de la passe 2 peut ajouter des pages par rapport à la passe 1.
  const nombrePages = resultatFinal.result!.numOfPages;

  return { buffer: Buffer.from(compiler.pdf(resultatFinal.result!)), nombrePages };
}

export async function compilerCouverture(
  nombrePages: number,
  opts: { titre: string; sousTitre: string; couleurCle: string }
): Promise<Buffer> {
  const dims = await dimensionsCouverture(nombrePages);
  const compiler = NodeCompiler.create();
  // Repli défensif sur la couleur par défaut si la clé stockée ne correspond
  // plus à la palette (ex. valeur historique avant l'ajout d'une couleur).
  const couleurHex =
    PALETTE_COUVERTURE.find((c) => c.cle === opts.couleurCle)?.hex ??
    PALETTE_COUVERTURE.find((c) => c.cle === COULEUR_COUVERTURE_DEFAUT)!.hex;
  const source = genererSourceCouverture(opts.titre, opts.sousTitre, dims, couleurHex);
  const resultat = compiler.compile({ mainFileContent: source });
  if (resultat.hasError()) {
    const diags = compiler.fetchDiagnostics(resultat.takeError()!);
    throw new Error("Typst couverture: " + JSON.stringify(diags));
  }
  return Buffer.from(compiler.pdf(resultat.result!));
}
