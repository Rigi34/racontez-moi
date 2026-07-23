"use client";

import { useState, useEffect } from "react";

type Adresse = {
  nom: string;
  adresse: string;
  ville: string;
  code_postal: string;
  pays: string;
  telephone: string;
};

const ADRESSE_VIDE: Adresse = { nom: "", adresse: "", ville: "", code_postal: "", pays: "FR", telephone: "" };

export default function FormulaireAdresse() {
  const [valeurs, setValeurs] = useState<Adresse>(ADRESSE_VIDE);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/compte/adresse");
        const data = await res.json();
        if (data.adresse) setValeurs(data.adresse);
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  const champ = (cle: keyof Adresse) => ({
    value: valeurs[cle],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValeurs((v) => ({ ...v, [cle]: e.target.value })),
  });

  const enregistrer = async () => {
    setEnregistrement(true);
    setError("");
    setConfirmation("");
    try {
      const res = await fetch("/api/compte/adresse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valeurs),
      });
      if (!res.ok) throw new Error();
      setConfirmation("Adresse enregistrée.");
      setTimeout(() => setConfirmation(""), 2500);
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setEnregistrement(false);
    }
  };

  if (chargement) return <p className="font-sans text-sm text-grege">Un instant…</p>;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <input
          {...champ("nom")}
          placeholder="Nom complet"
          className="bg-blanc border border-grege font-sans text-sm p-3 focus:outline-none focus:border-encre"
        />
        <input
          {...champ("telephone")}
          placeholder="Téléphone"
          className="bg-blanc border border-grege font-sans text-sm p-3 focus:outline-none focus:border-encre"
        />
        <input
          {...champ("adresse")}
          placeholder="Adresse"
          className="bg-blanc border border-grege font-sans text-sm p-3 sm:col-span-2 focus:outline-none focus:border-encre"
        />
        <input
          {...champ("code_postal")}
          placeholder="Code postal"
          className="bg-blanc border border-grege font-sans text-sm p-3 focus:outline-none focus:border-encre"
        />
        <input
          {...champ("ville")}
          placeholder="Ville"
          className="bg-blanc border border-grege font-sans text-sm p-3 focus:outline-none focus:border-encre"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={enregistrer}
          disabled={enregistrement}
          className="font-sans text-sm bg-encre text-blanc px-5 py-2.5 hover:bg-[#3A3632] transition-colors disabled:opacity-40"
        >
          {enregistrement ? "Enregistrement…" : "Enregistrer l'adresse"}
        </button>
        {confirmation && <span className="font-sans text-xs text-petrole">{confirmation}</span>}
      </div>
      {error && <p className="font-sans text-sm text-red-700">{error}</p>}
    </div>
  );
}
