// Génération de la couverture pour la commande Lulu réelle.
//
// 28/11/2026 (décision de Régis) : le livre passe en toile avec jaquette
// imprimée (« Hardcover Linen Wrap », code LW chez Lulu). Le fichier envoyé
// à Lulu est désormais la JAQUETTE (rabats compris) ; la toile elle-même ne
// reçoit que le titre frappé sur le dos (cf. texteDorure plus bas et
// lib/lulu.ts). Le commentaire casewrap ci-dessous reste pour l'historique.
// Les dimensions exactes (largeur du dos comprise)
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
//
// 28/11/2026 : chaque couleur fixe aussi la toile et la couleur du titre
// frappé (« duos » validés par Régis, un seul choix pour le client). Codes
// Lulu vérifiés le 28/11/2026 sur l'environnement d'essai (cover-dimensions
// et calcul de coût acceptés, même prix pour les quatre) : toile F = vert
// forêt, N = bleu marine, B = noire, T = beige ; dorure G = or, W = blanc.
// Sur la toile beige, l'or se lit mal : titre blanc (choix de Régis).
export type CouleurCouverture = {
  cle: string;
  label: string;
  hex: string;
  toile: { code: string; label: string; hex: string };
  dorure: { code: string; label: string };
};

export const PALETTE_COUVERTURE: CouleurCouverture[] = [
  { cle: "petrole", label: "Pétrole", hex: "#1F4B4C", toile: { code: "F", label: "vert forêt", hex: "#3D5847" }, dorure: { code: "G", label: "doré" } },
  { cle: "petrole_fonce", label: "Pétrole foncé", hex: "#17393A", toile: { code: "N", label: "bleu marine", hex: "#2B3550" }, dorure: { code: "G", label: "doré" } },
  { cle: "encre", label: "Encre", hex: "#242220", toile: { code: "B", label: "noire", hex: "#232326" }, dorure: { code: "G", label: "doré" } },
  { cle: "grege", label: "Grège", hex: "#6B6660", toile: { code: "T", label: "beige", hex: "#968E78" }, dorure: { code: "W", label: "blanc" } },
];

export const COULEUR_COUVERTURE_DEFAUT = "petrole";

// Repli sur la couleur par défaut si la clé stockée ne correspond plus à la
// palette (valeur historique).
export function couleurCouverture(cle: string | null | undefined): CouleurCouverture {
  return (
    PALETTE_COUVERTURE.find((c) => c.cle === cle) ??
    PALETTE_COUVERTURE.find((c) => c.cle === COULEUR_COUVERTURE_DEFAUT)!
  );
}

// Titre frappé sur le dos de la toile (champs foil_stamp_title_text et
// foil_stamp_author_text de Lulu). Règles vérifiées le 28/11/2026 sur
// l'environnement d'essai Lulu, pas supposées :
// - 42 caractères au plus pour le titre ET l'auteur réunis ;
// - refusés : les accents circonflexes (Â Ê Î Ô Û), Œ, Æ, l'apostrophe
//   typographique ’, les guillemets « », le tiret long — ;
// - acceptés : É È Ë À Ä Ï Ö Ù Ü Ÿ Ç, l'apostrophe droite, les guillemets
//   droits, le trait d'union, , . : ! ? & et les chiffres.
// Lulu demande des capitales. Ce qui ne passe pas est remplacé par son
// équivalent le plus proche ; le reste est retiré.
export const DORURE_MAX = 42;
const REMPLACEMENTS_DORURE: Record<string, string> = {
  Â: "A", Ê: "E", Î: "I", Ô: "O", Û: "U", Œ: "OE", Æ: "AE",
  "’": "'", "‘": "'", "«": '"', "»": '"', "“": '"', "”": '"', "—": "-", "–": "-", "…": "...",
};
const CARACTERE_DORURE = /[A-Z0-9 ;',./!`^&*()~+:?"\-ÉÈËÀÄÏÖÙÜŸÇ]/;

export function nettoyerDorure(texte: string): string {
  // Guillemets français : « x » devient "x", sans les espaces intérieures.
  const sansChevrons = texte.replace(/«[\s\u00a0\u202f]*/g, '"').replace(/[\s\u00a0\u202f]*»/g, '"');
  const remplace = [...sansChevrons.toLocaleUpperCase("fr-FR").replace(/[\s\u00a0\u202f]+/g, " ")]
    .map((c) => REMPLACEMENTS_DORURE[c] ?? c)
    .join("");
  return [...remplace]
    .filter((c) => CARACTERE_DORURE.test(c))
    .join("")
    .replace(/ +/g, " ")
    .trim();
}

function couperAuMot(texte: string, max: number): string {
  if (texte.length <= max) return texte;
  const coupe = texte.slice(0, max + 1);
  const espace = coupe.lastIndexOf(" ");
  return (espace > 0 ? coupe.slice(0, espace) : texte.slice(0, max)).replace(/[ ,;:\-]+$/, "");
}

// L'auteur (le prénom du narrateur) n'est frappé que s'il tient avec le
// titre complet ; sinon seul le titre reste, coupé au mot si besoin.
export function texteDorure(titre: string, auteur: string | null): { titre: string; auteur: string | null } {
  const t = couperAuMot(nettoyerDorure(titre), DORURE_MAX);
  const a = auteur ? nettoyerDorure(auteur) : "";
  return { titre: t, auteur: a && t.length + a.length <= DORURE_MAX ? a : null };
}

const PT_PAR_POUCE = 72;

// Géométrie de la jaquette (28/11/2026). Faits vérifiés auprès de l'API
// Lulu (cover-dimensions, environnement d'essai) : fichier de 20 × 9,75 po
// pour 24 à 84 pages, 20,25 po pour 120 pages ; le Book Creation Guide de
// Lulu donne un dos de 0,25 po (24-84 p.) puis 0,5 po (85-140 p.). D'où :
// largeur = 19,75 po + dos, soit 9,875 po de chaque côté du dos (plat +
// rabat + fond perdu de 0,125 po).
// DÉDUCTION, non documentée par Lulu : la position exacte du pli entre plat
// et rabat (entre ~6,25 et ~6,5 po du dos). Le texte est donc tenu à
// distance des deux plis possibles : zone de 0,5 à 5,6 po depuis le dos.
// Les rabats restent unis (aplat de couleur seulement).
const COTE_PT = 9.875 * PT_PAR_POUCE;
const ZONE_DEBUT_PT = 0.5 * PT_PAR_POUCE;
const ZONE_LARGEUR_PT = 5.1 * PT_PAR_POUCE;
// En dessous de cette épaisseur, le dos de la jaquette ne reçoit aucun texte.
const DOS_MIN_TEXTE_PT = 0.5 * PT_PAR_POUCE;

export function geometrieJaquette(dims: DimensionsCouverture) {
  const dosPt = Math.max(0, dims.largeurPt - 2 * COTE_PT);
  const dosX = COTE_PT;
  const platAvantX = dosX + dosPt;
  // Plat visible : 9 po + 0,125 po de débord haut et bas, centré.
  const hauteurPlat = 9.25 * PT_PAR_POUCE;
  const hautPlatY = Math.max(0, (dims.hauteurPt - hauteurPlat) / 2);
  return {
    dosPt,
    dosX,
    platAvantX,
    hautPlatY,
    hauteurPlat,
    zoneAvantX: platAvantX + ZONE_DEBUT_PT,
    zoneArriereX: dosX - ZONE_DEBUT_PT - ZONE_LARGEUR_PT,
    zoneLargeur: ZONE_LARGEUR_PT,
  };
}

export function genererSourceCouverture(
  titre: string,
  sousTitre: string,
  dims: DimensionsCouverture,
  couleurHex: string
): string {
  const g = geometrieJaquette(dims);
  const f = (n: number) => n.toFixed(2);
  const titreEchappe = echapperMarkupTypst(titre);
  const sousTitreEchappe = echapperMarkupTypst(sousTitre);

  // Titre au dos de la jaquette, lu de bas en haut (convention française),
  // seulement si l'épaisseur le permet.
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
#place(top + left, dx: ${f(g.zoneAvantX)}pt, dy: ${f(g.hautPlatY + g.hauteurPlat * 0.3)}pt)[
  #box(width: ${f(g.zoneLargeur)}pt)[
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
#place(top + left, dx: ${f(g.zoneArriereX)}pt, dy: ${f(g.hautPlatY + g.hauteurPlat - 60)}pt)[
  #box(width: ${f(g.zoneLargeur)}pt)[
    #align(center)[#text(size: 7.5pt, tracking: 0.2em, fill: white.transparentize(30%))[RACONTEZ-MOI]]
  ]
]
`;
}
