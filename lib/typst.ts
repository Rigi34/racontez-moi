// Gabarit Typst conforme aux specs Lulu pour le livre relié 6x9po (152,4 x
// 228,6 mm), couverture rigide casewrap (POD 0600X0900FCSTDCW080CW444GXX,
// cf. lib/lulu.ts — l'ancien commentaire « broché » datait du spike de juin).
// Specs vérifiées (help.lulu.com « Interior formatting: the basics »,
// 02/10/2026) : fond perdu 0,125po (3,18mm), marge de sécurité 0,5po
// (12,7mm) depuis le bord de coupe, gouttière additionnelle selon la
// pagination, images à 300 ppp idéalement, couleur en sRGB.
const TRIM_LARGEUR_MM = 152.4;
const TRIM_HAUTEUR_MM = 228.6;
const FOND_PERDU_MM = 3.18;

// Marges de mise en page, mesurées depuis le bord de coupe (02/10/2026).
// Toutes au-delà du minimum Lulu de 12,7mm — l'ancienne mise en page s'y
// tenait exactement, ce qui donnait une page dense, « document » plutôt que
// « livre ». Marge extérieure plus large que la marge intérieure (la
// reliure absorbe une partie de celle-ci), pied plus grand que la tête
// (proportions classiques de la page de livre).
// Tête à 24mm (02/10/2026, contrôle d'impression de l'exemplaire de test) :
// à 20mm, l'en-tête courant placé dans la marge commençait à 11mm du bord
// de coupe, sous le minimum Lulu de 12,7mm.
const MARGE_TETE_MM = 24;
const MARGE_PIED_MM = 24;
const MARGE_EXTERIEURE_MM = 19;
const MARGE_INTERIEURE_MM = 16;
const HAUTEUR_TEXTE_MM = TRIM_HAUTEUR_MM - MARGE_TETE_MM - MARGE_PIED_MM;

// Palier de gouttière Lulu par nombre de pages total du livre (pas juste du chapitre).
export function gouttiereMm(nombrePagesLivre: number): number {
  if (nombrePagesLivre < 60) return 0;
  if (nombrePagesLivre <= 150) return 3;
  if (nombrePagesLivre <= 400) return 13;
  if (nombrePagesLivre <= 600) return 16;
  return 19;
}

export function largeurTexteMm(nombrePagesLivre: number): number {
  return TRIM_LARGEUR_MM - MARGE_EXTERIEURE_MM - MARGE_INTERIEURE_MM - gouttiereMm(nombrePagesLivre);
}

// Échappe les caractères qui ont un sens en syntaxe markup Typst, pour que le texte
// d'un fragment (jamais écrit en pensant à Typst) ne casse jamais la compilation.
function echapperMarkupTypst(texte: string): string {
  return texte.replace(/([\\#*_$`<>@[\]])/g, "\\$1");
}

// Chaîne insérée comme littéral de chaîne Typst ("...") : seuls \ et "
// doivent y être échappés.
function chaineTypst(texte: string): string {
  return `"${texte.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
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

// Mise en page adaptative des photos (B1, 23/09/2026, révisée le 02/10/2026).
//
// B1 : appariement glouton par orientation en parcourant les photos dans
// l'ordre d'origine — deux photos consécutives de même orientation forment
// une paire côte à côte ; une photo sans partenaire est affichée seule.
//
// 02/10/2026 : les tailles ne sont plus des constantes fixes (9cm de haut,
// 9,5cm de large) mais dépendent de deux choses réelles :
// - la largeur du bloc de texte de CE livre (elle varie avec la gouttière) ;
// - la résolution de CHAQUE photo : jamais imprimée en dessous de 250 ppp
//   (Lulu recommande 300), donc jamais agrandie artificiellement. Une petite
//   photo reste petite plutôt que floue.
// Une photo paysage seule et bien définie prend toute la largeur du texte ;
// une photo portrait seule est limitée à un peu moins de la moitié de la
// hauteur de page, pour ne jamais concurrencer le récit.
export type PhotoShadow = { chemin: string; largeurPx: number; hauteurPx: number };

export const DPI_MIN_FLUX = 250;
const ESPACE_PAIRE_MM = 4;
const HAUTEUR_MAX_PORTRAIT_SEUL_MM = HAUTEUR_TEXTE_MM * 0.46;
const HAUTEUR_MAX_PAIRE_PORTRAIT_MM = 72;
const HAUTEUR_MAX_PAIRE_PAYSAGE_MM = 52;

function estPortrait(photo: PhotoShadow): boolean {
  return photo.hauteurPx > photo.largeurPx;
}

function ratioLargeurSurHauteur(photo: PhotoShadow): number {
  return photo.largeurPx / photo.hauteurPx;
}

// Plus grande hauteur (mm) à laquelle la photo s'imprime encore à DPI_MIN_FLUX.
function hauteurMaxNetteMm(photo: PhotoShadow): number {
  return (photo.hauteurPx / DPI_MIN_FLUX) * 25.4;
}

const mm = (valeur: number) => `${valeur.toFixed(1)}mm`;

function blocSeul(photo: PhotoShadow, largeurTexte: number): string {
  const ratio = ratioLargeurSurHauteur(photo);
  let hauteur = estPortrait(photo) ? HAUTEUR_MAX_PORTRAIT_SEUL_MM : largeurTexte / ratio;
  hauteur = Math.min(hauteur, hauteurMaxNetteMm(photo), largeurTexte / ratio);
  return `#image("${photo.chemin}", height: ${mm(hauteur)})`;
}

// Deux photos de même orientation, côte à côte à hauteur commune : la
// rangée remplit la largeur du texte, plafonnée par la hauteur maximale de
// la paire et par la résolution de la moins définie des deux.
function blocPaire(a: PhotoShadow, b: PhotoShadow, largeurTexte: number): string {
  const sommeRatios = ratioLargeurSurHauteur(a) + ratioLargeurSurHauteur(b);
  const hauteurPleineLargeur = (largeurTexte - ESPACE_PAIRE_MM) / sommeRatios;
  const plafond = estPortrait(a) ? HAUTEUR_MAX_PAIRE_PORTRAIT_MM : HAUTEUR_MAX_PAIRE_PAYSAGE_MM;
  const hauteur = Math.min(hauteurPleineLargeur, plafond, hauteurMaxNetteMm(a), hauteurMaxNetteMm(b));
  return `#grid(columns: (auto, auto), gutter: ${ESPACE_PAIRE_MM}mm, align(right)[#image("${a.chemin}", height: ${mm(hauteur)})], align(left)[#image("${b.chemin}", height: ${mm(hauteur)})])`;
}

function blocsPhotos(photos: PhotoShadow[], largeurTexte: number): string[] {
  const blocs: string[] = [];
  let enAttente: PhotoShadow | null = null;

  for (const photo of photos) {
    if (enAttente && estPortrait(enAttente) === estPortrait(photo)) {
      blocs.push(blocPaire(enAttente, photo, largeurTexte));
      enAttente = null;
    } else {
      if (enAttente) blocs.push(blocSeul(enAttente, largeurTexte));
      enAttente = photo;
    }
  }
  if (enAttente) blocs.push(blocSeul(enAttente, largeurTexte));

  // Chaque bloc est insécable (une image ne se coupe jamais) et respire
  // au-dessus et au-dessous ; jamais plus haut qu'une page, donc jamais de
  // perte silencieuse (cf. le bug du 23/09/2026 décrit plus bas).
  return blocs.map((b) => `#block(above: 1.6em, below: 1.6em, breakable: false, width: 100%)[#align(center)[${b}]]`);
}

export type FragmentPourAssemblage = {
  texte: string;
  // Photos avec leurs dimensions réelles, chemins absolus déjà déposés dans
  // le compilateur via mapShadow (cf. lib/manuscrit.ts) — pas les URLs
  // Supabase Storage, qui ne sont pas accessibles depuis le compilateur
  // Typst.
  photos: PhotoShadow[];
};

// Séparateur entre deux souvenirs d'un même chapitre : trois astérisques
// espacées, la convention des livres imprimés français pour une rupture de
// récit (remplace le tiret seul, 02/10/2026).
const SEPARATEUR = `#text(size: 9pt, fill: luma(110), tracking: 0.6em)[\\*\\*\\*]`;

// Assemble plusieurs fragments avec un séparateur entre chacun.
//
// Bug trouvé le 23/09/2026 (validation PHOTO-A1-B5) : la version précédente
// groupait le séparateur ET tout le fragment qui le suit (texte + photos)
// dans un bloc non-sécable (breakable: false), pour éviter qu'un séparateur
// ne reste seul en bas de page. Mais un bloc non-sécable qui dépasse la
// hauteur d'une page ne peut ni être scindé ni déplacé entièrement — Typst
// rend ce qui tient et perd silencieusement le reste, sans erreur. Jusqu'à
// 4 photos sur 6 disparaissaient du PDF final sans aucun avertissement.
//
// Corrigé en ne rendant "sticky" (attribut natif Typst, le même mécanisme
// que Typst utilise pour ne jamais laisser un titre seul en bas de page) que
// le séparateur lui-même — jamais le texte ni les photos, qui restent un
// flux normal, entièrement scindable entre pages.
//
// 02/10/2026 : quand un souvenir long (4 paragraphes ou plus) n'a qu'une
// photo, elle s'insère au milieu du récit plutôt qu'après lui — la photo
// accompagne le moment raconté au lieu de s'empiler en fin de texte.
export function assemblerFragments(
  fragments: FragmentPourAssemblage[],
  opts?: { largeurTexteMm?: number }
): string {
  const largeurTexte = opts?.largeurTexteMm ?? largeurTexteMm(Infinity);
  return fragments
    .map((fragment, i) => {
      const paragraphes = fragment.texte.split("\n\n").map(preparerTexte);
      const blocs = blocsPhotos(fragment.photos, largeurTexte);
      let corps: string;
      if (blocs.length === 1 && paragraphes.length >= 4) {
        const milieu = Math.ceil(paragraphes.length / 2);
        corps = [...paragraphes.slice(0, milieu), blocs[0], ...paragraphes.slice(milieu)].join("\n\n");
      } else {
        corps = [...paragraphes, ...blocs].join("\n\n");
      }
      if (i === 0) return corps;
      return `#block(above: 2em, below: 1.8em, sticky: true, width: 100%)[#align(center)[${SEPARATEUR}]]\n\n${corps}`;
    })
    .join("\n\n");
}

interface OptionsMiseEnPage {
  nombrePagesLivreEstime?: number; // pour calculer la gouttière ; défaut = pas de gouttière
  // Garantie (décision de Régis, 11/09/2026) : tampon visuel sur chaque page
  // tant que la commande d'impression n'a pas été validée — jamais sur le
  // fichier qui part réellement chez l'imprimeur (compilerInterieur appelé
  // sans ce drapeau depuis /api/commande/livre).
  apercu?: boolean;
}

// Réglages communs de page et de texte (format, marges, typographie).
function preambule(opts: OptionsMiseEnPage, enTeteEtPied: string): string {
  const gouttiere = gouttiereMm(opts.nombrePagesLivreEstime ?? 20);
  const largeurPage = (TRIM_LARGEUR_MM + 2 * FOND_PERDU_MM).toFixed(2);
  const hauteurPage = (TRIM_HAUTEUR_MM + 2 * FOND_PERDU_MM).toFixed(2);
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
  margin: (inside: ${(FOND_PERDU_MM + MARGE_INTERIEURE_MM + gouttiere).toFixed(2)}mm, outside: ${(FOND_PERDU_MM + MARGE_EXTERIEURE_MM).toFixed(2)}mm, top: ${(FOND_PERDU_MM + MARGE_TETE_MM).toFixed(2)}mm, bottom: ${(FOND_PERDU_MM + MARGE_PIED_MM).toFixed(2)}mm),
  binding: left,
  header-ascent: 7mm,
  background: ${tamponApercu},
${enTeteEtPied})
#set text(lang: "fr", font: "Libertinus Serif", size: 11pt, hyphenate: true, costs: (widow: 300%, orphan: 300%))
#set par(justify: true, leading: 0.72em, spacing: 0.72em, first-line-indent: (amount: 1.3em, all: false))
`;
}

// Document simple, sans pages liminaires ni chapitres — conservé pour les
// usages et tests qui composent un corps isolé.
export function genererSourceTypst(corps: string, opts: OptionsMiseEnPage & { titre: string }): string {
  return `${preambule(opts, `  numbering: "1",\n`)}
#align(center)[#text(size: 18pt)[${echapperMarkupTypst(opts.titre)}]]
#v(1.5em)

${corps}
`;
}

export type ChapitreTypst = {
  titre: string;
  corps: string; // déjà assemblé par assemblerFragments
  photoOuverture: PhotoShadow | null;
  // Page de citation (« respiration ») : une phrase exacte du récit, composée
  // seule sur la page paire en face de l'ouverture quand le chapitre n'a pas
  // de photo d'ouverture. Jamais générée automatiquement (02/10/2026) : le
  // choix d'une phrase est un geste éditorial, prévu pour être fait par le
  // narrateur ; absente, la page paire reste blanche.
  citation?: string | null;
};

// En-tête courant et folio (02/10/2026) : titre du livre sur les pages
// paires, titre du chapitre sur les pages impaires, folio au coin
// extérieur du pied. Rien sur les pages marquées <sans-folio> (ouvertures
// de chapitre) ni sur les pages liminaires et photos pleine page, qui
// définissent leur propre page sans en-tête ni pied.
function enTeteEtPiedLivre(titreLivre: string): string {
  // Une page est « muette » (ni en-tête ni folio) si elle ouvre un chapitre
  // (<sans-folio>), ou si c'est une page blanche insérée par un saut vers
  // une page impaire/paire : elle suit immédiatement une fin de chapitre
  // (<fin-chapitre>) et précède une ouverture, ou termine le livre.
  const muette = `let muette(p) = {
      let pages(l) = query(l).map(m => m.location().page())
      let fins = pages(<fin-chapitre>)
      let ouvertures = pages(<sans-folio>)
      let derniere = counter(page).final().first()
      ouvertures.contains(p) or (fins.contains(p - 1) and not fins.contains(p) and (ouvertures.contains(p + 1) or p == derniere))
    }`;
  return `  header: context {
    let p = here().page()
    ${muette}
    if muette(p) { return none }
    let chapitres = query(heading.where(level: 1).before(here()))
    set text(size: 7.5pt, fill: luma(120), tracking: 0.12em)
    if calc.even(p) {
      align(left, upper(${chaineTypst(titreLivre)}))
    } else if chapitres.len() > 0 {
      align(right, upper(chapitres.last().body))
    }
  },
  footer: context {
    let p = here().page()
    ${muette}
    if muette(p) { return none }
    set text(size: 9pt, fill: luma(90))
    align(if calc.even(p) { left } else { right }, str(p))
  },
`;
}

function chiffreRomain(n: number): string {
  const valeurs: [number, string][] = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let reste = n;
  let resultat = "";
  for (const [valeur, symbole] of valeurs) {
    while (reste >= valeur) {
      resultat += symbole;
      reste -= valeur;
    }
  }
  return resultat;
}

// Livre complet (02/10/2026) :
// - page de titre (impaire), page de colophon (paire), sommaire si le
//   récit compte plusieurs chapitres ;
// - chaque chapitre s'ouvre sur une page impaire, titre bas dans la page,
//   le texte commençant sous le titre ;
// - la page paire qui précède une ouverture reçoit la photo d'ouverture en
//   pleine page (fond perdu) quand le chapitre en a une (cf. lib/livre.ts),
//   et reste blanche sinon — la double page « photo / ouverture » naît
//   alors du contenu, pas d'un gabarit imposé.
export function genererLivreTypst(
  chapitres: ChapitreTypst[],
  opts: OptionsMiseEnPage & { titre: string; sousTitre?: string; mention?: string }
): string {
  const plusieurs = chapitres.length > 1;
  const liminaires = `#set document(title: ${chaineTypst(opts.titre)})
#show heading.where(level: 1): it => block(width: 100%, above: 0pt, below: 0pt)[
  #set align(center)
  #set par(justify: false)
  #text(size: 20pt, weight: "regular", hyphenate: false)[#it.body]
]

#page(header: none, footer: none)[
  #v(1fr)
  #align(center)[
    #set par(justify: false)
    #text(size: 26pt, hyphenate: false)[${echapperMarkupTypst(opts.titre)}]
    ${opts.sousTitre ? `#v(7mm)\n    #line(length: 14mm, stroke: 0.5pt + luma(140))\n    #v(6mm)\n    #text(size: 12pt, style: "italic", hyphenate: false)[${echapperMarkupTypst(opts.sousTitre)}]` : ""}
  ]
  #v(1.5fr)
]

#page(header: none, footer: none)[
  #v(1fr)
  #set par(justify: false, first-line-indent: 0pt)
  #text(size: 8.5pt, fill: luma(100))[${echapperMarkupTypst(opts.mention ?? "Composé à partir de conversations enregistrées avec Racontez-moi.")}]
  ${plusieurs ? "" : "#metadata(none) <fin-chapitre>"}
]
${
  plusieurs
    ? `
#page(header: none, footer: none)[
  #v(22mm)
  #align(center)[#text(size: 8pt, tracking: 0.25em, fill: luma(110))[SOMMAIRE]]
  #v(12mm)
  #set par(justify: false, first-line-indent: 0pt)
  #show outline.entry: set block(above: 1em)
  #outline(title: none, depth: 1)
  #metadata(none) <fin-chapitre>
]
`
    : ""
}`;

  // Page paire en face de l'ouverture (photo d'ouverture ou citation) — 02/10/2026,
  // révisé après le premier livre de démonstration : on ne l'insère QUE si le
  // chapitre précédent s'est terminé sur une page impaire, c'est-à-dire si la
  // page paire suivante est libre. Sinon, il faudrait laisser une page
  // impaire blanche au milieu du livre (effet d'erreur à l'impression) :
  // la citation est alors omise, et la photo d'ouverture passe en grand
  // au-dessus du titre, sur la page d'ouverture elle-même. La parité est lue
  // sur la position du dernier marqueur <fin-chapitre>.
  const finPrecedente = `let fins = query(selector(<fin-chapitre>).before(here()))
  let pf = if fins.len() > 0 { fins.last().location().page() } else { 0 }`;
  const corpsChapitres = chapitres
    .map((chapitre, i) => {
      const verso = chapitre.photoOuverture
        ? `page(margin: 0pt, header: none, footer: none, image("${chapitre.photoOuverture.chemin}", width: 100%, height: 100%, fit: "cover"))`
        : chapitre.citation
          ? `page(header: none, footer: none)[
      #v(1fr)
      #align(center)[#block(width: 80%)[
        #set par(justify: false, first-line-indent: 0pt, leading: 0.8em)
        #text(size: 15pt, style: "italic")[«\u{202F}${preparerTexte(chapitre.citation)}\u{202F}»]
      ]]
      #v(1.4fr)
    ]`
          : `pagebreak(to: "odd", weak: true)`;
      const avant = `#context {
  ${finPrecedente}
  if calc.odd(pf) { ${verso} } else { pagebreak(to: "odd", weak: true) }
}
`;
      // Sans page paire libre, la photo d'ouverture s'affiche en tête de
      // l'ouverture (hauteur limitée, jamais agrandie : elle supporte déjà la
      // pleine page) ; sinon, descente habituelle avant le titre.
      const tete = chapitre.photoOuverture
        ? `#context {
  ${finPrecedente}
  if calc.odd(pf) { v(52mm) } else { v(4mm); align(center, image("${chapitre.photoOuverture.chemin}", height: 92mm)); v(10mm) }
}`
        : `#v(52mm)`;
      const numero = plusieurs
        ? `#text(size: 8pt, tracking: 0.3em, fill: luma(110))[CHAPITRE ${chiffreRomain(i + 1)}]\n  #v(5mm)\n  `
        : "";
      return `${avant}#metadata(none) <sans-folio>
${tete}
#align(center)[
  ${numero}#heading(level: 1, outlined: ${plusieurs})[${echapperMarkupTypst(chapitre.titre)}]
  #v(6mm)
  #line(length: 12mm, stroke: 0.5pt + luma(150))
]
#v(16mm)

${chapitre.corps}

#metadata(none) <fin-chapitre>
`;
    })
    .join("\n");

  // Le livre se termine sur une page paire (verso) : une feuille complète,
  // et le dernier recto n'est jamais suivi d'une page imprimée au dos du
  // carton sans raison.
  return `${preambule(opts, enTeteEtPiedLivre(opts.titre))}${liminaires}
${corpsChapitres}
#pagebreak(to: "even", weak: true)
#box()
`;
}
