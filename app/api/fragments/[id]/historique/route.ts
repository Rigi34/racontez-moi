import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Liste les versions précédentes d'un fragment (les plus récentes
// d'abord) — décision du 23 juillet 2026, corrige l'absence de filet lors
// d'une édition/régénération (cf. app/api/fragments/[id]/route.ts et
// .../regenerer/route.ts, qui alimentent fragments_historique).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { data, error } = await supabase
    .from("fragments_historique")
    .select("id, texte, created_at")
    .eq("fragment_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Historique introuvable." }, { status: 404 });

  return NextResponse.json({ versions: data ?? [] });
}
