"use client";

import { useState, useRef, useCallback, Dispatch, SetStateAction } from "react";

type Phase = "question" | "reponse" | "relance" | "fragment" | "capture";

export default function PremièreQuestion() {
  const [phase, setPhase] = useState<Phase>("question");
  const [reponse, setReponse] = useState("");
  const [relance, setRelance] = useState("");
  const [reponseRelance, setReponseRelance] = useState("");
  const [fragment, setFragment] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
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

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/premiere-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "email", email, fragment }),
      });
      setEmailSent(true);
    } catch {
      setError("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Phase 1 — Question initiale */}
      {phase === "question" && (
        <div className="text-center space-y-8">
          <h2 className="font-display font-normal text-3xl md:text-4xl text-presque-noir leading-[1.25]">
            Quelle est la première maison dont vous vous souvenez&nbsp;?
          </h2>
          <div className="space-y-4">
            <textarea
              value={reponse}
              onChange={(e) => setReponse(e.target.value)}
              placeholder="Prenez votre temps. Écrivez ou dictez à la voix."
              className="w-full min-h-[140px] bg-ivoire border border-sable font-serif text-lg text-presque-noir p-5 resize-none focus:outline-none focus:border-gris-chaud placeholder:text-gris-chaud placeholder:text-base leading-relaxed"
            />
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() =>
                  isRecording ? stopVoice() : startVoice(setReponse)
                }
                disabled={transcribing}
                className={`font-sans text-sm px-5 py-2.5 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isRecording
                    ? "border-terracotta text-terracotta bg-terracotta/10"
                    : "border-sable text-gris-chaud hover:border-gris-chaud"
                }`}
              >
                {isRecording ? "⏹ Arrêter la dictée" : transcribing ? "Transcription…" : "🎙 Dicter à la voix"}
              </button>
              <button
                onClick={submitReponse}
                disabled={!reponse.trim() || loading || transcribing}
                className="bg-terracotta text-ivoire font-sans font-medium px-7 py-2.5 hover:bg-[#A8692E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
          <p className="font-garamond italic text-xl text-gris-chaud">
            {relance}
          </p>
          <div className="space-y-4">
            <textarea
              value={reponseRelance}
              onChange={(e) => setReponseRelance(e.target.value)}
              placeholder="Continuez, prenez votre temps…"
              className="w-full min-h-[120px] bg-ivoire border border-sable font-serif text-lg text-presque-noir p-5 resize-none focus:outline-none focus:border-gris-chaud placeholder:text-gris-chaud placeholder:text-base leading-relaxed"
            />
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() =>
                  isRecording ? stopVoice() : startVoice(setReponseRelance)
                }
                disabled={transcribing}
                className={`font-sans text-sm px-5 py-2.5 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isRecording
                    ? "border-terracotta text-terracotta bg-terracotta/10"
                    : "border-sable text-gris-chaud hover:border-gris-chaud"
                }`}
              >
                {isRecording ? "⏹ Arrêter" : transcribing ? "Transcription…" : "🎙 Dicter"}
              </button>
              <button
                onClick={submitRelance}
                disabled={!reponseRelance.trim() || loading}
                className="bg-terracotta text-ivoire font-sans font-medium px-7 py-2.5 hover:bg-[#A8692E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Composition en cours…" : "Voir mon fragment →"}
              </button>
            </div>
          </div>
          {error && <p className="font-sans text-sm text-red-700">{error}</p>}
        </div>
      )}

      {/* Phase 3 — Fragment enrichi */}
      {phase === "fragment" && (
        <div className="space-y-10">
          <p className="font-sans text-center text-sm text-gris-chaud tracking-wider uppercase">
            Voici ce que ce souvenir pourrait devenir.
          </p>

          {/* Fragment en EB Garamond */}
          <div className="bg-ivoire border-l-2 border-sable pl-8 pr-4 py-6">
            <p className="font-garamond text-[19px] leading-[1.85] text-presque-noir whitespace-pre-line">
              {fragment}
            </p>
          </div>

          <div className="text-center space-y-6">
            <p className="font-serif text-lg text-gris-chaud italic">
              Il reste toute une vie à raconter.
            </p>

            <div className="space-y-3">
              <a
                href="#"
                className="inline-block bg-terracotta text-ivoire font-sans font-medium text-base px-8 py-4 hover:bg-[#A8692E] transition-colors"
              >
                Commencer mon histoire — première séance offerte →
              </a>
            </div>

            {/* Capture email */}
            {!emailSent ? (
              <form onSubmit={submitEmail} className="space-y-3">
                <p className="font-sans text-sm text-gris-chaud">
                  Ou recevoir cette page par courriel :
                </p>
                <div className="flex gap-2 max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@courriel.fr"
                    className="flex-1 bg-ivoire border border-sable font-sans text-base text-presque-noir px-4 py-2.5 focus:outline-none focus:border-gris-chaud placeholder:text-gris-chaud"
                  />
                  <button
                    type="submit"
                    disabled={!email.trim() || loading}
                    className="bg-presque-noir text-ivoire font-sans text-sm px-5 py-2.5 hover:bg-gris-chaud transition-colors disabled:opacity-40"
                  >
                    Envoyer
                  </button>
                </div>
                <p className="font-sans text-xs text-gris-chaud">
                  Ce fragment vous appartient. Il ne servira jamais à entraîner une IA.
                </p>
                {error && <p className="font-sans text-sm text-red-700">{error}</p>}
              </form>
            ) : (
              <p className="font-garamond italic text-gris-chaud text-lg">
                Votre fragment est en route. À bientôt.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
