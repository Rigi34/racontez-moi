import { describe, it, expect, vi, afterEach } from "vitest";
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import QRCode from "qrcode";
import { voixChoisieActive, extensionAudio, genererJeton, jetonValide, urlEcoute } from "./voix";
import { qrSvg } from "./qr";
import { assemblerFragments, genererLivreTypst } from "./typst";

afterEach(() => vi.unstubAllEnvs());

describe("lib/voix", () => {
  it("l'interrupteur est coupé par défaut et ne s'active qu'avec « 1 »", () => {
    vi.stubEnv("NEXT_PUBLIC_VOIX_CHOISIE", "");
    expect(voixChoisieActive()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_VOIX_CHOISIE", "true");
    expect(voixChoisieActive()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_VOIX_CHOISIE", "1");
    expect(voixChoisieActive()).toBe(true);
  });

  it("reconnaît les formats des navigateurs (Safari en mp4) et refuse le reste", () => {
    expect(extensionAudio("audio/webm;codecs=opus")).toBe("webm");
    expect(extensionAudio("audio/mp4")).toBe("m4a");
    expect(extensionAudio("image/png")).toBeNull();
  });

  it("génère des jetons de 128 bits, valides et tous différents", () => {
    const jetons = new Set(Array.from({ length: 500 }, genererJeton));
    expect(jetons.size).toBe(500);
    for (const j of jetons) expect(jetonValide(j)).toBe(true);
    expect(jetonValide("../../etc/passwd")).toBe(false);
  });

  it("imprime toujours l'adresse publique durable par défaut", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(urlEcoute("AbCdEfGhIjKlMnOpQrStUv")).toBe("https://racontez-moi.com/v/AbCdEfGhIjKlMnOpQrStUv");
  });
});

describe("QR code dans le livre", () => {
  it("le SVG reproduit exactement la matrice QR (aucun module perdu)", () => {
    const url = "https://racontez-moi.com/v/AbCdEfGhIjKlMnOpQrStUv";
    const { modules } = QRCode.create(url, { errorCorrectionLevel: "M" });
    let sombres = 0;
    for (let y = 0; y < modules.size; y++) for (let x = 0; x < modules.size; x++) if (modules.get(y, x)) sombres++;
    expect((qrSvg(url).match(/h1v1h-1z/g) ?? []).length).toBe(sombres);
  });

  it("compile un livre avec un QR code en fin de souvenir, l'adresse imprimée en clair", () => {
    const c = NodeCompiler.create();
    const url = "https://racontez-moi.com/v/AbCdEfGhIjKlMnOpQrStUv";
    c.mapShadow(`${process.cwd()}/__shadow_voix__/test.svg`, Buffer.from(qrSvg(url)));
    const corps = assemblerFragments([{ texte: "Un souvenir raconté.", photos: [], qrVoix: { chemin: "/__shadow_voix__/test.svg", url } }]);
    expect(corps).toContain("racontez-moi.com/v/AbCdEfGhIjKlMnOpQrStUv");
    expect(corps).toContain("Écouter ce souvenir de vive voix");
    const source = genererLivreTypst([{ titre: "Racines", photoOuverture: null, corps }], { titre: "Mes Mémoires" });
    const r = c.compile({ mainFileContent: source });
    expect(r.hasError()).toBe(false);
  });

  it("aucun QR quand le fragment n'a pas d'extrait", () => {
    expect(assemblerFragments([{ texte: "Sans voix.", photos: [] }])).not.toContain("vive voix");
  });
});
