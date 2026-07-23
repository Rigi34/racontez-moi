import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { data } = await supabase
    .from("adresses_livraison")
    .select("nom, adresse, ville, code_postal, pays, telephone")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ adresse: data ?? null });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: { nom?: string; adresse?: string; ville?: string; code_postal?: string; pays?: string; telephone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { nom, adresse, ville, code_postal, telephone } = body;
  if (!nom?.trim() || !adresse?.trim() || !ville?.trim() || !code_postal?.trim() || !telephone?.trim()) {
    return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
  }

  const { error } = await supabase.from("adresses_livraison").upsert(
    {
      user_id: user.id,
      nom: nom.trim(),
      adresse: adresse.trim(),
      ville: ville.trim(),
      code_postal: code_postal.trim(),
      pays: body.pays?.trim() || "FR",
      telephone: telephone.trim(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return NextResponse.json({ error: "Échec de l'enregistrement." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
