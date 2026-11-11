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

// afficherReglages (lisibilité, 11/11/2026) : l'écoute reste toujours
// visible ; les réglages (QR, suppression) n'apparaissent qu'une fois « Plus
// d'options » ouvert sur la carte du souvenir.
export default function VoixFragment({
  fragmentId,
  afficherReglages = true,
}: {
  fragmentId: string;
  afficherReglages?: boolean;
}) {
  const actif = voixChoisieActive();
  const [extrait, setExtrait] = useState<Extrait | null>(null);
  const [confirmation, setConfirmation] = useState(false);
  const [erreur, setErreur] = useState("");
  const [enAttente, setEnAttente] = useState<Enregistrement[]>([]);

  const [rechargement, setRechargement] = useState(0);

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
  }, [actif, fragmentId, rechargement]);

  if (!actif) return null;
  if (!extrait) {
    return enAttente.length ? (
      <div className="border-t border-grege/30 pt-4">
        <ChoixVoix fragmentId={fragmentId} enregistrements={enAttente} onGarde={() => setRechargement((n) => n + 1)} />
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
      <p className="font-sans text-base font-semibold text-encre">Votre voix</p>
      {extrait.url && <audio controls preload="metadata" src={extrait.url} className="w-full" />}
      <p className="font-sans text-[15px] leading-relaxed text-encre/80">
        {extrait.actif
          ? "Vos proches pourront l'écouter grâce au code imprimé à la fin de ce souvenir, dans le livre."
          : "Écoute par QR code désactivée : le code imprimé ne renvoie plus rien."}
      </p>
      {afficherReglages && (
      <div className="space-y-2 pt-1">
        <button
          onClick={basculerQr}
          className="block w-full text-left font-sans bg-blanc border border-grege rounded-lg px-4 py-3 min-h-12 text-base font-medium text-encre hover:border-encre transition-colors"
        >
          {extrait.actif ? "Ne plus proposer l'écoute dans le livre" : "Proposer de nouveau l'écoute dans le livre"}
        </button>
        {!confirmation ? (
          <button
            onClick={() => setConfirmation(true)}
            className="block w-full text-left font-sans bg-blanc border border-red-200 rounded-lg px-4 py-3 min-h-12 text-base font-medium text-red-700 hover:border-red-700 transition-colors"
          >
            Supprimer l&apos;enregistrement de ma voix
          </button>
        ) : (
          // Test du 31/10/2026 : le « Oui » en simple lien passait inaperçu.
          <span className="flex flex-wrap gap-3 items-center font-sans text-base">
            <span className="text-encre w-full">Supprimer définitivement l&apos;enregistrement de votre voix ?</span>
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
      )}
      {erreur && <p className="font-sans text-sm text-red-700">{erreur}</p>}
    </div>
  );
}
