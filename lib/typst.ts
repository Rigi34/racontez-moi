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

// Assemble plusieurs fragments avec un séparateur "—" entre chacun. Chaque séparateur
// est groupé avec le fragment qui le suit dans un bloc non-sécable (breakable: false) :
// sans ça, Typst peut laisser le "—" seul en bas de page et faire commencer le fragment
// sur la page suivante — repéré visuellement dans le premier essai de pagination.
export function assemblerFragments(fragmentsBruts: string[]): string {
  return fragmentsBruts
    .map((fragment, i) => {
      const corpsFragment = fragment
        .split("\n\n")
        .map(preparerTexte)
        .join("\n\n");
      if (i === 0) return corpsFragment;
      return `#block(above: 2em, below: 1.5em, breakable: false)[\n#align(center)[—]\n#v(1em)\n${corpsFragment}\n]`;
    })
    .join("\n\n");
}

interface OptionsChapitre {
  titre: string;
  nombrePagesLivreEstime?: number; // pour calculer la gouttière ; défaut = pas de gouttière (chapitre isolé)
}

export function genererSourceTypst(corps: string, opts: OptionsChapitre): string {
  const gouttiere = gouttiereMm(opts.nombrePagesLivreEstime ?? 20);
  const largeurPage = (TRIM_LARGEUR_MM + 2 * FOND_PERDU_MM).toFixed(2);
  const hauteurPage = (TRIM_HAUTEUR_MM + 2 * FOND_PERDU_MM).toFixed(2);
  const exterieur = (FOND_PERDU_MM + MARGE_SECURITE_MM).toFixed(2);
  const interieur = (FOND_PERDU_MM + MARGE_SECURITE_MM + gouttiere).toFixed(2);

  return `#set page(
  width: ${largeurPage}mm,
  height: ${hauteurPage}mm,
  margin: (inside: ${interieur}mm, outside: ${exterieur}mm, top: ${exterieur}mm, bottom: ${exterieur}mm),
  binding: left,
  numbering: "1",
)
#set text(lang: "fr", font: "Libertinus Serif", size: 11pt)
#set par(justify: true, leading: 0.75em, first-line-indent: 1.2em)

#align(center)[= ${echapperMarkupTypst(opts.titre)}]
#v(1.5em)

${corps}
`;
}
