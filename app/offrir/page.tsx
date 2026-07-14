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
        <h1 className="font-display font-normal text-4xl md:text-5xl lg:text-6xl leading-[1.15] text-encre max-w-3xl mb-6">
          Vos parents ont une histoire.
          <br />
          Offrez-leur quelqu&apos;un pour la raconter.
        </h1>

        <p className="font-serif text-lg md:text-xl text-grege max-w-xl mb-10 leading-relaxed italic">
          Le Cadeau Mémoire&nbsp;: un an de conversations guidées, chez eux, à leur
          rythme. À la fin, un livre imprimé — le leur. Et le vôtre.
        </p>

        <a
          href="#offrir-cta"
          className="inline-block bg-encre text-blanc rounded-full font-sans font-medium text-lg px-8 py-4 hover:bg-[#3A3632] transition-colors duration-200"
        >
          Offrir le Parcours →
        </a>
      </section>

      {/* ─── LEAD ─────────────────────────────────────────────────────── */}
      <section className="bg-sauge py-20 px-6">
        <div className="max-w-2xl mx-auto space-y-6 font-serif text-lg leading-[1.85] text-encre">
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
      <section className="py-20 px-6 bg-blanc">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-normal text-3xl text-encre mb-8">
            Ce n&apos;est pas l&apos;envie qui leur manque.
          </h2>
          <div className="space-y-6 font-serif text-lg leading-[1.85] text-encre">
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
      <section className="bg-sauge py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display font-normal text-3xl text-encre text-center mb-14">
            En trois temps
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="font-display italic text-5xl text-grege mb-4">I.</div>
              <h3 className="font-serif font-semibold text-lg text-encre mb-3">
                Vous offrez.
              </h3>
              <p className="font-sans text-base text-grege leading-relaxed">
                Deux minutes&nbsp;: vous recevez un code d&apos;activation et un
                certificat élégant à imprimer ou à envoyer.
              </p>
            </div>
            <div className="text-center">
              <div className="font-display italic text-5xl text-grege mb-4">II.</div>
              <h3 className="font-serif font-semibold text-lg text-encre mb-3">
                Ils racontent.
              </h3>
              <p className="font-sans text-base text-grege leading-relaxed">
                Chez eux, à la voix, vingt minutes une à deux fois par semaine. La
                première séance se fait ensemble&nbsp;: c&apos;est vous qui poserez
                la première question.
              </p>
            </div>
            <div className="text-center">
              <div className="font-display italic text-5xl text-grege mb-4">III.</div>
              <h3 className="font-serif font-semibold text-lg text-encre mb-3">
                Le livre arrive.
              </h3>
              <p className="font-sans text-base text-grege leading-relaxed">
                Composé, imprimé, relié. Le leur — et, si vous voulez, un exemplaire
                pour chaque petit-enfant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LES TROIS FREINS DÉSAMORCÉS ─────────────────────────────── */}
      <section className="py-20 px-6 bg-blanc">
        <div className="max-w-2xl mx-auto space-y-10">
          <h2 className="font-display font-normal text-3xl text-encre">
            Vous vous demandez peut-être…
          </h2>

          <div className="space-y-8">
            <div>
              <p className="font-serif font-semibold text-lg text-encre mb-2">
                «&nbsp;Ils ne seront jamais à l&apos;aise avec une intelligence artificielle.&nbsp;»
              </p>
              <p className="font-sans text-base text-grege leading-relaxed">
                Il n&apos;y a rien à apprendre. On décroche, on parle, c&apos;est
                tout — et la première séance se fait avec vous à côté.
              </p>
            </div>

            <div className="w-full h-px bg-grege" />

            <div>
              <p className="font-serif font-semibold text-lg text-encre mb-2">
                «&nbsp;Est-ce que ce n&apos;est pas trop intime&nbsp;? Je ne veux pas être intrusif.&nbsp;»
              </p>
              <p className="font-sans text-base text-grege leading-relaxed">
                Vous offrez une possibilité, jamais une obligation. Rien de ce
                qu&apos;ils racontent ne vous est partagé sans leur accord explicite —
                leurs souvenirs leur appartiennent, à chaque étape.
              </p>
            </div>

            <div className="w-full h-px bg-grege" />

            <div>
              <p className="font-serif font-semibold text-lg text-encre mb-2">
                «&nbsp;Et s&apos;ils commencent, puis abandonnent&nbsp;?&nbsp;»
              </p>
              <p className="font-sans text-base text-grege leading-relaxed">
                Le rythme leur appartient, l&apos;interlocuteur relance avec délicatesse,
                jamais avec insistance. Et chaque séance produit déjà des pages qui
                restent&nbsp;: même un récit inachevé est un récit sauvé.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ET PRIX ─────────────────────────────────────────────── */}
      <section id="offrir-cta" className="bg-sauge py-20 px-6 text-center">
        <div className="max-w-xl mx-auto space-y-8">
          <p className="font-serif italic text-lg text-grege">
            Un écrivain public facture entre 1&nbsp;500 et 8&nbsp;000&nbsp;€ pour un
            récit de vie.
          </p>

          <div className="bg-papier p-8 border border-grege">
            <p className="font-display text-2xl text-encre mb-2">
              Le Parcours — 12 mois
            </p>
            <p className="font-sans text-grege text-base mb-6">
              Entretiens illimités · Fragments enrichis · Manuscrit imprimé relié
            </p>
            <p className="font-display text-4xl text-encre mb-1">
              Prix à venir
            </p>
            <p className="font-sans text-sm text-grege mb-6">
              Comptant ou mensualisé sur 12 mois
            </p>
            <a
              href="#"
              className="inline-block bg-encre text-blanc rounded-full font-sans font-medium text-lg px-8 py-4 hover:bg-[#3A3632] transition-colors"
            >
              Offrir le Parcours →
            </a>
          </div>

          <p className="font-sans text-sm text-grege">
            Livré par courriel en quelques minutes — même un 24 décembre au soir.
          </p>
        </div>
      </section>

      {/* ─── CERTIFICAT ──────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-lg mx-auto">
          <p className="font-sans text-center text-xs text-grege tracking-widest uppercase mb-8">
            Le certificat imprimable
          </p>
          <div className="bg-papier border border-grege p-10 text-center space-y-4">
            <p className="font-display italic text-xl text-encre leading-[1.8]">
              <em>[Prénom],</em>
            </p>
            <p className="font-display italic text-2xl text-encre">
              Raconte-moi.
            </p>
            <p className="font-display text-lg text-encre leading-[1.8]">
              Ce cadeau est une invitation&nbsp;: une année de conversations pour
              raconter ton histoire, à ton rythme, chez toi. À la fin, un livre —
              le tien.
            </p>
            <p className="font-display italic text-lg text-encre">
              On fera la première séance ensemble.
            </p>
            <div className="pt-4 border-t border-grege">
              <p className="font-display italic text-lg text-grege">
                [Votre signature]
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONFIDENTIALITÉ ────────────────────────────────────────── */}
      <section className="py-10 px-6 bg-sauge text-center">
        <p className="font-serif text-base text-grege max-w-xl mx-auto leading-relaxed">
          Ce que vous confiez ici vous appartient entièrement. Vos récits ne servent
          jamais à entraîner une intelligence artificielle, et ne sont jamais partagés
          — pas même avec la personne qui vous a offert ce parcours — sans votre accord
          explicite. Vous pouvez les exporter ou les supprimer à tout moment.
        </p>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 bg-encre">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <a href="/" className="font-display italic text-papier text-xl hover:text-petrole transition-colors">
            Racontez-moi
          </a>
          <div className="flex gap-8 font-sans text-sm text-papier/70">
            <a href="/" className="hover:text-petrole transition-colors">
              Accueil
            </a>
            <a href="#" className="hover:text-petrole transition-colors">
              Confidentialité
            </a>
            <a href="#" className="hover:text-petrole transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
