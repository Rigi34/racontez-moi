import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { purgerEssaisAbandonnes } from "@/lib/purge-essais";

// Tâche quotidienne Vercel (vercel.json) : suppression des comptes d'essai
// anonymes de plus de 30 jours jamais payés (cf. lib/purge-essais.ts).
// Vercel envoie « Authorization: Bearer <CRON_SECRET> » ; sans ce secret
// configuré, la route refuse tout (fail-closed), elle n'est jamais publique.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const service = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  try {
    const bilan = await purgerEssaisAbandonnes(service);
    console.log("Purge des essais abandonnés :", bilan);
    return NextResponse.json(bilan);
  } catch (e) {
    console.error("Purge des essais abandonnés échouée:", e);
    return NextResponse.json({ error: "Échec de la purge." }, { status: 500 });
  }
}
