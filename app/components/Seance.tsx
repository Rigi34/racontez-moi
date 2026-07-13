"use client";

import { useState, useRef, useCallback, Dispatch, SetStateAction } from "react";

type Phase = "question" | "relance" | "fragment";

const QUESTION_INITIALE = "Quelle est la première maison dont vous vous souvenez ?";

export default function Seance() {
  const [phase, setPhase] = useState<Phase>("question");
  const [reponse, setReponse] = useState("");
  const [relance, setRelance] = useState("");
  const [reponseRelance, setReponseRelance] = useState("");
  const [fragment, setFragment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copie, setCopie] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startVoice = useCallback(async (setter: Dispatch<SetStateAction<string>>) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setTranscribing(true);
        try {
          const form = new FormData();
          form.append("audio", blob, "recording.webm");
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          if (!res.ok) throw new Error();
          const data = await res.json();
          setter((prev) => (prev ? prev + " " + data.text : data.text));
        } catch {
          setError("Erreur lors de la transcription. Veuillez réessayer.");
        } finally {
          setTranscribing(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setError("Accès au microphone refusé. Vérifiez les permissions du navigateur.");
    }
  }, []);

  const stopVoice = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const submitReponse = async () => {
    if (!reponse.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/premiere-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "relance", reponse }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRelance(data.relance);
      setPhase("relance");
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const submitRelance = async () => {
    if (!reponseRelance.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/premiere-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "fragment", reponse, reponseRelance }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFragment(data.fragment);
      setPhase("fragment");
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const copierFragment = async () => {
    try {
      await navigator.clipboard.writeText(fragment);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      setError("Impossible de copier automatiquement. Sélectionnez le texte manuellement.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Phase 1 — Question initiale */}
      {phase === "question" && (
        <div className="text-center space-y-8">
          <h2 className="font-display font-normal text-3xl md:text-4xl text-encre leading-[1.25]">
            {QUESTION_INITIALE}
          </h2>
          <div className="space-y-4">
            <textarea
              value={reponse}
              onChange={(e) => setReponse(e.target.value)}
              placeholder="Prenez votre temps. Écrivez ou dictez à la voix."
              className="w-full min-h-[140px] bg-papier border border-grege font-serif text-lg text-encre p-5 resize-none focus:outline-none focus:border-grege placeholder:text-grege placeholder:text-base leading-relaxed"
            />
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() =>
                  isRecording ? stopVoice() : startVoice(setReponse)
                }
                disabled={transcribing}
                className={`font-sans text-sm px-5 py-2.5 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isRecording
                    ? "border-petrole text-petrole bg-petrole/10"
                    : "border-grege text-grege hover:border-grege"
                }`}
              >
                {isRecording ? "⏹ Arrêter la dictée" : transcribing ? "Transcription…" : "🎙 Dicter à la voix"}
              </button>
              <button
                onClick={submitReponse}
                disabled={!reponse.trim() || loading || transcribing}
                className="bg-petrole text-papier font-sans font-medium px-7 py-2.5 hover:bg-[#17393A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Un instant…" : "Continuer →"}
              </button>
            </div>
          </div>
          {error && <p className="font-sans text-sm text-red-700">{error}</p>}
        </div>
      )}

      {/* Phase 2 — Relance sensorielle */}
      {phase === "relance" && (
        <div className="text-center space-y-8">
          <p className="font-display italic text-xl text-grege">
            {relance}
          </p>
          <div className="space-y-4">
            <textarea
              value={reponseRelance}
              onChange={(e) => setReponseRelance(e.target.value)}
              placeholder="Continuez, prenez votre temps…"
              className="w-full min-h-[120px] bg-papier border border-grege font-serif text-lg text-encre p-5 resize-none focus:outline-none focus:border-grege placeholder:text-grege placeholder:text-base leading-relaxed"
            />
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() =>
                  isRecording ? stopVoice() : startVoice(setReponseRelance)
                }
                disabled={transcribing}
                className={`font-sans text-sm px-5 py-2.5 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isRecording
                    ? "border-petrole text-petrole bg-petrole/10"
                    : "border-grege text-grege hover:border-grege"
                }`}
              >
                {isRecording ? "⏹ Arrêter" : transcribing ? "Transcription…" : "🎙 Dicter"}
              </button>
              <button
                onClick={submitRelance}
                disabled={!reponseRelance.trim() || loading}
                className="bg-petrole text-papier font-sans font-medium px-7 py-2.5 hover:bg-[#17393A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Composition en cours…" : "Terminer la séance →"}
              </button>
            </div>
          </div>
          {error && <p className="font-sans text-sm text-red-700">{error}</p>}
        </div>
      )}

      {/* Phase 3 — Rituel de clôture */}
      {phase === "fragment" && (
        <div className="space-y-10">
          <p className="font-sans text-center text-sm text-grege tracking-wider uppercase">
            Voici ce que cette séance vient de créer
          </p>

          <div className="bg-papier border-l-2 border-grege pl-8 pr-4 py-6">
            <p className="font-display text-[19px] leading-[1.85] text-encre whitespace-pre-line">
              {fragment}
            </p>
          </div>

          <div className="text-center space-y-6">
            <p className="font-serif text-lg text-grege italic">
              Il reste toute une vie à raconter.
            </p>

            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={copierFragment}
                className="border border-grege text-encre font-sans text-sm px-6 py-3 hover:border-grege transition-colors"
              >
                {copie ? "Copié ✓" : "Copier le texte"}
              </button>
              <a
                href="/tableau-de-bord"
                className="inline-block bg-petrole text-papier font-sans font-medium text-base px-8 py-3 hover:bg-[#17393A] transition-colors"
              >
                Retour à mon parcours →
              </a>
            </div>

            <p className="font-sans text-xs text-grege max-w-md mx-auto">
              La sauvegarde automatique de vos séances arrive bientôt. En attendant, copiez ce
              texte si vous voulez le garder.
            </p>
            {error && <p className="font-sans text-sm text-red-700">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
