// Nom de fichier envoyé à la transcription (Groq), d'après le type réel de
// l'enregistrement (passe de bout en bout du 20/11/2026) : Safari enregistre
// en mp4, Chrome et Firefox en webm (ou ogg). Un fichier mp4 nommé
// « .webm » risquait d'être refusé.
export function nomFichierAudio(type: string | undefined | null): string {
  const t = (type ?? "").toLowerCase();
  if (t.includes("mp4") || t.includes("m4a") || t.includes("aac")) return "recording.m4a";
  if (t.includes("ogg")) return "recording.ogg";
  if (t.includes("mpeg") || t.includes("mp3")) return "recording.mp3";
  if (t.includes("wav")) return "recording.wav";
  return "recording.webm";
}
