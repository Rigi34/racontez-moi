"use client"
import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { messageErreurAuth } from "@/lib/auth-erreurs"
import FondVivant from "@/app/components/FondVivant"

// Arrivée du lien « Mot de passe oublié » (app/sign-in/page.tsx) : le
// callback a déjà ouvert la session, il ne reste qu'à enregistrer le
// nouveau mot de passe. Lien expiré ou page ouverte sans lien : updateUser
// échoue sur l'absence de session, le message renvoie vers la connexion.
export default function NouveauMotDePassePage() {
  const supabase = createClient()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setLoading(false)
      setError(messageErreurAuth(error.message))
      return
    }
    window.location.assign("/tableau-de-bord")
  }

  return (
    <div className="relative isolate min-h-screen flex flex-col items-center justify-center bg-papier px-6">
      <FondVivant fixe />
      <div className="relative w-full max-w-sm space-y-8">
        <div className="text-center">
          <p className="font-display text-lg italic text-petrole tracking-wide">
            Racontez-moi
          </p>
          <h1 className="font-display text-2xl text-encre mt-2">
            Nouveau <em className="italic text-ambre-texte">mot de passe</em>
          </h1>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="font-sans text-sm text-encre block mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Choisissez un mot de passe (8 car. min.)"
              required
              className="w-full border border-grege bg-white text-encre px-4 py-3 font-sans text-base focus:outline-none focus:border-petrole transition-colors"
            />
          </div>

          {error && (
            <p role="alert" className="font-sans text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || password.length < 8}
            className="w-full bg-encre text-blanc rounded-full font-sans text-base py-3.5 tracking-wide hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? "…" : "Enregistrer et continuer"}
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/sign-in"
            className="font-sans text-sm text-grege underline underline-offset-2 hover:text-encre transition-colors"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}
