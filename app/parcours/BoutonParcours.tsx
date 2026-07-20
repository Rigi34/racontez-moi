"use client";

import { useState } from "react";

export default function BoutonParcours() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const demarrer = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <div className="text-center space-y-3">
      <button
        onClick={demarrer}
        disabled={loading}
        className="bg-encre text-blanc rounded-full font-sans font-medium text-base px-8 py-4 hover:bg-[#3A3632] transition-colors disabled:opacity-40"
      >
        {loading ? "Un instant…" : "Commencer Le Parcours →"}
      </button>
      {error && <p className="font-sans text-sm text-red-700">{error}</p>}
    </div>
  );
}
