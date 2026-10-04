import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { COULEURS_COUVERTURE, COUVERTURE, PAGE, PAGES_EXEMPLE, SEANCE_REELLE, PHOTOS_EXEMPLAIRE } from "./donnees";
import { PALETTE_COUVERTURE } from "@/lib/couverture";
import visuels from "./visuels.json";

const fichier = (src: string) => join(process.cwd(), "public", src);

describe("présentation du livre : visuels réels", () => {
  it("chaque page montrée existe et a les dimensions déclarées", async () => {
    for (const src of [...PAGES_EXEMPLE.map((p) => p.src), SEANCE_REELLE.page]) {
      expect(existsSync(fichier(src)), src).toBe(true);
      const { width, height } = await sharp(fichier(src)).metadata();
      expect({ src, width, height }).toEqual({ src, width: PAGE.largeur, height: PAGE.hauteur });
    }
  });

  it("une couverture par couleur réellement proposée dans /mon-livre", async () => {
    expect(COULEURS_COUVERTURE.map((c) => c.cle)).toEqual(PALETTE_COUVERTURE.map((c) => c.cle));
    for (const c of COULEURS_COUVERTURE) {
      expect(existsSync(fichier(c.src)), c.src).toBe(true);
      const { width, height } = await sharp(fichier(c.src)).metadata();
      expect({ src: c.src, width, height }).toEqual({ src: c.src, width: COUVERTURE.largeur, height: COUVERTURE.hauteur });
    }
  });

  it("aucune photo d'exemplaire n'est référencée sans fichier", () => {
    for (const photo of PHOTOS_EXEMPLAIRE) expect(existsSync(fichier(photo.src)), photo.src).toBe(true);
  });

  it("chaque page a un texte alternatif et une légende", () => {
    for (const p of PAGES_EXEMPLE) {
      expect(p.alt.length).toBeGreaterThan(10);
      expect(p.legende.length).toBeGreaterThan(5);
    }
  });

  it("le souvenir affiché sur l'accueil est mot pour mot celui de la page du livre", () => {
    const livre = JSON.parse(readFileSync(join(process.cwd(), "scripts/data/livre-exemple.json"), "utf8"));
    const premier = livre.fragments.find((f: { code: string }) => f.code === "A0");
    expect(SEANCE_REELLE.souvenir.join("\n\n")).toBe(premier.texte);
  });

  it("le dossier des visuels contient exactement les fichiers du manifeste", () => {
    const attendus = [...Object.values(visuels.pages), ...Object.values(visuels.couvertures)]
      .map((src) => src.replace("/livre-exemple/", ""))
      .sort();
    expect(readdirSync(join(process.cwd(), "public/livre-exemple")).sort()).toEqual(attendus);
  });
});
