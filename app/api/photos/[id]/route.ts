import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { data: photo } = await supabase.from("photos").select("chemin_stockage").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!photo) return NextResponse.json({ error: "Photo introuvable." }, { status: 404 });

  await supabase.storage.from("photos").remove([photo.chemin_stockage]);
  const { error } = await supabase.from("photos").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Échec de la suppression." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
