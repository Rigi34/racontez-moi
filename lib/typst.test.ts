import { describe, it, expect } from "vitest";
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { gouttiereMm, preparerTexte, assemblerFragments, genererSourceTypst } from "./typst";

describe("gouttiereMm", () => {
  it.each([
    [59, 0],
    [60, 3],
    [150, 3],
    [151, 13],
    [400, 13],
    [401, 16],
    [600, 16],
    [601, 19],
  ])("pour %i pages, retourne %i mm", (pages, attendu) => {
    expect(gouttiereMm(pages)).toBe(attendu);
  });
});

describe("preparerTexte", () => {
  it("échappe le markup Typst (fragment jamais écrit en pensant à Typst)", () => {
    expect(preparerTexte("Prix 10$ #titre *gras* _italique_ [lien]")).toBe(
      "Prix 10\\$ \\#titre \\*gras\\* \\_italique\\_ \\[lien\\]"
    );
  });

  it("convertit les guillemets droits en guillemets français avec espaces fines insécables", () => {
    // U+202F (espace fine insécable), pas une espace normale — cf. commentaire
    // de typographierFrancais dans lib/typst.ts.
    expect(preparerTexte('Il a dit "bonjour" simplement.')).toBe("Il a dit « bonjour » simplement.");
  });

  it("insère une espace fine insécable avant la ponctuation haute française", () => {
    expect(preparerTexte("Vraiment? Oui! Voici: une liste;")).toBe(
      "Vraiment ? Oui ! Voici : une liste ;"
    );
  });
});

describe("assemblerFragments", () => {
  it("n'ajoute aucun séparateur pour un fragment unique", () => {
    const resultat = assemblerFragments([{ texte: "Un seul souvenir.", cheminsShadowPhotos: [] }]);
    expect(resultat).not.toContain("—");
    expect(resultat).toContain("Un seul souvenir.");
  });

  it("ajoute un séparateur non-sécable entre chaque fragment suivant", () => {
    const resultat = assemblerFragments([
      { texte: "Premier souvenir.", cheminsShadowPhotos: [] },
      { texte: "Deuxième souvenir.", cheminsShadowPhotos: [] },
    ]);
    expect(resultat).toContain("breakable: false");
    expect((resultat.match(/—/g) ?? []).length).toBe(1);
  });

  it("insère un bloc image par chemin shadow fourni", () => {
    const resultat = assemblerFragments([
      { texte: "Souvenir illustré.", cheminsShadowPhotos: ["/__shadow_photos__/a.png", "/__shadow_photos__/b.png"] },
    ]);
    expect(resultat).toContain('#image("/__shadow_photos__/a.png", width: 8cm)');
    expect(resultat).toContain('#image("/__shadow_photos__/b.png", width: 8cm)');
  });
});

describe("genererSourceTypst + assemblerFragments (compilation réelle)", () => {
  it("compile sans erreur un document à un seul fragment", () => {
    const corps = assemblerFragments([{ texte: "Un souvenir d'enfance, simple et court.", cheminsShadowPhotos: [] }]);
    const source = genererSourceTypst(corps, { titre: "Mes Mémoires" });
    const compiler = NodeCompiler.create();
    const resultat = compiler.compile({ mainFileContent: source });
    expect(resultat.hasError()).toBe(false);
  });

  it("compile sans erreur un document multi-fragments avec une gouttière non nulle", () => {
    const corps = assemblerFragments([
      { texte: "Premier souvenir, plein de détails sensoriels et de dialogues.", cheminsShadowPhotos: [] },
      { texte: "Deuxième souvenir, tout aussi vivant que le premier.", cheminsShadowPhotos: [] },
    ]);
    const source = genererSourceTypst(corps, { titre: "Titre [spécial] # test", nombrePagesLivreEstime: 200 });
    const compiler = NodeCompiler.create();
    const resultat = compiler.compile({ mainFileContent: source });
    expect(resultat.hasError()).toBe(false);
  });
});
