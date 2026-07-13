import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cadeau Mémoire — Racontez-moi",
  description:
    "Offrez à vos parents une année de conversations pour raconter leur histoire. Un vrai livre imprimé à la fin.",
};

export default function OffrirPage() {
  return (
    <main className="min-h-screen">
      {/* ─── HERO /OFFRIR ─────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center min-h-[80vh] px-6 pt-24 pb-20 text-center">
        <h1 className="font-display font-normal text-4xl md:text-5xl lg:text-6xl leading-[1.15] text-presque-noir max-w-3xl mb-6">
          Vos parents ont une histoire.
          <br />
          Offrez-leur quelqu&apos;un pour la raconter.
        </h1>

        <p className="font-serif text-lg md:text-xl text-gris-chaud max-w-xl mb-10 leading-relaxed italic">
          Le Cadeau Mémoire&nbsp;: un an de conversations guidées, chez eux, à leur
          rythme. À la fin, un livre imprimé — le leur. Et le vôtre.
        </p>

        <a
          href="#offrir-cta"
          className="inline-block bg-terracotta text-ivoire font-sans font-medium text-lg px-8 py-4 hover:bg-[#A8692E] transition-colors duration-200"
        >
          Offrir le Parcours →
        </a>
      </section>

      {/* ─── LEAD ─────────────────────────────────────────────────────── */}
      <section className="bg-ivoire-fonce py-20 px-6">
        <div className="max-w-2xl mx-auto space-y-6 font-serif text-lg leading-[1.85] text-presque-noir">
          <p>
            On se dit toujours qu&apos;on posera les questions plus tard. Comment ils
            se sont vraiment rencontrés. À quoi ressemblait la maison de leur enfance.
            Ce qu&apos;ils ont traversé sans jamais le raconter à table. Et puis la vie
            passe, les déjeuners de famille parlent d&apos;autre chose, et les questions
            restent où elles sont.
          </p>
          <p>
            Ce cadeau les pose pour vous. Une par une, avec douceur, pendant un an.
          </p>
        </div>
      </section>

      {/* ─── POURQUOI ILS N'ONT JAMAIS ÉCRIT ─────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-normal text-3xl text-presque-noir mb-8">
            Ce n&apos;est pas l&apos;envie qui leur manque.
          </h2>
          <div className="space-y-6 font-serif text-lg leading-[1.85] text-presque-noir">
            <p>
              Personne ne se raconte seul&nbsp;: il faut un interlocuteur qui écoute,
              questionne, relance — et se souvient. Vous ne pouvez pas être cet
              interlocuteur, et vous le savez&nbsp;: des heures d&apos;enregistrement,
              de notes, de relances, personne ne tient la distance. Eux le savent aussi.
              C&apos;est précisément pour ça qu&apos;ils ne vous l&apos;ont jamais
              demandé&nbsp;: ils ne veulent rien vous imposer.
            </p>
            <p>
              Notre interlocuteur, lui, ne se fatigue jamais. Il pose les bonnes
              questions, vingt minutes par semaine, à la voix — pas de clavier, pas
              d&apos;application à apprendre. Et de séance en séance, il compose leurs
              mots en chapitres. Leurs mots à eux&nbsp;: l&apos;intelligence artificielle
              questionne, elle n&apos;écrit pas leur vie à leur place.
            </p>
          </div>
        </div>
      </section>

      {/* ─── COMMENT ÇA MARCHE ────────────────────────────────────────── */}
      <section className="bg-ivoire-fonce py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display font-normal text-3xl text-presque-noir text-center mb-14">
            En trois temps
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="font-garamond italic text-5xl text-sable mb-4">I.</div>
              <h3 className="font-serif font-semibold text-lg text-presque-noir mb-3">
                Vous offrez.
              </h3>
              <p className="font-sans text-base text-gris-chaud leading-relaxed">
                Deux minutes&nbsp;: vous recevez un code d&apos;activation et un
                certificat élégant à imprimer ou à envoyer.
              </p>
            </div>
            <div className="text-center">
              <div className="font-garamond italic text-5xl text-sable mb-4">II.</div>
              <h3 className="font-serif font-semibold text-lg text-presque-noir mb-3">
                Ils racontent.
              </h3>
              <p className="font-sans text-base text-gris-chaud leading-relaxed">
                Chez eux, à la voix, vingt minutes une à deux fois par semaine. La
                première séance se fait ensemble&nbsp;: c&apos;est vous qui poserez
                la première question.
              </p>
            </div>
            <div className="text-center">
              <div className="font-garamond italic text-5xl text-sable mb-4">III.</div>
              <h3 className="font-serif font-semibold text-lg text-presque-noir mb-3">
                Le livre arrive.
              </h3>
              <p className="font-sans text-base text-gris-chaud leading-relaxed">
                Composé, imprimé, relié. Le leur — et, si vous voulez, un exemplaire
                pour chaque petit-enfant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LES TROIS FREINS DÉSAMORCÉS ─────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto space-y-10">
          <h2 className="font-display font-normal text-3xl text-presque-noir">
            Vous vous demandez peut-être…
          </h2>

          <div className="space-y-8">
            <div>
              <p className="font-serif font-semibold text-lg text-presque-noir mb-2">
                «&nbsp;Ils ne seront jamais à l&apos;aise avec une intelligence artificielle.&nbsp;»
              </p>
              <p className="font-sans text-base text-gris-chaud leading-relaxed">
                Il n&apos;y a rien à apprendre. On décroche, on parle, c&apos;est
                tout — et la première séance se fait avec vous à côté.
              </p>
            </div>

            <div className="w-full h-px bg-sable" />

            <div>
              <p className="font-serif font-semibold text-lg text-presque-noir mb-2">
                «&nbsp;Est-ce que ce n&apos;est pas trop intime&nbsp;? Je ne veux pas être intrusif.&nbsp;»
              </p>
              <p className="font-sans text-base text-gris-chaud leading-relaxed">
                Vous offrez une possibilité, jamais une obligation. Rien de ce
                qu&apos;ils racontent ne vous est partagé sans leur accord explicite —
                leurs souvenirs leur appartiennent, à chaque étape.
              </p>
            </div>

            <div className="w-full h-px bg-sable" />

            <div>
              <p className="font-serif font-semibold text-lg text-presque-noir mb-2">
                «&nbsp;Et s&apos;ils commencent, puis abandonnent&nbsp;?&nbsp;»
              </p>
              <p className="font-sans text-base text-gris-chaud leading-relaxed">
                Le rythme leur appartient, l&apos;interlocuteur relance avec délicatesse,
                jamais avec insistance. Et chaque séance produit déjà des pages qui
                restent&nbsp;: même un récit inachevé est un récit sauvé.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ET PRIX ─────────────────────────────────────────────── */}
      <section id="offrir-cta" className="bg-ivoire-fonce py-20 px-6 text-center">
        <div className="max-w-xl mx-auto space-y-8">
          <p className="font-serif italic text-lg text-gris-chaud">
            Un écrivain public facture entre 1&nbsp;500 et 8&nbsp;000&nbsp;€ pour un
            récit de vie.
          </p>

          <div className="bg-ivoire p-8 border border-sable">
            <p className="font-display text-2xl text-presque-noir mb-2">
              Le Parcours — 12 mois
            </p>
            <p className="font-sans text-gris-chaud text-base mb-6">
              Entretiens illimités · Fragments enrichis · Manuscrit imprimé relié
            </p>
            <p className="font-display text-4xl text-presque-noir mb-1">
              Prix à venir
            </p>
            <p className="font-sans text-sm text-gris-chaud mb-6">
              Comptant ou mensualisé sur 12 mois
            </p>
            <a
              href="#"
              className="inline-block bg-terracotta text-ivoire font-sans font-medium text-lg px-8 py-4 hover:bg-[#A8692E] transition-colors"
            >
              Offrir le Parcours →
            </a>
          </div>

          <p className="font-sans text-sm text-gris-chaud">
            Livré par courriel en quelques minutes — même un 24 décembre au soir.
          </p>
        </div>
      </section>

      {/* ─── CERTIFICAT ──────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-lg mx-auto">
          <p className="font-sans text-center text-xs text-gris-chaud tracking-widest uppercase mb-8">
            Le certificat imprimable
          </p>
          <div className="bg-ivoire border border-sable p-10 text-center space-y-4">
            <p className="font-garamond italic text-xl text-presque-noir leading-[1.8]">
              <em>[Prénom],</em>
            </p>
            <p className="font-garamond italic text-2xl text-presque-noir">
              Raconte-moi.
            </p>
            <p className="font-garamond text-lg text-presque-noir leading-[1.8]">
              Ce cadeau est une invitation&nbsp;: une année de conversations pour
              raconter ton histoire, à ton rythme, chez toi. À la fin, un livre —
              le tien.
            </p>
            <p className="font-garamond italic text-lg text-presque-noir">
              On fera la première séance ensemble.
            </p>
            <div className="pt-4 border-t border-sable">
              <p className="font-garamond italic text-lg text-gris-chaud">
                [Votre signature]
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONFIDENTIALITÉ ────────────────────────────────────────── */}
      <section className="py-10 px-6 bg-ivoire-fonce text-center">
        <p className="font-serif text-base text-gris-chaud max-w-xl mx-auto leading-relaxed">
          Ce que vous confiez ici vous appartient entièrement. Vos récits ne servent
          jamais à entraîner une intelligence artificielle, et ne sont jamais partagés
          — pas même avec la personne qui vous a offert ce parcours — sans votre accord
          explicite. Vous pouvez les exporter ou les supprimer à tout moment.
        </p>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 bg-presque-noir">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <a href="/" className="font-garamond italic text-ivoire text-xl hover:text-terracotta transition-colors">
            Racontez-moi
          </a>
          <div className="flex gap-8 font-sans text-sm text-ivoire/70">
            <a href="/" className="hover:text-terracotta transition-colors">
              Accueil
            </a>
            <a href="#" className="hover:text-terracotta transition-colors">
              Confidentialité
            </a>
            <a href="#" className="hover:text-terracotta transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
