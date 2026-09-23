// Gabarit Typst conforme aux specs Lulu pour un livre broché 6x9po (152,4 x 228,6 mm),
// l'équivalent catalogue le plus proche du format visé (~15x22cm).
// Specs vérifiées (help.api.lulu.com, juillet 2026) : fond perdu 3,18mm, marge de
// sécurité 12,7mm depuis le bord de coupe, gouttière additionnelle selon pagination.
const TRIM_LARGEUR_MM = 152.4;
const TRIM_HAUTEUR_MM = 228.6;
const FOND_PERDU_MM = 3.18;
const MARGE_SECURITE_MM = 12.7;

// Palier de gouttière Lulu par nombre de pages total du livre (pas juste du chapitre).
export function gouttiereMm(nombrePagesLivre: number): number {
  if (nombrePagesLivre < 60) return 0;
  if (nombrePagesLivre <= 150) return 3;
  if (nombrePagesLivre <= 400) return 13;
  if (nombrePagesLivre <= 600) return 16;
  return 19;
}

// Échappe les caractères qui ont un sens en syntaxe markup Typst, pour que le texte
// d'un fragment (jamais écrit en pensant à Typst) ne casse jamais la compilation.
function echapperMarkupTypst(texte: string): string {
  return texte.replace(/([\\#*_$`<>@[\]])/g, "\\$1");
}

// Typographie française : Typst convertit automatiquement "..." en « ... » (smartquote
// + lang: "fr") mais n'insère aucune espace insécable nulle part — ni autour des
// guillemets, ni avant ; : ! ? — vérifié empiriquement, ce n'est pas un réglage caché.
// U+202F (espace fine insécable) est la convention typographique française standard ;
// on l'utilise ici plutôt que U+00A0 pour rester cohérent avec l'usage imprimé.
function typographierFrancais(texte: string): string {
  return texte
    .replace(/«\s*([^»]*?)\s*»/g, "« $1 »")
    .replace(/"([^"]*)"/g, "« $1 »")
    .replace(/\s?([;:!?])/g, " $1");
}

export function preparerTexte(texte: string): string {
  return typographierFrancais(echapperMarkupTypst(texte));
}

// Une photo par bloc centré plutôt qu'une grille : la mise en page reste
// simple et prévisible quel que soit le nombre de photos (1 à 6 par
// fragment, cf. lib/photos.ts), sans logique de grille à faire tenir dans
// la largeur utile de la page. 8cm de large — la taille de placement
// retenue lors de la conception de l'upload (cf. lib/photos.ts).
function genererBlocPhotos(cheminsShadowPhotos: string[]): string {
  if (!cheminsShadowPhotos.length) return "";
  const images = cheminsShadowPhotos
    .map((chemin) => `#align(center)[#image("${chemin}", width: 8cm)]`)
    .join("\n#v(0.8em)\n");
  return `\n#v(1em)\n${images}\n#v(1em)\n`;
}

export type FragmentPourAssemblage = {
  texte: string;
  // Chemins absolus déjà déposés dans le compilateur via mapShadow (cf.
  // lib/manuscrit.ts) — pas les URLs Supabase Storage, qui ne sont pas
  // accessibles depuis le compilateur Typst.
  cheminsShadowPhotos: string[];
};

// Assemble plusieurs fragments avec un séparateur "—" entre chacun. Chaque séparateur
// est groupé avec le fragment qui le suit dans un bloc non-sécable (breakable: false) :
// sans ça, Typst peut laisser le "—" seul en bas de page et faire commencer le fragment
// sur la page suivante — repéré visuellement dans le premier essai de pagination.
export function assemblerFragments(fragments: FragmentPourAssemblage[]): string {
  return fragments
    .map((fragment, i) => {
      const corpsFragment = fragment.texte
        .split("\n\n")
        .map(preparerTexte)
        .join("\n\n");
      const corpsAvecPhotos = corpsFragment + genererBlocPhotos(fragment.cheminsShadowPhotos);
      if (i === 0) return corpsAvecPhotos;
      return `#block(above: 2em, below: 1.5em, breakable: false)[\n#align(center)[—]\n#v(1em)\n${corpsAvecPhotos}\n]`;
    })
    .join("\n\n");
}

interface OptionsChapitre {
  titre: string;
  nombrePagesLivreEstime?: number; // pour calculer la gouttière ; défaut = pas de gouttière (chapitre isolé)
  // Garantie (décision de Régis, 11/09/2026) : tampon visuel sur chaque page
  // tant que la commande d'impression n'a pas été validée — jamais sur le
  // fichier qui part réellement chez l'imprimeur (compilerInterieur appelé
  // sans ce drapeau depuis /api/commande/livre).
  apercu?: boolean;
}

export function genererSourceTypst(corps: string, opts: OptionsChapitre): string {
  const gouttiere = gouttiereMm(opts.nombrePagesLivreEstime ?? 20);
  const largeurPage = (TRIM_LARGEUR_MM + 2 * FOND_PERDU_MM).toFixed(2);
  const hauteurPage = (TRIM_HAUTEUR_MM + 2 * FOND_PERDU_MM).toFixed(2);
  const exterieur = (FOND_PERDU_MM + MARGE_SECURITE_MM).toFixed(2);
  const interieur = (FOND_PERDU_MM + MARGE_SECURITE_MM + gouttiere).toFixed(2);
  // Bug trouvé le 23/09/2026 : `background: align(...)[${tamponApercu}]`
  // insérait ce code Typst à l'intérieur de crochets `[...]` (mode markup),
  // où il était donc affiché comme texte littéral au lieu d'être exécuté
  // comme code — le tampon affichait le code source brut en aperçu, et le
  // mot "none" en toutes lettres sur un PDF de commande confirmée. Corrigé
  // en construisant l'expression complète (y compris l'appel à `align`) en
  // code Typst, insérée directement comme valeur de `background:` sans
  // crochets englobants.
  const tamponApercu = opts.apercu
    ? `align(center + horizon, rotate(-35deg, text(size: 70pt, fill: rgb(31, 75, 76, 35%), weight: "bold")[APERÇU]))`
    : "none";

  return `#set page(
  width: ${largeurPage}mm,
  height: ${hauteurPage}mm,
  margin: (inside: ${interieur}mm, outside: ${exterieur}mm, top: ${exterieur}mm, bottom: ${exterieur}mm),
  binding: left,
  numbering: "1",
  background: ${tamponApercu},
)
#set text(lang: "fr", font: "Libertinus Serif", size: 11pt)
#set par(justify: true, leading: 0.75em, first-line-indent: 1.2em)

#align(center)[= ${echapperMarkupTypst(opts.titre)}]
#v(1.5em)

${corps}
`;
}
