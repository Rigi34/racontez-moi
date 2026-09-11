"use client";

import { useState } from "react";

export default function GestionCompte() {
  const [confirmation, setConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const exporter = () => {
    window.location.href = "/api/compte/export";
  };

  const supprimer = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/compte/supprimer", { method: "POST" });
      if (!res.ok) throw new Error();
      window.location.href = "/";
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer, ou nous écrire via /contact.");
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-grege/30 pt-8 space-y-4">
      <p className="font-sans text-xs text-grege tracking-wider uppercase">Mes données</p>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={exporter}
          className="font-sans text-sm border border-grege text-encre px-5 py-2.5 hover:border-encre transition-colors"
        >
          Télécharger mes données
        </button>
        {/* Remboursement traité manuellement (pas de flux applicatif) — le
            lien évite juste d'avoir à chercher comment nous contacter.
            Portée de la garantie : intégral, sans justification, tant que
            "commander mon livre" n'a pas été cliqué (décision du
            11/09/2026). La révocation d'accès au remboursement est gérée
            côté webhook Stripe (charge.refunded), pas ici. */}
        <a
          href="mailto:rigi34000@gmail.com?subject=Demande%20de%20remboursement%20%E2%80%94%20Le%20Parcours&body=Bonjour%2C%0A%0AJe%20souhaite%20demander%20le%20remboursement%20de%20mon%20Parcours.%0A%0AEmail%20du%20compte%20%3A%20%0A"
          className="font-sans text-sm border border-grege text-encre px-5 py-2.5 hover:border-encre transition-colors"
        >
          Demander un remboursement
        </a>
        {!confirmation ? (
          <button
            onClick={() => setConfirmation(true)}
            className="font-sans text-sm text-red-700 border border-red-200 px-5 py-2.5 hover:border-red-700 transition-colors"
          >
            Supprimer mon compte
          </button>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <p className="font-sans text-sm text-encre">
              Supprimer définitivement votre compte et toutes vos séances ?
            </p>
            <button
              onClick={supprimer}
              disabled={loading}
              className="font-sans text-sm bg-red-700 text-blanc px-5 py-2.5 hover:bg-red-800 transition-colors disabled:opacity-40"
            >
              {loading ? "Suppression…" : "Oui, tout supprimer"}
            </button>
            <button
              onClick={() => setConfirmation(false)}
              className="font-sans text-sm text-grege px-3 py-2.5"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
      {error && <p className="font-sans text-sm text-red-700">{error}</p>}
    </div>
  );
}
