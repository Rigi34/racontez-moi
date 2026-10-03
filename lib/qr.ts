import QRCode from "qrcode";

// QR code en SVG, généré de façon SYNCHRONE (la compilation Typst du livre est
// synchrone) à partir de la matrice de la bibliothèque `qrcode` (MIT).
// Correction d'erreur « M » (15 %) : bon compromis entre robustesse à
// l'impression et taille ; zone de silence de 4 modules, exigée par la norme
// pour une lecture fiable par les téléphones.
export function qrSvg(texte: string): string {
  const { modules } = QRCode.create(texte, { errorCorrectionLevel: "M" });
  const n = modules.size;
  const marge = 4;
  const total = n + 2 * marge;
  let chemin = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (modules.get(y, x)) chemin += `M${x + marge} ${y + marge}h1v1h-1z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="#fff"/><path d="${chemin}" fill="#000"/></svg>`;
}
