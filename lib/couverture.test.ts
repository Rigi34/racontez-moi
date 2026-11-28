import { describe, it, expect } from "vitest";
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { genererSourceCouverture, geometrieJaquette, nettoyerDorure, PALETTE_COUVERTURE, texteDorure } from "./couverture";

// Compile réellement via Typst (pas de mock) — garde-fou contre une
// régression d'échappement introduite par la personnalisation (titre,
// sous-titre, couleur), cf. migration 0022 (26/08/2026). Dimensions
// fictives : dimensionsCouverture() (lib/lulu.ts) appelle l'API Lulu en
// réseau, hors de portée d'un test unitaire.
const DIMS_FICTIVES = { largeurPt: 1440, hauteurPt: 702 };

describe("genererSourceCouverture", () => {
  it.each(PALETTE_COUVERTURE)("compile sans erreur avec la couleur $cle", ({ hex }) => {
    const source = genererSourceCouverture("Un titre personnalisé", "Un sous-titre", DIMS_FICTIVES, hex);
    const compiler = NodeCompiler.create();
    const resultat = compiler.compile({ mainFileContent: source });
    expect(resultat.hasError()).toBe(false);
  });

  it("échappe les caractères spéciaux du markup Typst dans le titre et le sous-titre", () => {
    const source = genererSourceCouverture("Titre [avec] # caractères_spéciaux*", "Sous-titre <test>", DIMS_FICTIVES, "#1F4B4C");
    const compiler = NodeCompiler.create();
    const resultat = compiler.compile({ mainFileContent: source });
    expect(resultat.hasError()).toBe(false);
  });
});

// Dimensions réelles renvoyées par Lulu (environnement d'essai, 28/11/2026).
describe("geometrieJaquette", () => {
  it("retrouve le dos de 0,25 po (24-84 p.) et de 0,5 po (120 p.)", () => {
    expect(geometrieJaquette({ largeurPt: 1440, hauteurPt: 702 }).dosPt).toBeCloseTo(18);
    expect(geometrieJaquette({ largeurPt: 1458, hauteurPt: 702 }).dosPt).toBeCloseTo(36);
  });
  it("tient le texte du plat avant loin des plis plat/rabat possibles", () => {
    const g = geometrieJaquette({ largeurPt: 1440, hauteurPt: 702 });
    const finZone = g.zoneAvantX + g.zoneLargeur - (g.dosX + g.dosPt);
    expect(finZone).toBeLessThanOrEqual(6 * 72);
    expect(g.zoneArriereX).toBeGreaterThanOrEqual(g.dosX - 6 * 72);
  });
});

describe("texteDorure", () => {
  it("met en capitales et garde les accents acceptés par Lulu", () => {
    expect(nettoyerDorure("Le figuier au fond du jardin")).toBe("LE FIGUIER AU FOND DU JARDIN");
    expect(nettoyerDorure("Mes mémoires, été à Sète")).toBe("MES MÉMOIRES, ÉTÉ À SÈTE");
  });
  it("remplace ce que Lulu refuse (circonflexes, Œ, apostrophe et guillemets typographiques)", () => {
    expect(nettoyerDorure("La fête à l’île")).toBe("LA FETE À L'ILE");
    expect(nettoyerDorure("« Mon œuvre » — fin")).toBe('"MON OEUVRE" - FIN');
    expect(nettoyerDorure("Vie 🌳 et_mort")).toBe("VIE ETMORT");
  });
  it("ajoute le prénom seulement s'il tient dans les 42 signes", () => {
    expect(texteDorure("Le figuier au fond du jardin", "Daniel")).toEqual({ titre: "LE FIGUIER AU FOND DU JARDIN", auteur: "DANIEL" });
    const long = "Les souvenirs de toute une vie au bord de la mer";
    const r = texteDorure(long, "Daniel");
    expect(r.auteur).toBeNull();
    expect(r.titre.length).toBeLessThanOrEqual(42);
    expect(r.titre).toBe("LES SOUVENIRS DE TOUTE UNE VIE AU BORD DE");
  });
  it("chaque couleur a un code de toile et de titre", () => {
    for (const c of PALETTE_COUVERTURE) {
      expect(c.toile.code).toMatch(/^[A-Z]$/);
      expect(["G", "W", "B"]).toContain(c.dorure.code);
    }
  });
});
