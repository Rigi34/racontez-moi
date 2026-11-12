import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import GestionCompte from "./GestionCompte"
import FragmentCard from "./FragmentCard"
import FondVivant from "@/app/components/FondVivant"

export default async function TableauDeBord() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/sign-in")

  const [{ data: fragments }, { data: profil }] = await Promise.all([
    supabase
      .from("fragments")
      .select("id, texte, statut, created_at, session:sessions(question_ouverture)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("profil_narrateur").select("prenom_choisi").eq("user_id", user.id).maybeSingle(),
  ])

  const nombreSeances = fragments?.length ?? 0
  // « Retiré de mon livre » = statut a_revoir (seule exclusion du livre).
  const retires = fragments?.filter((f) => f.statut === "a_revoir") ?? []
  // Jamais utilisé dans les relances IA (choix de Régis, 29/07/2026) —
  // uniquement pour personnaliser l'interface.
  const prenom = profil?.prenom_choisi?.trim() || null

  return (
    <div className="relative isolate min-h-screen bg-papier flex flex-col">
      <FondVivant entete fixe />
      <header className="relative px-8 py-6 flex items-center justify-between">
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
            {prenom ? (
              <>
                Bonjour <em className="italic text-ambre-texte">{prenom}</em>
              </>
            ) : (
              <>
                Votre <em className="italic text-ambre-texte">parcours</em>
              </>
            )}
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
            <div className="bg-sauge border border-grege rounded-lg p-6 sm:p-8 space-y-4">
              <p className="font-sans text-sm font-semibold uppercase tracking-widest text-grege">Prochaine étape</p>
              <p className="font-sans text-[18px] text-encre leading-relaxed">
                Vous avez déjà raconté {nombreSeances} souvenir{nombreSeances > 1 ? "s" : ""}. Continuez quand vous le souhaitez, ou regardez votre livre prendre forme.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link
                  href="/seance"
                  className="inline-flex items-center justify-center min-h-12 bg-encre text-blanc rounded-full font-sans text-base font-semibold px-8 py-3 hover:opacity-90 transition-opacity"
                >
                  Continuer mon histoire
                </Link>
                <Link
                  href="/mon-livre"
                  className="inline-flex items-center justify-center min-h-12 bg-blanc border border-encre text-encre rounded-full font-sans text-base font-semibold px-8 py-3 hover:bg-papier transition-colors"
                >
                  Voir mon livre
                </Link>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="font-display text-2xl text-encre">Vos souvenirs</h2>
              <p className="font-sans text-base text-encre/80 leading-relaxed">
                Chaque souvenir raconté va directement dans votre livre. Vous pouvez le relire, y ajouter des photos, ou le corriger.
              </p>
              {retires.length > 0 && (
                <p className="font-sans text-base text-amber-900 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3">
                  {retires.length === 1
                    ? "1 souvenir est retiré de votre livre."
                    : `${retires.length} souvenirs sont retirés de votre livre.`}{" "}
                  <a href={`#souvenir-${retires[0].id}`} className="font-semibold underline underline-offset-4">
                    {retires.length === 1 ? "Le voir ›" : "Les voir ›"}
                  </a>
                </p>
              )}
              <div className="space-y-4">
                {fragments?.map((f) => {
                  const session = Array.isArray(f.session) ? f.session[0] : f.session
                  return (
                    <FragmentCard
                      key={f.id}
                      id={f.id}
                      texteInitial={f.texte}
                      statutInitial={f.statut}
                      questionInitiale={session?.question_ouverture ?? null}
                      date={new Date(f.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <GestionCompte />
      </main>
    </div>
  )
}
