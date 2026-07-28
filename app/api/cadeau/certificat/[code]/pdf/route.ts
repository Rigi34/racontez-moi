import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { compilerCertificatPdf } from "@/lib/certificat";

// Le code lui-même sert de clé d'accès (comme une carte cadeau physique) —
// pas d'authentification requise, cf. codes_cadeau (migration 0015).
const supabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

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
