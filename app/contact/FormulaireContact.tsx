"use client";

import { useState } from "react";

export default function FormulaireContact() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, message }),
      });
      if (!res.ok) throw new Error();
      setEnvoye(true);
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (envoye) {
    return (
      <p className="font-display italic text-xl text-encre">
        Votre message a bien été envoyé. Nous vous répondrons personnellement.
      </p>
    );
  }

  return (
    <form onSubmit={envoyer} className="space-y-4 text-left max-w-md mx-auto">
      <input
        type="text"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Votre nom"
        required
        className="w-full bg-papier border border-grege font-sans text-base text-encre px-4 py-3 focus:outline-none focus:border-grege placeholder:text-grege"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Votre email"
        required
        className="w-full bg-papier border border-grege font-sans text-base text-encre px-4 py-3 focus:outline-none focus:border-grege placeholder:text-grege"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Votre message"
        required
        className="w-full min-h-[120px] bg-papier border border-grege font-sans text-base text-encre px-4 py-3 resize-none focus:outline-none focus:border-grege placeholder:text-grege"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-encre text-blanc rounded-full font-sans font-medium text-lg px-8 py-4 hover:bg-[#3A3632] transition-colors duration-200 disabled:opacity-40"
      >
        {loading ? "Envoi en cours…" : "Envoyer"}
      </button>
      {error && <p className="font-sans text-sm text-red-700">{error}</p>}
    </form>
  );
}
