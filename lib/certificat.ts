// Certificat cadeau — personnalisé (prénom du destinataire, signature de
// l'offrant, message optionnel, code d'activation), exporté à la fois en
// PDF (impression) et en image (envoi direct par email/SMS) à partir d'un
// seul design Typst (décision du 28 juillet 2026). Reprend la charte du
// livre (lib/typst.ts, lib/couverture.ts) : couleurs de app/globals.css,
// police "Libertinus Serif" (bundlée avec Typst, jamais besoin de charger
// la police d'affichage web "Fraunces" — pas de fichier de police custom
// à fournir au compilateur).
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import sharp from "sharp";

const LARGEUR_MM = 148; // format A5, imprimable 2-up sur A4
const HAUTEUR_MM = 210;

const PETROLE = "#1F4B4C";
const AMBRE = "#B8823D";
const ENCRE = "#242220";
const GREGE = "#6B6660";
const PAPIER = "#FAF8F3";

function echapperMarkupTypst(texte: string): string {
  return texte.replace(/([\\#*_$`<>@[\]])/g, "\\$1");
}

export type DonneesCertificat = {
  destinatairePrenom: string;
  offrantNom: string;
  message: string | null;
  code: string;
};

function genererSourceCertificat(d: DonneesCertificat): string {
  const messageBloc = d.message
    ? `#v(1.2em)\n#text(size: 11.5pt, style: "italic", fill: rgb("${ENCRE}"))[${echapperMarkupTypst(d.message)}]`
    : "";

  return `#set page(
  width: ${LARGEUR_MM}mm,
  height: ${HAUTEUR_MM}mm,
  margin: 0mm,
  fill: rgb("${PAPIER}"),
)
#set text(lang: "fr", font: "Libertinus Serif", fill: rgb("${ENCRE}"))

#place(top + left)[#box(width: ${LARGEUR_MM}mm, height: 12mm, fill: rgb("${PETROLE}"))[
  #align(center + horizon)[#text(size: 11pt, style: "italic", fill: rgb("${PAPIER}"))[Racontez-moi]]
]]

#place(bottom + left)[#box(width: ${LARGEUR_MM}mm, height: 12mm, fill: rgb("${PETROLE}"))[
  #align(center + horizon)[#text(size: 10pt, style: "italic", fill: rgb("${PAPIER}"))[— ${echapperMarkupTypst(d.offrantNom)}]]
]]

#place(center + horizon)[
  #box(width: ${LARGEUR_MM - 40}mm)[
    #align(center)[
      #text(size: 10pt, tracking: 2pt, fill: rgb("${AMBRE}"))[UN CADEAU MÉMOIRE POUR]
      #v(0.7em)
      #text(size: 27pt, style: "italic", weight: "bold", fill: rgb("${PETROLE}"))[${echapperMarkupTypst(d.destinatairePrenom)}]
      ${messageBloc}
      #v(2.2em)
      #box(width: 100%, inset: 12pt, stroke: 0.6pt + rgb("${PETROLE}"))[
        #align(center)[
          #text(size: 8.5pt, tracking: 1.5pt, fill: rgb("${GREGE}"))[VOTRE CODE D'ACTIVATION]
          #v(0.5em)
          #text(size: 19pt, weight: "bold", fill: rgb("${PETROLE}"))[${d.code}]
          #v(0.6em)
          #text(size: 8pt, fill: rgb("${GREGE}"))[À saisir sur racontez-moi.com/activer]
        ]
      ]
    ]
  ]
]
`;
}

function compilerResultat(d: DonneesCertificat) {
  const compiler = NodeCompiler.create();
  const source = genererSourceCertificat(d);
  const resultat = compiler.compile({ mainFileContent: source });
  if (resultat.hasError()) {
    const diags = compiler.fetchDiagnostics(resultat.takeError()!);
    throw new Error("Typst certificat: " + JSON.stringify(diags));
  }
  return { compiler, resultat };
}

export function compilerCertificatPdf(d: DonneesCertificat): Buffer {
  const { compiler, resultat } = compilerResultat(d);
  return Buffer.from(compiler.pdf(resultat.result!));
}

// Rasterise le SVG Typst en PNG via sharp (déjà présent en dépendance
// transitive de Next.js) — à une densité plus élevée que le défaut pour
// rester net une fois affiché en plein écran sur un téléphone.
export async function compilerCertificatImage(d: DonneesCertificat): Promise<Buffer> {
  const { compiler, resultat } = compilerResultat(d);
  const svg = compiler.svg(resultat.result!);
  return sharp(Buffer.from(svg), { density: 220 }).png().toBuffer();
}
