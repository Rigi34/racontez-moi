// Génération de la couverture (recto + dos + quatrième de couverture) pour
// la commande Lulu réelle. Les dimensions exactes (largeur du dos comprise)
// dépendent du nombre de pages intérieures — toujours demandées à
// lib/lulu.ts (dimensionsCouverture), jamais recalculées à la main.
//
// Simplification assumée pour cette première version : Lulu ne renvoie que
// la largeur totale de la couverture, pas la position exacte de la
// tranche/dos à l'intérieur. Le texte du recto est donc placé prudemment
// dans les ~35% les plus à droite de la largeur totale (marge de sécurité
// généreuse par rapport au dos, quelle que soit sa largeur réelle pour un
// livre de cette pagination) plutôt que positionné au pixel près sur le
// gabarit — à vérifier visuellement contre le gabarit téléchargeable de
// Lulu avant un vrai tirage de production.

function echapperMarkupTypst(texte: string): string {
  return texte.replace(/([\\#*_$`<>@[\]])/g, "\\$1");
}

export type DimensionsCouverture = { largeurPt: number; hauteurPt: number };

export function genererSourceCouverture(titre: string, sousTitre: string, dims: DimensionsCouverture): string {
  const margeSecuritePt = 36; // 12,7mm, cohérent avec la marge de sécurité de l'intérieur (lib/typst.ts)
  const largeurRectoPt = dims.largeurPt * 0.35;
  const decalageGauchePt = dims.largeurPt - largeurRectoPt - margeSecuritePt;

  return `#set page(
  width: ${dims.largeurPt.toFixed(2)}pt,
  height: ${dims.hauteurPt.toFixed(2)}pt,
  margin: 0pt,
  fill: rgb("#1F4B4C"),
)
#set text(lang: "fr", fill: white)

#place(
  top + left,
  dx: ${decalageGauchePt.toFixed(2)}pt,
  dy: ${(dims.hauteurPt * 0.32).toFixed(2)}pt,
)[
  #box(width: ${largeurRectoPt.toFixed(2)}pt)[
    #align(center)[
      #text(size: 28pt, weight: "bold", font: "Libertinus Serif")[${echapperMarkupTypst(titre)}]
      #v(1.2em)
      #text(size: 13pt, style: "italic")[${echapperMarkupTypst(sousTitre)}]
    ]
  ]
]
`;
}
