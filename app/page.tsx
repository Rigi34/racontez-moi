import Image from "next/image";
import Link from "next/link";
import Seance from "./components/Seance";
import FAQAccordion from "./components/FAQAccordion";
import EnTeteSite from "./components/EnTeteSite";
import BarreCTAMobile from "./components/BarreCTAMobile";
import EmplacementPreuve, { AFFICHER_EMPLACEMENTS } from "./components/EmplacementPreuve";
import { ChangementAvis, ListeCompris } from "./components/OffreParcours";
import { SectionDeLaVoixAuLivre, SectionVotreLivre, VisuelLivre } from "./components/livre/PresentationLivre";

// Niveau 1 (accueil) : uniquement les questions qui lèvent un frein direct à
// l'essai gratuit — celles qu'un visiteur hésitant se pose avant de cliquer.
// Le reste vit sur /fonctionnement (cf. décision du 26/07/2026, retour de
// Claude Pro sur la structuration en deux niveaux).
const FAQ_ACCUEIL = [
  {
    question: "Combien de temps dure une séance ?",
    reponse:
      "30 à 45 minutes environ. Ce n'est jamais chronométré strictement : une réponse en cours n'est jamais coupée pour respecter une limite de temps.",
  },
  {
    question: "Quelle fréquence ?",
    reponse: "Une à deux séances par semaine, à votre rythme — jamais imposée comme une obligation.",
  },
  {
    question: "Suis-je vraiment écouté ?",
    reponse:
      "Chaque séance est transcrite puis composée en récit, jamais résumée en direct pendant que vous parlez. Rien ne vous évalue en temps réel.",
  },
  {
    question: "Puis-je m'arrêter et reprendre plus tard sans tout perdre ?",
    reponse: "Oui. Chaque réponse est enregistrée dès qu'elle est validée ; vous reprenez exactement là où vous vous étiez arrêté.",
  },
  {
    question: "Dois-je savoir écrire ou avoir un ordinateur ?",
    reponse: "Non. Tout se fait à la voix, depuis un téléphone. L'écrit reste une option, jamais une obligation.",
  },
  {
    question: "Que se passe-t-il si je ne veux pas répondre à une question ?",
    reponse: "Vous pouvez la passer simplement, sans justification — une autre vous sera proposée aussitôt.",
  },
  {
    question: "Ils n'ont pas eu une vie si intéressante à raconter.",
    reponse:
      "Presque personne ne se sent digne d'être raconté avant qu'on lui pose les bonnes questions — c'est presque toujours faux une fois qu'on gratte. Une vie ordinaire déborde de matière ; il ne manque jamais l'histoire, seulement les bonnes questions pour la faire remonter.",
  },
  {
    question: "Le prix change-t-il selon la longueur de mon récit ?",
    reponse:
      "Non. 155\u00a0€ quelle que soit la longueur finale de votre histoire — livre imprimé et relié inclus. Jamais de palier, jamais de supplément découvert après coup. Payable en une fois ou en plusieurs fois via Klarna.",
  },
];

const objetsMemoire = [
  {
    src: "/objet-1-lecoute.webp",
    alt: "Téléphone posé sur une table en bois affichant une séance en cours, entouré d'anciennes photos de famille",
    caption: "L'écoute",
    position: "object-center",
  },
  {
    src: "/objet-2-laseance.webp",
    alt: "Femme de dos assise dans un canapé près d'une fenêtre, tenant son téléphone affichant une séance Racontez-moi en cours",
    caption: "La séance",
    position: "object-[90%_center]",
  },
  // 04/10/2026 : image d'ambiance choisie par Régis — le geste du partage,
  // deux personnes de dos devant un livre ouvert. Elle illustre l'aboutissement,
  // pas le détail du produit, montré en vrai juste avant et juste après.
  {
    src: "/le-partage-portrait.webp",
    alt: "Deux personnes de dos, côte à côte, regardant ensemble un livre ouvert avec des photos",
    caption: "Le partage",
    position: "object-center",
  },
];

// Le texte du « Verrou Narratif Solitaire », inchangé mot pour mot, découpé
// en blocs titrés (02/10/2026) : sur mobile, il occupait trois écrans pleins
// sans respiration.
const verrouNarratif = [
  {
    titre: "Le cahier resté vide",
    texte: (
      <>
        Vous vous êtes déjà dit qu&apos;il faudrait raconter tout ça, un jour.
        Peut-être même qu&apos;on vous a offert un de ces cahiers — «&nbsp;Racontez
        votre vie&nbsp;» en lettres dorées. Il est resté vide après trois pages.
      </>
    ),
  },
  {
    titre: "Personne ne se raconte seul",
    texte: (
      <>
        Ce n&apos;était ni le talent qui manquait, ni la volonté. Personne — pas
        même les écrivains — ne se raconte seul. Le cerveau humain construit ses
        récits en conversation&nbsp;: il lui faut quelqu&apos;un qui écoute, qui
        questionne, qui relance. C&apos;est ce que nous appelons le Verrou Narratif
        Solitaire. Il explique tous les cahiers vides de France.
      </>
    ),
  },
  {
    titre: "Pourquoi pas vos proches",
    texte: (
      <>
        Alors bien sûr, il y a vos proches. Mais vous connaissez la vraie raison
        pour laquelle vous ne leur avez jamais demandé&nbsp;: vous ne voulez pas
        leur imposer ça. Des heures d&apos;écoute, des enregistrements, des notes
        à reprendre. Ce n&apos;est pas de la pudeur — c&apos;est de la délicatesse.
      </>
    ),
  },
  {
    titre: "Ce que nous avons changé",
    texte: (
      <>
        Un interlocuteur qui ne se lasse jamais, ne juge pas, n&apos;attend rien en
        retour — et qui se souvient de tout ce que vous lui confiez. Cet interlocuteur
        est une intelligence artificielle. Elle n&apos;écrit pas votre vie à votre
        place&nbsp;: elle vous pose les questions que personne ne prend le temps de
        poser. Le livre, lui, sera fait de vos mots.
      </>
    ),
  },
];

const piliers = [
  {
    titre: "Pour eux.",
    texte:
      "Un récit de vie cohérent se transmet : la recherche sur l'attachement montre qu'il structure le lien des générations suivantes.",
    source: "D. Siegel",
  },
  {
    titre: "Pour vous.",
    texte:
      "Mettre sa vie en récit n'est pas un caprice : c'est une étape du développement adulte, décrite par Erikson il y a cinquante ans.",
    source: "E. Erikson",
  },
  {
    titre: "Pour votre équilibre.",
    texte:
      "Ce qui se raconte pèse moins. Quarante ans d'études sur l'écriture expressive le confirment, jusque dans les indicateurs de santé.",
    source: "J. Pennebaker",
  },
];

const lienDiscret =
  "text-petrole underline decoration-sauge underline-offset-4 hover:decoration-petrole transition-colors";

// Ordre des sections (02/10/2026, étude « Racontez-moi face au marché ») :
// promesse → comment ça marche → expérience → ce que l'on reçoit → preuve →
// prix et garantie → objections → séance d'essai. Un message principal par
// écran ; la citation de Cyrulnik quitte le premier écran (elle l'occupait
// entièrement sur mobile) pour ouvrir le texte du Verrou Narratif.
export default function Home() {
  return (
    <main className="min-h-screen">
      <EnTeteSite />

      {/* ─── PROMESSE ─────────────────────────────────────────────────── */}
      <section className="px-6 pt-6 pb-16 md:pt-20 md:pb-28">
        <div className="max-w-6xl mx-auto w-full lg:grid lg:grid-cols-[1fr_420px] lg:gap-20 items-center">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <h1 className="font-display font-normal text-[2.15rem] leading-[1.12] md:text-5xl lg:text-6xl md:leading-[1.15] text-encre max-w-3xl mb-6 text-balance">
              Votre histoire n&apos;attend pas l&apos;inspiration.
              <br />
              Elle attend un interlocuteur.
            </h1>

            <p className="font-sans text-base md:text-xl text-grege max-w-2xl mb-7 md:mb-8 leading-relaxed">
              {/* Version courte sur mobile (02/10/2026) : garder titre, phrase,
                  bouton et prix dans le premier écran d'un téléphone. */}
              <span className="md:hidden">
                Des conversations à la voix, chez vous. Un interlocuteur qui écoute, questionne, se
                souvient — et compose le livre de votre vie. Un vrai livre. Imprimé.
              </span>
              <span className="hidden md:inline">
                Des conversations de trente à quarante-cinq minutes, chez vous, à la voix. Un
                interlocuteur attentif qui écoute, questionne, se souvient — et compose au fil des
                séances le livre de votre vie. Un vrai livre. Imprimé.
              </span>
            </p>

            <a
              href="#premiere-question"
              className="inline-block bg-encre text-blanc rounded-full font-sans font-medium text-lg px-8 py-4 hover:bg-[#3A3632] transition-colors duration-200 mb-4"
            >
              Commencer mon histoire →
            </a>

            <p className="font-sans text-sm text-grege">
              Première séance offerte — sans compte, sans carte bancaire.
            </p>
            <p className="font-sans text-sm text-grege mt-1">
              Ensuite, 155&nbsp;€ pour tout le parcours, livre relié compris.{" "}
              <a href="#prix" className={lienDiscret}>
                Le détail
              </a>
            </p>
          </div>

          {/* 04/10/2026 : vrais rendus du moteur (couverture + ouverture de
              chapitre) à la place de hero-livre.webp, image générée qui
              montrait un papier crème et une mise en page qui ne sont pas les
              nôtres. */}
          <div className="mt-12 lg:mt-0 max-w-[420px] mx-auto w-full">
            <VisuelLivre />
          </div>
        </div>
      </section>

      {/* ─── COMMENT ÇA MARCHE ───────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-6 bg-sauge">
        <div className="max-w-4xl mx-auto">
          <p className="font-sans text-center text-encre/70 text-xs tracking-widest uppercase mb-10">
            Comment ça se passe
          </p>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="relative px-2">
              <p className="font-display text-6xl md:text-7xl text-encre/15 leading-none mb-2">01</p>
              <p className="font-display text-2xl text-encre mb-3">Vous commencez.</p>
              <p className="font-sans text-base text-encre/80 leading-relaxed">
                Une première séance offerte, sans engagement&nbsp;— vous verrez tout de suite
                si cette voix vous convient.
              </p>
            </div>
            <div className="relative px-2">
              <p className="font-display text-6xl md:text-7xl text-encre/15 leading-none mb-2">02</p>
              <p className="font-display text-2xl text-encre mb-3">Vous racontez.</p>
              <p className="font-sans text-base text-encre/80 leading-relaxed">
                Trente à quarante-cinq minutes, une à deux fois par semaine, à votre rythme, pendant deux à quatre mois.
              </p>
            </div>
            <div className="relative px-2">
              <p className="font-display text-6xl md:text-7xl text-encre/15 leading-none mb-2">03</p>
              <p className="font-display text-2xl text-encre mb-3">Le livre arrive.</p>
              <p className="font-sans text-base text-encre/80 leading-relaxed">
                Composé séance après séance, imprimé, relié. Le vôtre.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LE VERROU NARRATIF (épigraphe + texte découpé) ──────────── */}
      <section className="py-16 md:py-24 px-6 bg-blanc">
        <div className="max-w-2xl mx-auto">
          <figure className="mb-14 md:mb-16">
            <blockquote className="font-display italic text-xl md:text-[22px] leading-[1.6] text-encre">
              «&nbsp;Dès qu&apos;on en fait un récit, on donne sens à nos souffrances, on comprend,
              longtemps après, comment on a pu changer un malheur en merveille.&nbsp;»
            </blockquote>
            <figcaption className="mt-4 font-sans text-xs tracking-widest uppercase text-grege">
              Boris Cyrulnik, neuropsychiatre
            </figcaption>
          </figure>
          <div className="space-y-10">
            {verrouNarratif.map((bloc) => (
              <div key={bloc.titre}>
                <h2 className="font-display text-2xl text-encre mb-3">{bloc.titre}</h2>
                <p className="font-serif text-lg leading-[1.85] text-encre">{bloc.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── L'EXPÉRIENCE : LA SÉANCE (aplat pétrole) ────────────────── */}
      <section className="py-20 md:py-24 px-6 bg-petrole-fonce text-papier">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl">
            <p className="font-sans text-xs tracking-widest uppercase text-sauge mb-4">La séance</p>
            <h2 className="font-display font-normal text-3xl md:text-4xl leading-[1.2] mb-6 text-balance">
              Une question à la fois. Quelqu&apos;un qui écoute vraiment.
            </h2>
            <p className="font-serif text-lg leading-[1.8] text-papier/85">
              Vous répondez à voix haute, sans vous presser&nbsp;: un silence n&apos;est jamais pris
              pour une fin de réponse. L&apos;interlocuteur relance à partir de ce que vous venez de
              dire, puis compose le passage. D&apos;une séance à l&apos;autre, il se souvient de ce
              que vous avez raconté. Une question ne vous convient pas&nbsp;? Vous la passez, sans
              justification.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-8 mt-12 md:mt-14">
            {objetsMemoire.map((objet) => (
              <figure key={objet.caption}>
                <div className="relative aspect-[4/5] overflow-hidden bg-petrole">
                  <Image
                    src={objet.src}
                    alt={objet.alt}
                    fill
                    className={`object-cover ${objet.position}`}
                    sizes="30vw"
                  />
                </div>
                <figcaption className="mt-3 font-sans text-[10px] sm:text-xs tracking-widest uppercase text-papier/70 text-center">
                  {objet.caption}
                </figcaption>
              </figure>
            ))}
          </div>

          {AFFICHER_EMPLACEMENTS && (
            <div className="mt-12 max-w-2xl">
              <EmplacementPreuve
                sombre
                format="min-h-32"
                titre="Écouter l'interlocuteur"
                attendu="45 à 60 secondes audio d'une vraie séance pilote (avec l'accord écrit du narrateur), et sa transcription. Fichier .mp3 ou .m4a."
              />
            </div>
          )}
        </div>
      </section>

      {/* ─── CE QUE VOUS RECEVEZ : LE LIVRE (rendus réels du moteur) ──
          04/10/2026 : remplace la composition triptyque-livre / pdf / epub,
          images générées qui montraient un livre et des écrans qui ne sont
          pas les nôtres. Voir app/components/livre/. */}
      <SectionVotreLivre />

      {/* ─── DE LA VOIX AU LIVRE (séance de test réelle) ─────────────── */}
      <SectionDeLaVoixAuLivre />

      {/* ─── PREUVE : LA MÉTHODE ET LE RÉSULTAT ──────────────────────── */}
      <section className="py-20 md:py-24 px-6 bg-blanc">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl text-encre mb-8">Rien n&apos;est improvisé</h2>
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

          <div className="grid md:grid-cols-3 gap-10 mt-16 pt-10 border-t border-grege/30">
            {piliers.map((pilier) => (
              <div key={pilier.titre}>
                <p className="font-display text-xl text-encre mb-2">{pilier.titre}</p>
                <p className="font-serif text-base leading-relaxed text-encre/85">{pilier.texte}</p>
                <p className="font-sans text-xs text-grege mt-3 tracking-widest uppercase">{pilier.source}</p>
              </div>
            ))}
          </div>

          {AFFICHER_EMPLACEMENTS && (
            <div className="max-w-xl mt-16">
              <EmplacementPreuve
                titre="Avis vérifiés"
                attendu="Uniquement des avis réels, recueillis après réception du livre, avec accord de publication. Aucun avis tant qu'il n'y en a pas."
                format="min-h-40"
              />
            </div>
          )}
        </div>
      </section>

      {/* ─── PRIX, CONTENU ET GARANTIE (aplat pétrole) ───────────────── */}
      <section id="prix" className="py-20 md:py-24 px-6 bg-petrole text-papier scroll-mt-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <p className="font-display text-6xl md:text-7xl font-normal">155&nbsp;€</p>
            <p className="font-display text-xl md:text-2xl mt-4 text-balance">
              Votre parcours Racontez-moi, de la première conversation à votre livre.
            </p>
            <p className="font-serif text-lg text-papier/80 mt-4 leading-relaxed">
              Un parcours d&apos;environ deux à quatre mois, à votre rythme&nbsp;: aucune durée
              n&apos;est imposée. En une fois, ou en 3 ou 4 fois avec Klarna. Jamais de supplément
              selon la longueur du récit.
            </p>
          </div>

          <div className="mt-12 pt-10 border-t border-papier/20">
            <p className="font-sans text-xs tracking-widest uppercase text-sauge mb-6">Ce qui est compris</p>
            <ListeCompris sombre />
          </div>

          <div className="mt-12 pt-10 border-t border-papier/20 max-w-2xl">
            <ChangementAvis sombre />
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <a
              href="#premiere-question"
              className="inline-block bg-papier text-encre rounded-full font-sans font-medium text-base px-7 py-3.5 hover:bg-blanc transition-colors"
            >
              Commencer par la séance offerte
            </a>
            <Link href="/offrir" className="font-sans text-sm text-papier underline decoration-sauge/60 underline-offset-4 hover:decoration-papier transition-colors">
              L&apos;offrir en cadeau →
            </Link>
            {/* Ancien lien « Découvrir Le Parcours » vers /parcours : cette page
                exige une session et renvoyait tout visiteur non connecté vers
                /sign-in (corrigé le 02/10/2026). */}
            <Link href="/fonctionnement" className="font-sans text-sm text-papier underline decoration-sauge/60 underline-offset-4 hover:decoration-papier transition-colors">
              Le déroulé du parcours →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── OBJECTIONS ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-papier">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl text-encre mb-10 text-center">
            Vous vous demandez sans doute...
          </h2>
          <FAQAccordion items={FAQ_ACCUEIL} />
          <p className="text-center mt-8 font-sans text-sm text-grege">
            D&apos;autres questions ?{" "}
            <Link href="/fonctionnement" className={lienDiscret}>
              Voir le fonctionnement en détail →
            </Link>
          </p>
        </div>
      </section>

      {/* ─── SÉANCE GRATUITE INTÉGRÉE ─────────────────────────────────── */}
      <section id="premiere-question" className="bg-sauge/40 py-20 scroll-mt-4">
        <p className="font-sans text-center text-grege text-sm tracking-widest uppercase mb-8 px-6">
          Ne nous croyez pas sur parole. Faites une vraie séance, gratuitement.
        </p>
        <Seance modeInvite />
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="pt-12 pb-28 md:pb-12 px-6 bg-encre">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo-R-papier-transparent-1024.png"
              alt=""
              width={28}
              height={28}
            />
            <p className="font-display italic text-papier text-xl">
              Racontez-moi
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 font-sans text-sm text-papier/70">
              <a href="/offrir" className="hover:text-sauge transition-colors">
                Offrir en cadeau
              </a>
              <a href="/manifeste" className="hover:text-sauge transition-colors">
                Notre histoire
              </a>
              <a href="/fonctionnement" className="hover:text-sauge transition-colors">
                Fonctionnement
              </a>
              <Link href="/blog" className="hover:text-sauge transition-colors">
                Journal
              </Link>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 font-sans text-xs text-papier/50">
              <a href="/confidentialite" className="hover:text-sauge transition-colors">
                Confidentialité (RGPD)
              </a>
              <a href="/mentions-legales" className="hover:text-sauge transition-colors">
                Mentions légales
              </a>
              <a href="/contact" className="hover:text-sauge transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>

      <BarreCTAMobile />
    </main>
  );
}
