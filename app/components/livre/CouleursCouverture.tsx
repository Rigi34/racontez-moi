"use client";

import Image from "next/image";
import { useState } from "react";
import { COULEURS_COUVERTURE, COUVERTURE } from "./donnees";

// Les quatre couleurs de couverture réellement proposées dans /mon-livre,
// montrées avec les vrais rendus du moteur. Pas de saisie de titre ici : le
// rendu dans le navigateur ne serait pas celui du moteur (police différente).
export default function CouleursCouverture() {
  const [choix, setChoix] = useState(0);
  const couleur = COULEURS_COUVERTURE[choix];
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-full max-w-[240px] aspect-[1225/1850] shadow-[6px_6px_0px_#DAD4C5]">
        {COULEURS_COUVERTURE.map((c, i) => (
          <Image
            key={c.cle}
            src={c.src}
            alt={`Couverture ${c.label.toLowerCase()} du livre d'exemple`}
            width={COUVERTURE.largeur}
            height={COUVERTURE.hauteur}
            sizes="240px"
            className={`absolute inset-0 w-full h-full transition-opacity duration-500 motion-reduce:transition-none ${
              i === choix ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== choix}
          />
        ))}
      </div>
      <div role="radiogroup" aria-label="Couleur de couverture" className="flex gap-3">
        {COULEURS_COUVERTURE.map((c, i) => (
          <button
            key={c.cle}
            type="button"
            role="radio"
            aria-checked={i === choix}
            aria-label={c.label}
            onClick={() => setChoix(i)}
            className={`h-11 w-11 rounded-full border-2 transition-colors ${
              i === choix ? "border-encre" : "border-transparent"
            } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ambre`}
          >
            <span
              className="block h-8 w-8 mx-auto rounded-full ring-1 ring-inset ring-black/10"
              style={{ backgroundColor: c.hex }}
            />
          </button>
        ))}
      </div>
      <p className="font-sans text-sm text-grege" aria-live="polite">
        {couleur.label}
      </p>
    </div>
  );
}
