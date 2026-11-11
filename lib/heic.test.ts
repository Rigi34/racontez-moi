import { describe, it, expect } from "vitest";
import { signatureHeif, nomOuTypeHeif, nomEnJpg, estHeif } from "./heic";

function entete(marque: string): Uint8Array<ArrayBuffer> {
  const octets = new Uint8Array(12);
  octets.set([0, 0, 0, 0x18], 0);
  octets.set([..."ftyp"].map((c) => c.charCodeAt(0)), 4);
  octets.set([...marque].map((c) => c.charCodeAt(0)), 8);
  return octets;
}

describe("détection HEIC/HEIF", () => {
  it("reconnaît les marques des photos d'iPhone", () => {
    expect(signatureHeif(entete("heic"))).toBe(true);
    expect(signatureHeif(entete("mif1"))).toBe(true);
    expect(signatureHeif(entete("hevc"))).toBe(true);
  });

  it("ne confond pas avec un JPEG, un MP4 ou un fichier trop court", () => {
    expect(signatureHeif(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(false);
    expect(signatureHeif(entete("isom"))).toBe(false);
    expect(signatureHeif(new Uint8Array([0, 0, 0]))).toBe(false);
  });

  it("se fie au type ou à l'extension quand ils sont présents", () => {
    expect(nomOuTypeHeif("IMG_0042.HEIC", "")).toBe(true);
    expect(nomOuTypeHeif("photo", "image/heif")).toBe(true);
    expect(nomOuTypeHeif("photo.jpg", "image/jpeg")).toBe(false);
  });

  it("lit l'en-tête quand le navigateur ne donne aucun type", async () => {
    const heic = new File([entete("heic")], "sans-extension", { type: "" });
    const jpeg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "photo.jpg", { type: "image/jpeg" });
    expect(await estHeif(heic)).toBe(true);
    expect(await estHeif(jpeg)).toBe(false);
  });

  it("renomme en .jpg", () => {
    expect(nomEnJpg("IMG_0042.HEIC")).toBe("IMG_0042.jpg");
    expect(nomEnJpg("vacances.été.heif")).toBe("vacances.été.jpg");
    expect(nomEnJpg(".heic")).toBe("photo.jpg");
  });
});
