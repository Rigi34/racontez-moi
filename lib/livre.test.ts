import { describe, it, expect } from "vitest";
import { deflateSync } from "node:zlib";
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { organiserEnChapitres, convientPleinePage, aptitudePleinePage, TITRES_CHAPITRES } from "./livre";
import { assemblerFragments, genererLivreTypst, largeurTexteMm, DPI_MIN_FLUX } from "./typst";

const photo = (chemin: string, largeurPx: number, hauteurPx: number) => ({ chemin, largeurPx, hauteurPx });

describe("organiserEnChapitres", () => {
  it("groupe par section de vie, dans l'ordre éditorial, le bilan (O) en dernier", () => {
    const chapitres = organiserEnChapitres([
      { texte: "Bilan.", section: "O", photos: [] },
      { texte: "Mariage.", section: "E", photos: [] },
      { texte: "Première séance.", section: null, photos: [] },
      { texte: "Lignée.", section: "P", photos: [] },
      { texte: "Enfance.", section: "B", photos: [] },
    ]);
    expect(chapitres.map((c) => c.section)).toEqual(["A", "B", "E", "P", "O"]);
    expect(chapitres[0].titre).toBe(TITRES_CHAPITRES.A);
  });

  it("conserve l'ordre d'enregistrement à l'intérieur d'un chapitre et ne modifie jamais le texte", () => {
    const chapitres = organiserEnChapitres([
      { texte: "Premier souvenir d'enfance.", section: "B", photos: [] },
      { texte: "Un mariage.", section: "E", photos: [] },
      { texte: "Second souvenir d'enfance.", section: "B", photos: [] },
    ]);
    expect(chapitres[0].fragments.map((f) => f.texte)).toEqual(["Premier souvenir d'enfance.", "Second souvenir d'enfance."]);
  });

  it("une section inconnue retombe sur le chapitre A plutôt que de perdre le fragment", () => {
    const chapitres = organiserEnChapitres([{ texte: "x", section: "Z", photos: [] }]);
    expect(chapitres).toHaveLength(1);
    expect(chapitres[0].section).toBe("A");
  });

  it("retient au plus une photo d'ouverture par chapitre, la retire du flux, et garde toutes les autres", () => {
    const grande = photo("/hd.jpg", 3000, 4000);
    const petite = photo("/petite.jpg", 1000, 1300);
    const [chapitre] = organiserEnChapitres([{ texte: "x", section: "A", photos: [petite, grande] }]);
    expect(chapitre.photoOuverture).toBe(grande);
    expect(chapitre.fragments[0].photos).toEqual([petite]);
  });

  it("aucune photo d'ouverture si aucune ne supporte la pleine page", () => {
    const [chapitre] = organiserEnChapitres([
      { texte: "x", section: "A", photos: [photo("/petite.jpg", 1000, 1300), photo("/paysage.jpg", 4000, 3000)] },
    ]);
    expect(chapitre.photoOuverture).toBeNull();
    expect(chapitre.fragments[0].photos).toHaveLength(2);
  });
});

describe("convientPleinePage", () => {
  it("refuse une photo trop peu définie (jamais d'agrandissement artificiel)", () => {
    expect(aptitudePleinePage(photo("/a.jpg", 1200, 1600)).dpi).toBeLessThan(280);
    expect(convientPleinePage(photo("/a.jpg", 1200, 1600))).toBe(false);
  });

  it("refuse une photo paysage, même très définie (recadrage excessif)", () => {
    expect(convientPleinePage(photo("/a.jpg", 6000, 4000))).toBe(false);
  });

  it("accepte une photo portrait de smartphone récente (3024 × 4032)", () => {
    expect(convientPleinePage(photo("/a.jpg", 3024, 4032))).toBe(true);
  });
});

describe("tailles des photos dans le flux", () => {
  it("n'imprime jamais une photo en dessous de la résolution minimale", () => {
    const corps = assemblerFragments([{ texte: "x", photos: [photo("/petite.png", 448, 336)] }], {
      largeurTexteMm: largeurTexteMm(20),
    });
    const hauteur = Number(corps.match(/height: ([\d.]+)mm/)![1]);
    expect(hauteur).toBeLessThanOrEqual((336 / DPI_MIN_FLUX) * 25.4 + 0.1);
  });

  it("une photo paysage bien définie prend la largeur du texte", () => {
    const largeur = largeurTexteMm(20);
    const corps = assemblerFragments([{ texte: "x", photos: [photo("/hd.png", 3000, 2000)] }], { largeurTexteMm: largeur });
    const hauteur = Number(corps.match(/height: ([\d.]+)mm/)![1]);
    expect(hauteur * 1.5).toBeCloseTo(largeur, 0);
  });
});

describe("genererLivreTypst (compilation réelle)", () => {
  function png(r: number, g: number, b: number): Buffer {
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(1, 0);
    ihdr.writeUInt32BE(1, 4);
    ihdr[8] = 8;
    ihdr[9] = 2;
    const chunk = (type: string, data: Buffer) => {
      const len = Buffer.alloc(4);
      len.writeUInt32BE(data.length, 0);
      const typeBuf = Buffer.from(type, "ascii");
      let crc = 0xffffffff;
      for (const byte of Buffer.concat([typeBuf, data])) {
        crc ^= byte;
        for (let k = 0; k < 8; k++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
      }
      const crcBuf = Buffer.alloc(4);
      crcBuf.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 0);
      return Buffer.concat([len, typeBuf, data, crcBuf]);
    };
    return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(Buffer.from([0, r, g, b]))), chunk("IEND", Buffer.alloc(0))]);
  }
  const compterImagesPdf = (pdf: Buffer) => (pdf.toString("latin1").match(/\/Subtype ?\/Image/g) ?? []).length;
  const texte = Array(5).fill("Un souvenir assez long pour remplir une partie de page, raconté avec des détails.").join("\n\n");

  function compiler(sections: { section: string; photos: [number, number][] }[]) {
    const c = NodeCompiler.create();
    let n = 0;
    const fragments = sections.map(({ section, photos }) => ({
      texte,
      section,
      photos: photos.map(([w, h]) => {
        const chemin = `/livre${n}.png`;
        c.mapShadow(`${process.cwd()}${chemin}`, png(10 + n * 20, 10, 10));
        n++;
        return photo(chemin, w, h);
      }),
    }));
    const chapitres = organiserEnChapitres(fragments);
    const source = genererLivreTypst(
      chapitres.map((ch) => ({ titre: ch.titre, photoOuverture: ch.photoOuverture, corps: assemblerFragments(ch.fragments) })),
      { titre: "Mes Mémoires", sousTitre: "Un sous-titre" }
    );
    const resultat = c.compile({ mainFileContent: source });
    return { c, resultat, nbPhotos: n };
  }

  it("compile un livre à plusieurs chapitres, se termine sur une page paire, sans perdre aucune photo", () => {
    const { c, resultat, nbPhotos } = compiler([
      { section: "A", photos: [[3024, 4032], [1600, 1200]] },
      { section: "B", photos: [] },
      { section: "E", photos: [[1200, 1600], [1200, 1600], [1600, 1200]] },
    ]);
    expect(resultat.hasError()).toBe(false);
    expect(resultat.result!.numOfPages % 2).toBe(0);
    const pdf = Buffer.from(c.pdf(resultat.result!));
    expect(compterImagesPdf(pdf)).toBe(nbPhotos);
  });

  it("compile un livre à un seul chapitre (ni sommaire ni numéro de chapitre)", () => {
    const { resultat } = compiler([{ section: "A", photos: [] }]);
    expect(resultat.hasError()).toBe(false);
    expect(resultat.result!.numOfPages % 2).toBe(0);
  });

  it("compose une page de citation en face d'une ouverture sans photo, guillemets et markup sûrs", () => {
    const c = NodeCompiler.create();
    const source = genererLivreTypst(
      [
        { titre: "Racines", photoOuverture: null, corps: "x", citation: "Je n'ai commencé d'avoir des souvenirs que fort tard; [vraiment] *tard*." },
        { titre: "Enfance", photoOuverture: null, corps: "y" },
      ],
      { titre: "Mes Mémoires" }
    );
    expect(source).toContain("souvenirs que fort tard");
    const resultat = c.compile({ mainFileContent: source });
    expect(resultat.hasError()).toBe(false);
    expect(resultat.result!.numOfPages % 2).toBe(0);
  });

  it("échappe le markup dans le titre et le sous-titre du livre", () => {
    const c = NodeCompiler.create();
    const source = genererLivreTypst([{ titre: "Racines", photoOuverture: null, corps: "x" }], {
      titre: 'Titre [spécial] # "guillemets" \\ fin',
      sousTitre: "Sous-titre <test> *",
    });
    expect(c.compile({ mainFileContent: source }).hasError()).toBe(false);
  });
});
