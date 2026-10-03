"use client";

import { useEffect, useMemo, useState } from "react";
import { TEXTE_CONSENTEMENT_VOIX, VERSION_CONSENTEMENT_VOIX } from "@/lib/voix";

// Fin de séance (chantier VOIX-CHOISIE) : le narrateur réécoute ses réponses
// et peut en garder UNE pour le passage qui vient d'être composé. Les
// enregistrements sont restés dans le navigateur ; rien n'est envoyé tant
// qu'il n'a pas choisi et coché le consentement. « Ne rien garder » les
// oublie définitivement.

export type Enregistrement = { blob: Blob; etape: "question" | "relance" | "relance2" };

const LIBELLES: Record<Enregistrement["etape"], string> = {
  question: "Votre réponse",
  relance: "Après la première relance",
  relance2: "Après la seconde relance",
};

export default function ChoixVoix({ fragmentId, enregistrements }: { fragmentId: string; enregistrements: Enregistrement[] }) {
  const [etat, setEtat] = useState<"choix" | "envoi" | "garde" | "refuse">("choix");
  const [consenti, setConsenti] = useState(false);
  const [erreur, setErreur] = useState("");

  const urls = useMemo(() => enregistrements.map((e) => URL.createObjectURL(e.blob)), [enregistrements]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  if (!enregistrements.length || etat === "refuse") return null;

  const garder = async (index: number) => {
    if (!consenti) {
      setErreur("Cochez d'abord la case d'accord ci-dessous.");
      return;
    }
    setEtat("envoi");
    setErreur("");
    try {
      const { blob } = enregistrements[index];
      const form = new FormData();
      form.append("audio", blob, "voix");
      form.append("fragment_id", fragmentId);
      form.append("consentement", VERSION_CONSENTEMENT_VOIX);
      const res = await fetch("/api/voix", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "");
      setEtat("garde");
    } catch (e) {
      setErreur((e as Error).message || "L'enregistrement n'a pas pu être gardé. Réessayez.");
      setEtat("choix");
    }
  };

  if (etat === "garde") {
    return (
      <p className="font-sans text-sm text-petrole text-center">
        Votre voix est gardée pour ce passage. Vous pourrez la réécouter ou la supprimer depuis votre parcours.
      </p>
    );
  }

  return (
    <div className="border border-grege/40 bg-blanc px-6 py-6 space-y-5 text-left max-w-xl mx-auto">
      <div className="space-y-2">
        <p className="font-display text-xl text-encre">Garder votre voix pour ce passage ?</p>
        <p className="font-serif text-base text-encre/80 leading-relaxed">
          Si vous le souhaitez, un de vos enregistrements peut être conservé. Vous pourrez le réécouter, et vos
          proches l&apos;entendront en scannant un petit code imprimé dans votre livre. Rien n&apos;est gardé sans
          votre accord.
        </p>
      </div>

      <ul className="space-y-4">
        {enregistrements.map((e, i) => (
          <li key={i} className="space-y-2">
            <p className="font-sans text-xs tracking-widest uppercase text-grege">{LIBELLES[e.etape]}</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <audio controls preload="metadata" src={urls[i]} className="w-full sm:flex-1" />
              <button
                onClick={() => garder(i)}
                disabled={etat === "envoi"}
                className="shrink-0 border border-encre text-encre font-sans text-sm px-4 py-2 rounded-full hover:bg-encre hover:text-blanc transition-colors disabled:opacity-40"
              >
                {etat === "envoi" ? "Un instant…" : "Garder celui-ci"}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <label className="flex gap-3 items-start font-sans text-sm text-encre/80 leading-relaxed cursor-pointer">
        <input type="checkbox" checked={consenti} onChange={(e) => setConsenti(e.target.checked)} className="mt-1 shrink-0" />
        <span>{TEXTE_CONSENTEMENT_VOIX}</span>
      </label>

      {erreur && <p className="font-sans text-sm text-red-700">{erreur}</p>}

      <button
        onClick={() => setEtat("refuse")}
        className="font-sans text-sm text-grege underline underline-offset-4 hover:text-encre transition-colors"
      >
        Ne rien garder
      </button>
    </div>
  );
}
