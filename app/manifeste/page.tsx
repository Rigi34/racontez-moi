import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pourquoi Racontez-moi existe",
  description:
    "Ce qui manque, ce n'est jamais l'histoire. C'est l'interlocuteur.",
};

export default function Manifeste() {
  return (
    <main className="min-h-screen bg-blanc">
      {/* ─── EN-TÊTE ───────────────────────────────────────────────── */}
      <header className="px-6 py-8 bg-sauge shadow-[0_1px_3px_rgba(28,25,23,0.08)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="font-display italic text-xl text-encre hover:text-grege transition-colors"
          >
            Racontez-moi
          </Link>
          <Link
            href="/#premiere-question"
            className="font-sans text-sm text-encre hover:text-petrole transition-colors"
          >
            Commencer mon histoire →
          </Link>
        </div>
      </header>

      {/* ─── MANIFESTE ────────────────────────────────────────────── */}
      <article className="py-20 px-6">
        <div className="max-w-2xl mx-auto">

          {/* Titre */}
          <h1 className="font-display font-normal text-4xl md:text-5xl text-encre mb-16 leading-[1.2]">
            Pourquoi Racontez-moi existe
          </h1>

          {/* Corps */}
          <div className="space-y-7 font-serif text-lg leading-[1.85] text-encre">
            <p>
              Presque tout le monde a, un jour, pensé à écrire sa vie. Très peu le font.
              Ce n&apos;est pas un manque de matière&nbsp;— une vie ordinaire déborde de
              matière. Ce n&apos;est pas non plus un manque de volonté&nbsp;: combien de
              cahiers offerts, combien de bonnes résolutions, restent vides après trois
              pages&nbsp;?
            </p>

            {/* Phrase pivot — mise en valeur */}
            <p className="font-display italic text-2xl leading-[1.6] text-encre py-6 border-y border-grege">
              Ce qui manque, ce n&apos;est jamais l&apos;histoire. C&apos;est
              l&apos;interlocuteur.
            </p>

            <p>
              Personne ne se raconte seul. Un souvenir a besoin d&apos;une question pour
              remonter, d&apos;une écoute pour se déployer, d&apos;une relance pour aller
              plus loin qu&apos;un résumé poli. Vos proches le savent, et c&apos;est bien
              pour cela qu&apos;ils n&apos;insistent jamais&nbsp;: ils savent qu&apos;ils
              n&apos;ont ni le temps ni la patience nécessaires pour tenir ce rôle dans la
              durée&nbsp;— et vous le savez aussi, de l&apos;autre côté, ce qui vous retient
              souvent de le leur demander.
            </p>

            <p>
              Racontez-moi est né de ce constat, tout simple&nbsp;: il fallait un
              interlocuteur qui ne se lasse jamais, qui ne juge pas, qui n&apos;attend rien
              en retour&nbsp;— et qui se souvient de tout ce qu&apos;on lui confie,
              d&apos;une séance à l&apos;autre, année après année. Ce que la technologie
              rend possible aujourd&apos;hui, ce n&apos;est pas d&apos;écrire une vie à la
              place de quelqu&apos;un. C&apos;est de tenir, enfin, la place de
              l&apos;interlocuteur qu&apos;aucun proche ne peut occuper indéfiniment.
            </p>

            {/* Placeholder origine personnelle */}
            <div className="my-10 pl-6 border-l-2 border-grege">
              <p className="font-sans text-sm text-grege italic leading-relaxed">
                [Origine personnelle — à compléter si vous souhaitez ajouter un fait
                fondateur propre à votre parcours&nbsp;; sinon cette section reste telle
                quelle et le manifeste fonctionne sans elle.]
              </p>
            </div>

            <p>
              Le résultat n&apos;est jamais un texte généré. C&apos;est un livre fait de vos
              mots, à votre rythme, qui vous ressemble&nbsp;— parce que c&apos;est vous qui
              l&apos;avez raconté.
            </p>
          </div>

          {/* CTA de sortie */}
          <div className="mt-16 pt-10 border-t border-grege">
            <Link
              href="/#premiere-question"
              className="inline-block bg-encre text-blanc rounded-full font-sans font-medium text-base px-7 py-3 hover:bg-[#3A3632] transition-colors duration-200"
            >
              Commencer mon histoire →
            </Link>
          </div>
        </div>
      </article>

      {/* ─── FOOTER MINIMAL ───────────────────────────────────────── */}
      <footer className="py-10 px-6 bg-encre">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="font-sans text-sm text-papier/70 hover:text-petrole transition-colors"
          >
            ← Retour à l&apos;accueil
          </Link>
          <p className="font-display italic text-papier text-lg">
            Racontez-moi
          </p>
        </div>
      </footer>
    </main>
  );
}
