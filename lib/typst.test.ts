import { describe, it, expect } from "vitest";
import { deflateSync } from "node:zlib";
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

// Dimensions de test : portrait 3:4 (ex. 1200×1600), paysage 4:3 (ex.
// 1600×1200) — ratios courants en photo smartphone.
const PORTRAIT = (chemin: string) => ({ chemin, largeurPx: 1200, hauteurPx: 1600 });
const PAYSAGE = (chemin: string) => ({ chemin, largeurPx: 1600, hauteurPx: 1200 });

describe("assemblerFragments", () => {
  it("n'ajoute aucun séparateur pour un fragment unique", () => {
    const resultat = assemblerFragments([{ texte: "Un seul souvenir.", photos: [] }]);
    expect(resultat).not.toContain("—");
    expect(resultat).toContain("Un seul souvenir.");
  });

  it("ajoute un séparateur sticky (jamais orphelin) entre chaque fragment suivant", () => {
    const resultat = assemblerFragments([
      { texte: "Premier souvenir.", photos: [] },
      { texte: "Deuxième souvenir.", photos: [] },
    ]);
    // Correctif du 23/09/2026 : le séparateur seul est sticky, plus le
    // fragment entier en breakable: false (cf. bug de pagination ci-dessous).
    expect(resultat).toContain("sticky: true");
    expect(resultat).not.toContain("breakable: false");
    expect((resultat.match(/—/g) ?? []).length).toBe(1);
  });

  it("B1 : deux photos portrait forment une paire (grille), pas deux blocs seuls", () => {
    const resultat = assemblerFragments([
      { texte: "Souvenir illustré.", photos: [PORTRAIT("/__shadow_photos__/a.png"), PORTRAIT("/__shadow_photos__/b.png")] },
    ]);
    expect(resultat).toContain("#grid(");
    expect(resultat).toContain('#image("/__shadow_photos__/a.png", height:');
    expect(resultat).toContain('#image("/__shadow_photos__/b.png", height:');
    expect(resultat).not.toContain("width: 8cm");
  });

  it("B1 : deux photos paysage forment une paire (grille)", () => {
    const resultat = assemblerFragments([
      { texte: "Souvenir illustré.", photos: [PAYSAGE("/__shadow_photos__/a.png"), PAYSAGE("/__shadow_photos__/b.png")] },
    ]);
    expect(resultat).toContain("#grid(");
    expect((resultat.match(/#grid\(/g) ?? []).length).toBe(1);
  });

  it("B1 : un portrait et un paysage consécutifs ne sont PAS appariés (orientations incompatibles)", () => {
    const resultat = assemblerFragments([
      { texte: "Souvenir illustré.", photos: [PORTRAIT("/__shadow_photos__/a.png"), PAYSAGE("/__shadow_photos__/b.png")] },
    ]);
    expect(resultat).not.toContain("#grid(");
    expect(resultat).toContain('#image("/__shadow_photos__/a.png", height: 9cm)');
    expect(resultat).toContain('#image("/__shadow_photos__/b.png", width:');
  });

  it("B1 : 3 photos (2 même orientation + 1 seule) donnent une paire et un bloc seul", () => {
    const resultat = assemblerFragments([
      {
        texte: "Souvenir illustré.",
        photos: [PORTRAIT("/__shadow_photos__/a.png"), PORTRAIT("/__shadow_photos__/b.png"), PAYSAGE("/__shadow_photos__/c.png")],
      },
    ]);
    expect((resultat.match(/#grid\(/g) ?? []).length).toBe(1);
    expect(resultat).toContain('#image("/__shadow_photos__/c.png", width:');
  });

  it("B1 : 6 photos (le maximum par fragment) en alternance produisent 6 blocs seuls (aucune paire adjacente compatible)", () => {
    const resultat = assemblerFragments([
      {
        texte: "Souvenir illustré.",
        photos: [
          PORTRAIT("/__shadow_photos__/1.png"),
          PAYSAGE("/__shadow_photos__/2.png"),
          PORTRAIT("/__shadow_photos__/3.png"),
          PAYSAGE("/__shadow_photos__/4.png"),
          PORTRAIT("/__shadow_photos__/5.png"),
          PAYSAGE("/__shadow_photos__/6.png"),
        ],
      },
    ]);
    expect(resultat).not.toContain("#grid(");
    for (let i = 1; i <= 6; i++) {
      expect(resultat).toContain(`/__shadow_photos__/${i}.png`);
    }
  });

  it("B1 : 6 photos toutes portrait forment 3 paires", () => {
    const resultat = assemblerFragments([
      {
        texte: "Souvenir illustré.",
        photos: [1, 2, 3, 4, 5, 6].map((i) => PORTRAIT(`/__shadow_photos__/${i}.png`)),
      },
    ]);
    expect((resultat.match(/#grid\(/g) ?? []).length).toBe(3);
  });
});

describe("genererSourceTypst + assemblerFragments (compilation réelle)", () => {
  it("compile sans erreur un document à un seul fragment", () => {
    const corps = assemblerFragments([{ texte: "Un souvenir d'enfance, simple et court.", photos: [] }]);
    const source = genererSourceTypst(corps, { titre: "Mes Mémoires" });
    const compiler = NodeCompiler.create();
    const resultat = compiler.compile({ mainFileContent: source });
    expect(resultat.hasError()).toBe(false);
  });

  it("compile sans erreur un document multi-fragments avec une gouttière non nulle", () => {
    const corps = assemblerFragments([
      { texte: "Premier souvenir, plein de détails sensoriels et de dialogues.", photos: [] },
      { texte: "Deuxième souvenir, tout aussi vivant que le premier.", photos: [] },
    ]);
    const source = genererSourceTypst(corps, { titre: "Titre [spécial] # test", nombrePagesLivreEstime: 200 });
    const compiler = NodeCompiler.create();
    const resultat = compiler.compile({ mainFileContent: source });
    expect(resultat.hasError()).toBe(false);
  });

  it("compile sans erreur avec le tampon APERÇU actif (garantie, 11/09/2026)", () => {
    const corps = assemblerFragments([{ texte: "Un souvenir quelconque.", photos: [] }]);
    const source = genererSourceTypst(corps, { titre: "Mes Mémoires", apercu: true });
    const compiler = NodeCompiler.create();
    const resultat = compiler.compile({ mainFileContent: source });
    expect(resultat.hasError()).toBe(false);
  });

  // Le bloc <style> du SVG Typst contient toujours "fill: none" (CSS
  // générique, non lié au contenu) — on l'exclut avant de chercher du texte
  // rendu, sous peine de faux positif sur la vérification "none" ci-dessous.
  const texteRenduSvg = (svg: string) => svg.replace(/<style[\s\S]*?<\/style>/g, "");

  it("rend visuellement le tampon APERÇU en aperçu, sans jamais afficher le code Typst en texte littéral (bug du 23/09/2026)", () => {
    const source = genererSourceTypst("Un souvenir quelconque.", { titre: "Mes Mémoires", apercu: true });
    const compiler = NodeCompiler.create();
    const svg = texteRenduSvg(compiler.svg(compiler.compile({ mainFileContent: source }).result!));

    expect(svg).toContain("APERÇU");
    // Signature du bug corrigé : le code Typst du tampon inséré dans des
    // crochets markup s'affichait comme texte brut au lieu d'être exécuté.
    expect(svg).not.toContain("rotate(");
    expect(svg).not.toContain("weight:");
  });

  it("n'affiche jamais le mot none sur un PDF de commande confirmée (bug du 23/09/2026)", () => {
    const source = genererSourceTypst("Un souvenir quelconque.", { titre: "Mes Mémoires" });
    const compiler = NodeCompiler.create();
    const svg = texteRenduSvg(compiler.svg(compiler.compile({ mainFileContent: source }).result!));

    expect(svg).not.toContain("none");
    expect(svg).not.toContain("APERÇU");
  });

  // PNG 1×1 minimal valide — le contenu réel importe peu ici, seules les
  // dimensions cm explicites du #image() généré comptent pour la mise en
  // page (B1), mais Typst doit pouvoir décoder un fichier réel.
  const PNG_1X1 = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64"
  );

  it("compile sans erreur avec de vraies photos, mise en page B1 (paire + bloc seul)", () => {
    const compiler = NodeCompiler.create();
    compiler.mapShadow(`${process.cwd()}/a.png`, PNG_1X1);
    compiler.mapShadow(`${process.cwd()}/b.png`, PNG_1X1);
    compiler.mapShadow(`${process.cwd()}/c.png`, PNG_1X1);

    const corps = assemblerFragments([
      {
        texte: "Souvenir illustré de vraies photos.",
        photos: [PORTRAIT("/a.png"), PORTRAIT("/b.png"), PAYSAGE("/c.png")],
      },
    ]);
    const source = genererSourceTypst(corps, { titre: "Mes Mémoires" });
    const resultat = compiler.compile({ mainFileContent: source });
    expect(resultat.hasError()).toBe(false);
  });

  // Bug de pagination trouvé le 23/09/2026 (validation PHOTO-A1-B5) : tout
  // fragment non-premier était enveloppé dans #block(breakable: false) avec
  // son texte ET ses photos. Un fragment dépassant la hauteur d'une page ne
  // pouvait alors ni être scindé ni déplacé — Typst rendait ce qui tenait et
  // perdait silencieusement le reste, sans erreur (hasError() restait
  // false). Corrigé en ne rendant "sticky" que le séparateur — ces tests
  // vérifient le contenu réellement présent dans le PDF compilé, pas
  // seulement l'absence d'erreur de compilation.

  // PNG 1×1 de couleur distincte par index — nécessaire (pas PNG_1X1
  // réutilisé) pour que chaque photo soit un objet image distinct dans le
  // PDF exporté : Typst dédoublonne les images strictement identiques en un
  // seul objet réutilisé, ce qui fausserait un comptage par occurrences.
  function pngCouleur(r: number, g: number, b: number): Buffer {
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(1, 0);
    ihdr.writeUInt32BE(1, 4);
    ihdr[8] = 8;
    ihdr[9] = 2;
    const raw = Buffer.from([0, r, g, b]);
    const idat = deflateSync(raw);
    const chunk = (type: string, data: Buffer) => {
      const len = Buffer.alloc(4);
      len.writeUInt32BE(data.length, 0);
      const typeBuf = Buffer.from(type, "ascii");
      const crcTable = (buf: Buffer) => {
        let crc = 0xffffffff;
        for (const byte of buf) {
          crc ^= byte;
          for (let k = 0; k < 8; k++) crc = crc & 1 ? (0xedb88320 ^ (crc >>> 1)) : crc >>> 1;
        }
        return (crc ^ 0xffffffff) >>> 0;
      };
      const crcBuf = Buffer.alloc(4);
      crcBuf.writeUInt32BE(crcTable(Buffer.concat([typeBuf, data])), 0);
      return Buffer.concat([len, typeBuf, data, crcBuf]);
    };
    return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
  }

  // Compte les objets image réellement embarqués dans le PDF final — preuve
  // sur le contenu produit, pas sur la seule réussite de la compilation.
  const compterImagesPdf = (pdf: Buffer) => (pdf.toString("latin1").match(/\/Subtype ?\/Image/g) ?? []).length;

  const texteLong = Array(4)
    .fill(
      "Ce paragraphe simule un souvenir assez long pour occuper une page presque entière, avec plusieurs phrases qui se répètent afin d'atteindre un volume de texte réaliste pour ce test de pagination avec des photos jointes au même fragment."
    )
    .join("\n\n");

  function compilerAvecPhotos(fragments: { texte: string; nbPhotos: number }[]) {
    const compiler = NodeCompiler.create();
    let compteur = 0;
    const fragmentsAssembles = fragments.map(({ texte, nbPhotos }) => {
      const photos = Array.from({ length: nbPhotos }, () => {
        const chemin = `/img${compteur}.png`;
        // Couleur strictement croissante et jamais répétée dans la plage de
        // ce test (au plus une douzaine de photos) — indispensable pour que
        // chaque photo soit un objet image distinct dans le PDF : Typst
        // dédoublonne deux images strictement identiques en un seul objet
        // réutilisé, ce qui fausserait le comptage par occurrences.
        const c = 5 + compteur * 20;
        compiler.mapShadow(`${process.cwd()}${chemin}`, pngCouleur(c, c, c));
        const portrait = compteur % 2 === 0;
        compteur++;
        return { chemin, largeurPx: portrait ? 1200 : 1600, hauteurPx: portrait ? 1600 : 1200 };
      });
      return { texte, photos };
    });
    const corps = assemblerFragments(fragmentsAssembles);
    const source = genererSourceTypst(corps, { titre: "Test pagination" });
    const resultat = compiler.compile({ mainFileContent: source });
    return { compiler, resultat, nbPhotosTotal: compteur };
  }

  it.each([1, 2, 3, 6])(
    "ne perd aucune des %i photos sur un fragment NON-PREMIER avec un texte long",
    (nbPhotos) => {
      const { compiler, resultat, nbPhotosTotal } = compilerAvecPhotos([
        { texte: "Un tout petit premier souvenir.", nbPhotos: 0 },
        { texte: texteLong, nbPhotos },
      ]);
      expect(resultat.hasError()).toBe(false);
      const pdf = Buffer.from(compiler.pdf(resultat.result!));
      expect(compterImagesPdf(pdf)).toBe(nbPhotosTotal);
      expect(nbPhotosTotal).toBe(nbPhotos);
    }
  );

  it("un fragment à 6 photos + texte long produit le même nombre de pages qu'il soit premier ou non (parité, bug du 23/09/2026)", () => {
    const premier = compilerAvecPhotos([{ texte: texteLong, nbPhotos: 6 }]);
    const nonPremier = compilerAvecPhotos([
      { texte: "Un tout petit premier souvenir.", nbPhotos: 0 },
      { texte: texteLong, nbPhotos: 6 },
    ]);
    expect(premier.resultat.hasError()).toBe(false);
    expect(nonPremier.resultat.hasError()).toBe(false);

    const pagesPremier = premier.resultat.result!.numOfPages;
    const pagesNonPremier = nonPremier.resultat.result!.numOfPages;
    // Avant le correctif : 4 pages avec ce contenu en premier fragment,
    // contre seulement 2 pages avec perte massive de contenu en second
    // fragment (cas mesuré pendant la validation) — le second fragment
    // n'a plus le droit de nécessiter MOINS de pages que le même contenu
    // en premier, alors qu'il porte en plus un petit fragment initial.
    expect(pagesNonPremier).toBeGreaterThanOrEqual(pagesPremier);

    const pdfPremier = Buffer.from(premier.compiler.pdf(premier.resultat.result!));
    const pdfNonPremier = Buffer.from(nonPremier.compiler.pdf(nonPremier.resultat.result!));
    expect(compterImagesPdf(pdfPremier)).toBe(6);
    expect(compterImagesPdf(pdfNonPremier)).toBe(6);
  });

  it("plusieurs fragments consécutifs avec photos ne perdent aucun contenu (3 + 2 + 6 photos)", () => {
    const { compiler, resultat, nbPhotosTotal } = compilerAvecPhotos([
      { texte: "Premier souvenir, court.", nbPhotos: 0 },
      { texte: texteLong, nbPhotos: 3 },
      { texte: "Un souvenir court avec deux photos.", nbPhotos: 2 },
      { texte: texteLong, nbPhotos: 6 },
      { texte: "Dernier souvenir, sans photo.", nbPhotos: 0 },
    ]);
    expect(resultat.hasError()).toBe(false);
    expect(nbPhotosTotal).toBe(11);
    const pdf = Buffer.from(compiler.pdf(resultat.result!));
    expect(compterImagesPdf(pdf)).toBe(11);
  });

  it("le séparateur reste sticky (rattaché au contenu suivant) et le bloc n'est plus breakable: false", () => {
    const corps = assemblerFragments([
      { texte: "Premier fragment.", photos: [] },
      { texte: "Second fragment.", photos: [] },
    ]);
    expect(corps).toContain("sticky: true");
    expect(corps).not.toContain("breakable: false");
  });

  it("texte court sans photo sur un fragment non-premier : comportement inchangé (pas de régression)", () => {
    const { resultat } = compilerAvecPhotos([
      { texte: "Premier souvenir.", nbPhotos: 0 },
      { texte: "Un petit souvenir, bref et simple.", nbPhotos: 0 },
    ]);
    expect(resultat.hasError()).toBe(false);
    expect(resultat.result!.numOfPages).toBe(1);
  });
});
