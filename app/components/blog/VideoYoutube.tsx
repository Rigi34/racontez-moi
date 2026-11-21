"use client";

import { useState } from "react";

/**
 * Vidéo YouTube intégrée à un article.
 * Avant le clic : seule la vignette servie par le site s'affiche, aucune
 * requête vers YouTube ni Google, donc aucun cookie. Au clic : le lecteur
 * youtube-nocookie se charge et démarre.
 */
export default function VideoYoutube({
  youtube,
  titre,
  vignette,
  duree,
}: {
  youtube: string;
  titre: string;
  vignette: string;
  duree: string;
}) {
  const [lancee, setLancee] = useState(false);

  return (
    <figure className="my-12">
      <div className="relative aspect-video w-full overflow-hidden rounded-[22px] bg-encre">
        {lancee ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1&rel=0`}
            title={titre}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setLancee(true)}
            className="group absolute inset-0 h-full w-full"
            aria-label={`Regarder la vidéo : ${titre} (${duree})`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={vignette}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-blanc/90 shadow-lg transition-transform group-hover:scale-105">
                <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9 fill-encre" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-3 font-sans text-sm text-grege">
        Version vidéo ({duree}). La lecture se fait sur YouTube et ne démarre
        qu&apos;au clic.
      </figcaption>
    </figure>
  );
}
