import { describe, it, expect } from "vitest";
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { genererSourceCouverture, PALETTE_COUVERTURE } from "./couverture";

// Compile réellement via Typst (pas de mock) — garde-fou contre une
// régression d'échappement introduite par la personnalisation (titre,
// sous-titre, couleur), cf. migration 0022 (26/08/2026). Dimensions
// fictives : dimensionsCouverture() (lib/lulu.ts) appelle l'API Lulu en
// réseau, hors de portée d'un test unitaire.
const DIMS_FICTIVES = { largeurPt: 500, hauteurPt: 700 };

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
