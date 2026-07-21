import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const [sessions, fragments, toursConversation, profilNarrateur, abonnement] = await Promise.all([
    supabase.from("sessions").select("*").eq("user_id", user.id),
    supabase.from("fragments").select("id, session_id, texte, statut, created_at").eq("user_id", user.id),
    supabase.from("tours_conversation").select("*").eq("user_id", user.id),
    supabase.from("profil_narrateur").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("abonnements").select("status, created_at").eq("user_id", user.id).maybeSingle(),
  ]);

  const export_ = {
    exporte_le: new Date().toISOString(),
    compte: { email: user.email, cree_le: user.created_at },
    abonnement: abonnement.data,
    note_sur_les_fragments:
      "sessions[].transcript[] contient l'instantané figé de la composition d'origine (jamais modifié après coup, même après une édition ou une recomposition). fragments[].texte est la version actuelle et vivante du fragment — celle qui compte pour le livre, modifiable à tout moment depuis le tableau de bord. Les deux peuvent donc légitimement différer si le fragment a été édité ou recomposé depuis sa création.",
    sessions: sessions.data,
    fragments: fragments.data,
    tours_conversation: toursConversation.data,
    profil_narrateur: profilNarrateur.data,
  };

  return new NextResponse(JSON.stringify(export_, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="racontez-moi-export-${user.id}.json"`,
    },
  });
}
