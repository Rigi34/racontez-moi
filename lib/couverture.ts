// Génération de la couverture (recto + dos + quatrième de couverture) pour
// la commande Lulu réelle. Les dimensions exactes (largeur du dos comprise)
// dépendent du nombre de pages intérieures — toujours demandées à
// lib/lulu.ts (dimensionsCouverture), jamais recalculées à la main.
//
// Géométrie casewrap (02/10/2026), d'après help.lulu.com « Creating your
// hardcover casewrap cover » et vérifiée sur de vraies dimensions renvoyées
// par l'API Lulu sandbox (14 × 10,75po pour 24 à 60 pages, 14,25po pour
// 120 pages, 14,569po pour 250 pages) :
// - le fichier dépasse le format fini de 0,75po de rabat sur chaque bord
//   extérieur (replié derrière le carton) ;
// - chaque plat mesure 6po + 0,125po de débord (« overhang ») ;
// - largeur totale = 2 × (0,75 + 6,125) + dos  →  dos = largeur − 13,75po ;
// - hauteur = 9po + 0,25po de débord + 2 × 0,75po de rabat ;
// - charnière à ~0,25po du dos sur chaque plat ; texte du dos à 0,125po
//   minimum de chaque bord du dos ; l'impression peut se décaler de
//   0,125po.
// L'ancienne version plaçait le titre dans les 35 % de droite de la largeur
// totale, à 0,5po du bord du fichier : décentré sur le plat et empiétant
// sur la zone de rabat pour un titre long. Ce n'est plus le cas.

function echapperMarkupTypst(texte: string): string {
  return texte.replace(/([\\#*_$`<>@[\]])/g, "\\$1");
}

export type DimensionsCouverture = { largeurPt: number; hauteurPt: number };

// Couleurs de marque déjà définies dans app/globals.css (@theme) — seules
// celles assez sombres pour un texte blanc lisible dessus sont proposées ici
// (pas de logique de contraste dynamique à construire pour cette première
// version, cf. décision du 26/08/2026, migration 0022).
export const PALETTE_COUVERTURE: { cle: string; label: string; hex: string }[] = [
  { cle: "petrole", label: "Pétrole", hex: "#1F4B4C" },
  { cle: "petrole_fonce", label: "Pétrole foncé", hex: "#17393A" },
  { cle: "encre", label: "Encre", hex: "#242220" },
  { cle: "grege", label: "Grège", hex: "#6B6660" },
];

export const COULEUR_COUVERTURE_DEFAUT = "petrole";

const PT_PAR_POUCE = 72;
const RABAT_PT = 0.75 * PT_PAR_POUCE;
const PLAT_PT = 6.125 * PT_PAR_POUCE;
const DEBORD_VERTICAL_PT = 0.125 * PT_PAR_POUCE;
const CHARNIERE_PT = 0.25 * PT_PAR_POUCE;
const MARGE_SURETE_PT = 0.25 * PT_PAR_POUCE;
// En dessous de cette épaisseur, le dos ne reçoit aucun texte (0,125po de
// blanc de chaque côté + un corps lisible ne tiennent pas).
const DOS_MIN_TEXTE_PT = 0.5 * PT_PAR_POUCE;

export function geometrieCouverture(dims: DimensionsCouverture) {
  const dosPt = Math.max(0, dims.largeurPt - 2 * (RABAT_PT + PLAT_PT));
  const platArriereX = RABAT_PT;
  const dosX = RABAT_PT + PLAT_PT;
  const platAvantX = dosX + dosPt;
  const hautPlatY = RABAT_PT + DEBORD_VERTICAL_PT;
  const hauteurPlat = Math.max(0, dims.hauteurPt - 2 * hautPlatY);
  return { dosPt, platArriereX, dosX, platAvantX, hautPlatY, hauteurPlat };
}

export function genererSourceCouverture(
  titre: string,
  sousTitre: string,
  dims: DimensionsCouverture,
  couleurHex: string
): string {
  const g = geometrieCouverture(dims);
  // Zone de texte du plat avant : charnière + marge côté dos, marge de
  // sûreté côté tranche, centrée visuellement sur la partie lisible du plat.
  const zoneAvantX = g.platAvantX + CHARNIERE_PT + MARGE_SURETE_PT;
  const zoneAvantLargeur = Math.max(10, PLAT_PT - CHARNIERE_PT - 2 * MARGE_SURETE_PT);
  const zoneArriereX = g.platArriereX + MARGE_SURETE_PT;
  const zoneArriereLargeur = Math.max(10, PLAT_PT - CHARNIERE_PT - 2 * MARGE_SURETE_PT);
  const f = (n: number) => n.toFixed(2);

  const titreEchappe = echapperMarkupTypst(titre);
  const sousTitreEchappe = echapperMarkupTypst(sousTitre);

  // Titre au dos, lu de bas en haut (convention française), seulement si
  // l'épaisseur le permet.
  const corpsDosPt = Math.min(11, (g.dosPt - 2 * 9) * 0.55);
  const dos =
    g.dosPt >= DOS_MIN_TEXTE_PT
      ? `#place(top + left, dx: ${f(g.dosX)}pt, dy: ${f(g.hautPlatY)}pt)[
  #box(width: ${f(g.dosPt)}pt, height: ${f(g.hauteurPlat)}pt)[
    #align(center + horizon)[#rotate(-90deg, reflow: true)[#text(size: ${f(corpsDosPt)}pt, tracking: 0.08em)[${titreEchappe}]]]
  ]
]`
      : "";

  return `#set page(
  width: ${f(dims.largeurPt)}pt,
  height: ${f(dims.hauteurPt)}pt,
  margin: 0pt,
  fill: rgb("${couleurHex}"),
)
#set text(lang: "fr", fill: white, font: "Libertinus Serif", hyphenate: false)
#set par(justify: false)

// Plat avant : titre au tiers supérieur, filet, sous-titre.
#place(top + left, dx: ${f(zoneAvantX)}pt, dy: ${f(g.hautPlatY + g.hauteurPlat * 0.3)}pt)[
  #box(width: ${f(zoneAvantLargeur)}pt)[
    #align(center)[
      #text(size: 30pt)[${titreEchappe}]
      #v(16pt)
      #line(length: 36pt, stroke: 0.6pt + white.transparentize(40%))
      #v(14pt)
      #text(size: 13pt, style: "italic")[${sousTitreEchappe}]
    ]
  ]
]

${dos}

// Quatrième de couverture : une seule mention discrète, en pied.
#place(top + left, dx: ${f(zoneArriereX)}pt, dy: ${f(g.hautPlatY + g.hauteurPlat - 60)}pt)[
  #box(width: ${f(zoneArriereLargeur)}pt)[
    #align(center)[#text(size: 7.5pt, tracking: 0.2em, fill: white.transparentize(30%))[RACONTEZ-MOI]]
  ]
]
`;
}
