// Visuels du livre d'exemple de la page d'accueil (04/10/2026).
//
// Tout ce qui est montré au visiteur sort du moteur de production
// (lib/manuscrit.ts compilerInterieur, lib/couverture.ts), sans tampon
// APERÇU : pages et couvertures sont de vrais rendus, jamais des mockups.
// Contenu : scripts/data/livre-exemple.json (récit de démonstration).
//
// Usage (depuis la racine du projet, avec les identifiants Lulu sandbox de
// .env.local pour les dimensions exactes de couverture) :
//   set -a; . ./.env.local; set +a; npx tsx scripts/generer-visuels-livre.mts
// Prérequis système : pdftoppm (poppler-utils).
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { compilerInterieur, type FragmentAvecPhotos } from "../lib/manuscrit";
import { genererSourceCouverture, geometrieCouverture, PALETTE_COUVERTURE } from "../lib/couverture";
import { dimensionsCouverture } from "../lib/lulu";
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";

const RACINE = process.cwd();
const SORTIE = join(RACINE, "public/livre-exemple");
const DPI = 200;
// Fond perdu de 0,125 po rogné : on montre la page au format fini.
const FOND_PERDU_PX = Math.round(0.125 * DPI);

type DonneesLivre = {
  titre: string;
  sousTitre: string;
  mention: string;
  citations: Record<string, string>;
  photos: Record<string, string>;
  fragments: { code: string; section: string; texte: string }[];
};

const livre: DonneesLivre = JSON.parse(readFileSync(join(RACINE, "scripts/data/livre-exemple.json"), "utf8"));
// Noms de fichiers versionnés par leur contenu (04/10/2026) : une page
// régénérée change d'adresse, si bien qu'aucun navigateur ni cache d'images
// ne peut servir l'ancienne version sous le même nom. Les anciens fichiers
// sont retirés ; app/components/livre/visuels.json donne les adresses.
rmSync(SORTIE, { recursive: true, force: true });
mkdirSync(SORTIE, { recursive: true });
const manifeste: { pages: Record<string, string>; couvertures: Record<string, string> } = { pages: {}, couvertures: {} };
async function ecrireVersionne(image: sharp.Sharp, nom: string): Promise<string> {
  const octets = await image.toBuffer();
  const empreinte = createHash("sha256").update(octets).digest("hex").slice(0, 10);
  const fichier = `${nom}.${empreinte}.webp`;
  writeFileSync(join(SORTIE, fichier), octets);
  return `/livre-exemple/${fichier}`;
}
const travail = mkdtempSync(join(tmpdir(), "livre-exemple-"));

async function photoPourFragment(code: string): Promise<FragmentAvecPhotos["photos"]> {
  const chemin = livre.photos[code];
  if (!chemin) return [];
  // Typst lit le JPEG ; la photo source peut être en WebP.
  const { data, info } = await sharp(join(RACINE, chemin)).jpeg({ quality: 92 }).toBuffer({ resolveWithObject: true });
  return [{ id: `exemple-${code}`, extension: "jpg", buffer: data, largeurPx: info.width, hauteurPx: info.height }];
}

const fragments: FragmentAvecPhotos[] = [];
for (const f of livre.fragments) {
  fragments.push({ texte: f.texte, section: f.section, photos: await photoPourFragment(f.code) });
}

const { buffer, nombrePages } = compilerInterieur(fragments, {
  titre: livre.titre,
  sousTitre: livre.sousTitre,
  mention: livre.mention,
  citations: livre.citations,
});
const pdfInterieur = join(travail, "interieur.pdf");
writeFileSync(pdfInterieur, buffer);
execFileSync("pdftoppm", ["-r", String(DPI), "-png", pdfInterieur, join(travail, "p")]);
console.log(`intérieur : ${nombrePages} pages`);

const chiffres = String(nombrePages).length;
const cheminPage = (n: number) => join(travail, `p-${String(n).padStart(Math.max(2, chiffres), "0")}.png`);

async function pageRognee(n: number) {
  const img = sharp(cheminPage(n));
  const { width, height } = await img.metadata();
  return img.extract({
    left: FOND_PERDU_PX,
    top: FOND_PERDU_PX,
    width: width! - 2 * FOND_PERDU_PX,
    height: height! - 2 * FOND_PERDU_PX,
  });
}

// Pages montrées sur l'accueil (numéros du livre généré ; voir le rapport de
// la commande pour les retrouver si le contenu change).
const PAGES = (process.env.PAGES_EXEMPLE ?? "1,3,5,7,51")
  .split(",")
  .map((n) => Number(n.trim()));
for (const n of PAGES) {
  manifeste.pages[n] = await ecrireVersionne((await pageRognee(n)).webp({ quality: 86 }), `page-${String(n).padStart(2, "0")}`);
}
// Toutes les pages, en petit, pour choisir (non publiées).
for (let n = 1; n <= nombrePages; n++) {
  await (await pageRognee(n)).resize({ width: 300 }).png().toFile(join(travail, `vignette-${String(n).padStart(2, "0")}.png`));
}

// Couvertures : vraies dimensions Lulu pour CE nombre de pages, première de
// couverture extraite (plat avant + débord du carton, sans la marge repliée).
const dims = await dimensionsCouverture(nombrePages);
const g = geometrieCouverture(dims);
for (const couleur of PALETTE_COUVERTURE) {
  const compilateur = NodeCompiler.create();
  const resultat = compilateur.compile({
    mainFileContent: genererSourceCouverture(livre.titre, livre.sousTitre, dims, couleur.hex),
  });
  if (resultat.hasError()) throw new Error(JSON.stringify(compilateur.fetchDiagnostics(resultat.takeError()!)));
  const pdf = join(travail, `couverture-${couleur.cle}.pdf`);
  writeFileSync(pdf, Buffer.from(compilateur.pdf(resultat.result!)));
  execFileSync("pdftoppm", ["-r", String(DPI), "-png", "-singlefile", pdf, join(travail, `couverture-${couleur.cle}`)]);
  const px = (pt: number) => Math.round((pt / 72) * DPI);
  manifeste.couvertures[couleur.cle] = await ecrireVersionne(
    sharp(join(travail, `couverture-${couleur.cle}.png`))
      .extract({ left: px(g.platAvantX), top: px(g.hautPlatY - 0.125 * 72), width: px(6.125 * 72), height: px(g.hauteurPlat + 0.25 * 72) })
      .webp({ quality: 88 }),
    `couverture-${couleur.cle}`
  );
}

// Image de partage (1200 × 630) : la couverture et une double page, à plat,
// sur le papier de la charte. Aucune mise en scène photographique.
const fond = { r: 0xfa, g: 0xf8, b: 0xf3, alpha: 1 };
const hauteur = 500;
const couv = await sharp(join(RACINE, "public", manifeste.couvertures.petrole)).resize({ height: hauteur }).toBuffer();
const gauche = await (await pageRognee(6)).resize({ height: hauteur }).toBuffer();
const droite = await (await pageRognee(7)).resize({ height: hauteur }).toBuffer();
const largeurCouv = (await sharp(couv).metadata()).width!;
const largeurPage = (await sharp(gauche).metadata()).width!;
const ombre = await sharp({ create: { width: largeurPage * 2, height: hauteur, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.12 } } }).png().toBuffer();
const ombreCouv = await sharp({ create: { width: largeurCouv, height: hauteur, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.18 } } }).png().toBuffer();
const x0 = Math.round((1200 - (largeurCouv + 56 + largeurPage * 2)) / 2);
const y0 = 65;
await sharp({ create: { width: 1200, height: 630, channels: 4, background: fond } })
  .composite([
    { input: ombreCouv, left: x0 + 6, top: y0 + 6 },
    { input: couv, left: x0, top: y0 },
    { input: ombre, left: x0 + largeurCouv + 56 + 4, top: y0 + 4 },
    { input: gauche, left: x0 + largeurCouv + 56, top: y0 },
    { input: droite, left: x0 + largeurCouv + 56 + largeurPage, top: y0 },
  ])
  .jpeg({ quality: 88 })
  .toFile(join(RACINE, "public/og-image.jpg"));

writeFileSync(join(RACINE, "app/components/livre/visuels.json"), JSON.stringify(manifeste, null, 2) + "\n");
console.log(`visuels écrits dans public/livre-exemple/ et public/og-image.jpg (vignettes de contrôle : ${travail})`);
if (!process.env.GARDER_TRAVAIL) rmSync(travail, { recursive: true, force: true });
