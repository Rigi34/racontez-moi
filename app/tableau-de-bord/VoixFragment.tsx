"use client";

import { useEffect, useState } from "react";
import { voixChoisieActive } from "@/lib/voix";

// Extrait de voix gardé pour un passage (chantier VOIX-CHOISIE) : écoute,
// suppression, et activation/désactivation de l'écoute par QR code. Rien ne
// s'affiche si aucun extrait n'a été gardé, ni si l'interrupteur est coupé.

type Extrait = { id: string; url: string | null; actif: boolean };

export default function VoixFragment({ fragmentId }: { fragmentId: string }) {
  const actif = voixChoisieActive();
  const [extrait, setExtrait] = useState<Extrait | null>(null);
  const [confirmation, setConfirmation] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!actif) return;
    (async () => {
      try {
        const res = await fetch(`/api/voix?fragment_id=${fragmentId}`);
        if (!res.ok) return;
        const data = await res.json();
        setExtrait(data.extraits?.[0] ?? null);
      } catch {
        // Silencieux : l'absence d'extrait n'empêche rien d'autre.
      }
    })();
  }, [actif, fragmentId]);

  if (!actif || !extrait) return null;

  const supprimer = async () => {
    setErreur("");
    const res = await fetch(`/api/voix/${extrait.id}`, { method: "DELETE" });
    if (!res.ok) {
      setErreur("La suppression a échoué. Réessayez.");
      return;
    }
    setExtrait(null);
  };

  const basculerQr = async () => {
    setErreur("");
    const res = await fetch(`/api/voix/${extrait.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !extrait.actif }),
    });
    if (!res.ok) {
      setErreur("La modification a échoué. Réessayez.");
      return;
    }
    setExtrait({ ...extrait, actif: !extrait.actif });
  };

  return (
    <div className="space-y-2 border-t border-grege/30 pt-4">
      <p className="font-sans text-xs tracking-widest uppercase text-grege">Votre voix pour ce passage</p>
      {extrait.url && <audio controls preload="metadata" src={extrait.url} className="w-full" />}
      <p className="font-sans text-xs text-grege">
        {extrait.actif
          ? "Vos proches pourront l'écouter en scannant le code imprimé à la fin de ce passage dans le livre."
          : "Écoute par QR code désactivée : le code imprimé ne renvoie plus rien."}
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={basculerQr}
          className="font-sans text-sm border border-grege text-encre px-4 py-2 hover:border-encre transition-colors"
        >
          {extrait.actif ? "Désactiver l'écoute par QR code" : "Réactiver l'écoute par QR code"}
        </button>
        {!confirmation ? (
          <button
            onClick={() => setConfirmation(true)}
            className="font-sans text-sm text-red-700 border border-red-200 px-4 py-2 hover:border-red-700 transition-colors"
          >
            Supprimer cet extrait
          </button>
        ) : (
          <span className="flex gap-2 items-center font-sans text-sm">
            <span className="text-encre">Supprimer définitivement ?</span>
            <button onClick={supprimer} className="text-red-700 underline underline-offset-4">Oui</button>
            <button onClick={() => setConfirmation(false)} className="text-grege underline underline-offset-4">Annuler</button>
          </span>
        )}
      </div>
      {erreur && <p className="font-sans text-sm text-red-700">{erreur}</p>}
    </div>
  );
}
