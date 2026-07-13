import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import Seance from "../components/Seance"

export default async function SeancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/sign-in")

  return (
    <div className="min-h-screen bg-papier flex flex-col">
      <header className="px-8 py-6 bg-sauge shadow-[0_1px_3px_rgba(28,25,23,0.08)] flex items-center justify-between">
        <Link href="/" className="font-display text-xl italic text-petrole tracking-wide">
          Racontez-moi
        </Link>
        <Link
          href="/tableau-de-bord"
          className="font-sans text-sm text-encre hover:text-petrole transition-colors"
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
