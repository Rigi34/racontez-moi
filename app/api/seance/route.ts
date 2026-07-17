import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import { QUESTION_INITIALE, construireSystemRelance, SYSTEM_FRAGMENT } from "@/lib/prompts";
import { embedText } from "@/lib/embeddings";
import { retrieverTechniques } from "@/lib/retrieval";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type TranscriptEntry = { role: string; text: string };

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { data } = await supabase
    .from("sessions")
    .select("id, transcript, started_at")
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ session: data ?? null });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: {
    step: string;
    session_id?: string;
    reponse?: string;
    reponseRelance?: string;
    fresh?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { step } = body;

  if (step === "start") {
    const { data: existing } = await supabase
      .from("sessions")
      .select("id, transcript, started_at")
      .eq("user_id", user.id)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && !body.fresh) return NextResponse.json({ session_id: existing.id });

    if (existing && body.fresh) {
      // Séance précédente abandonnée sans fragment — on la clôture pour qu'elle
      // n'apparaisse plus comme reprenable, sans lui attribuer de fragment.
      await supabase
        .from("sessions")
        .update({ status: "completed", ended_at: new Date().toISOString() })
        .eq("id", existing.id);
    }

    const { data: created, error } = await supabase
      .from("sessions")
      .insert({ user_id: user.id })
      .select("id")
      .single();

    if (error || !created) {
      return NextResponse.json({ error: "Impossible de démarrer la séance." }, { status: 500 });
    }
    return NextResponse.json({ session_id: created.id });
  }

  if (step === "relance") {
    const { session_id, reponse } = body;
    if (!session_id || !reponse?.trim()) {
      return NextResponse.json({ error: "Réponse manquante." }, { status: 400 });
    }

    const { data: session } = await supabase
      .from("sessions")
      .select("id, transcript, status")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!session || session.status !== "in_progress") {
      return NextResponse.json({ error: "Séance introuvable." }, { status: 404 });
    }

    const techniques = await retrieverTechniques(supabase, reponse, "type_question", 3);

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 80,
      system: construireSystemRelance(techniques.map((t) => t.texte)),
      messages: [{ role: "user", content: reponse }],
    });

    const relance = (message.content[0] as { type: string; text: string }).text.trim();

    const transcript: TranscriptEntry[] = [
      ...(session.transcript ?? []),
      { role: "narrateur", text: reponse },
      { role: "relance", text: relance },
    ];

    await supabase.from("sessions").update({ transcript }).eq("id", session_id);

    return NextResponse.json({ relance });
  }

  if (step === "fragment") {
    const { session_id, reponse, reponseRelance } = body;
    if (!session_id || !reponse?.trim() || !reponseRelance?.trim()) {
      return NextResponse.json({ error: "Réponses manquantes." }, { status: 400 });
    }

    const { data: session } = await supabase
      .from("sessions")
      .select("id, transcript, status")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!session || session.status !== "in_progress") {
      return NextResponse.json({ error: "Séance introuvable." }, { status: 404 });
    }

    // Recherche des fragments passés du même narrateur pour donner à Sonnet
    // du fil (continuité inter-séances) — silencieux si pas d'embedding dispo.
    let contexteMemoire = "";
    const embeddingRequete = await embedText(`${reponse} ${reponseRelance}`);
    if (embeddingRequete) {
      const { data: souvenirs } = await supabase.rpc("match_fragments", {
        query_embedding: embeddingRequete,
        match_user_id: user.id,
        match_count: 3,
      });
      if (souvenirs?.length) {
        contexteMemoire = `\n\nFragments d'une séance précédente, pour mémoire (ne les répète pas, tisse un lien si naturel, sinon ignore-les) :\n${souvenirs
          .map((s: { texte: string }) => `— ${s.texte}`)
          .join("\n")}`;
      }
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      system: SYSTEM_FRAGMENT,
      messages: [
        {
          role: "user",
          content: `Question : ${QUESTION_INITIALE}\n\nRéponse initiale : ${reponse}\n\nRelance et réponse : ${reponseRelance}${contexteMemoire}`,
        },
      ],
    });

    const fragment = (message.content[0] as { type: string; text: string }).text.trim();
    const embeddingFragment = await embedText(fragment);

    const transcript: TranscriptEntry[] = [
      ...(session.transcript ?? []),
      { role: "narrateur", text: reponseRelance },
      { role: "fragment", text: fragment },
    ];

    await supabase.from("fragments").insert({
      session_id,
      user_id: user.id,
      texte: fragment,
      embedding: embeddingFragment,
    });

    await supabase
      .from("sessions")
      .update({ transcript, status: "completed", ended_at: new Date().toISOString() })
      .eq("id", session_id);

    return NextResponse.json({ fragment });
  }

  return NextResponse.json({ error: "Étape inconnue." }, { status: 400 });
}
