"use client";

import { useRef, useState } from "react";
import { PASSAGE_LU } from "./donnees";

// Passage du livre d'exemple lu à voix haute (02/11/2026, demande de Régis) :
// « ce livre se lit, et il s'écoute ». Rien n'est chargé avant le clic
// (preload="none"), rien ne démarre seul. Deux présentations : une pastille
// sous le livre du premier écran, et un bloc avec le texte dans « Votre
// histoire, reliée. ».

function couperLesAutres(courant: HTMLMediaElement) {
  document.querySelectorAll("audio, video").forEach((m) => {
    if (m !== courant) (m as HTMLMediaElement).pause();
  });
}

function useLecteur() {
  const audio = useRef<HTMLAudioElement>(null);
  const [enLecture, setEnLecture] = useState(false);
  const basculer = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      couperLesAutres(a);
      void a.play();
    } else {
      a.pause();
    }
  };
  const lecteur = (
    <audio
      ref={audio}
      src={PASSAGE_LU.src}
      preload="none"
      onPlay={() => setEnLecture(true)}
      onPause={() => setEnLecture(false)}
      onEnded={() => setEnLecture(false)}
    />
  );
  return { enLecture, basculer, lecteur };
}

function Onde({ enLecture }: { enLecture: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`onde-pastille ${enLecture ? "" : "onde-pastille--pause"} flex h-[18px] items-end gap-[3px]`}
    >
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

export function PastillePassage() {
  const { enLecture, basculer, lecteur } = useLecteur();
  return (
    <div className="mt-5 flex justify-center lg:justify-end">
      {lecteur}
      <button
        type="button"
        onClick={basculer}
        aria-pressed={enLecture}
        className="inline-flex items-center gap-3 rounded-full border border-grege/20 bg-blanc py-2 pl-2 pr-5 text-left text-encre hover:border-grege/40 transition-colors duration-200"
      >
        <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-ambre text-blanc text-xs">
          {enLecture ? "❚❚" : "▶"}
        </span>
        <span className="flex flex-col leading-tight">
          <span className="font-sans text-sm font-semibold">
            {enLecture ? "Mettre en pause" : "Ce livre s'écoute aussi"}
          </span>
          <span className="font-sans text-xs text-grege">Un passage lu à voix haute, {PASSAGE_LU.duree}</span>
        </span>
        <Onde enLecture={enLecture} />
      </button>
    </div>
  );
}

export function BlocPassage({ avecQr }: { avecQr: boolean }) {
  const { enLecture, basculer, lecteur } = useLecteur();
  return (
    <figure id="passage-lu" className="mt-14 rounded-[22px] bg-ambre-clair p-6 md:p-9 scroll-mt-6">
      {lecteur}
      <div className="grid gap-8 md:grid-cols-[260px_1fr] md:gap-12 items-start">
        <div>
          <p className="font-sans text-xs tracking-widest uppercase text-ambre-texte mb-3">À écouter</p>
          <p className="font-display text-2xl leading-snug text-encre mb-4 text-balance">
            Ce livre se lit, <em className="italic text-ambre-texte">et il s&apos;écoute.</em>
          </p>
          <p className="font-sans text-sm leading-relaxed text-encre/75 mb-5">{PASSAGE_LU.contexte}</p>
          <button
            type="button"
            onClick={basculer}
            aria-pressed={enLecture}
            className="inline-flex items-center gap-3 rounded-full bg-encre py-2 pl-2 pr-5 text-blanc hover:bg-[#3A3632] transition-colors duration-200"
          >
            <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-ambre text-blanc text-xs">
              {enLecture ? "❚❚" : "▶"}
            </span>
            <span className="font-sans text-sm font-medium">
              {enLecture ? "Mettre en pause" : `Écouter (${PASSAGE_LU.duree})`}
            </span>
          </button>
        </div>
        <blockquote className="font-serif text-lg leading-[1.8] text-encre space-y-4 md:border-l md:border-ambre/40 md:pl-8">
          {PASSAGE_LU.texte.map((p) => (
            <p key={p.slice(0, 20)}>{p}</p>
          ))}
        </blockquote>
      </div>
      <figcaption className="mt-6 font-sans text-[11px] text-grege tracking-wide">
        {PASSAGE_LU.mention}
        {avecQr && " Dans le livre, un QR code sous le souvenir permet de réentendre la voix."}
      </figcaption>
    </figure>
  );
}
