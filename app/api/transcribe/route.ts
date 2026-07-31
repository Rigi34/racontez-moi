import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type SegmentGroq = {
  start: number;
  text: string;
  no_speech_prob?: number;
  compression_ratio?: number;
};

// Seuils empiriques usuels (whisper.cpp / faster-whisper) pour repérer les
// segments hallucinés par Whisper sur du silence prolongé à l'intérieur d'un
// même enregistrement continu (push-to-talk, pas de VAD en direct) : forte
// probabilité de "pas de parole" (no_speech_prob) ou texte répétitif en
// boucle (compression_ratio élevé). Filtrage volontairement conservateur —
// mieux vaut garder un segment ambigu que couper un vrai bout de récit.
const SEUIL_NO_SPEECH = 0.6;
const SEUIL_COMPRESSION = 2.4;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const formData = await req.formData();
  const audio = formData.get("audio") as Blob | null;

  if (!audio) {
    return NextResponse.json({ error: "No audio" }, { status: 400 });
  }

  const groqForm = new FormData();
  groqForm.append("file", audio, "recording.webm");
  groqForm.append("model", "whisper-large-v3");
  groqForm.append("language", "fr");
  groqForm.append("response_format", "verbose_json");

  const res = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: groqForm,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("Groq transcription error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }

  const data = await res.json();
  const segments = data.segments as SegmentGroq[] | undefined;

  // Silence avant le premier mot prononcé — signal doux d'hésitation
  // (l'enregistrement est en push-to-talk : ce délai reflète le temps de
  // réflexion avant de répondre, pas du bruit ambiant).
  const dureeSilenceMs = segments?.length ? Math.round(segments[0].start * 1000) : null;

  // Reconstruit le texte à partir des segments jugés fiables plutôt que du
  // texte brut de Whisper — filtre les passages hallucinés sur un silence
  // prolongé en cours d'enregistrement. Repli sur le texte brut si le
  // filtrage viderait tout (mieux vaut un risque d'hallucination que de
  // renvoyer un texte vide au narrateur).
  const texteFiltre = segments?.length
    ? segments
        .filter((s) => (s.no_speech_prob ?? 0) < SEUIL_NO_SPEECH && (s.compression_ratio ?? 0) < SEUIL_COMPRESSION)
        .map((s) => s.text.trim())
        .filter(Boolean)
        .join(" ")
    : "";

  return NextResponse.json({ text: texteFiltre || data.text, duree_silence_ms: dureeSilenceMs });
}
