// Photos HEIC/HEIF (format par défaut des iPhone) — 11/11/2026.
// Le serveur n'accepte toujours que JPEG, PNG et WebP (contrôle de
// signature, audit I-3 du 27/10/2026) : une photo HEIC est convertie en JPEG
// dans le navigateur, avant l'envoi. La bibliothèque de conversion (heic-to,
// libheif en WebAssembly, ~3 Mo) n'est chargée que si une photo HEIC est
// choisie. Les iPhone convertissent souvent d'eux-mêmes depuis la galerie ;
// ce chemin couvre le dossier « Fichiers », les Mac, PC et Android.

// Marques ISOBMFF des fichiers HEIF/HEIC (octets 8 à 11, après « ftyp »).
const MARQUES_HEIF = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"]);

export function signatureHeif(octets: Uint8Array): boolean {
  if (octets.length < 12) return false;
  const texte = (debut: number) => String.fromCharCode(...octets.slice(debut, debut + 4));
  return texte(4) === "ftyp" && MARQUES_HEIF.has(texte(8));
}

export function nomOuTypeHeif(nom: string, type: string): boolean {
  return /^image\/hei[cf](-sequence)?$/i.test(type) || /\.hei[cf]$/i.test(nom);
}

export function nomEnJpg(nom: string): string {
  const base = nom.replace(/\.[^./\\]+$/, "");
  return `${base || "photo"}.jpg`;
}

export async function estHeif(fichier: File): Promise<boolean> {
  if (nomOuTypeHeif(fichier.name, fichier.type)) return true;
  // Navigateurs qui ne renseignent pas le type : on lit l'en-tête.
  if (fichier.type && fichier.type !== "application/octet-stream") return false;
  const entete = new Uint8Array(await fichier.slice(0, 12).arrayBuffer());
  return signatureHeif(entete);
}

// Qualité JPEG 0,92 : rendu d'impression sans différence visible, taille
// raisonnable (~3 à 6 Mo pour une photo d'iPhone de 12 Mpx).
export async function convertirEnJpeg(fichier: File): Promise<File> {
  const { heicTo } = await import("heic-to");
  const jpeg = await heicTo({ blob: fichier, type: "image/jpeg", quality: 0.92 });
  return new File([jpeg], nomEnJpg(fichier.name), { type: "image/jpeg" });
}
