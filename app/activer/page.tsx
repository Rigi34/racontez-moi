"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function ActiverInner() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const [code, setCode] = useState(params.get("code") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifieAuth, setVerifieAuth] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const next = `/activer${code ? `?code=${encodeURIComponent(code)}` : ""}`;
        router.replace(`/sign-in?redirect_url=${encodeURIComponent(next)}`);
        return;
      }
      setVerifieAuth(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cadeau/activer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue.");
      router.push("/tableau-de-bord");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  };

  if (!verifieAuth) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-papier px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <p className="font-display text-lg italic text-petrole tracking-wide">Racontez-moi</p>
          <h1 className="font-display text-2xl text-encre mt-2">Activer votre cadeau</h1>
          <p className="font-sans text-sm text-grege mt-2">
            Saisissez le code d&apos;activation reçu avec votre certificat.
          </p>
        </div>

        <form onSubmit={activer} className="space-y-4">
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            className="w-full border border-grege bg-blanc px-4 py-3 font-sans text-center text-lg tracking-widest text-encre focus:outline-none focus:border-petrole"
          />
          {error && <p className="font-sans text-sm text-red-700 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-encre text-blanc rounded-full font-sans font-medium text-base px-6 py-3.5 hover:bg-[#3A3632] transition-colors disabled:opacity-40"
          >
            {loading ? "Un instant…" : "Activer mon Parcours →"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ActiverPage() {
  return (
    <Suspense>
      <ActiverInner />
    </Suspense>
  );
}
