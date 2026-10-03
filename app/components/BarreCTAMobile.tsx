"use client";

import { useEffect, useState } from "react";

// Bouton persistant discret, mobile uniquement — 02/10/2026 (étude « face au
// marché », priorité mobile). N'apparaît qu'après le premier écran, et
// disparaît dès que la cible (la séance d'essai) est à l'écran : jamais deux
// appels à l'action superposés.
export default function BarreCTAMobile({
  cible = "premiere-question",
  libelle = "Commencer — première séance offerte",
}: {
  cible?: string;
  libelle?: string;
}) {
  const [apresHero, setApresHero] = useState(false);
  const [cibleVisible, setCibleVisible] = useState(false);

  useEffect(() => {
    const surDefilement = () => setApresHero(window.scrollY > window.innerHeight * 0.9);
    surDefilement();
    window.addEventListener("scroll", surDefilement, { passive: true });

    const element = document.getElementById(cible);
    let observateur: IntersectionObserver | null = null;
    if (element) {
      observateur = new IntersectionObserver(([entree]) => setCibleVisible(entree.isIntersecting), {
        threshold: 0.05,
      });
      observateur.observe(element);
    }
    return () => {
      window.removeEventListener("scroll", surDefilement);
      observateur?.disconnect();
    };
  }, [cible]);

  const visible = apresHero && !cibleVisible;

  return (
    <div
      aria-hidden={!visible}
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 px-4 pt-3 bg-papier/95 backdrop-blur border-t border-grege/20 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <a
        href={`#${cible}`}
        tabIndex={visible ? 0 : -1}
        className="block w-full text-center bg-encre text-blanc rounded-full font-sans font-medium text-base px-6 py-3"
      >
        {libelle}
      </a>
    </div>
  );
}
