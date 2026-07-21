import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import { QUESTION_INITIALE, construireSystemRelance, construireSystemOuverture } from "@/lib/prompts";
import { embedText } from "@/lib/embeddings";
import { retrieverTechniques } from "@/lib/retrieval";
import { lireProfil, resumerProfilPourPrompt, mettreAJourProfil } from "@/lib/profil-narrateur";
import { composerFragment, genererResumeSession } from "@/lib/redaction";

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
    reponseRelance2?: string;
    fresh?: boolean;
    duree_silence_ms?: number | null;
    chunks_rag_utilises?: string[];
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

    if (existing && !body.fresh) {
      return NextResponse.json({ session_id: existing.id, question: QUESTION_INITIALE });
    }

    if (existing && body.fresh) {
      // Séance précédente abandonnée sans fragment — on la clôture pour qu'elle
      // n'apparaisse plus comme reprenable, sans lui attribuer de fragment.
      await supabase
        .from("sessions")
        .update({ status: "completed", ended_at: new Date().toISOString() })
        .eq("id", existing.id);
    }

    // La question fixe ne sert qu'à la toute première séance d'un narrateur
    // (aucun fragment produit jusqu'ici) — au-delà, question d'ouverture
    // générée dynamiquement pour ne jamais reposer la même (cf. profil
    // narrateur + résumé de la dernière séance), cohérent avec les relances.
    const { count: nombreFragments } = await supabase
      .from("fragments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    let question = QUESTION_INITIALE;
    if ((nombreFragments ?? 0) > 0) {
      const [profil, derniereSession] = await Promise.all([
        lireProfil(supabase, user.id),
        supabase
          .from("sessions")
          .select("resume_session")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .not("resume_session", "is", null)
          .order("ended_at", { ascending: false })
          .limit(1)
          .maybeSingle()
          .then((r) => r.data),
      ]);

      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 60,
        system: construireSystemOuverture(resumerProfilPourPrompt(profil), derniereSession?.resume_session ?? ""),
        messages: [{ role: "user", content: "Génère la question d'ouverture de cette nouvelle séance." }],
      });
      question = (message.content[0] as { type: string; text: string }).text.trim();
    }

    const { data: created, error } = await supabase
      .from("sessions")
      .insert({ user_id: user.id, question_ouverture: question })
      .select("id")
      .single();

    if (error || !created) {
      return NextResponse.json({ error: "Impossible de démarrer la séance." }, { status: 500 });
    }
    return NextResponse.json({ session_id: created.id, question });
  }

  if (step === "relance") {
    const { session_id, reponse } = body;
    if (!session_id || !reponse?.trim()) {
      return NextResponse.json({ error: "Réponse manquante." }, { status: 400 });
    }

    const { data: session } = await supabase
      .from("sessions")
      .select("id, transcript, status, question_ouverture")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!session || session.status !== "in_progress") {
      return NextResponse.json({ error: "Séance introuvable." }, { status: 404 });
    }

    const [techniques, profil, derniereSession] = await Promise.all([
      retrieverTechniques(supabase, reponse, "type_question", 3),
      lireProfil(supabase, user.id),
      supabase
        .from("sessions")
        .select("resume_session")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .not("resume_session", "is", null)
        .order("ended_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then((r) => r.data),
    ]);

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 80,
      system: construireSystemRelance(
        techniques.map((t) => t.texte),
        resumerProfilPourPrompt(profil),
        derniereSession?.resume_session ?? ""
      ),
      messages: [{ role: "user", content: reponse }],
    });

    const relance = (message.content[0] as { type: string; text: string }).text.trim();

    const transcript: TranscriptEntry[] = [
      ...(session.transcript ?? []),
      { role: "narrateur", text: reponse },
      { role: "relance", text: relance },
    ];

    await supabase.from("sessions").update({ transcript }).eq("id", session_id);

    // Tour 1 : la question d'ouverture (fixe pour la 1ère séance, générée
    // dynamiquement ensuite — cf. étape "start"), pas de RAG ici, on trace
    // juste la réponse et le silence qui l'a précédée.
    await supabase.from("tours_conversation").insert({
      session_id,
      user_id: user.id,
      tour_index: 0,
      question: session.question_ouverture ?? QUESTION_INITIALE,
      reponse_brute: reponse,
      duree_silence_ms: body.duree_silence_ms ?? null,
      chunks_rag_utilises: null,
    });

    return NextResponse.json({ relance, chunks_rag_utilises: techniques.map((t) => t.id) });
  }

  if (step === "relance2") {
    // Deuxième relance — correctif rapide du 15 juillet (transmission Le
    // Révélateur, section 2.4) : une seule relance donnait des séances trop
    // courtes. Ce n'est qu'une étape transitoire, pas encore le vrai moteur
    // de session à clôture naturelle (Session 3 du system prompt).
    const { session_id, reponseRelance, chunks_rag_utilises: chunksRelance1 } = body;
    if (!session_id || !reponseRelance?.trim()) {
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

    const relance1 = session.transcript?.find((e: TranscriptEntry) => e.role === "relance")?.text ?? "";

    const [techniques, profil, derniereSession] = await Promise.all([
      retrieverTechniques(supabase, reponseRelance, "type_question", 3),
      lireProfil(supabase, user.id),
      supabase
        .from("sessions")
        .select("resume_session")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .not("resume_session", "is", null)
        .order("ended_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then((r) => r.data),
    ]);

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 80,
      system: construireSystemRelance(
        techniques.map((t) => t.texte),
        resumerProfilPourPrompt(profil),
        derniereSession?.resume_session ?? ""
      ),
      messages: [{ role: "user", content: reponseRelance }],
    });

    const relance2 = (message.content[0] as { type: string; text: string }).text.trim();

    const transcript: TranscriptEntry[] = [
      ...(session.transcript ?? []),
      { role: "narrateur", text: reponseRelance },
      { role: "relance", text: relance2 },
    ];

    await supabase.from("sessions").update({ transcript }).eq("id", session_id);

    // Tour 1 : la question posée est la première relance, avec les chunks
    // RAG qui ont servi à la formuler (retournés par l'étape "relance").
    await supabase.from("tours_conversation").insert({
      session_id,
      user_id: user.id,
      tour_index: 1,
      question: relance1,
      reponse_brute: reponseRelance,
      duree_silence_ms: body.duree_silence_ms ?? null,
      chunks_rag_utilises: chunksRelance1?.length ? chunksRelance1 : null,
    });

    return NextResponse.json({ relance: relance2, chunks_rag_utilises: techniques.map((t) => t.id) });
  }

  if (step === "fragment") {
    const { session_id, reponseRelance2, chunks_rag_utilises } = body;
    if (!session_id || !reponseRelance2?.trim()) {
      return NextResponse.json({ error: "Réponse manquante." }, { status: 400 });
    }

    const { data: session } = await supabase
      .from("sessions")
      .select("id, transcript, status, question_ouverture")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!session || session.status !== "in_progress") {
      return NextResponse.json({ error: "Séance introuvable." }, { status: 404 });
    }

    // Transcript attendu à ce stade : [narrateur(réponse), relance(relance1),
    // narrateur(réponse relance1), relance(relance2)] — la réponse à
    // relance2 arrive dans cette requête, pas encore dans le transcript.
    const t = session.transcript ?? [];
    const reponse = t[0]?.text ?? "";
    const relance1 = t[1]?.text ?? "";
    const reponseRelance = t[2]?.text ?? "";
    const relance2 = t[3]?.text ?? "";

    const tours = [
      { question: session.question_ouverture ?? QUESTION_INITIALE, reponse },
      { question: relance1, reponse: reponseRelance },
      { question: relance2, reponse: reponseRelance2 },
    ];

    // Recherche des fragments passés du même narrateur pour donner à Sonnet
    // du fil (continuité inter-séances) — silencieux si pas d'embedding dispo.
    let contexteMemoire = "";
    const embeddingRequete = await embedText(`${reponse} ${reponseRelance} ${reponseRelance2}`);
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

    const fragment = await composerFragment(client, { tours, contexteMemoire });
    const embeddingFragment = await embedText(fragment);
    const resumeSession = await genererResumeSession(client, { tours }).catch((e) => {
      console.error("génération résumé de séance échouée:", e);
      return null;
    });

    const transcript: TranscriptEntry[] = [
      ...t,
      { role: "narrateur", text: reponseRelance2 },
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
      .update({
        transcript,
        status: "completed",
        ended_at: new Date().toISOString(),
        resume_session: resumeSession,
      })
      .eq("id", session_id);

    // Tour 2 : la question posée est la deuxième relance, avec les chunks
    // RAG qui ont servi à la formuler et le silence avant cette réponse-ci.
    await supabase.from("tours_conversation").insert({
      session_id,
      user_id: user.id,
      tour_index: 2,
      question: relance2,
      reponse_brute: reponseRelance2,
      duree_silence_ms: body.duree_silence_ms ?? null,
      chunks_rag_utilises: chunks_rag_utilises?.length ? chunks_rag_utilises : null,
    });

    // Mise à jour du profil narrateur (périodes/ancrages/profondeur) — ne
    // bloque pas la réponse à l'utilisateur si ça échoue, non critique.
    mettreAJourProfil(supabase, user.id, `${reponse}\n${reponseRelance}\n${reponseRelance2}\n${fragment}`).catch((e) =>
      console.error("mise à jour profil narrateur échouée:", e)
    );

    return NextResponse.json({ fragment });
  }

  return NextResponse.json({ error: "Étape inconnue." }, { status: 400 });
}
