import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import Seance from "../components/Seance"

export default async function SeancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/sign-in")

  return (
    <div className="min-h-screen bg-ivoire flex flex-col">
      <header className="px-8 py-6 border-b border-sable flex items-center justify-between">
        <Link href="/" className="font-garamond text-xl italic text-terracotta tracking-wide">
          Racontez-moi
        </Link>
        <Link
          href="/tableau-de-bord"
          className="font-sans text-sm text-gris-chaud hover:text-presque-noir transition-colors"
        >
          Mon parcours
        </Link>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-16">
        <Seance />
      </main>
    </div>
  )
}
