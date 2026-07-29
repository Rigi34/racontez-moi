"use client";

import { useState } from "react";

export default function FormulaireCadeau() {
  const [destinataire, setDestinataire] = useState("");
  const [offrant, setOffrant] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apercuUrl, setApercuUrl] = useState("");

  const voirApercu = () => {
    const params = new URLSearchParams({ destinataire, offrant, message });
    setApercuUrl(`/api/cadeau/certificat/apercu?${params.toString()}`);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout-cadeau", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinataire_prenom: destinataire, offrant_nom: offrant, message }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="text-left space-y-4">
      <div>
        <label className="font-sans text-sm text-encre block mb-1.5">Prénom du destinataire</label>
        <input
          type="text"
          required
          maxLength={100}
          value={destinataire}
          onChange={(e) => setDestinataire(e.target.value)}
          className="w-full border border-grege bg-blanc px-4 py-2.5 font-sans text-base text-encre focus:outline-none focus:border-petrole"
          placeholder="Ex. Monique"
        />
      </div>
      <div>
        <label className="font-sans text-sm text-encre block mb-1.5">Votre nom (pour la signature)</label>
        <input
          type="text"
          required
          maxLength={100}
          value={offrant}
          onChange={(e) => setOffrant(e.target.value)}
          className="w-full border border-grege bg-blanc px-4 py-2.5 font-sans text-base text-encre focus:outline-none focus:border-petrole"
          placeholder="Ex. Votre fille Claire"
        />
      </div>
      <div>
        <label className="font-sans text-sm text-encre block mb-1.5">Un petit mot (facultatif)</label>
        <textarea
          maxLength={500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full border border-grege bg-blanc px-4 py-2.5 font-sans text-base text-encre focus:outline-none focus:border-petrole resize-none"
          placeholder="Ce cadeau me tient à cœur parce que..."
        />
      </div>
      <button
        type="button"
        onClick={voirApercu}
        disabled={!destinataire.trim() || !offrant.trim()}
        className="w-full font-sans text-sm border border-grege bg-blanc text-encre rounded-full px-6 py-2.5 hover:border-encre transition-colors disabled:opacity-40"
      >
        Voir l&apos;aperçu du certificat
      </button>

      {apercuUrl && (
        <div className="border border-grege p-3 bg-papier">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={apercuUrl} alt="Aperçu du certificat cadeau" className="w-full h-auto" />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-block bg-encre text-blanc rounded-full font-sans font-medium text-lg px-8 py-4 hover:bg-[#3A3632] transition-colors disabled:opacity-40"
      >
        {loading ? "Un instant…" : "Offrir le Parcours — 155€ →"}
      </button>
      {error && <p className="font-sans text-sm text-red-700">{error}</p>}
    </form>
  );
}
