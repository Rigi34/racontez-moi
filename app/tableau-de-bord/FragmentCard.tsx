"use client";

import { useState } from "react";
import PhotosFragment from "./PhotosFragment";
import VoixFragment from "./VoixFragment";

type Statut = "brouillon" | "valide" | "a_revoir";
type Version = { id: string; texte: string; created_at: string };

export default function FragmentCard({
  id,
  texteInitial,
  statutInitial,
  questionInitiale,
  date,
}: {
  id: string;
  texteInitial: string;
  statutInitial: string;
  questionInitiale?: string | null;
  date: string;
}) {
  const [texte, setTexte] = useState(texteInitial);
  const [brouillonTexte, setBrouillonTexte] = useState(texteInitial);
  const [statut, setStatut] = useState<Statut>(statutInitial as Statut);
  const [enEdition, setEnEdition] = useState(false);
  const [enRegeneration, setEnRegeneration] = useState(false);
  const [enHistorique, setEnHistorique] = useState(false);
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [optionsOuvertes, setOptionsOuvertes] = useState(false);
  const retire = statut === "a_revoir";

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
      setConfirmation(
        retire && data.fragment.statut !== "a_revoir"
          ? "Enregistré — ce souvenir est de nouveau dans votre livre."
          : "Enregistré.",
      );
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

  const ouvrirHistorique = async () => {
    setEnHistorique(true);
    if (versions !== null) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/fragments/${id}/historique`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVersions(data.versions);
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const restaurerVersion = async (version: Version) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/fragments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texte: version.texte }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTexte(data.fragment.texte);
      setBrouillonTexte(data.fragment.texte);
      setStatut(data.fragment.statut);
      setEnHistorique(false);
      setVersions(null);
      setConfirmation("Version restaurée.");
      setTimeout(() => setConfirmation(""), 2500);
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
      if (res.status === 422) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "La réécriture n'a pas pu aboutir : rien n'a été changé.");
        return;
      }
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

  // Lisibilité (11/11/2026) : tout souvenir est dans le livre par défaut.
  // Les actions secondaires sont regroupées sous « Plus d'options » ;
  // « Retirer de mon livre » = statut a_revoir (seule exclusion du livre).
  const boutonOption =
    "block w-full text-left font-sans bg-blanc border border-grege rounded-lg px-4 py-3 min-h-12 text-base font-medium text-encre hover:border-encre transition-colors disabled:opacity-40";
  const boutonPrincipal =
    "font-sans text-base font-semibold bg-encre text-blanc rounded-lg px-5 py-3 min-h-12 hover:bg-[#3A3632] transition-colors disabled:opacity-40";
  const boutonAnnuler = "font-sans text-base text-encre underline px-3 py-3 min-h-12";
  const actionEnCours = enEdition || enRegeneration || enHistorique;

  return (
    <div id={`souvenir-${id}`} className="scroll-mt-6 bg-papier border-l-2 border-grege pl-6 pr-4 py-5 space-y-4">
      <p className="font-sans text-sm text-grege">{date}</p>

      {retire && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3">
          <p className="font-sans text-base font-semibold text-amber-900">Retiré de votre livre</p>
          <p className="font-sans text-[15px] text-amber-900">
            Vous l&apos;avez gardé ici, mais il ne sera pas imprimé.
          </p>
        </div>
      )}

      {questionInitiale && (
        <p className="font-display italic text-base text-grege">{questionInitiale}</p>
      )}

      {enEdition ? (
        <textarea
          value={brouillonTexte}
          onChange={(e) => setBrouillonTexte(e.target.value)}
          aria-label="Texte de ce souvenir"
          className="w-full min-h-[220px] bg-blanc border border-grege rounded-lg font-serif text-[18px] text-encre p-4 resize-y focus:outline-none focus:border-encre leading-relaxed"
        />
      ) : (
        <p
          className={`font-serif text-[18px] text-encre whitespace-pre-line leading-relaxed ${retire ? "opacity-60" : ""}`}
        >
          {texte}
        </p>
      )}

      <PhotosFragment fragmentId={id} />

      <VoixFragment fragmentId={id} afficherReglages={optionsOuvertes} />

      {enRegeneration && (
        <div className="space-y-2 bg-sauge/40 rounded-lg p-4">
          <p className="font-sans text-base text-encre">
            Qu&apos;est-ce qui ne sonne pas juste ? (facultatif)
          </p>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Ex : vous avez mal compris le lieu, c'était la maison de mes grands-parents, pas la mienne."
            className="w-full min-h-[100px] bg-blanc border border-grege rounded-lg font-sans text-base text-encre p-3 resize-y focus:outline-none focus:border-encre leading-relaxed"
          />
        </div>
      )}

      {enHistorique && (
        <div className="space-y-3 bg-sauge/40 rounded-lg p-4">
          <p className="font-sans text-base text-encre">
            Versions précédentes de ce souvenir — la plus récente en premier.
          </p>
          {loading && versions === null && <p className="font-sans text-base text-grege">Chargement…</p>}
          {versions?.length === 0 && (
            <p className="font-sans text-base text-grege">
              Aucune version précédente — ce souvenir n&apos;a jamais été modifié.
            </p>
          )}
          {versions?.map((v) => (
            <div key={v.id} className="bg-blanc border border-grege rounded-lg p-4 space-y-2">
              <p className="font-sans text-sm text-grege">
                {new Date(v.created_at).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
              </p>
              <p className="font-serif text-base text-encre whitespace-pre-line leading-relaxed line-clamp-4">{v.texte}</p>
              <button
                onClick={() => restaurerVersion(v)}
                disabled={loading}
                className="font-sans text-base font-medium border border-grege rounded-lg text-encre px-4 py-3 min-h-12 hover:border-encre transition-colors disabled:opacity-40"
              >
                Reprendre cette version
              </button>
            </div>
          ))}
        </div>
      )}

      {enEdition && (
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={enregistrerTexte} disabled={loading} className={boutonPrincipal}>
            {loading ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            onClick={() => {
              setBrouillonTexte(texte);
              setEnEdition(false);
            }}
            className={boutonAnnuler}
          >
            Annuler
          </button>
        </div>
      )}
      {enRegeneration && (
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={regenerer} disabled={loading} className={boutonPrincipal}>
            {loading ? "Réécriture en cours…" : "Réécrire ce souvenir"}
          </button>
          <button
            onClick={() => {
              setInstruction("");
              setEnRegeneration(false);
            }}
            className={boutonAnnuler}
          >
            Annuler
          </button>
        </div>
      )}
      {enHistorique && (
        <button onClick={() => setEnHistorique(false)} className={boutonAnnuler}>
          Fermer les versions précédentes
        </button>
      )}

      {!actionEnCours &&
        (retire ? (
          <button
            onClick={() => marquerStatut("brouillon")}
            disabled={loading}
            className="block w-full text-left bg-blanc border-2 border-petrole rounded-lg px-4 py-3 min-h-12 hover:bg-sauge/40 transition-colors disabled:opacity-40"
          >
            <span className="block font-sans text-base font-semibold text-petrole">
              ✓ Le remettre dans mon livre
            </span>
            <span className="block font-sans text-[15px] text-encre/80">Tel quel, ou après l&apos;avoir corrigé.</span>
          </button>
        ) : (
          <div className="bg-sauge/40 rounded-lg px-4 py-3">
            <p className="font-sans text-base font-semibold text-petrole">✓ Ce souvenir est dans votre livre</p>
            <p className="font-sans text-[15px] text-encre/80">Vous pourrez le corriger à tout moment.</p>
          </div>
        ))}

      {confirmation && (
        <p role="status" className="font-sans text-base text-petrole">
          {confirmation}
        </p>
      )}

      {!actionEnCours && (
        <div className="space-y-2">
          <button
            onClick={() => setOptionsOuvertes((o) => !o)}
            aria-expanded={optionsOuvertes}
            className="font-sans text-base font-medium text-encre underline underline-offset-4 py-3 min-h-12"
          >
            {optionsOuvertes ? "Moins d'options ▴" : "Plus d'options ▾"}
          </button>
          {optionsOuvertes && (
            <div className="space-y-2">
              <button onClick={() => setEnEdition(true)} className={boutonOption}>
                Corriger le texte moi-même
              </button>
              <button onClick={() => setEnRegeneration(true)} className={boutonOption}>
                Faire réécrire ce souvenir
              </button>
              <button onClick={ouvrirHistorique} className={boutonOption}>
                Voir les versions précédentes
              </button>
              {!retire && (
                <button onClick={() => marquerStatut("a_revoir")} disabled={loading} className={boutonOption}>
                  Retirer de mon livre
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {error && <p className="font-sans text-base text-red-700">{error}</p>}
    </div>
  );
}
