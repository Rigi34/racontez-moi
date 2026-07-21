import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { embedText } from "@/lib/embeddings";

const STATUTS_VALIDES = ["brouillon", "valide", "a_revoir"];

// Édition directe + validation légère (décision du 20 juillet 2026) : le
// narrateur peut corriger son texte, ou juste signaler "ça me ressemble" /
// "à revoir" sans y toucher. Toute édition de texte remet le statut à
// "brouillon" si la requête ne fixe pas explicitement un nouveau statut —
// le contenu a changé, il redevient à confirmer.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: { texte?: string; statut?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const updates: { texte?: string; statut?: string; embedding?: number[] | null } = {};

  if (typeof body.texte === "string" && body.texte.trim()) {
    updates.texte = body.texte.trim();
    updates.embedding = await embedText(updates.texte);
  }

  if (body.statut && STATUTS_VALIDES.includes(body.statut)) {
    updates.statut = body.statut;
  } else if (updates.texte) {
    updates.statut = "brouillon";
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Rien à mettre à jour." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("fragments")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, texte, statut")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Fragment introuvable." }, { status: 404 });
  }

  return NextResponse.json({ fragment: data });
}
