import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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

  // Silence avant le premier mot prononcé — signal doux d'hésitation
  // (l'enregistrement est en push-to-talk : ce délai reflète le temps de
  // réflexion avant de répondre, pas du bruit ambiant).
  const segments = data.segments as { start: number }[] | undefined;
  const dureeSilenceMs = segments?.length ? Math.round(segments[0].start * 1000) : null;

  return NextResponse.json({ text: data.text, duree_silence_ms: dureeSilenceMs });
}
