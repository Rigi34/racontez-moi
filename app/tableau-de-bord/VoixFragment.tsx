"use client";

import { useEffect, useState } from "react";
import { voixChoisieActive } from "@/lib/voix";
import { enregistrementsEnAttente } from "@/lib/voix-locale";
import ChoixVoix, { type Enregistrement } from "@/app/components/ChoixVoix";

// Extrait de voix gardé pour un passage (chantier VOIX-CHOISIE) : écoute,
// suppression, et activation/désactivation de l'écoute par QR code. Rien ne
// s'affiche si aucun extrait n'a été gardé, ni si l'interrupteur est coupé —
// sauf des enregistrements restés sans choix sur cet appareil (onglet
// rechargé en fin de séance, cf. lib/voix-locale.ts) : le choix est alors
// proposé ici.

type Extrait = { id: string; url: string | null; actif: boolean };

export default function VoixFragment({ fragmentId }: { fragmentId: string }) {
  const actif = voixChoisieActive();
  const [extrait, setExtrait] = useState<Extrait | null>(null);
  const [confirmation, setConfirmation] = useState(false);
  const [erreur, setErreur] = useState("");
  const [enAttente, setEnAttente] = useState<Enregistrement[]>([]);

  useEffect(() => {
    if (!actif) return;
    (async () => {
      try {
        const res = await fetch(`/api/voix?fragment_id=${fragmentId}`);
        if (!res.ok) return;
        const data = await res.json();
        const garde = data.extraits?.[0] ?? null;
        setExtrait(garde);
        if (!garde) setEnAttente(await enregistrementsEnAttente(fragmentId));
      } catch {
        // Silencieux : l'absence d'extrait n'empêche rien d'autre.
      }
    })();
  }, [actif, fragmentId]);

  if (!actif) return null;
  if (!extrait) {
    return enAttente.length ? (
      <div className="border-t border-grege/30 pt-4">
        <ChoixVoix fragmentId={fragmentId} enregistrements={enAttente} />
      </div>
    ) : null;
  }

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
          // Test du 31/10/2026 : le « Oui » en simple lien passait inaperçu.
          <span className="flex flex-wrap gap-3 items-center font-sans text-base">
            <span className="text-encre w-full">Supprimer définitivement cet extrait ?</span>
            <button
              onClick={supprimer}
              className="bg-red-700 text-blanc rounded-full font-medium px-6 py-3 min-h-12 hover:bg-red-800 transition-colors"
            >
              Oui, supprimer
            </button>
            <button
              onClick={() => setConfirmation(false)}
              className="border border-grege text-encre rounded-full px-6 py-3 min-h-12 hover:border-encre transition-colors"
            >
              Annuler
            </button>
          </span>
        )}
      </div>
      {erreur && <p className="font-sans text-sm text-red-700">{erreur}</p>}
    </div>
  );
}
