"use client"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

function messageErreur(raw: string): string {
  if (/invalid login credentials/i.test(raw)) return "Email ou mot de passe incorrect."
  if (/user already registered/i.test(raw)) return "Un compte existe déjà avec cet email. Connectez-vous."
  if (/password should be at least/i.test(raw)) return "Mot de passe trop court (8 caractères minimum)."
  if (/unable to validate email|invalid email/i.test(raw)) return "Adresse email invalide."
  return "Une erreur est survenue. Réessayez."
}

function SignInInner() {
  const params = useSearchParams()
  const next = params.get("redirect_url") ?? "/tableau-de-bord"
  const supabase = createClient()

  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationEnvoyee, setConfirmationEnvoyee] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password })
      setLoading(false)
      if (error) { setError(messageErreur(error.message)); return }
      if (!data.session) { setConfirmationEnvoyee(true); return }
      window.location.assign(next)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(messageErreur(error.message)); return }
    window.location.assign(next)
  }

  if (confirmationEnvoyee) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ivoire px-6">
        <div className="w-full max-w-sm text-center space-y-4">
          <p className="font-garamond text-lg italic text-terracotta tracking-wide">
            Racontez-moi
          </p>
          <p className="font-sans text-base text-presque-noir leading-relaxed">
            Presque prêt. Un email vient de vous être envoyé — ouvrez-le et cliquez sur le
            lien de confirmation pour activer votre compte. Si vous ne le voyez pas dans
            quelques minutes, pensez à vérifier vos courriers indésirables.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ivoire px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <p className="font-garamond text-lg italic text-terracotta tracking-wide">
            Racontez-moi
          </p>
          <h1 className="font-display text-2xl text-presque-noir mt-2">
            {mode === "signup" ? "Créer votre espace" : "Votre espace narrateur"}
          </h1>
          <p className="font-sans text-sm text-gris-chaud mt-2">
            {mode === "signup"
              ? "Commencez votre parcours d'écriture."
              : "Retrouvez vos séances et vos fragments."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="font-sans text-sm text-presque-noir block mb-1.5">
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
              autoComplete="email"
              placeholder="votre@email.fr"
              required
              className="w-full border border-sable bg-white text-presque-noir px-4 py-3 font-sans text-base focus:outline-none focus:border-terracotta transition-colors"
            />
          </div>
          <div>
            <label className="font-sans text-sm text-presque-noir block mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder={mode === "signup" ? "Choisissez un mot de passe (8 car. min.)" : "Votre mot de passe"}
              required
              className="w-full border border-sable bg-white text-presque-noir px-4 py-3 font-sans text-base focus:outline-none focus:border-terracotta transition-colors"
            />
          </div>

          {error && (
            <p role="alert" className="font-sans text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || password.length < 8}
            className="w-full bg-terracotta text-ivoire font-sans text-base py-3.5 tracking-wide hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading
              ? "…"
              : mode === "signup"
              ? "Créer mon espace narrateur"
              : "Se connecter"}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(null) }}
            disabled={loading}
            className="font-sans text-sm text-gris-chaud underline underline-offset-2 hover:text-presque-noir transition-colors"
          >
            {mode === "signup" ? "J'ai déjà un espace narrateur" : "Créer un espace narrateur"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ivoire">
          <p className="font-sans text-sm text-gris-chaud">Chargement…</p>
        </div>
      }
    >
      <SignInInner />
    </Suspense>
  )
}
