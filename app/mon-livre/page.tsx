import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import FormulaireAdresse from "./FormulaireAdresse";
import BoutonCommande from "./BoutonCommande";
import BoutonPayerLivre from "./BoutonPayerLivre";
import { compilerInterieur } from "@/lib/manuscrit";
import { PAGES_MINIMUM_RELIE } from "@/lib/lulu";

export default async function MonLivrePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [{ data: fragments }, { data: adresse }, { data: commande }, { data: abonnement }] = await Promise.all([
    supabase.from("fragments").select("texte").eq("user_id", user.id).neq("statut", "a_revoir").order("created_at", { ascending: true }),
    supabase.from("adresses_livraison").select("nom").eq("user_id", user.id).maybeSingle(),
    supabase.from("commandes_livre").select("statut").eq("user_id", user.id).in("statut", ["en_cours", "confirmee"]).maybeSingle(),
    supabase.from("abonnements").select("livre_paye").eq("user_id", user.id).maybeSingle(),
  ]);

  const nombreFragments = fragments?.length ?? 0;
  const nombrePages = nombreFragments ? compilerInterieur(fragments!.map((f) => f.texte)).nombrePages : 0;
  const assezDePages = nombrePages >= PAGES_MINIMUM_RELIE;

  return (
    <div className="min-h-screen bg-papier flex flex-col">
      <header className="px-8 py-6 bg-sauge shadow-[0_1px_3px_rgba(28,25,23,0.08)] flex items-center justify-between">
        <Link href="/" className="font-display text-xl italic text-petrole tracking-wide">
          Racontez-moi
        </Link>
        <Link href="/tableau-de-bord" className="font-sans text-sm text-encre hover:text-petrole transition-colors">
          Retour à mon parcours
        </Link>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-8 py-16 space-y-12">
        <div>
          <h1 className="font-display text-3xl text-encre">Mon livre</h1>
          <p className="font-sans text-base text-grege mt-2">
            {nombreFragments ?? 0} fragment{(nombreFragments ?? 0) > 1 ? "s" : ""} prêt{(nombreFragments ?? 0) > 1 ? "s" : ""} pour votre manuscrit.
          </p>
        </div>

        {!nombreFragments ? (
          <div className="bg-sauge border border-grege p-8 text-center space-y-4">
            <p className="font-display text-xl italic text-encre">
              Votre manuscrit n&apos;a pas encore de matière.
            </p>
            <p className="font-sans text-sm text-grege">
              Continuez vos séances — dès votre premier fragment validé, un aperçu de votre livre apparaîtra ici.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-sauge border border-grege p-6 space-y-3">
              <h2 className="font-display text-lg text-encre">Aperçu de votre manuscrit</h2>
              <div className="flex gap-3 flex-wrap">
                <a
                  href="/api/manuscrit/apercu"
                  target="_blank"
                  className="font-sans text-sm border border-grege bg-blanc text-encre px-4 py-2 hover:border-encre transition-colors"
                >
                  Voir le PDF
                </a>
                <a
                  href="/api/manuscrit/epub"
                  className="font-sans text-sm border border-grege bg-blanc text-encre px-4 py-2 hover:border-encre transition-colors"
                >
                  Télécharger l&apos;EPUB
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-lg text-encre">Adresse de livraison</h2>
              <p className="font-sans text-sm text-grege">
                Nécessaire pour l&apos;impression du livre relié — vous pourrez la modifier à tout moment.
              </p>
              <FormulaireAdresse />
            </div>

            <div className="space-y-3 border-t border-grege/30 pt-8">
              <h2 className="font-display text-lg text-encre">Impression</h2>
              {commande ? (
                <p className="font-sans text-sm text-petrole">
                  {commande.statut === "confirmee"
                    ? "Votre livre a été envoyé à l'impression."
                    : "Votre commande est en cours de traitement."}
                </p>
              ) : !assezDePages ? (
                <p className="font-sans text-sm text-grege">
                  Votre manuscrit fait {nombrePages} page{nombrePages > 1 ? "s" : ""} pour l&apos;instant — il en faut au moins {PAGES_MINIMUM_RELIE} pour un livre relié. Continuez vos séances, l&apos;impression sera possible dès que vous y serez.
                </p>
              ) : !abonnement?.livre_paye ? (
                <BoutonPayerLivre />
              ) : (
                <BoutonCommande adresseRemplie={!!adresse} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
