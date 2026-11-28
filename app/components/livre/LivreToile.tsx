"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { COULEURS_COUVERTURE, MENTION_EXEMPLE } from "./donnees";
import s from "./LivreToile.module.css";

// Le livre relié en toile avec jaquette (28/11/2026, décision de Régis) :
// une petite fenêtre animée en haut de l'accueil, qui s'ouvre en grand au
// toucher. Le livre est dessiné en CSS ; la jaquette est la vraie couverture
// du livre d'exemple rendue par le moteur. Aucune image de Lulu.
//
// Ce qui est vrai chez Lulu et montré ici (vérifié le 28/11/2026) : le titre
// est frappé sur le dos de la toile seulement, en capitales ; le plat de la
// toile reste nu ; la jaquette porte la couverture imprimée. Le dos de la
// jaquette est laissé uni : pour un livre de moins de 85 pages, il est trop
// fin pour un titre imprimé (cf. lib/couverture.ts).

const OR = "linear-gradient(100deg,#9C7A35 0%,#E8CF8E 38%,#B8913F 62%,#F3E2AE 80%,#A07D38 100%)";
const BLANC = "linear-gradient(100deg,#E9E6DF,#FFFFFF 45%,#E4E0D8)";
const TITRE_DOS = "LE FIGUIER AU FOND DU JARDIN";
const AUTEUR_DOS = "DANIEL";

type Couleur = (typeof COULEURS_COUVERTURE)[number];

export function detailCouleur(c: Couleur): string {
  return `Jaquette ${c.label.toLowerCase()} · toile ${c.toile.label} · titre ${c.dorure.label}`;
}

function Livre({ couleur, jaquette, dos, petit }: { couleur: Couleur; jaquette: boolean; dos: boolean; petit?: boolean }) {
  const style = {
    "--toile": couleur.toile.hex,
    "--dorure": couleur.dorure.code === "W" ? BLANC : OR,
    "--jaquette-dos": couleur.hex,
  } as CSSProperties;
  return (
    <div
      className={[s.livre, petit ? s.petit : "", dos ? s.dosVisible : "", jaquette ? "" : s.sansJaquette].join(" ")}
      style={style}
      aria-hidden="true"
    >
      <div className={`${s.face} ${s.arriere} ${s.toile}`} />
      <div className={`${s.face} ${s.tranche}`} />
      <div className={`${s.face} ${s.dessus}`} />
      <div className={`${s.face} ${s.plat} ${s.toile}`} />
      <div className={`${s.face} ${s.dos} ${s.toile}`}>
        <span className={s.titreDos}>{TITRE_DOS}</span>
        <span className={s.auteurDos}>{AUTEUR_DOS}</span>
      </div>
      <div className={s.jaquette}>
        <div className={`${s.face} ${s.jplat}`} style={{ backgroundImage: `url(${couleur.src})` }} />
        <div className={`${s.face} ${s.jdos}`} />
      </div>
    </div>
  );
}

const etiquette = "font-sans text-xs tracking-widest uppercase";

// Deux boutons côte à côte, l'actif en pétrole : on voit toujours l'état
// (retour de Régis : avec un seul bouton qui change de nom, on ne savait
// plus si la jaquette était mise ou non).
function Bascule({ legende, options, valeur, onChange }: { legende: string; options: [string, string]; valeur: 0 | 1; onChange: (v: 0 | 1) => void }) {
  return (
    <div role="radiogroup" aria-label={legende} className="inline-flex rounded-full bg-blanc/90 p-1 ring-1 ring-grege/25 shadow-sm">
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={valeur === i}
          onClick={() => onChange(i as 0 | 1)}
          className={`rounded-full px-3.5 py-1.5 font-sans text-[13px] transition-colors ${
            valeur === i ? "bg-petrole text-papier" : "text-encre hover:bg-papier"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function PresentationComplete({ fermer }: { fermer: () => void }) {
  const [i, setI] = useState(0);
  const [jaquette, setJaquette] = useState<0 | 1>(0);
  const [vue, setVue] = useState<0 | 1>(0);
  const couleur = COULEURS_COUVERTURE[i];
  return (
    <div className="grid md:grid-cols-[1.05fr_1fr] gap-6 md:gap-10 items-start">
      <div className="md:sticky md:top-0">
        <div className="relative rounded-[22px] bg-[radial-gradient(ellipse_at_50%_85%,rgba(36,34,32,.13),transparent_60%),linear-gradient(180deg,#EFEAE0,#E6DFD1)]">
          <div className={`${s.scene} h-[330px] md:h-[520px]`}>
            <div className={s.ombre} />
            <Livre couleur={couleur} jaquette={jaquette === 0} dos={vue === 1} />
          </div>
          <p className="absolute left-4 top-4 rounded-full bg-blanc/90 px-3 py-1 font-sans text-xs text-encre" aria-live="polite">
            {jaquette === 0 ? "Avec la jaquette imprimée" : "La toile, sans la jaquette"}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Bascule legende="Jaquette" options={["Avec jaquette", "Sans jaquette"]} valeur={jaquette} onChange={setJaquette} />
          <Bascule legende="Vue" options={["De face", "Le dos"]} valeur={vue} onChange={setVue} />
        </div>
        <p className="mt-2 font-sans text-xs text-grege">Le dos : le côté de la reliure, celui qu&apos;on voit dans une bibliothèque.</p>
      </div>

      <div>
        <p className={`${etiquette} text-ambre-texte`}>Le livre</p>
        <h2 className="font-display font-light text-3xl md:text-4xl leading-tight text-encre mt-2 mb-3">Relié en toile, titré sur le dos</h2>
        <p className="font-serif text-lg leading-relaxed text-encre/85">
          Une couverture rigide habillée de toile, le titre frappé à chaud sur le dos, et une jaquette imprimée pour la
          protéger. Un livre fait pour durer, et pour passer de main en main.
        </p>

        <p className={`${etiquette} text-grege mt-7 mb-2`}>Couleur du livre</p>
        <p className="font-display text-2xl text-encre">{couleur.label}</p>
        <p className="font-sans text-[13px] text-grege mb-3">{detailCouleur(couleur)}</p>
        <div role="radiogroup" aria-label="Couleur du livre" className="flex flex-wrap gap-3">
          {COULEURS_COUVERTURE.map((c, k) => (
            <button
              key={c.cle}
              type="button"
              role="radio"
              aria-checked={k === i}
              aria-label={`${c.label} : ${detailCouleur(c)}`}
              onClick={() => setI(k)}
              className={`flex h-14 w-14 overflow-hidden rounded-[13px] shadow-[0_6px_14px_-8px_rgba(0,0,0,.4)] outline-offset-4 ${
                k === i ? "outline-2 outline-ambre outline" : ""
              }`}
            >
              <span className="flex-1" style={{ backgroundColor: c.hex }} />
              <span className="relative flex-1" style={{ backgroundColor: c.toile.hex }}>
                <span
                  className="absolute left-[44%] top-[22%] bottom-[22%] w-[2px]"
                  style={{ background: c.dorure.code === "W" ? BLANC : OR }}
                />
              </span>
            </button>
          ))}
        </div>

        <dl className="mt-7 divide-y divide-grege/20 border-y border-grege/20">
          {[
            ["Couverture", "Rigide, recouverte de toile (coton et polyester, vernis protecteur)"],
            ["Titre", "Frappé à chaud sur le dos, en lettres capitales"],
            ["Jaquette", "Imprimée en couleur, assortie à la toile"],
            ["Format", "15 × 23 cm, intérieur en couleur sur papier blanc"],
          ].map(([t, d]) => (
            <div key={t} className="grid grid-cols-[110px_1fr] gap-4 py-2.5">
              <dt className={`${etiquette} text-grege pt-1 text-[11px]`}>{t}</dt>
              <dd className="font-serif text-base leading-relaxed text-encre">{d}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 font-sans text-[11px] leading-relaxed text-grege">
          {MENTION_EXEMPLE}. Teintes de toile indicatives : le grain et la couleur réels varient selon la lumière.
        </p>
        <button type="button" onClick={fermer} className="mt-5 font-sans text-sm underline underline-offset-4 text-petrole">
          Fermer
        </button>
      </div>
    </div>
  );
}

// Petite fenêtre du premier écran : le livre s'anime seul (jaquette, toile,
// dos, puis couleur suivante) ; rien ne bouge si le visiteur a demandé moins
// d'animations.
export default function VignetteLivreToile() {
  const [etape, setEtape] = useState(0);
  const [i, setI] = useState(0);
  const [ouvert, setOuvert] = useState(false);
  const dialogue = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (ouvert || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setEtape((e) => {
        const n = (e + 1) % 5;
        if (n === 0) setI((k) => (k + 1) % COULEURS_COUVERTURE.length);
        return n;
      });
    }, 2600);
    return () => clearInterval(id);
  }, [ouvert]);

  useEffect(() => {
    const d = dialogue.current;
    if (!d) return;
    if (ouvert && !d.open) d.showModal();
    if (!ouvert && d.open) d.close();
  }, [ouvert]);

  // Étapes : 0 jaquette de face, 1 toile de face, 2 toile de dos,
  // 3 toile de face, 4 retour de la jaquette.
  const jaquette = etape === 0 || etape === 4;
  const dos = etape === 2;

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="group relative block w-full rounded-[26px] bg-petrole-clair transition hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-22px_rgba(31,75,76,.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ambre"
        aria-haspopup="dialog"
        aria-label="Découvrir le livre relié en toile"
      >
        <div className={`${s.scene} h-[330px] sm:h-[380px]`}>
          <div className={s.ombre} />
          <Livre couleur={COULEURS_COUVERTURE[i]} jaquette={jaquette} dos={dos} petit />
        </div>
        <span className="absolute left-5 bottom-4 rounded-full bg-blanc/85 px-3 py-1.5 font-sans text-xs text-petrole">
          Toucher pour découvrir ↗
        </span>
      </button>

      <dialog
        ref={dialogue}
        onClose={() => setOuvert(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOuvert(false);
        }}
        aria-label="Le livre relié en toile"
        className="m-auto w-[min(1100px,94vw)] max-h-[92vh] rounded-[22px] bg-papier p-0 text-encre shadow-[0_40px_90px_-30px_rgba(0,0,0,.5)] backdrop:bg-[rgba(23,57,58,.55)] backdrop:backdrop-blur-sm"
      >
        <div className="relative p-5 md:p-9">
          <button
            type="button"
            onClick={() => setOuvert(false)}
            aria-label="Fermer"
            className="absolute right-3 top-3 z-10 h-10 w-10 rounded-full bg-blanc text-xl shadow-[0_4px_14px_rgba(0,0,0,.15)]"
          >
            ×
          </button>
          {ouvert && <PresentationComplete fermer={() => setOuvert(false)} />}
        </div>
      </dialog>
    </>
  );
}
