"use client";

import { useState, useEffect } from "react";
import { PALETTE_COUVERTURE, texteDorure } from "@/lib/couverture";

type Personnalisation = { titre: string; sousTitre: string; couleurCle: string };

const PERSONNALISATION_VIDE: Personnalisation = { titre: "", sousTitre: "", couleurCle: "petrole" };

// 28/11/2026 : palette lue directement dans lib/couverture.ts (fichier sans
// dépendance serveur) plutôt que recopiée ; chaque couleur fixe aussi la
// toile et le titre frappé sur le dos.
const PALETTE = PALETTE_COUVERTURE;

export default function FormulaireCouverture() {
  const [valeurs, setValeurs] = useState<Personnalisation>(PERSONNALISATION_VIDE);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/compte/personnalisation");
        const data = await res.json();
        if (data.personnalisation) setValeurs(data.personnalisation);
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  const enregistrer = async () => {
    setEnregistrement(true);
    setError("");
    setConfirmation("");
    try {
      const res = await fetch("/api/compte/personnalisation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valeurs),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setConfirmation("Personnalisation enregistrée.");
      setTimeout(() => setConfirmation(""), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setEnregistrement(false);
    }
  };

  if (chargement) return <p className="font-sans text-sm text-grege">Un instant…</p>;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <input
          value={valeurs.titre}
          onChange={(e) => setValeurs((v) => ({ ...v, titre: e.target.value }))}
          maxLength={60}
          placeholder="Titre (ex : Mes Mémoires)"
          className="bg-blanc border border-grege font-sans text-sm p-3 focus:outline-none focus:border-encre"
        />
        <input
          value={valeurs.sousTitre}
          onChange={(e) => setValeurs((v) => ({ ...v, sousTitre: e.target.value }))}
          maxLength={80}
          placeholder="Sous-titre (ex : Racontez-moi)"
          className="bg-blanc border border-grege font-sans text-sm p-3 focus:outline-none focus:border-encre"
        />
      </div>

      <div className="flex items-center gap-3">
        {PALETTE.map((c) => (
          <button
            key={c.cle}
            type="button"
            onClick={() => setValeurs((v) => ({ ...v, couleurCle: c.cle }))}
            title={c.label}
            aria-label={c.label}
            aria-pressed={valeurs.couleurCle === c.cle}
            className={`w-8 h-8 rounded-full transition-all ${
              valeurs.couleurCle === c.cle ? "ring-2 ring-offset-2 ring-encre" : ""
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>

      {(() => {
        const c = PALETTE.find((p) => p.cle === valeurs.couleurCle) ?? PALETTE[0];
        const dos = texteDorure(valeurs.titre || "Mes Mémoires", null).titre;
        return (
          <p className="font-sans text-xs text-grege leading-relaxed">
            {c.label}&nbsp;: jaquette {c.label.toLowerCase()}, toile {c.toile.label}, titre {c.dorure.label} sur le dos.
            {dos && <> Frappé sur le dos, en capitales&nbsp;: <span className="text-encre">{dos}</span></>}
          </p>
        );
      })()}

      <div className="flex items-center gap-3">
        <button
          onClick={enregistrer}
          disabled={enregistrement}
          className="font-sans text-sm bg-encre text-blanc px-5 py-2.5 hover:bg-[#3A3632] transition-colors disabled:opacity-40"
        >
          {enregistrement ? "Enregistrement…" : "Enregistrer la personnalisation"}
        </button>
        {confirmation && <span className="font-sans text-xs text-petrole">{confirmation}</span>}
      </div>
      {error && <p className="font-sans text-sm text-red-700">{error}</p>}
    </div>
  );
}
