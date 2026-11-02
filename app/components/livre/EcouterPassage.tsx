"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { PAGE, PASSAGE_LU } from "./donnees";

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

// 02/11/2026 (retour de Régis) : l'encart montre la page du livre où se trouve
// ce souvenir (photo du vélo) et le QR code qui, dans le livre, fait entendre
// la voix. Le QR est réel : scanné, il lance ce passage. Généré côté serveur
// (lib/qr) et transmis en SVG. Affiché dès maintenant (décision de Régis).
export function BlocPassage({ qr }: { qr: string }) {
  const { enLecture, basculer, lecteur } = useLecteur();
  return (
    <figure id="passage-lu" className="mt-14 rounded-[22px] bg-ambre-clair p-6 md:p-9 scroll-mt-6">
      {lecteur}
      <div className="max-w-2xl">
        <p className="font-sans text-xs tracking-widest uppercase text-ambre-texte mb-3">À écouter</p>
        <p className="font-display text-2xl md:text-3xl leading-snug text-encre mb-4 text-balance">
          Ce livre se lit, <em className="italic text-ambre-texte">et il s&apos;écoute.</em>
        </p>
        <p className="font-serif text-base leading-relaxed text-encre/85">
          Sous un souvenir, un QR code&nbsp;: on le scanne avec un téléphone, et on entend la voix
          qui le raconte. Ici, le souvenir de la page avec la photo du vélo&nbsp;: {PASSAGE_LU.contexte}
        </p>
      </div>

      <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,300px)_1fr] md:gap-12 items-start">
        <div className="flex items-end gap-4">
          <Image
            src={PASSAGE_LU.page}
            alt="Page du livre d'exemple avec la photo du vélo dans l'allée, au milieu du souvenir"
            width={PAGE.largeur}
            height={PAGE.hauteur}
            sizes="170px"
            className="w-[150px] md:w-[170px] h-auto bg-blanc ring-1 ring-grege/25 shadow-[4px_4px_0px_#DAD4C5]"
          />
          <div className="flex flex-col items-center gap-2">
            <div
              role="img"
              aria-label="QR code qui fait entendre ce souvenir"
              className="w-24 md:w-28 bg-blanc p-1.5 ring-1 ring-grege/25"
              dangerouslySetInnerHTML={{ __html: qr }}
            />
            <p className="font-sans text-[11px] leading-tight text-encre/70 text-center">
              Scannez
              <br />
              pour écouter
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <button
            type="button"
            onClick={basculer}
            aria-pressed={enLecture}
            className="mb-6 inline-flex items-center gap-3 rounded-full bg-encre py-2 pl-2 pr-5 text-blanc hover:bg-[#3A3632] transition-colors duration-200"
          >
            <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-ambre text-blanc text-xs">
              {enLecture ? "❚❚" : "▶"}
            </span>
            <span className="font-sans text-sm font-medium">
              {enLecture ? "Mettre en pause" : `Écouter ce souvenir (${PASSAGE_LU.duree})`}
            </span>
          </button>
          <blockquote className="font-serif text-lg leading-[1.8] text-encre space-y-4 md:border-l md:border-ambre/40 md:pl-8">
            {PASSAGE_LU.texte.map((p) => (
              <p key={p.slice(0, 20)}>{p}</p>
            ))}
          </blockquote>
        </div>
      </div>
      <figcaption className="mt-6 font-sans text-[11px] text-grege tracking-wide">{PASSAGE_LU.mention}</figcaption>
    </figure>
  );
}
