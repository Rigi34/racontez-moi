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

// Mise en page adaptative des photos (B1, 23/09/2026 — remplace le rendu
// "une photo, un bloc, 8cm fixe" : diagnostic réel du 23/09/2026 a montré
// qu'une photo portrait à 8cm de large occupe quasiment une page A5 entière
// (hauteur ≈ 10,7cm pour un ratio 3:4 courant en photo smartphone), et qu'un
// livre à 6 photos par fragment pouvait générer 4 pages quasi vides.
//
// Algorithme : appariement glouton par orientation en parcourant les photos
// dans l'ordre d'origine — deux photos consécutives de même orientation
// (portrait/portrait ou paysage/paysage) forment une paire affichée côte à
// côte ; une photo sans partenaire de même orientation est affichée seule.
// Comparé (diagnostic du 23/09/2026, variante "C — grille") à un pairage
// naïf "2 par 2 dans l'ordre d'arrivée" : ce dernier produisait des rangées
// visuellement déséquilibrées quand portrait et paysage étaient mélangés
// dans la même paire — l'appariement par orientation l'évite.
export type PhotoShadow = { chemin: string; largeurPx: number; hauteurPx: number };

// Largeur utile maximale garantie sans déborder de la zone de texte, quel
// que soit le nombre de pages du livre : largeur de page (158,76mm) moins
// la marge extérieure (15,88mm) moins la marge intérieure au palier de
// gouttière le plus large (19mm pour >600 pages, cf. gouttiereMm) donne
// 108,0mm de large utile dans le pire cas — 10,5cm garde une marge de
// sécurité sans sacrifier de taille dans le cas courant (gouttière nulle ou
// faible, où la largeur utile réelle atteint jusqu'à 12,7cm).
const LARGEUR_UTILE_CM = 10.5;
const GOUTTIERE_PAIRE_CM = 0.4;

function estPortrait(photo: PhotoShadow): boolean {
  return photo.hauteurPx > photo.largeurPx;
}

function ratioLargeurSurHauteur(photo: PhotoShadow): number {
  return photo.largeurPx / photo.hauteurPx;
}

// Bloc d'une seule photo : dimensionnée par hauteur si portrait (évite le
// quasi-page-pleine), par largeur si paysage (une hauteur fixe donnerait une
// largeur souvent trop grande pour la zone de texte).
function blocSeul(photo: PhotoShadow): string {
  if (estPortrait(photo)) {
    return `#image("${photo.chemin}", height: 9cm)`;
  }
  const largeur = Math.min(9.5, LARGEUR_UTILE_CM);
  return `#image("${photo.chemin}", width: ${largeur}cm)`;
}

// Bloc de deux photos de même orientation, côte à côte à hauteur commune —
// hauteur cible réduite si besoin pour ne jamais dépasser LARGEUR_UTILE_CM
// une fois les deux largeurs (calculées depuis le ratio réel de chaque
// photo) et la gouttière additionnées.
function blocPaire(a: PhotoShadow, b: PhotoShadow): string {
  const hauteurCible = estPortrait(a) ? 7 : 5;
  const sommeRatios = ratioLargeurSurHauteur(a) + ratioLargeurSurHauteur(b);
  const largeurTotaleAHauteurCible = hauteurCible * sommeRatios + GOUTTIERE_PAIRE_CM;
  const hauteur =
    largeurTotaleAHauteurCible > LARGEUR_UTILE_CM
      ? (LARGEUR_UTILE_CM - GOUTTIERE_PAIRE_CM) / sommeRatios
      : hauteurCible;
  const hauteurStr = hauteur.toFixed(2);
  return `#grid(columns: (auto, auto), gutter: ${GOUTTIERE_PAIRE_CM}cm, align(right)[#image("${a.chemin}", height: ${hauteurStr}cm)], align(left)[#image("${b.chemin}", height: ${hauteurStr}cm)])`;
}

function genererBlocPhotos(photos: PhotoShadow[]): string {
  if (!photos.length) return "";

  const blocs: string[] = [];
  let enAttente: PhotoShadow | null = null;

  for (const photo of photos) {
    if (enAttente && estPortrait(enAttente) === estPortrait(photo)) {
      blocs.push(blocPaire(enAttente, photo));
      enAttente = null;
    } else {
      if (enAttente) blocs.push(blocSeul(enAttente));
      enAttente = photo;
    }
  }
  if (enAttente) blocs.push(blocSeul(enAttente));

  const images = blocs.map((b) => `#align(center)[${b}]`).join("\n#v(0.8em)\n");
  return `\n#v(1em)\n${images}\n#v(1em)\n`;
}

export type FragmentPourAssemblage = {
  texte: string;
  // Photos avec leurs dimensions réelles, chemins absolus déjà déposés dans
  // le compilateur via mapShadow (cf. lib/manuscrit.ts) — pas les URLs
  // Supabase Storage, qui ne sont pas accessibles depuis le compilateur
  // Typst.
  photos: PhotoShadow[];
};

// Assemble plusieurs fragments avec un séparateur "—" entre chacun.
//
// Bug trouvé le 23/09/2026 (validation PHOTO-A1-B5) : la version précédente
// groupait le séparateur ET tout le fragment qui le suit (texte + photos)
// dans un bloc non-sécable (breakable: false), pour éviter qu'un "—" ne
// reste seul en bas de page. Mais un bloc non-sécable qui dépasse la
// hauteur d'une page ne peut ni être scindé ni déplacé entièrement — Typst
// rend ce qui tient et perd silencieusement le reste, sans erreur. Avec les
// photos de B1 (jusqu'à 9cm de haut), un fragment à plusieurs photos
// dépassait facilement une page : jusqu'à 4 photos sur 6 disparaissaient du
// PDF final sans aucun avertissement (cf. rapport de validation
// PHOTO-A1-B5, cas minimal reproductible : même contenu, 4 pages complètes
// en premier fragment contre 2 pages avec perte massive en second
// fragment).
//
// Corrigé en ne rendant "sticky" (attribut natif Typst, le même mécanisme
// que Typst utilise par défaut pour ne jamais laisser un titre seul en bas
// de page) que le séparateur lui-même — jamais le texte ni les photos, qui
// redeviennent un flux normal, entièrement scindable entre pages, exactement
// comme le tout premier fragment (qui n'a jamais eu ce bug). L'intention
// éditoriale reste identique : sticky force le séparateur à basculer avec
// le début du contenu suivant plutôt que de rester seul en fin de page.
export function assemblerFragments(fragments: FragmentPourAssemblage[]): string {
  return fragments
    .map((fragment, i) => {
      const corpsFragment = fragment.texte
        .split("\n\n")
        .map(preparerTexte)
        .join("\n\n");
      const corpsAvecPhotos = corpsFragment + genererBlocPhotos(fragment.photos);
      if (i === 0) return corpsAvecPhotos;
      return `#block(above: 2em, below: 1.5em, sticky: true)[#align(center)[—]]\n#v(1em)\n${corpsAvecPhotos}`;
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
