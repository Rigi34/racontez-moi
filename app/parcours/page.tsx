import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import BoutonParcours from "./BoutonParcours";

export default async function ParcoursPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: abonnement } = await supabase
    .from("abonnements")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (abonnement?.status === "active") redirect("/tableau-de-bord");

  return (
    <div className="min-h-screen bg-papier flex flex-col">
      <header className="px-8 py-6 bg-sauge shadow-[0_1px_3px_rgba(28,25,23,0.08)] flex items-center justify-between">
        <Link href="/" className="font-display text-xl italic text-petrole tracking-wide">
          Racontez-moi
        </Link>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-20 text-center space-y-10">
        <div className="space-y-4">
          <h1 className="font-display text-3xl md:text-4xl text-encre leading-[1.25]">
            Le Parcours
          </h1>
          <p className="font-serif text-lg text-grege leading-relaxed">
            Un interlocuteur mémorial à votre rythme, séance après séance, pour composer le récit de votre vie.
          </p>
        </div>

        <div className="bg-blanc border border-sauge rounded-2xl px-8 py-10 space-y-2">
          <p className="font-display text-4xl text-encre">129€</p>
          <p className="font-sans text-sm text-grege">Un seul paiement, aucune mensualité.</p>
        </div>

        <p className="font-sans text-sm text-grege">
          Pas d&apos;engagement caché : vous payez une fois, rien d&apos;autre ne sera jamais prélevé.
        </p>

        <div className="text-left space-y-4">
          <h2 className="font-display text-xl text-encre text-center">Ce qui est inclus</h2>
          <ul className="space-y-3 font-serif text-base text-grege leading-relaxed">
            <li>Des séances illimitées, une à deux fois par semaine, pendant deux à quatre mois.</li>
            <li>Une mémoire qui vous suit d&apos;une séance à l&apos;autre — jamais deux fois la même question.</li>
            <li>Vous relisez, vous corrigez, vous validez : le livre reste fidèle à vos mots.</li>
            <li>Votre manuscrit complet en PDF et ebook, à la fin du Parcours.</li>
          </ul>
          <p className="font-sans text-sm text-grege pt-2">
            Le livre imprimé et relié sera proposé en option séparée, une fois votre Parcours terminé.
          </p>
        </div>

        <BoutonParcours />
      </main>
    </div>
  );
}
