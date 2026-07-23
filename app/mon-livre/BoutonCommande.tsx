"use client";

import { useState } from "react";

export default function BoutonCommande({ adresseRemplie }: { adresseRemplie: boolean }) {
  const [confirmation, setConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<"ok" | "erreur" | null>(null);
  const [message, setMessage] = useState("");

  const commander = async () => {
    setLoading(true);
    setResultat(null);
    try {
      const res = await fetch("/api/commande/livre", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setResultat("erreur");
        setMessage(data.error ?? "Une erreur s'est produite.");
        return;
      }
      setResultat("ok");
      setMessage(`Commande envoyée — ${data.nombre_pages} pages.`);
    } catch {
      setResultat("erreur");
      setMessage("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
      setConfirmation(false);
    }
  };

  if (resultat === "ok") {
    return <p className="font-sans text-sm text-petrole">{message}</p>;
  }

  return (
    <div className="space-y-3">
      {!adresseRemplie ? (
        <p className="font-sans text-sm text-grege">Renseignez votre adresse de livraison avant de commander.</p>
      ) : !confirmation ? (
        <button
          onClick={() => setConfirmation(true)}
          className="font-sans text-sm bg-encre text-blanc rounded-full px-6 py-3 hover:bg-[#3A3632] transition-colors"
        >
          Valider mon livre pour impression →
        </button>
      ) : (
        <div className="bg-sauge border border-grege p-5 space-y-3">
          <p className="font-sans text-sm text-encre">
            Une fois validé, votre manuscrit et votre couverture sont envoyés à l&apos;impression tels quels — vérifiez l&apos;aperçu PDF ci-dessus avant de confirmer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={commander}
              disabled={loading}
              className="font-sans text-sm bg-encre text-blanc px-5 py-2.5 hover:bg-[#3A3632] transition-colors disabled:opacity-40"
            >
              {loading ? "Envoi en cours…" : "Oui, imprimer mon livre"}
            </button>
            <button onClick={() => setConfirmation(false)} className="font-sans text-sm text-grege px-3 py-2.5">
              Annuler
            </button>
          </div>
        </div>
      )}
      {resultat === "erreur" && <p className="font-sans text-sm text-red-700">{message}</p>}
    </div>
  );
}
