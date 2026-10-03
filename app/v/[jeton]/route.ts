import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { BUCKET_VOIX, jetonValide, voixChoisieActive } from "@/lib/voix";
import { extraireIp, verifierQuotaAnonyme } from "@/lib/rate-limit";

// Écoute publique d'un extrait de voix depuis le QR code imprimé dans le
// livre (chantier VOIX-CHOISIE). Posséder le livre donne l'accès : aucune
// connexion. Sécurité :
// - le jeton est un secret de 128 bits, vérifié par format avant toute
//   requête en base ;
// - la lecture passe par le service role (aucune policy publique sur la
//   table ni sur le bucket), limitée à UNE ligne active par jeton ;
// - le fichier est servi par une URL signée de 10 minutes, jamais par une
//   adresse de stockage permanente ;
// - plafond quotidien par IP contre l'énumération et l'abus de bande passante.

function introuvable() {
  return new NextResponse(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Racontez-moi</title></head><body style="font-family:Georgia,serif;background:#FAF8F3;color:#242220;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px;text-align:center"><p>Cet enregistrement n'est plus disponible.</p></body></html>`,
    { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ jeton: string }> }) {
  if (!voixChoisieActive()) return introuvable();
  const { jeton } = await params;
  if (!jetonValide(jeton)) return introuvable();

  const service = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  let autorise: boolean;
  try {
    autorise = await verifierQuotaAnonyme(service, extraireIp(req), "ecoute_voix");
  } catch (e) {
    console.error("Quota écoute voix indisponible:", e);
    return new NextResponse("Service momentanément indisponible.", { status: 503 });
  }
  if (!autorise) return new NextResponse("Trop de demandes, réessayez demain.", { status: 429 });

  const { data: extrait } = await service
    .from("extraits_voix")
    .select("chemin_stockage")
    .eq("jeton", jeton)
    .eq("actif", true)
    .maybeSingle();
  if (!extrait) return introuvable();

  const { data: signe } = await service.storage.from(BUCKET_VOIX).createSignedUrl(extrait.chemin_stockage, 600);
  if (!signe?.signedUrl) return introuvable();

  return NextResponse.redirect(signe.signedUrl, { status: 302, headers: { "Cache-Control": "no-store" } });
}
