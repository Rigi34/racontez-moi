import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import { QUESTION_INITIALE } from "@/lib/prompts";
import { composerFragment } from "@/lib/redaction";
import { embedText } from "@/lib/embeddings";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type TranscriptEntry = { role: string; text: string };

// Régénération ciblée (décision du 20 juillet 2026) : reconstruit les tours
// de la séance d'origine à partir du transcript (par rôle, pas par index
// fixe — reste compatible avec les séances d'avant le passage à 2 relances)
// et recompose via le même SYSTEM_FRAGMENT, avec l'instruction libre du
// narrateur en plus si fournie.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: { instruction?: string } = {};
  try {
    body = await req.json();
  } catch {
    // instruction optionnelle, corps vide accepté
  }

  const { data: fragment } = await supabase
    .from("fragments")
    .select("id, session_id, texte")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!fragment) return NextResponse.json({ error: "Fragment introuvable." }, { status: 404 });

  const { data: session } = await supabase
    .from("sessions")
    .select("transcript, question_ouverture")
    .eq("id", fragment.session_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!session) return NextResponse.json({ error: "Séance introuvable." }, { status: 404 });

  const t = (session.transcript ?? []) as TranscriptEntry[];
  const reponsesNarrateur = t.filter((e) => e.role === "narrateur").map((e) => e.text);
  const relances = t.filter((e) => e.role === "relance").map((e) => e.text);

  const tours = [
    { question: session.question_ouverture ?? QUESTION_INITIALE, reponse: reponsesNarrateur[0] ?? "" },
    ...relances.map((question, i) => ({ question, reponse: reponsesNarrateur[i + 1] ?? "" })),
  ];

  const fragmentRecompose = await composerFragment(client, { tours, instruction: body.instruction });
  const embedding = await embedText(fragmentRecompose);

  // Historique de versions (décision du 23 juillet 2026) : la version que
  // la régénération s'apprête à remplacer est sauvegardée avant l'écrasement.
  await supabase.from("fragments_historique").insert({ fragment_id: id, user_id: user.id, texte: fragment.texte });

  const { data: updated, error } = await supabase
    .from("fragments")
    .update({ texte: fragmentRecompose, embedding, statut: "brouillon" })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, texte, statut")
    .maybeSingle();

  if (error || !updated) {
    return NextResponse.json({ error: "Impossible d'enregistrer la recomposition." }, { status: 500 });
  }

  return NextResponse.json({ fragment: updated });
}
