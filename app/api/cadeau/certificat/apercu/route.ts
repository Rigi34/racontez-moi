import { NextRequest, NextResponse } from "next/server";
import { compilerCertificatImage } from "@/lib/certificat";

// Aperçu avant paiement — génère le même visuel que le vrai certificat,
// à partir des champs du formulaire directement (pas de ligne codes_cadeau
// à ce stade, aucun code réel n'existe encore). Le code affiché est un
// espace réservé, jamais un vrai code d'activation.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const destinataire = params.get("destinataire")?.trim().slice(0, 100);
  const offrant = params.get("offrant")?.trim().slice(0, 100);
  const message = params.get("message")?.trim().slice(0, 500) || null;

  if (!destinataire || !offrant) {
    return NextResponse.json({ error: "Prénom du destinataire et nom de l'offrant requis." }, { status: 400 });
  }

  const png = await compilerCertificatImage({
    destinatairePrenom: destinataire,
    offrantNom: offrant,
    message,
    code: "XXXX-XXXX",
  });

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
