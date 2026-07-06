import PremièreQuestion from "./components/PremièreQuestion";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center min-h-screen px-6 pt-24 pb-20 text-center">
        {/* Épigraphe Cyrulnik */}
        <div className="mb-8 max-w-[540px]">
          <p className="font-garamond italic text-[22px] leading-[1.6] text-presque-noir">
            «&nbsp;Dès qu&apos;on en fait un récit, on donne sens à nos souffrances.&nbsp;»
          </p>
          <p className="mt-3 font-sans text-[13px] tracking-[0.12em] text-gris-chaud">
            — Boris Cyrulnik, neuropsychiatre
          </p>
        </div>

        {/* Filet séparateur */}
        <div className="mb-10 w-[60px] h-px bg-sable" />

        {/* H1 */}
        <h1 className="font-display font-normal text-4xl md:text-5xl lg:text-6xl leading-[1.15] text-presque-noir max-w-3xl mb-6">
          Votre histoire n&apos;attend pas l&apos;inspiration.
          <br />
          Elle attend un interlocuteur.
        </h1>

        {/* Sous-titre */}
        <p className="font-sans text-lg md:text-xl text-gris-chaud max-w-2xl mb-10 leading-relaxed">
          Des conversations de vingt minutes, chez vous, à la voix. Un interlocuteur
          attentif qui écoute, questionne, se souvient — et compose au fil des séances
          le livre de votre vie. Un vrai livre. Imprimé.
        </p>

        {/* Formule */}
        <p className="font-garamond italic text-2xl text-presque-noir mb-8">
          Vous parlez. Le livre s&apos;écrit.
        </p>

        {/* CTA */}
        <a
          href="#premiere-question"
          className="inline-block bg-terracotta text-ivoire font-sans font-medium text-lg px-8 py-4 hover:bg-[#A8692E] transition-colors duration-200 mb-4"
        >
          Commencer mon histoire →
        </a>

        {/* Réassurance */}
        <p className="font-sans text-sm text-gris-chaud">
          Première séance offerte — sans compte, sans carte bancaire.
        </p>
      </section>

      {/* ─── 3 PILIERS ────────────────────────────────────────────────── */}
      <section className="bg-ivoire-fonce py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10">
          <div className="text-center">
            <div className="w-8 h-px mx-auto mb-6 bg-sable" />
            <p className="font-serif text-base leading-relaxed text-presque-noir">
              <strong className="font-semibold block mb-2">Pour eux.</strong>
              Un récit de vie cohérent se transmet&nbsp;: la recherche sur
              l&apos;attachement montre qu&apos;il structure le lien des générations
              suivantes.
            </p>
            <p className="font-sans text-xs text-gris-chaud mt-3 tracking-wider uppercase">
              D. Siegel
            </p>
          </div>

          <div className="text-center">
            <div className="w-8 h-px mx-auto mb-6 bg-sable" />
            <p className="font-serif text-base leading-relaxed text-presque-noir">
              <strong className="font-semibold block mb-2">Pour vous.</strong>
              Mettre sa vie en récit n&apos;est pas un caprice&nbsp;: c&apos;est une
              étape du développement adulte, décrite par Erikson il y a cinquante ans.
            </p>
          </div>

          <div className="text-center">
            <div className="w-8 h-px mx-auto mb-6 bg-sable" />
            <p className="font-serif text-base leading-relaxed text-presque-noir">
              <strong className="font-semibold block mb-2">Pour votre équilibre.</strong>
              Ce qui se raconte pèse moins. Quarante ans d&apos;études sur
              l&apos;écriture expressive le confirment, jusque dans les indicateurs
              de santé.
            </p>
            <p className="font-sans text-xs text-gris-chaud mt-3 tracking-wider uppercase">
              J. Pennebaker
            </p>
          </div>
        </div>
      </section>

      {/* ─── LEAD TEXT ────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto space-y-6 font-serif text-lg leading-[1.85] text-presque-noir">
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

      {/* ─── MODULE LA PREMIÈRE QUESTION ─────────────────────────────── */}
      <section id="premiere-question" className="bg-ivoire-fonce py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="font-sans text-center text-gris-chaud text-sm tracking-widest uppercase mb-12">
            Ne nous croyez pas sur parole. Répondez à une question.
          </p>
          <PremièreQuestion />
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 border-t border-sable">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-garamond italic text-presque-noir text-xl">
            Racontez-moi
          </p>
          <div className="flex gap-8 font-sans text-sm text-gris-chaud">
            <a href="/offrir" className="hover:text-presque-noir transition-colors">
              Offrir en cadeau
            </a>
            <a href="#" className="hover:text-presque-noir transition-colors">
              Confidentialité
            </a>
            <a href="#" className="hover:text-presque-noir transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
