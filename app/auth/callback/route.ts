import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/tableau-de-bord"
  const consent = searchParams.get("consent") === "1"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Consentement RGPD art. 9 (cf. app/sign-in/page.tsx) : pour l'OAuth,
      // Supabase ne permet pas de le passer en amont comme pour signUp — il
      // est écrit ici, une fois la session établie.
      if (consent) {
        await supabase.auth.updateUser({
          data: {
            consentement_donnees_sensibles: true,
            consentement_donnees_sensibles_le: new Date().toISOString(),
          },
        })
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=confirm`)
}
