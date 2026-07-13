import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"

export default async function TableauDeBord() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/sign-in")

  return (
    <div className="min-h-screen bg-ivoire flex flex-col">
      <header className="px-8 py-6 bg-ivoire-fonce shadow-[0_1px_3px_rgba(28,25,23,0.08)] flex items-center justify-between">
        <Link href="/" className="font-garamond text-xl italic text-terracotta tracking-wide">
          Racontez-moi
        </Link>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="font-sans text-sm text-presque-noir hover:text-terracotta transition-colors"
          >
            Se déconnecter
          </button>
        </form>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-8 py-16 space-y-12">
        <div>
          <h1 className="font-display text-3xl text-presque-noir">
            Votre parcours
          </h1>
          <p className="font-sans text-base text-gris-chaud mt-2">
            {user.email}
          </p>
        </div>

        <div className="bg-ivoire-fonce border border-sable p-8 text-center space-y-4">
          <p className="font-garamond text-xl italic text-presque-noir">
            Votre premier chapitre n&apos;a pas encore commencé.
          </p>
          <p className="font-sans text-sm text-gris-chaud">
            Les séances et fragments apparaîtront ici au fil de votre parcours.
          </p>
          <div className="pt-4">
            <Link
              href="/seance"
              className="inline-block bg-terracotta text-ivoire font-sans text-sm px-8 py-3 hover:opacity-90 transition-opacity"
            >
              Commencer une séance
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
