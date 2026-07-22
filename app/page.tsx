import Image from "next/image";
import PremièreQuestion from "./components/PremièreQuestion";

const objetsMemoire = [
  {
    src: "/objet-1-lecoute.webp",
    alt: "Téléphone posé sur une table en bois affichant une séance en cours, entouré d'anciennes photos de famille",
    caption: "L'écoute",
    position: "object-center",
  },
  {
    src: "/objet-2-laseance.webp",
    alt: "Femme de dos assise près d'une fenêtre, téléphone posé sur la table en train d'enregistrer",
    caption: "La séance",
    position: "object-center",
  },
  {
    src: "/objet-3-lepartage.webp",
    alt: "Trois personnes de dos, réunies sur un canapé, lisant un livre ensemble",
    caption: "Le partage",
    position: "object-center",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* ─── HEADER ───────────────────────────────────────────────────── */}
      <header className="px-6 pt-6 flex justify-end">
        <a
          href="/sign-in"
          className="font-sans text-sm text-encre hover:text-petrole transition-colors"
        >
          Se connecter
        </a>
      </header>

      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="min-h-screen flex items-center px-6 pt-16 pb-20">
        <div className="max-w-6xl mx-auto w-full lg:grid lg:grid-cols-[1fr_420px] lg:gap-20 items-center">

          {/* Colonne texte */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Épigraphe Cyrulnik */}
            <div className="mb-8 max-w-[540px]">
              <p className="font-display italic text-[22px] leading-[1.6] text-encre">
                «&nbsp;Dès qu&apos;on en fait un récit, on donne sens à nos souffrances, on comprend, longtemps après, comment on a pu changer un malheur en merveille.&nbsp;»
              </p>
              <p className="note-marginale mt-2 text-2xl">
                — Boris Cyrulnik, neuropsychiatre
              </p>
            </div>

            {/* Filet séparateur */}
            <div className="mb-10 w-[60px] h-px bg-grege" />

            {/* H1 */}
            <h1 className="font-display font-normal text-4xl md:text-5xl lg:text-6xl leading-[1.15] text-encre max-w-3xl mb-6">
              Votre histoire n&apos;attend pas l&apos;inspiration.
              <br />
              Elle attend un interlocuteur.
            </h1>

            {/* Sous-titre */}
            <p className="font-sans text-lg md:text-xl text-grege max-w-2xl mb-10 leading-relaxed">
              Des conversations de vingt minutes, chez vous, à la voix. Un interlocuteur
              attentif qui écoute, questionne, se souvient — et compose au fil des séances
              le livre de votre vie. Un vrai livre. Imprimé.
            </p>

            {/* Formule */}
            <p className="font-display italic text-2xl text-encre mb-8">
              Vous parlez. Le livre s&apos;écrit.
            </p>

            {/* CTA */}
            <a
              href="#premiere-question"
              className="inline-block bg-encre text-blanc rounded-full font-sans font-medium text-lg px-8 py-4 hover:bg-[#3A3632] transition-colors duration-200 mb-4"
            >
              Commencer mon histoire →
            </a>

            {/* Réassurance */}
            <p className="font-sans text-sm text-grege">
              Première séance offerte — sans compte, sans carte bancaire.
            </p>
          </div>

          {/* Colonne image — livre physique above the fold */}
          <div className="mt-14 lg:mt-0">
            <div className="relative overflow-hidden shadow-[6px_6px_0px_#DAD4C5]">
              <Image
                src="/hero-livre.webp"
                alt="Une personne tenant le livre Racontez-moi, avec l'application ouverte sur son téléphone à côté"
                width={420}
                height={525}
                className="object-cover w-full"
                priority
              />
              {/* Fine bordure papier-foncé */}
              <div className="absolute inset-0 ring-1 ring-inset ring-grege/40" />
            </div>
            {/* Caption discret */}
            <p className="mt-3 font-sans text-xs text-grege tracking-widest uppercase text-center lg:text-right">
              Votre histoire. Votre livre.
            </p>
          </div>

        </div>
      </section>

      {/* ─── 3 PILIERS ────────────────────────────────────────────────── */}
      <section className="bg-sauge py-20 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="bg-papier p-8 shadow-[5px_5px_0px_#DAD4C5] text-center">
            <div className="w-8 h-[3px] mx-auto mb-6 bg-encre" />
            <p className="font-serif text-base leading-relaxed text-encre">
              <strong className="font-semibold block mb-2">Pour eux.</strong>
              Un récit de vie cohérent se transmet&nbsp;: la recherche sur
              l&apos;attachement montre qu&apos;il structure le lien des générations
              suivantes.
            </p>
            <p className="font-sans text-xs text-encre mt-3 tracking-wider uppercase">
              D. Siegel
            </p>
          </div>

          <div className="bg-papier p-8 shadow-[5px_5px_0px_#DAD4C5] text-center">
            <div className="w-8 h-[3px] mx-auto mb-6 bg-encre" />
            <p className="font-serif text-base leading-relaxed text-encre">
              <strong className="font-semibold block mb-2">Pour vous.</strong>
              Mettre sa vie en récit n&apos;est pas un caprice&nbsp;: c&apos;est une
              étape du développement adulte, décrite par Erikson il y a cinquante ans.
            </p>
          </div>

          <div className="bg-papier p-8 shadow-[5px_5px_0px_#DAD4C5] text-center">
            <div className="w-8 h-[3px] mx-auto mb-6 bg-encre" />
            <p className="font-serif text-base leading-relaxed text-encre">
              <strong className="font-semibold block mb-2">Pour votre équilibre.</strong>
              Ce qui se raconte pèse moins. Quarante ans d&apos;études sur
              l&apos;écriture expressive le confirment, jusque dans les indicateurs
              de santé.
            </p>
            <p className="font-sans text-xs text-encre mt-3 tracking-wider uppercase">
              J. Pennebaker
            </p>
          </div>
        </div>
      </section>

      {/* ─── LEAD TEXT ────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-blanc">
        <div className="max-w-2xl mx-auto space-y-6 font-serif text-lg leading-[1.85] text-encre">
          <p>
            Vous vous êtes déjà dit qu&apos;il faudrait raconter tout ça, un jour.
            Peut-être même qu&apos;on vous a offert un de ces cahiers — «&nbsp;Racontez
            votre vie&nbsp;» en lettres dorées. Il est resté vide après trois pages.
          </p>
          <p>
            Ce n&apos;était ni le talent qui manquait, ni la volonté. Personne — pas
            même les écrivains — ne se raconte seul. Le cerveau humain construit ses
            récits en conversation&nbsp;: il lui faut quelqu&apos;un qui écoute, qui
            questionne, qui relance. C&apos;est ce que nous appelons le Verrou Narratif
            Solitaire. Il explique tous les cahiers vides de France.
          </p>
          <p>
            Alors bien sûr, il y a vos proches. Mais vous connaissez la vraie raison
            pour laquelle vous ne leur avez jamais demandé&nbsp;: vous ne voulez pas
            leur imposer ça. Des heures d&apos;écoute, des enregistrements, des notes
            à reprendre. Ce n&apos;est pas de la pudeur — c&apos;est de la délicatesse.
          </p>
          <p>
            C&apos;est exactement ce que nous avons changé. Un interlocuteur qui ne se
            lasse jamais, ne juge pas, n&apos;attend rien en retour — et qui se souvient
            de tout ce que vous lui confiez. Cet interlocuteur est une intelligence
            artificielle. Elle n&apos;écrit pas votre vie à votre place&nbsp;: elle vous
            pose les questions que personne ne prend le temps de poser. Le livre, lui,
            sera fait de vos mots.
          </p>
        </div>
      </section>

      {/* ─── COMMENT ÇA MARCHE ───────────────────────────────────────── */}
      <section className="py-20 px-6 bg-sauge">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-10">
            <div className="relative px-2">
              <p className="font-display text-7xl text-encre/15 leading-none mb-2">01</p>
              <p className="font-display text-2xl text-encre mb-3">Vous commencez.</p>
              <p className="font-sans text-base text-encre/80 leading-relaxed">
                Une première séance offerte, sans engagement&nbsp;— vous verrez tout de suite
                si cette voix vous convient.
              </p>
            </div>
            <div className="relative px-2">
              <p className="font-display text-7xl text-encre/15 leading-none mb-2">02</p>
              <p className="font-display text-2xl text-encre mb-3">Vous racontez.</p>
              <p className="font-sans text-base text-encre/80 leading-relaxed">
                Vingt minutes, une à deux fois par semaine, à votre rythme, pendant deux à trois mois.
              </p>
            </div>
            <div className="relative px-2">
              <p className="font-display text-7xl text-encre/15 leading-none mb-2">03</p>
              <p className="font-display text-2xl text-encre mb-3">Le livre arrive.</p>
              <p className="font-sans text-base text-encre/80 leading-relaxed">
                Composé séance après séance, imprimé, relié. Le vôtre.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── RIEN N'EST IMPROVISÉ ────────────────────────────────────── */}
      <section className="py-20 px-6 bg-blanc">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl text-encre mb-10">
            Rien n&apos;est improvisé
          </h2>
          <div className="space-y-6 font-serif text-lg leading-[1.85] text-encre">
            <p>
              Les questions qui vous seront posées, le rythme des séances, la façon dont vos mots
              deviennent un texte&nbsp;: rien n&apos;a été laissé au hasard. Quatorze ouvrages de
              référence ont nourri cette méthode&nbsp;— de la neuropsychologie de la mémoire à
              l&apos;art d&apos;écrire une vie&nbsp;— pour comprendre pourquoi un souvenir remonte
              mieux par une sensation que par une date, et ce qui transforme un souvenir raconté en
              un texte qu&apos;on a vraiment envie de relire.
            </p>
            <p>
              Ce sérieux ne se voit pas pendant la conversation. C&apos;est précisément le
              but&nbsp;: vous n&apos;aurez jamais l&apos;impression de suivre un protocole,
              seulement celle d&apos;être bien écouté.
            </p>
          </div>
        </div>
      </section>

      {/* ─── OBJETS DE MÉMOIRE ────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-sauge">
        <div className="max-w-5xl mx-auto">
          <p className="font-sans text-center text-grege text-xs tracking-widest uppercase mb-10">
            Ce que garde une vie
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-3xl mx-auto">
            {objetsMemoire.map((objet) => (
              <div key={objet.caption}>
                <div className="relative aspect-[4/5] overflow-hidden bg-grege/30 shadow-[5px_5px_0px_#DAD4C5]">
                  <Image
                    src={objet.src}
                    alt={objet.alt}
                    fill
                    className={`object-cover ${objet.position}`}
                    sizes="(max-width: 640px) 90vw, 30vw"
                  />
                </div>
                <p className="mt-3 font-sans text-xs text-encre tracking-widest uppercase text-center">
                  {objet.caption}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MODULE LA PREMIÈRE QUESTION ─────────────────────────────── */}
      <section id="premiere-question" className="bg-papier py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="font-sans text-center text-grege text-sm tracking-widest uppercase mb-12">
            Ne nous croyez pas sur parole. Répondez à une question.
          </p>
          <PremièreQuestion />
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 bg-encre">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-display italic text-papier text-xl">
            Racontez-moi
          </p>
          <div className="flex gap-8 font-sans text-sm text-papier/70">
            <a href="/offrir" className="hover:text-petrole transition-colors">
              Offrir en cadeau
            </a>
            <a href="/manifeste" className="hover:text-petrole transition-colors">
              Notre histoire
            </a>
            <a href="/blog" className="hover:text-petrole transition-colors">
              Journal
            </a>
            <a href="/confidentialite" className="hover:text-petrole transition-colors">
              Confidentialité
            </a>
            <a href="/mentions-legales" className="hover:text-petrole transition-colors">
              Mentions légales
            </a>
            <a href="/contact" className="hover:text-petrole transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
