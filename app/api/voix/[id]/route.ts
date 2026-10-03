import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { BUCKET_VOIX, voixChoisieActive } from "@/lib/voix";

// Suppression d'un extrait de voix par son propriétaire : le fichier puis la
// ligne. Le QR code éventuellement imprimé ne renverra plus rien (404).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!voixChoisieActive()) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { data: extrait } = await supabase
    .from("extraits_voix")
    .select("chemin_stockage")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!extrait) return NextResponse.json({ error: "Extrait introuvable." }, { status: 404 });

  const { error: erreurStockage } = await supabase.storage.from(BUCKET_VOIX).remove([extrait.chemin_stockage]);
  if (erreurStockage) return NextResponse.json({ error: "Échec de la suppression." }, { status: 500 });
  const { error } = await supabase.from("extraits_voix").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Échec de la suppression." }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// Active ou désactive l'écoute publique par QR code sans supprimer l'extrait.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!voixChoisieActive()) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const corps = await req.json().catch(() => null);
  if (typeof corps?.actif !== "boolean") return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const { data, error } = await supabase
    .from("extraits_voix")
    .update({ actif: corps.actif })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, actif")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Échec de la mise à jour." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Extrait introuvable." }, { status: 404 });
  return NextResponse.json({ extrait: data });
}
