"use client";

import { useState } from "react";

export default function BoutonPayerLivre() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const payer = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout-livre", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="font-sans text-sm text-grege">
        Le forfait création n&apos;inclut pas le livre imprimé — un paiement séparé (50€) est nécessaire avant de pouvoir le commander.
      </p>
      <button
        onClick={payer}
        disabled={loading}
        className="font-sans text-sm bg-encre text-blanc rounded-full px-6 py-3 hover:bg-[#3A3632] transition-colors disabled:opacity-40"
      >
        {loading ? "Un instant…" : "Payer le livre imprimé — 50€ →"}
      </button>
      {error && <p className="font-sans text-sm text-red-700">{error}</p>}
    </div>
  );
}
