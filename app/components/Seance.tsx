"use client";

import { useState, useRef, useCallback, useEffect, Dispatch, SetStateAction } from "react";

type Phase = "chargement" | "reprise" | "question" | "relance" | "relance2" | "fragment";

const QUESTION_INITIALE = "Quelle est la première maison dont vous vous souvenez ?";

const HAUTEURS_ONDE = [5, 9, 13, 8, 6]; // px, au repos — silhouette d'onde sonore

function OndeSonore({ active }: { active: boolean }) {
  return (
    <span className="flex items-end gap-[3px] h-[13px]" aria-hidden="true">
      {HAUTEURS_ONDE.map((h, i) => (
        <span
          key={i}
          className={`w-[2.5px] rounded-full bg-current origin-bottom ${
            active ? "h-[13px] barre-onde--active" : ""
          }`}
          style={active ? { animationDelay: `${i * 0.12}s` } : { height: `${h}px` }}
        />
      ))}
    </span>
  );
}

const HAUTEURS_ONDE_GRANDE = [10, 22, 34, 48, 30, 44, 20, 38, 52, 28, 42, 16, 36, 24, 46, 18];

function PanneauEnregistrement({ duree }: { duree: number }) {
  const minutes = Math.floor(duree / 60);
  const secondes = duree % 60;
  const chrono = `${minutes}:${secondes.toString().padStart(2, "0")}`;

  return (
    <div className="bg-blanc border border-sauge rounded-2xl px-6 py-7 shadow-[0_2px_8px_rgba(36,34,32,0.08)]">
      <div className="flex items-end justify-center gap-[5px] h-14" aria-hidden="true">
        {HAUTEURS_ONDE_GRANDE.map((h, i) => (
          <span
            key={i}
            className="w-[5px] rounded-full bg-petrole origin-bottom barre-onde-grande--active"
            style={{ height: `${h}px`, animationDelay: `${i * 0.09}s` }}
          />
        ))}
      </div>
      <p className="mt-4 font-sans text-lg text-petrole font-medium">{chrono}</p>
      <p className="mt-1 font-sans text-sm text-grege">Enregistrement en cours</p>
    </div>
  );
}

function BoutonDicter({
  isRecording,
  transcribing,
  onClick,
  label,
}: {
  isRecording: boolean;
  transcribing: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={transcribing}
      className={`inline-flex items-center gap-3 rounded-full border font-sans text-base px-7 py-4 shadow-[0_1px_3px_rgba(36,34,32,0.1)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        isRecording
          ? "border-petrole/40 bg-petrole/10 text-petrole"
          : "border-sauge bg-blanc text-grege hover:border-grege hover:text-encre"
      }`}
    >
      <OndeSonore active={isRecording} />
      {isRecording ? "Arrêter l'écoute" : transcribing ? "Transcription…" : label}
    </button>
  );
}

export default function Seance() {
  const [phase, setPhase] = useState<Phase>("chargement");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [reponse, setReponse] = useState("");
  const [relance, setRelance] = useState("");
  const [reponseRelance, setReponseRelance] = useState("");
  const [relance2, setRelance2] = useState("");
  const [reponseRelance2, setReponseRelance2] = useState("");
  const [fragment, setFragment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copie, setCopie] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [dureeEnregistrement, setDureeEnregistrement] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chronoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dureeSilenceReponseRef = useRef<number | null>(null);
  const dureeSilenceRelanceRef = useRef<number | null>(null);
  const dureeSilenceRelance2Ref = useRef<number | null>(null);
  const chunksRagRef = useRef<string[]>([]);
  const chunksRagRef2 = useRef<string[]>([]);
  const [phaseApresReprise, setPhaseApresReprise] = useState<Phase>("relance");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/seance");
        const data = await res.json();
        const session = data.session as { id: string; transcript: { role: string; text: string }[] } | null;
        const t = session?.transcript ?? [];
        if (session && t.length >= 4) {
          setSessionId(session.id);
          setReponse(t[0].text);
          setRelance(t[1].text);
          setReponseRelance(t[2].text);
          setRelance2(t[3].text);
          setPhaseApresReprise("relance2");
          setPhase("reprise");
        } else if (session && t.length >= 2) {
          setSessionId(session.id);
          setReponse(t[0].text);
          setRelance(t[1].text);
          setPhaseApresReprise("relance");
          setPhase("reprise");
        } else {
          setPhase("question");
        }
      } catch {
        setPhase("question");
      }
    })();
  }, []);

  const startVoice = useCallback(async (
    setter: Dispatch<SetStateAction<string>>,
    dureeSilenceRef: React.MutableRefObject<number | null>
  ) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chronoRef.current) clearInterval(chronoRef.current);
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setTranscribing(true);
        try {
          const form = new FormData();
          form.append("audio", blob, "recording.webm");
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          if (!res.ok) throw new Error();
          const data = await res.json();
          setter((prev) => (prev ? prev + " " + data.text : data.text));
          dureeSilenceRef.current = data.duree_silence_ms ?? null;
        } catch {
          setError("Erreur lors de la transcription. Veuillez réessayer.");
        } finally {
          setTranscribing(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setDureeEnregistrement(0);
      chronoRef.current = setInterval(() => setDureeEnregistrement((d) => d + 1), 1000);
    } catch {
      setError("Accès au microphone refusé. Vérifiez les permissions du navigateur.");
    }
  }, []);

  const stopVoice = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const reprendreSeance = () => {
    setPhase(phaseApresReprise);
  };

  const recommencerSeance = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/seance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "start", fresh: true }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSessionId(data.session_id);
      setReponse("");
      setRelance("");
      setReponseRelance("");
      setRelance2("");
      setReponseRelance2("");
      setPhase("question");
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const submitReponse = async () => {
    if (!reponse.trim()) return;
    setLoading(true);
    setError("");
    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const startRes = await fetch("/api/seance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: "start" }),
        });
        if (!startRes.ok) throw new Error();
        const startData = await startRes.json();
        currentSessionId = startData.session_id;
        setSessionId(currentSessionId);
      }

      const res = await fetch("/api/seance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "relance",
          session_id: currentSessionId,
          reponse,
          duree_silence_ms: dureeSilenceReponseRef.current,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRelance(data.relance);
      chunksRagRef.current = data.chunks_rag_utilises ?? [];
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
      const res = await fetch("/api/seance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "relance2",
          session_id: sessionId,
          reponseRelance,
          duree_silence_ms: dureeSilenceRelanceRef.current,
          chunks_rag_utilises: chunksRagRef.current,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRelance2(data.relance);
      chunksRagRef2.current = data.chunks_rag_utilises ?? [];
      setPhase("relance2");
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const submitRelance2 = async () => {
    if (!reponseRelance2.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/seance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "fragment",
          session_id: sessionId,
          reponseRelance2,
          duree_silence_ms: dureeSilenceRelance2Ref.current,
          chunks_rag_utilises: chunksRagRef2.current,
        }),
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
      {/* Chargement initial — vérification d'une séance en cours */}
      {phase === "chargement" && (
        <p className="text-center font-sans text-sm text-grege">Un instant…</p>
      )}

      {/* Reprise d'une séance interrompue */}
      {phase === "reprise" && (
        <div className="text-center space-y-8">
          <h2 className="font-display font-normal text-2xl md:text-3xl text-encre leading-[1.3]">
            Vous avez une séance en cours, jamais terminée.
          </h2>
          <p className="font-serif text-lg text-grege">
            Voulez-vous la reprendre là où vous vous étiez arrêté, ou en commencer une nouvelle ?
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={recommencerSeance}
              disabled={loading}
              className="font-sans text-sm px-5 py-2.5 border border-grege text-grege hover:border-grege transition-colors disabled:opacity-40"
            >
              Recommencer à zéro
            </button>
            <button
              onClick={reprendreSeance}
              disabled={loading}
              className="bg-encre text-blanc rounded-full font-sans font-medium px-7 py-2.5 hover:bg-[#3A3632] transition-colors disabled:opacity-40"
            >
              Reprendre ma séance →
            </button>
          </div>
          {error && <p className="font-sans text-sm text-red-700">{error}</p>}
        </div>
      )}

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
              className="w-full min-h-[220px] bg-papier border border-grege font-serif text-lg text-encre p-5 resize-none focus:outline-none focus:border-grege placeholder:text-grege placeholder:text-base leading-relaxed"
            />
            {isRecording && <PanneauEnregistrement duree={dureeEnregistrement} />}
            <div className="flex gap-3 justify-center flex-wrap">
              <BoutonDicter
                isRecording={isRecording}
                transcribing={transcribing}
                onClick={() => (isRecording ? stopVoice() : startVoice(setReponse, dureeSilenceReponseRef))}
                label="Dicter à la voix"
              />
              <button
                onClick={submitReponse}
                disabled={!reponse.trim() || loading || transcribing}
                className="bg-encre text-blanc rounded-full font-sans font-medium px-7 py-2.5 hover:bg-[#3A3632] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Un instant…" : "Continuer →"}
              </button>
            </div>
            <p className="font-display italic text-sm text-grege">
              Votre voix, à votre rythme. Relisez et corrigez si besoin.
            </p>
          </div>
          {error && <p className="font-sans text-sm text-red-700">{error}</p>}
        </div>
      )}

      {/* Phase 2 — Première relance sensorielle */}
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
              className="w-full min-h-[200px] bg-papier border border-grege font-serif text-lg text-encre p-5 resize-none focus:outline-none focus:border-grege placeholder:text-grege placeholder:text-base leading-relaxed"
            />
            {isRecording && <PanneauEnregistrement duree={dureeEnregistrement} />}
            <div className="flex gap-3 justify-center flex-wrap">
              <BoutonDicter
                isRecording={isRecording}
                transcribing={transcribing}
                onClick={() => (isRecording ? stopVoice() : startVoice(setReponseRelance, dureeSilenceRelanceRef))}
                label="Dicter"
              />
              <button
                onClick={submitRelance}
                disabled={!reponseRelance.trim() || loading}
                className="bg-encre text-blanc rounded-full font-sans font-medium px-7 py-2.5 hover:bg-[#3A3632] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Un instant…" : "Continuer →"}
              </button>
            </div>
            <p className="font-display italic text-sm text-grege">
              Relisez et corrigez si besoin.
            </p>
          </div>
          {error && <p className="font-sans text-sm text-red-700">{error}</p>}
        </div>
      )}

      {/* Phase 2bis — Seconde relance sensorielle */}
      {phase === "relance2" && (
        <div className="text-center space-y-8">
          <p className="font-display italic text-xl text-grege">
            {relance2}
          </p>
          <div className="space-y-4">
            <textarea
              value={reponseRelance2}
              onChange={(e) => setReponseRelance2(e.target.value)}
              placeholder="Continuez, prenez votre temps…"
              className="w-full min-h-[200px] bg-papier border border-grege font-serif text-lg text-encre p-5 resize-none focus:outline-none focus:border-grege placeholder:text-grege placeholder:text-base leading-relaxed"
            />
            {isRecording && <PanneauEnregistrement duree={dureeEnregistrement} />}
            <div className="flex gap-3 justify-center flex-wrap">
              <BoutonDicter
                isRecording={isRecording}
                transcribing={transcribing}
                onClick={() => (isRecording ? stopVoice() : startVoice(setReponseRelance2, dureeSilenceRelance2Ref))}
                label="Dicter"
              />
              <button
                onClick={submitRelance2}
                disabled={!reponseRelance2.trim() || loading}
                className="bg-encre text-blanc rounded-full font-sans font-medium px-7 py-2.5 hover:bg-[#3A3632] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Composition en cours…" : "Terminer la séance →"}
              </button>
            </div>
            <p className="font-display italic text-sm text-grege">
              Relisez et corrigez si besoin.
            </p>
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
                className="inline-block bg-encre text-blanc rounded-full font-sans font-medium text-base px-8 py-3 hover:bg-[#3A3632] transition-colors"
              >
                Retour à mon parcours →
              </a>
            </div>

            <p className="font-sans text-xs text-grege max-w-md mx-auto">
              Cette séance est enregistrée dans votre parcours.
            </p>
            {error && <p className="font-sans text-sm text-red-700">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
