"use client";

import { useState, useRef, useCallback, useEffect, Dispatch, SetStateAction, ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type Phase = "chargement" | "reprise" | "question" | "relance" | "relance2" | "fragment";

// Repli affiché si jamais la question n'a pas pu être récupérée du serveur
// (erreur réseau au chargement) — le serveur reste la source de vérité :
// fixe pour la toute première séance, générée dynamiquement ensuite.
const QUESTION_INITIALE_REPLI = "Quelle est la première maison dont vous vous souvenez ?";
const TITRE_SECTION_REPLI = "Racines et petite enfance";

// Petits carillons de démarrage/arrêt d'enregistrement (demande de Régis,
// 29/07/2026) — synthétisés au vol (deux notes sinusoïdales, enveloppe
// douce) plutôt qu'un fichier audio à héberger, pour rester léger et
// cohérent avec le reste de l'interface (jamais un bip strident).
function jouerCarillon(frequences: [number, number]) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    frequences.forEach((freq, i) => {
      const debut = ctx.currentTime + i * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, debut);
      gain.gain.linearRampToValueAtTime(0.12, debut + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, debut + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(debut);
      osc.stop(debut + 0.4);
    });
    setTimeout(() => ctx.close(), 700);
  } catch {
    // Web Audio indisponible (navigateur ancien, contexte bloqué) — silence,
    // jamais bloquant pour l'enregistrement lui-même.
  }
}

// Do (C5) → Mi (E5) à l'ouverture de l'écoute, Mi → Do à la fermeture —
// même intervalle, sens inversé, pour que les deux se répondent.
const CARILLON_DEBUT: [number, number] = [523.25, 659.25];
const CARILLON_FIN: [number, number] = [659.25, 523.25];

// Phrases affichées après quelques secondes sans reprise de parole —
// purement décoratif à ce stade (basé sur un minuteur, pas sur une vraie
// détection audio du silence). La vraie détection de silence reste un
// chantier séparé, non couvert par cette refonte de l'interface.
const PHRASES_SILENCE = [
  "Prenez votre temps.",
  "Les souvenirs viennent souvent après quelques secondes.",
  "Il n'y a aucune bonne réponse.",
  "Fermez les yeux si cela vous aide.",
];

const HAUTEURS_ONDE_GRANDE = [10, 22, 34, 48, 30, 44, 20, 38, 52, 28, 42, 16, 36, 24, 46, 18];

// Invitation plutôt qu'interrogation — retour du Révélateur du 24 juillet :
// "il manque LE détail qui fera que les gens oublieront qu'ils parlent à une
// IA". Choisie une fois par écran, pas recalculée à chaque rendu.
const INVITATIONS = [
  "Prenons quelques minutes pour retrouver ce souvenir.",
  "Je vais simplement vous écouter.",
  "Laissez venir ce qui vous vient, sans vous presser.",
];

// Approximation légère de l'idée "saisons du livre" (retour du 24 juillet) :
// une seule photo, mais la teinte du voile glisse doucement selon
// l'avancement dans le cycle des 16 sections — jamais nommée, jamais
// écrite. Pas encore de vraies photos saisonnières (idée plus large,
// à discuter séparément si elle mérite sa propre production photo).
const TEINTES_AMBIANCE = ["#EEF0DE", "#F7E9C7", "#F2DAB8", "#E6ECEF"];

function teinteAmbiance(pourcentageCouverture: number): string {
  const index = Math.min(3, Math.floor(pourcentageCouverture / 25));
  return TEINTES_AMBIANCE[index];
}

function IconeMicro({ souffle = false, className = "w-8 h-8" }: { souffle?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} ${souffle ? "btn-icone-souffle" : ""}`}
    >
      <path d="M12 15a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v5.5A3.5 3.5 0 0 0 12 15Z" />
      <path d="M6.5 11.2V12a5.5 5.5 0 0 0 11 0v-.8" />
      <path d="M12 17.5V21" />
      <path d="M9 21h6" />
    </svg>
  );
}

function PanneauEnregistrement({ duree }: { duree: number }) {
  const minutes = Math.floor(duree / 60);
  const secondes = duree % 60;
  const chrono = `${minutes}:${secondes.toString().padStart(2, "0")}`;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-center gap-[5px] h-12" aria-hidden="true">
        {HAUTEURS_ONDE_GRANDE.map((h, i) => (
          <span
            key={i}
            className="w-[5px] rounded-full bg-petrole origin-bottom barre-onde-grande--active"
            style={{ height: `${h}px`, animationDelay: `${i * 0.09}s` }}
          />
        ))}
      </div>
      <p className="font-sans text-sm text-petrole font-medium tabular-nums">{chrono}</p>
    </div>
  );
}

// Le "chargement..." affiché en topbar peut être trompeur avant la première
// vraie compilation Typst (coûteuse, cf. lib/manuscrit.ts) : c'est une
// approximation à partir du nombre de mots, d'où le "~" permanent.
function BarreProgression({
  titreSection,
  pagesEstimees,
  pourcentageCouverture,
  modeInvite,
}: {
  titreSection: string | null;
  pagesEstimees: number | null;
  pourcentageCouverture: number;
  modeInvite?: boolean;
}) {
  return (
    <header
      className={`${modeInvite ? "" : "sticky top-0 z-20"} bg-papier/90 backdrop-blur-sm border-b border-sauge/50`}
    >
      <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-4">
          <span className="font-display italic text-petrole text-lg whitespace-nowrap">Racontez-moi</span>
          {/* "Mon parcours" mène au vrai tableau de bord — pas montré avant
              conversion, pour ne pas exposer une page pensée pour un compte
              déjà engagé pendant l'essai gratuit. */}
          {!modeInvite && (
            <Link href="/tableau-de-bord" className="font-sans text-xs text-grege hover:text-encre transition-colors whitespace-nowrap">
              Mon parcours
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="font-sans text-xs font-medium text-encre tabular-nums">
              {pagesEstimees !== null ? `~${pagesEstimees} page${pagesEstimees > 1 ? "s" : ""}` : "…"}
            </p>
            <p className="font-sans text-[11px] text-grege uppercase tracking-wide">{titreSection ?? "…"}</p>
          </div>
          <div className="w-16 h-[5px] rounded-full bg-sauge/50 overflow-hidden">
            <div
              className="h-full bg-petrole rounded-full transition-[width] duration-500"
              style={{ width: `${Math.max(4, pourcentageCouverture)}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function ZoneEcoute({
  eyebrow,
  question,
  valeur,
  setValeur,
  placeholder,
  isRecording,
  transcribing,
  dureeEnregistrement,
  onToggleVoice,
  ecrireForce,
  setEcrireForce,
  onContinuer,
  continuerLabel,
  continuerLoadingLabel,
  loading,
  silencePhrase,
  silenceVisible,
  pourcentageCouverture,
  error,
  onPasser,
  modeInvite,
}: {
  eyebrow: string;
  question: ReactNode;
  valeur: string;
  setValeur: Dispatch<SetStateAction<string>>;
  placeholder: string;
  isRecording: boolean;
  transcribing: boolean;
  dureeEnregistrement: number;
  onToggleVoice: () => void;
  ecrireForce: boolean;
  setEcrireForce: (v: boolean) => void;
  onContinuer: () => void;
  continuerLabel: string;
  continuerLoadingLabel: string;
  loading: boolean;
  silencePhrase: string;
  silenceVisible: boolean;
  pourcentageCouverture: number;
  error: string;
  // "Jamais forcer" — n'apparaît que sur la question d'ouverture (pas les
  // relances, qui sont déjà des suites personnalisées de ce que la personne
  // vient de dire, pas une question de la banque qu'on pourrait éviter).
  onPasser?: () => void;
  // Séance gratuite intégrée en bas de l'accueil (décision du 26/07/2026) —
  // ajoute la réassurance "sans carte" juste au-dessus du bouton, jamais
  // affichée dans la vraie séance (déjà payée à ce stade).
  modeInvite?: boolean;
}) {
  const montrerTexte = ecrireForce || valeur.trim().length > 0;
  const [invitation] = useState(() => INVITATIONS[Math.floor(Math.random() * INVITATIONS.length)]);

  return (
    <div
      className={`stage min-h-[58vh] flex items-center justify-center px-6 py-16 ${isRecording ? "stage--recording" : ""}`}
      style={{ "--veil-tint": teinteAmbiance(pourcentageCouverture) } as React.CSSProperties}
    >
      <div className="stage-photo" aria-hidden="true" />
      <div className="stage-light" aria-hidden="true" />
      <div className="stage-photo-veil" aria-hidden="true" />
      <div className="stage-inner max-w-xl w-full text-center space-y-10">
        <div>
          <p className="stage-fade-in font-sans text-xs font-medium text-grege uppercase tracking-widest">{eyebrow}</p>
          <div className="stage-fade-in mt-4" style={{ animationDelay: "0.08s" }}>
            {question}
          </div>
        </div>

        {!montrerTexte ? (
          <div className="stage-fade-in mic-cta mt-16 space-y-5" style={{ animationDelay: "0.18s" }}>
            <div
              className={`mic-ring w-20 h-20 mx-auto rounded-full bg-blanc border flex items-center justify-center shadow-[0_1px_2px_rgba(36,34,32,0.06),0_8px_24px_-12px_rgba(36,34,32,0.2)] ${
                isRecording ? "mic-ring--recording border-petrole text-petrole" : "border-sauge text-petrole"
              }`}
            >
              <IconeMicro />
            </div>

            {isRecording ? (
              <div className="space-y-5">
                <p className="font-display italic text-xl text-petrole">Je vous écoute.</p>
                <PanneauEnregistrement duree={dureeEnregistrement} />
                <p className={`font-serif italic text-sm text-ambre min-h-[1.4em] silence-phrase ${silenceVisible ? "silence-phrase--visible" : ""}`}>
                  {silencePhrase}
                </p>
              </div>
            ) : transcribing ? (
              <p className="font-display italic text-xl text-petrole">Un instant, je transcris…</p>
            ) : (
              <p className="font-serif text-lg text-encre max-w-sm mx-auto">{invitation}</p>
            )}

            <div className="flex flex-col items-center gap-2.5">
              {!isRecording && !transcribing && (
                <p className="font-sans text-xs text-grege max-w-[280px]">
                  Parlez simplement comme vous parleriez à un proche.
                  <br />
                  Je m&apos;occupe du reste.
                  {modeInvite && (
                    <>
                      <br />
                      Sans carte, sans engagement.
                    </>
                  )}
                </p>
              )}
              <button
                onClick={onToggleVoice}
                disabled={transcribing}
                className={`inline-flex items-center gap-3 rounded-full font-sans font-medium text-[15px] px-8 py-3.5 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isRecording
                    ? "bg-petrole/10 border-petrole/40 text-petrole"
                    : "bg-blanc border-sauge text-petrole shadow-[0_1px_2px_rgba(36,34,32,0.05),0_6px_18px_-10px_rgba(36,34,32,0.25)] hover:border-petrole/50"
                }`}
              >
                {isRecording ? <span className="rec-dot" /> : <IconeMicro souffle className="w-4 h-4" />}
                {isRecording ? "Terminer la séance" : transcribing ? "Transcription…" : "Commencer à parler"}
              </button>
              {!isRecording && !transcribing && (
                <button
                  onClick={() => setEcrireForce(true)}
                  className="font-sans text-[15px] text-encre underline decoration-sauge underline-offset-4 hover:decoration-grege transition-colors"
                >
                  ou écrire à la place
                </button>
              )}
              {onPasser && !isRecording && !transcribing && (
                <button
                  onClick={onPasser}
                  className="font-sans text-xs text-grege hover:text-encre transition-colors"
                >
                  Passer cette question
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="stage-fade-in space-y-4 text-left" style={{ animationDelay: "0.1s" }}>
            <textarea
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
              placeholder={placeholder}
              className="w-full min-h-[200px] bg-blanc/95 border border-sauge font-serif text-lg text-encre p-5 rounded-xl resize-none focus:outline-none focus:border-petrole placeholder:text-grege placeholder:text-base leading-relaxed"
              autoFocus
            />
            {isRecording && (
              <div className="flex justify-center">
                <PanneauEnregistrement duree={dureeEnregistrement} />
              </div>
            )}
            <div className="flex gap-3 justify-center flex-wrap pt-1">
              <button
                onClick={onToggleVoice}
                disabled={transcribing}
                className={`inline-flex items-center gap-2.5 rounded-full border font-sans text-[15px] px-6 py-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isRecording ? "border-petrole/40 bg-petrole/10 text-petrole" : "border-sauge bg-blanc text-grege hover:border-grege hover:text-encre"
                }`}
              >
                {isRecording && <span className="rec-dot" />}
                {isRecording ? "Arrêter l'écoute" : transcribing ? "Transcription…" : "Dicter à la voix"}
              </button>
              <button
                onClick={onContinuer}
                disabled={!valeur.trim() || loading || transcribing}
                className="bg-encre text-blanc rounded-full font-sans font-medium px-7 py-3 hover:bg-[#3A3632] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? continuerLoadingLabel : continuerLabel}
              </button>
            </div>
            <p className="font-display italic text-sm text-grege text-center">Relisez et corrigez si besoin.</p>
          </div>
        )}
        {error && <p className="font-sans text-sm text-red-700">{error}</p>}
      </div>
    </div>
  );
}

export default function Seance({ modeInvite = false }: { modeInvite?: boolean } = {}) {
  const [phase, setPhase] = useState<Phase>("chargement");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState(QUESTION_INITIALE_REPLI);
  const [titreSection, setTitreSection] = useState<string | null>(null);
  const [pagesEstimees, setPagesEstimees] = useState<number | null>(null);
  const [pourcentageCouverture, setPourcentageCouverture] = useState(0);
  const [reponse, setReponse] = useState("");
  const [relance, setRelance] = useState("");
  const [reponseRelance, setReponseRelance] = useState("");
  const [relance2, setRelance2] = useState("");
  const [reponseRelance2, setReponseRelance2] = useState("");
  const [fragment, setFragment] = useState("");
  const [fragmentId, setFragmentId] = useState<string | null>(null);
  const [statutFragment, setStatutFragment] = useState<"brouillon" | "valide" | "a_revoir">("brouillon");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copie, setCopie] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [dureeEnregistrement, setDureeEnregistrement] = useState(0);
  const [ecrireForce, setEcrireForce] = useState(false);
  // "Pour qui racontez-vous ?" puis "Comment aimeriez-vous qu'on vous
  // appelle ?" — deux pseudo-questions posées une seule fois avant la toute
  // première vraie question d'un nouveau narrateur (29/07/2026), sans
  // séance associée : leur réponse suit le circuit normal d'enregistrement/
  // transcription de la phase "question", mais est envoyée à un step API
  // dédié plutôt qu'à "relance" (cf. submitReponse).
  const [etapeSpeciale, setEtapeSpeciale] = useState<"pour_qui" | "prenom" | null>(null);
  const [silencePhrase, setSilencePhrase] = useState("");
  const [silenceVisible, setSilenceVisible] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chronoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceCycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceIndexRef = useRef(0);
  const dureeSilenceReponseRef = useRef<number | null>(null);
  const dureeSilenceRelanceRef = useRef<number | null>(null);
  const dureeSilenceRelance2Ref = useRef<number | null>(null);
  const chunksRagRef = useRef<string[]>([]);
  const chunksRagRef2 = useRef<string[]>([]);
  const [phaseApresReprise, setPhaseApresReprise] = useState<Phase>("relance");

  useEffect(() => {
    (async () => {
      // Séance gratuite intégrée en bas de l'accueil (décision du
      // 26/07/2026) : aucun compte requis avant de commencer — une session
      // Supabase anonyme est ouverte en silence au premier chargement, avec
      // le même user_id conservé si elle se convertit en compte réel au
      // moment du paiement (cf. bouton "Continuer mon histoire" plus bas).
      if (modeInvite) {
        const supabase = createClient();
        const { data: { session: sessionAuth } } = await supabase.auth.getSession();
        if (!sessionAuth) {
          const { error: erreurAnonyme } = await supabase.auth.signInAnonymously();
          if (erreurAnonyme) {
            setError("Impossible de démarrer la séance gratuite. Veuillez réessayer.");
            setPhase("question");
            return;
          }
        }
      }
      try {
        const res = await fetch("/api/seance");
        const data = await res.json();
        const session = data.session as { id: string; transcript: { role: string; text: string }[] } | null;
        const t = session?.transcript ?? [];
        setTitreSection(data.titre_section ?? null);
        setPagesEstimees(data.progression?.pagesEstimees ?? null);
        setPourcentageCouverture(data.progression?.pourcentageCouverture ?? 0);
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
          // Pas de séance en cours : on en démarre une tout de suite pour
          // récupérer la vraie question (fixe en 1ère séance, générée
          // dynamiquement ensuite côté serveur) avant de l'afficher.
          try {
            const startRes = await fetch("/api/seance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ step: "start" }),
            });
            if (!startRes.ok) throw new Error();
            const startData = await startRes.json();
            const etape = startData.type === "pour_qui" || startData.type === "prenom" ? startData.type : null;
            setEtapeSpeciale(etape);
            setSessionId(startData.session_id);
            setQuestion(startData.question ?? QUESTION_INITIALE_REPLI);
            setTitreSection(etape ? null : startData.titre_section ?? TITRE_SECTION_REPLI);
            setPagesEstimees(startData.progression?.pagesEstimees ?? null);
            setPourcentageCouverture(startData.progression?.pourcentageCouverture ?? 0);
          } catch {
            // Repli silencieux : la question par défaut s'affiche, et la
            // séance sera créée au moment de la première réponse (voir
            // submitReponse).
          }
          setPhase("question");
        }
      } catch {
        setPhase("question");
      }
    })();
  }, [modeInvite]);

  // Phrase de silence : purement décorative (minuteur, pas de vraie
  // détection audio) — apparaît une fois, ~6s après le début de
  // l'enregistrement, pour rassurer sans presser le narrateur.
  useEffect(() => {
    if (!isRecording) return;
    silenceTimerRef.current = setTimeout(() => {
      setSilencePhrase(PHRASES_SILENCE[silenceIndexRef.current % PHRASES_SILENCE.length]);
      silenceIndexRef.current += 1;
      setSilenceVisible(true);
      silenceCycleTimerRef.current = setTimeout(() => setSilenceVisible(false), 3600);
    }, 6000);
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (silenceCycleTimerRef.current) clearTimeout(silenceCycleTimerRef.current);
      setSilenceVisible(false);
    };
  }, [isRecording]);

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
      jouerCarillon(CARILLON_DEBUT);
    } catch {
      setError("Accès au microphone refusé. Vérifiez les permissions du navigateur.");
    }
  }, []);

  const stopVoice = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    jouerCarillon(CARILLON_FIN);
  }, []);

  const reprendreSeance = () => {
    setEcrireForce(false);
    setPhase(phaseApresReprise);
  };

  const passerQuestion = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/seance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "passer", session_id: sessionId, special: etapeSpeciale }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const prochaineEtape = data.type === "pour_qui" || data.type === "prenom" ? data.type : null;
      setEtapeSpeciale(prochaineEtape);
      setSessionId(data.session_id);
      setQuestion(data.question ?? QUESTION_INITIALE_REPLI);
      setTitreSection(prochaineEtape ? null : data.titre_section ?? TITRE_SECTION_REPLI);
      setPagesEstimees(data.progression?.pagesEstimees ?? null);
      setPourcentageCouverture(data.progression?.pourcentageCouverture ?? 0);
      setReponse("");
      setEcrireForce(false);
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
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
      setQuestion(data.question ?? QUESTION_INITIALE_REPLI);
      setTitreSection(data.titre_section ?? TITRE_SECTION_REPLI);
      setPagesEstimees(data.progression?.pagesEstimees ?? null);
      setPourcentageCouverture(data.progression?.pourcentageCouverture ?? 0);
      setReponse("");
      setRelance("");
      setReponseRelance("");
      setRelance2("");
      setReponseRelance2("");
      setEcrireForce(false);
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
      if (etapeSpeciale) {
        // Pas de relance IA pour ces pseudo-questions — juste
        // l'enregistrement de la réponse, puis enchaînement direct sur
        // l'étape suivante (cf. steps "pour_qui"/"prenom", app/api/seance/route.ts).
        const res = await fetch("/api/seance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: etapeSpeciale, reponse }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const prochaineEtape = data.type === "pour_qui" || data.type === "prenom" ? data.type : null;
        setEtapeSpeciale(prochaineEtape);
        setSessionId(data.session_id);
        setQuestion(data.question ?? QUESTION_INITIALE_REPLI);
        setTitreSection(prochaineEtape ? null : data.titre_section ?? TITRE_SECTION_REPLI);
        setPagesEstimees(data.progression?.pagesEstimees ?? null);
        setPourcentageCouverture(data.progression?.pourcentageCouverture ?? 0);
        setReponse("");
        setEcrireForce(false);
        return;
      }

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
      setEcrireForce(false);
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
      setEcrireForce(false);
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
      setFragmentId(data.fragment_id ?? null);
      setStatutFragment("brouillon");
      setPhase("fragment");
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const [redirectionPaiement, setRedirectionPaiement] = useState(false);

  // Séance gratuite intégrée : "Continuer mon histoire" ouvre directement le
  // paiement Stripe existant (client_reference_id = user.id, déjà en place
  // pour les comptes réels) — le user_id anonyme créé au chargement de la
  // séance devient le même user_id que celui de l'abonnement, sans rien à
  // migrer.
  const continuerVersPaiement = async () => {
    setRedirectionPaiement(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
      setRedirectionPaiement(false);
    }
  };

  const marquerFragment = async (statut: "valide" | "a_revoir") => {
    if (!fragmentId) return;
    try {
      const res = await fetch(`/api/fragments/${fragmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      if (!res.ok) throw new Error();
      setStatutFragment(statut);
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
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
    <div>
      {phase !== "chargement" && (
        <BarreProgression
          titreSection={titreSection}
          pagesEstimees={pagesEstimees}
          pourcentageCouverture={pourcentageCouverture}
          modeInvite={modeInvite}
        />
      )}

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
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
          <ZoneEcoute
            eyebrow={titreSection ? `Chapitre · ${titreSection}` : "Question du jour"}
            question={
              <h1 className="font-display font-normal text-3xl md:text-4xl text-encre leading-[1.28] text-balance">
                {question}
              </h1>
            }
            valeur={reponse}
            setValeur={setReponse}
            placeholder="Prenez votre temps. Écrivez ou dictez à la voix."
            isRecording={isRecording}
            transcribing={transcribing}
            dureeEnregistrement={dureeEnregistrement}
            onToggleVoice={() => (isRecording ? stopVoice() : startVoice(setReponse, dureeSilenceReponseRef))}
            ecrireForce={ecrireForce}
            setEcrireForce={setEcrireForce}
            onContinuer={submitReponse}
            continuerLabel="Continuer →"
            continuerLoadingLabel="Un instant…"
            loading={loading}
            silencePhrase={silencePhrase}
            silenceVisible={silenceVisible}
            pourcentageCouverture={pourcentageCouverture}
            error={error}
            onPasser={passerQuestion}
            modeInvite={modeInvite}
          />
        )}

        {/* Phase 2 — Première relance sensorielle */}
        {phase === "relance" && (
          <ZoneEcoute
            eyebrow="Vous continuez de raconter"
            question={<p className="font-display italic text-xl md:text-2xl text-petrole text-balance">{relance}</p>}
            valeur={reponseRelance}
            setValeur={setReponseRelance}
            placeholder="Continuez, prenez votre temps…"
            isRecording={isRecording}
            transcribing={transcribing}
            dureeEnregistrement={dureeEnregistrement}
            onToggleVoice={() => (isRecording ? stopVoice() : startVoice(setReponseRelance, dureeSilenceRelanceRef))}
            ecrireForce={ecrireForce}
            setEcrireForce={setEcrireForce}
            onContinuer={submitRelance}
            continuerLabel="Continuer →"
            continuerLoadingLabel="Un instant…"
            loading={loading}
            silencePhrase={silencePhrase}
            silenceVisible={silenceVisible}
            pourcentageCouverture={pourcentageCouverture}
            error={error}
          />
        )}

        {/* Phase 2bis — Seconde relance sensorielle */}
        {phase === "relance2" && (
          <ZoneEcoute
            eyebrow="Vous continuez de raconter"
            question={<p className="font-display italic text-xl md:text-2xl text-petrole text-balance">{relance2}</p>}
            valeur={reponseRelance2}
            setValeur={setReponseRelance2}
            placeholder="Continuez, prenez votre temps…"
            isRecording={isRecording}
            transcribing={transcribing}
            dureeEnregistrement={dureeEnregistrement}
            onToggleVoice={() => (isRecording ? stopVoice() : startVoice(setReponseRelance2, dureeSilenceRelance2Ref))}
            ecrireForce={ecrireForce}
            setEcrireForce={setEcrireForce}
            onContinuer={submitRelance2}
            continuerLabel="Terminer la séance →"
            continuerLoadingLabel="Composition en cours…"
            loading={loading}
            silencePhrase={silencePhrase}
            silenceVisible={silenceVisible}
            pourcentageCouverture={pourcentageCouverture}
            error={error}
          />
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

              {statutFragment === "brouillon" ? (
                <div className="space-y-2">
                  <p className="font-sans text-sm text-grege">Est-ce que ça vous ressemble ?</p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <button
                      onClick={() => marquerFragment("valide")}
                      className="border border-grege text-encre font-sans text-sm px-5 py-2 hover:border-petrole transition-colors"
                    >
                      Ça me ressemble
                    </button>
                    <button
                      onClick={() => marquerFragment("a_revoir")}
                      className="border border-grege text-encre font-sans text-sm px-5 py-2 hover:border-amber-700 transition-colors"
                    >
                      À revoir
                    </button>
                  </div>
                </div>
              ) : (
                <p className="font-sans text-sm text-petrole">
                  {statutFragment === "valide"
                    ? "Noté — vous pourrez toujours le relire et le corriger depuis votre parcours."
                    : "Noté — retrouvez-le dans votre parcours pour le corriger ou le recomposer."}
                </p>
              )}

              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={copierFragment}
                  className="border border-grege text-encre font-sans text-sm px-6 py-3 hover:border-grege transition-colors"
                >
                  {copie ? "Copié ✓" : "Copier le texte"}
                </button>
                {modeInvite ? (
                  <button
                    onClick={continuerVersPaiement}
                    disabled={redirectionPaiement}
                    className="inline-block bg-encre text-blanc rounded-full font-sans font-medium text-base px-8 py-3 hover:bg-[#3A3632] transition-colors disabled:opacity-40"
                  >
                    {redirectionPaiement ? "Un instant…" : "Continuer mon histoire →"}
                  </button>
                ) : (
                  <a
                    href="/tableau-de-bord"
                    className="inline-block bg-encre text-blanc rounded-full font-sans font-medium text-base px-8 py-3 hover:bg-[#3A3632] transition-colors"
                  >
                    Retour à mon parcours →
                  </a>
                )}
              </div>

              <p className="font-sans text-xs text-grege max-w-md mx-auto">
                {modeInvite
                  ? "Cette séance est déjà enregistrée. Continuez pour garder votre histoire et poursuivre le récit."
                  : "Cette séance est enregistrée dans votre parcours."}
              </p>
              {error && <p className="font-sans text-sm text-red-700">{error}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
