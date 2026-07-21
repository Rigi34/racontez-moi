import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import GestionCompte from "./GestionCompte"
import FragmentCard from "./FragmentCard"

export default async function TableauDeBord() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/sign-in")

  const { data: fragments } = await supabase
    .from("fragments")
    .select("id, texte, statut, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const nombreSeances = fragments?.length ?? 0

  return (
    <div className="min-h-screen bg-papier flex flex-col">
      <header className="px-8 py-6 bg-sauge shadow-[0_1px_3px_rgba(28,25,23,0.08)] flex items-center justify-between">
        <Link href="/" className="font-display text-xl italic text-petrole tracking-wide">
          Racontez-moi
        </Link>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="font-sans text-sm text-encre hover:text-petrole transition-colors"
          >
            Se déconnecter
          </button>
        </form>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-8 py-16 space-y-12">
        <div>
          <h1 className="font-display text-3xl text-encre">
            Votre parcours
          </h1>
          <p className="font-sans text-base text-grege mt-2">
            {user.email}
          </p>
        </div>

        {nombreSeances === 0 ? (
          <div className="bg-sauge border border-grege p-8 text-center space-y-4">
            <p className="font-display text-xl italic text-encre">
              Votre premier chapitre n&apos;a pas encore commencé.
            </p>
            <p className="font-sans text-sm text-grege">
              Les séances et fragments apparaîtront ici au fil de votre parcours.
            </p>
            <div className="pt-4">
              <Link
                href="/seance"
                className="inline-block bg-encre text-blanc rounded-full font-sans text-sm px-8 py-3 hover:opacity-90 transition-opacity"
              >
                Commencer une séance
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-sauge border border-grege p-8 space-y-2">
              <p className="font-sans text-sm text-grege">
                {nombreSeances} séance{nombreSeances > 1 ? "s" : ""} enregistrée{nombreSeances > 1 ? "s" : ""}
              </p>
            </div>
            <Link
              href="/seance"
              className="inline-block bg-encre text-blanc rounded-full font-sans text-sm px-8 py-3 hover:opacity-90 transition-opacity"
            >
              Continuer mon parcours
            </Link>

            <div className="space-y-4 pt-4">
              <h2 className="font-display text-xl text-encre">Vos fragments</h2>
              <p className="font-sans text-sm text-grege">
                Relisez à tout moment ce que vos séances ont déjà écrit.
              </p>
              <div className="space-y-4">
                {fragments?.map((f) => (
                  <FragmentCard
                    key={f.id}
                    id={f.id}
                    texteInitial={f.texte}
                    statutInitial={f.statut}
                    date={new Date(f.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <GestionCompte />
      </main>
    </div>
  )
}
