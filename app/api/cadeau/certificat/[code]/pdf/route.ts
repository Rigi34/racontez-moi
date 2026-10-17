import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { verifierQuotaAnonyme, extraireIp } from "@/lib/rate-limit";
import { compilerCertificatPdf } from "@/lib/certificat";

// Le code lui-même sert de clé d'accès (comme une carte cadeau physique) —
// pas d'authentification requise, cf. codes_cadeau (migration 0015).
const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  // Quota quotidien par IP avant la recherche du code et toute compilation
  // (A-2026-09-12-03, 17/10/2026) — même modèle que la route sœur apercu.
  try {
    if (!(await verifierQuotaAnonyme(supabase, extraireIp(req), "certificat_code"))) {
      return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
    }
  } catch (e) {
    console.error("verifierQuotaAnonyme (certificat_code) échouée:", e);
    return NextResponse.json({ error: "Vérification impossible. Réessayez plus tard." }, { status: 500 });
  }

  const { data: ligne } = await supabase
    .from("codes_cadeau")
    .select("destinataire_prenom, offrant_nom, message")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (!ligne) return NextResponse.json({ error: "Code cadeau introuvable." }, { status: 404 });

  const pdf = compilerCertificatPdf({
    destinatairePrenom: ligne.destinataire_prenom,
    offrantNom: ligne.offrant_nom,
    message: ligne.message,
    code: code.toUpperCase(),
  });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=cadeau-racontez-moi-${code}.pdf`,
    },
  });
}
