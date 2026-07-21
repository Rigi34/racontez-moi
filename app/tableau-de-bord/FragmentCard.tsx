"use client";

import { useState } from "react";

type Statut = "brouillon" | "valide" | "a_revoir";

export default function FragmentCard({
  id,
  texteInitial,
  statutInitial,
  date,
}: {
  id: string;
  texteInitial: string;
  statutInitial: string;
  date: string;
}) {
  const [texte, setTexte] = useState(texteInitial);
  const [brouillonTexte, setBrouillonTexte] = useState(texteInitial);
  const [statut, setStatut] = useState<Statut>(statutInitial as Statut);
  const [enEdition, setEnEdition] = useState(false);
  const [enRegeneration, setEnRegeneration] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const enregistrerTexte = async () => {
    if (!brouillonTexte.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/fragments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texte: brouillonTexte }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTexte(data.fragment.texte);
      setStatut(data.fragment.statut);
      setEnEdition(false);
      setConfirmation("Enregistré.");
      setTimeout(() => setConfirmation(""), 2500);
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const marquerStatut = async (nouveauStatut: Statut) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/fragments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: nouveauStatut }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStatut(data.fragment.statut);
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const regenerer = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/fragments/${id}/regenerer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTexte(data.fragment.texte);
      setBrouillonTexte(data.fragment.texte);
      setStatut(data.fragment.statut);
      setEnRegeneration(false);
      setInstruction("");
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-papier border-l-2 border-grege pl-6 pr-4 py-5 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="font-sans text-xs text-grege">{date}</p>
        {statut === "valide" && (
          <span className="font-sans text-xs text-petrole">Ça vous ressemble ✓</span>
        )}
        {statut === "a_revoir" && (
          <span className="font-sans text-xs text-amber-700">À revoir</span>
        )}
      </div>

      {enEdition ? (
        <textarea
          value={brouillonTexte}
          onChange={(e) => setBrouillonTexte(e.target.value)}
          className="w-full min-h-[180px] bg-blanc border border-grege font-serif text-base text-encre p-4 resize-none focus:outline-none focus:border-grege leading-relaxed"
        />
      ) : (
        <p className="font-serif text-base text-encre whitespace-pre-line leading-relaxed">{texte}</p>
      )}

      {enRegeneration && (
        <div className="space-y-2 bg-sauge/40 p-4">
          <p className="font-sans text-xs text-grege">
            Qu&apos;est-ce qui ne sonne pas juste ? (facultatif)
          </p>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Ex : vous avez mal compris le lieu, c'était la maison de mes grands-parents, pas la mienne."
            className="w-full min-h-[80px] bg-blanc border border-grege font-sans text-sm text-encre p-3 resize-none focus:outline-none focus:border-grege leading-relaxed"
          />
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        {enEdition ? (
          <>
            <button
              onClick={enregistrerTexte}
              disabled={loading}
              className="font-sans text-sm bg-encre text-blanc px-4 py-2 hover:bg-[#3A3632] transition-colors disabled:opacity-40"
            >
              {loading ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              onClick={() => {
                setBrouillonTexte(texte);
                setEnEdition(false);
              }}
              className="font-sans text-sm text-grege px-3 py-2"
            >
              Annuler
            </button>
          </>
        ) : enRegeneration ? (
          <>
            <button
              onClick={regenerer}
              disabled={loading}
              className="font-sans text-sm bg-encre text-blanc px-4 py-2 hover:bg-[#3A3632] transition-colors disabled:opacity-40"
            >
              {loading ? "Composition en cours…" : "Recomposer"}
            </button>
            <button
              onClick={() => {
                setInstruction("");
                setEnRegeneration(false);
              }}
              className="font-sans text-sm text-grege px-3 py-2"
            >
              Annuler
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => marquerStatut("valide")}
              disabled={loading}
              className="font-sans text-xs border border-grege text-encre px-3 py-1.5 hover:border-petrole transition-colors disabled:opacity-40"
            >
              Ça me ressemble
            </button>
            <button
              onClick={() => marquerStatut("a_revoir")}
              disabled={loading}
              className="font-sans text-xs border border-grege text-encre px-3 py-1.5 hover:border-amber-700 transition-colors disabled:opacity-40"
            >
              À revoir
            </button>
            <button
              onClick={() => setEnEdition(true)}
              className="font-sans text-xs text-grege px-3 py-1.5 hover:text-encre transition-colors"
            >
              Modifier le texte
            </button>
            <button
              onClick={() => setEnRegeneration(true)}
              className="font-sans text-xs text-grege px-3 py-1.5 hover:text-encre transition-colors"
            >
              Recomposer ce passage
            </button>
          </>
        )}
        {confirmation && <span className="font-sans text-xs text-petrole">{confirmation}</span>}
      </div>
      {error && <p className="font-sans text-sm text-red-700">{error}</p>}
    </div>
  );
}
