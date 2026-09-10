import type { Metadata } from "next";
import Link from "next/link";
import FAQAccordion from "../components/FAQAccordion";

export const metadata: Metadata = {
  title: "Comment fonctionne Racontez-moi",
  description: "Durée des séances, rythme, silence, corrections — la mécanique expliquée simplement.",
};

// Icônes linework des 6 étapes ci-dessous — dessinées à la main (pas de
// génération IA : les tentatives via ChatGPT produisaient un rendu qui ne
// correspondait pas à sa propre description — fond non transparent, flou
// parasite). Deux teintes de la charte uniquement : pétrole (trait
// principal) + ambre (accent), jamais de dégradé, jamais de visage.
const PETROLE = "#1F4B4C";
const AMBRE = "#B8823D";

function IconVousRacontez() {
  return (
    <svg viewBox="0 0 64 64" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="26" y="8" width="12" height="22" rx="6" stroke={PETROLE} strokeWidth="2" />
      <path d="M18 26a14 14 0 0 0 28 0" stroke={PETROLE} strokeWidth="2" />
      <line x1="32" y1="40" x2="32" y2="48" stroke={PETROLE} strokeWidth="2" />
      <line x1="24" y1="48" x2="40" y2="48" stroke={PETROLE} strokeWidth="2" />
      <path d="M8 22v8M14 18v16" stroke={AMBRE} strokeWidth="2" opacity="0.85" />
      <path d="M56 22v8M50 18v16" stroke={AMBRE} strokeWidth="2" opacity="0.85" />
    </svg>
  );
}

function IconInterlocuteurEcoute() {
  return (
    <svg viewBox="0 0 64 64" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M34 12c-11 0-20 9-20 20v4a7 7 0 0 0 7 7 5 5 0 0 0 5-5v-1.5a3 3 0 0 1 3-3 3 3 0 0 0 3-3v-1c0-6 5-11 11-11h1c6 0 11 5 11 11"
        stroke={PETROLE}
        strokeWidth="2.2"
      />
      <path d="M48 22a16 16 0 0 1 0 20" stroke={AMBRE} strokeWidth="2" opacity="0.85" />
      <path d="M54 17a24 24 0 0 1 0 30" stroke={AMBRE} strokeWidth="2" opacity="0.55" />
    </svg>
  );
}

function IconParoleFormeTexte() {
  return (
    <svg viewBox="0 0 64 64" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 32h3M10 25v14M16 20v24M22 28v8M28 32h2" stroke={PETROLE} strokeWidth="2" />
      <path d="M34 32h10M40 26l4 6-4 6" stroke={AMBRE} strokeWidth="2" />
      <line x1="48" y1="22" x2="60" y2="22" stroke={PETROLE} strokeWidth="2" />
      <line x1="48" y1="32" x2="60" y2="32" stroke={PETROLE} strokeWidth="2" />
      <line x1="48" y1="42" x2="56" y2="42" stroke={PETROLE} strokeWidth="2" />
    </svg>
  );
}

function IconGardezLaMain() {
  return (
    <svg viewBox="0 0 64 64" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 44l3-11L33 11l8 8-22 22-11 3z" stroke={PETROLE} strokeWidth="2" />
      <line x1="29" y1="15" x2="37" y2="23" stroke={PETROLE} strokeWidth="2" />
      <circle cx="48" cy="42" r="11" stroke={AMBRE} strokeWidth="2" />
      <path d="M43 42l4 4 8-8" stroke={AMBRE} strokeWidth="2" />
    </svg>
  );
}

function IconChapitreApresChapitre() {
  const tranches = ["Mes racines", "Les rencontres", "Les épreuves", "Les joies", "Le bilan", "La transmission"];
  return (
    <svg viewBox="0 0 220 150" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {tranches.map((label, i) => (
        <g key={label}>
          <rect x="14" y={12 + i * 21} width="192" height="16" rx="3" stroke={PETROLE} strokeWidth="1.5" />
          <text x="24" y={24 + i * 21} fontSize="10.5" fontFamily="var(--font-serif)" fill={i % 2 === 0 ? PETROLE : AMBRE}>
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function IconTransmission() {
  return (
    <svg viewBox="0 0 64 64" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Livre fermé vu de face, tranche de pages à droite, ruban marque-page */}
      <rect x="20" y="8" width="24" height="30" rx="1.5" stroke={PETROLE} strokeWidth="2" />
      <path d="M44 10v26M46.5 11v24M49 12.5v21" stroke={PETROLE} strokeWidth="1" opacity="0.5" />
      <path d="M30 8v14l4-4 4 4V8" stroke={AMBRE} strokeWidth="2" />
      {/* Deux mains en coupe, qui présentent le livre */}
      <path d="M6 46c2-7 9-10 15-6 2 1 3 2 3 2" stroke={PETROLE} strokeWidth="2" />
      <path d="M58 46c-2-7-9-10-15-6-2 1-3 2-3 2" stroke={PETROLE} strokeWidth="2" />
      <path d="M6 46c0 5 4 8 8 8M58 46c0 5-4 8-8 8" stroke={PETROLE} strokeWidth="2" />
    </svg>
  );
}

const ETAPES_DETAIL = [
  {
    titre: "Vous racontez",
    sousTitre: "À votre rythme.",
    texte:
      "Vous partagez vos souvenirs en toute simplicité, par la voix. Pas besoin d'écrire, ni d'être un expert. Juste l'envie de raconter.",
    Icone: IconVousRacontez,
  },
  {
    titre: "L'interlocuteur écoute",
    sousTitre: "Une question ouvre le souvenir. Votre parole fait le reste.",
    texte:
      "Racontez-moi vous guide avec bienveillance. Chaque échange est une conversation naturelle, conçue pour faire émerger ce qui compte vraiment.",
    Icone: IconInterlocuteurEcoute,
  },
  {
    titre: "Votre parole prend forme",
    sousTitre: "Votre parole devient un récit lisible, sans perdre votre voix.",
    texte:
      "La transcription structure vos souvenirs pour leur donner une cohérence, tout en respectant votre style et votre authenticité.",
    Icone: IconParoleFormeTexte,
  },
  {
    titre: "Vous gardez la main",
    sousTitre: "Vous relisez. Vous corrigez. Vous validez. Rien n'est définitif sans vous.",
    texte:
      "Chaque texte vous est présenté. Vous pouvez le modifier, le compléter, demander des ajustements. C'est votre histoire, et elle vous ressemble.",
    Icone: IconGardezLaMain,
  },
  {
    titre: "Chapitre après chapitre",
    sousTitre: "Votre histoire se construit progressivement.",
    texte:
      "Au fil des échanges, les chapitres s'assemblent pour former un récit fluide, vivant et profondément humain.",
    Icone: IconChapitreApresChapitre,
  },
  {
    titre: "Votre histoire devient transmission",
    sousTitre: "Un livre à garder. Une histoire à transmettre.",
    texte:
      "Votre récit prend la forme d'un beau livre, agrémenté si vous le souhaitez de photos et de souvenirs. Un objet unique, pour vous et pour ceux qui comptent.",
    Icone: IconTransmission,
  },
];

// Niveau 2 (page dédiée) : le reste des questions, pour qui veut creuser —
// cf. décision du 26/07/2026 (retour de Claude Pro), en complément de la
// FAQ courte sur l'accueil.
const FAQ_FONCTIONNEMENT = [
  {
    question: "Quelle chronologie suivent les séances ?",
    reponse:
      "Les questions suivent l'ordre naturel d'une vie — des racines et de la petite enfance jusqu'au bilan et à la transmission — sur une durée cible de deux à quatre mois qui s'ajuste au volume que vous racontez réellement. Ce n'est jamais un forfait figé à choisir à l'avance.",
  },
  {
    question: "Puis-je faire des séances de 30 à 40 minutes ?",
    reponse: "Oui, c'est exactement la durée visée. Rien n'empêche une séance plus courte ou plus longue si le récit le demande.",
  },
  {
    question: "Suis-je interrompu ? Pourquoi le silence a-t-il un sens ?",
    reponse:
      "Non — un silence de plusieurs secondes n'est jamais pris pour une fin de réponse. Réfléchir à voix haute, chercher ses mots, hésiter : tout cela fait partie du récit, pas un vide à combler au plus vite.",
  },
  {
    question: "Puis-je payer en plusieurs fois ?",
    reponse:
      "Oui — Klarna propose un paiement en 3 ou 4 fois directement à l'étape de paiement, sans démarche supplémentaire de votre part. Les conditions exactes (nombre de fois, frais éventuels) sont déterminées par Klarna selon votre situation.",
  },
  {
    question: "Le prix dépend-il du nombre de pages ou de photos de mon livre ?",
    reponse:
      "Non, jamais. 155€ couvre les séances illimitées, le manuscrit en PDF et ebook, et le livre imprimé relié couleur — quelle que soit la longueur finale de votre récit. C'est un choix délibéré : beaucoup de services équivalents révèlent un supplément après coup selon le nombre de pages, ce qui pose particulièrement problème pour un achat-cadeau (l'offrant ne connaît pas le prix final). Ici, le prix annoncé au départ est le seul que vous paierez.",
  },
  {
    question: "Pourquoi des séances courtes et fréquentes plutôt que de longues séances espacées ?",
    reponse:
      "Parce que l'effet d'un tel parcours dépend surtout de sa durée totale — plusieurs semaines — pas de la précision de chaque séance prise isolément. Mieux vaut revenir souvent, brièvement, que rarement et longuement.",
  },
  {
    question: "Puis-je corriger ou refaire une réponse après coup ?",
    reponse:
      "Oui. Chaque fragment de récit reste modifiable depuis votre parcours : vous pouvez corriger le texte, demander une recomposition, ou consulter l'historique de vos versions précédentes.",
  },
];

export default function Fonctionnement() {
  return (
    <main className="min-h-screen bg-blanc">
      {/* ─── EN-TÊTE ───────────────────────────────────────────────── */}
      <header className="px-6 py-8 bg-sauge shadow-[0_1px_3px_rgba(28,25,23,0.08)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-display italic text-xl text-encre hover:text-grege transition-colors">
            Racontez-moi
          </Link>
          <Link href="/#premiere-question" className="font-sans text-sm text-encre hover:text-petrole transition-colors">
            Commencer mon histoire →
          </Link>
        </div>
      </header>

      <article className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display font-normal text-4xl md:text-5xl text-encre mb-16 leading-[1.2]">
            Comment fonctionne Racontez-moi
          </h1>

          {/* Paragraphe d'ouverture — prose, pas des questions-réponses */}
          <div className="space-y-7 font-serif text-lg leading-[1.85] text-encre mb-16">
            <p>
              Chaque séance dure entre 30 et 45 minutes — pas parce qu&apos;un chronomètre l&apos;impose, mais
              parce que c&apos;est le format qui laisse le temps de vraiment raconter sans jamais épuiser
              l&apos;attention. Le rythme, lui, s&apos;ajuste plutôt que d&apos;imposer une durée totale
              fixe&nbsp;: personne ne sait à l&apos;avance combien de séances il faudra pour raconter une vie,
              alors nous ne vous demandons pas de le deviner avant même d&apos;avoir commencé.
            </p>
            <p>
              Un silence n&apos;est jamais interrompu. Chercher ses mots, s&apos;arrêter pour se souvenir,
              reprendre son souffle&nbsp;: tout cela fait partie du récit, pas un vide qu&apos;il faudrait
              combler au plus vite. C&apos;est la même méthode que pour tout le reste&nbsp;— rien
              d&apos;improvisé, jamais au prix de la conversation elle-même.
            </p>
            <p>
              La structure des questions elle-même s&apos;appuie sur le protocole Life Story Interview du
              psychologue Dan McAdams (Northwestern University)&nbsp;— un instrument de recherche publié, pas
              une improvisation.
            </p>
          </div>

          {/* ─── COMMENT ÇA MARCHE, EN DÉTAIL (6 étapes) ───────────────
              Copy de Le Révélateur (2 août 2026), icônes linework codées à
              la main (cf. commentaire plus haut : la génération IA ne
              produisait pas un rendu fiable). Complète le "01/02/03" court
              de la home, ne le remplace pas — l'un est le résumé, l'autre
              l'approfondissement. */}
          <div className="space-y-10 mb-16">
            {ETAPES_DETAIL.map(({ titre, sousTitre, texte, Icone }, i) => (
              <div key={titre} className="flex gap-6 items-start">
                <div className="shrink-0 w-16 h-16 md:w-20 md:h-20">
                  <Icone />
                </div>
                <div>
                  <p className="font-sans text-xs tracking-widest uppercase text-grege mb-1">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-display text-xl text-encre mb-1">{titre}</h3>
                  <p className="font-serif italic text-base text-petrole mb-2">{sousTitre}</p>
                  <p className="font-sans text-base text-grege leading-relaxed">{texte}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mb-16 space-y-2">
            <p className="font-serif text-lg text-grege leading-relaxed">
              On ne raconte pas votre vie à votre place.
              <br />
              On vous aide à lui donner forme.
            </p>
            <p className="font-display italic text-2xl text-petrole">Vous parlez. Le livre s&apos;écrit.</p>
          </div>

          {/* ─── LE FIL DE VOTRE RÉCIT (timeline sobre, 4 phases) ─────── */}
          <h2 className="font-display text-2xl text-encre mb-8">Le fil de votre récit</h2>
          {/* Photo d'accent retirée (10/09/2026) — mal raccordée visuellement au
              texte dans cette mise en page, jugée "esseulée" au milieu de la
              page. Reste cohérent avec "peu que trop" : zéro photo ici,
              simplement, plutôt qu'une de plus mal intégrée. */}
          <div className="mb-16 space-y-8 border-l-2 border-sauge pl-6">
            <div>
              <p className="font-display italic text-lg text-petrole mb-1">Les racines</p>
              <p className="font-sans text-base text-grege leading-relaxed">
                L&apos;enfance, la famille, les premiers repères — ce qui vous a construit avant même que vous
                le choisissiez.
              </p>
            </div>
            <div>
              <p className="font-display italic text-lg text-petrole mb-1">Se construire</p>
              <p className="font-sans text-base text-grege leading-relaxed">
                L&apos;amour, le travail, devenir parent — les choix qui ont dessiné le reste de votre vie.
              </p>
            </div>
            <div>
              <p className="font-display italic text-lg text-petrole mb-1">Traverser</p>
              <p className="font-sans text-base text-grege leading-relaxed">
                Les lieux, les épreuves, les convictions, les passions — tout ce qui donne du relief à une
                vie, dans le désordre où la mémoire les ramène.
              </p>
            </div>
            <div>
              <p className="font-display italic text-lg text-petrole mb-1">Transmettre</p>
              <p className="font-sans text-base text-grege leading-relaxed">
                Le bilan, ce que vous voulez laisser — le mot de la fin, celui qui compte le plus.
              </p>
            </div>
          </div>

          {/* ─── LE LIVRE, EN VRAI ─────────────────────────────────────── */}
          <div className="space-y-7 font-serif text-lg leading-[1.85] text-encre mb-16">
            <p>
              Le papier est certifié FSC et sans acide&nbsp;— pensé pour durer, pas seulement pour être
              imprimé. Et parce que chaque livre n&apos;est fabriqué qu&apos;au moment où il est commandé, il
              n&apos;y a ni stock ni gaspillage&nbsp;: votre livre existe parce que vous l&apos;avez voulu, pas
              parce qu&apos;il fallait écouler un tirage.
            </p>
          </div>

          {/* ─── SE PRÉPARER À UNE SÉANCE ──────────────────────────────── */}
          <h2 className="font-display text-2xl text-encre mb-6">Se préparer à une séance</h2>
          <div className="space-y-7 font-serif text-lg leading-[1.85] text-encre mb-16">
            <p>
              Rien de compliqué&nbsp;: parlez simplement, sans vous soucier de bien dire les choses. Ce
              n&apos;est ni un examen ni une dictée&nbsp;— dites-le de travers si besoin, personne ne
              corrigera sur le moment.
            </p>
            <p>
              Choisissez un moment où vous vous sentez tranquille, pas juste après une contrariété. Le matin
              ou le soir&nbsp;: les deux ont leurs partisans (la mémoire se consolide pendant le sommeil,
              mais l&apos;esprit est aussi plus disponible au réveil)&nbsp;— à vous de voir ce qui vous
              convient, il n&apos;y a pas de bon moment universel.
            </p>
            <p>
              Une astuce qui aide beaucoup&nbsp;: gardez à portée de main une photo, un objet ou une musique
              du souvenir que vous comptez raconter. Ce genre de détail fait souvent remonter bien plus que
              prévu.
            </p>
            <p>
              Enfin, une question simple peut tout changer&nbsp;: pour qui racontez-vous cette histoire&nbsp;?
              Vos enfants, vos petits-enfants, ou simplement vous-même&nbsp;— y penser avant de commencer
              donne souvent un sens plus clair à ce qui suit. C&apos;est d&apos;ailleurs la première chose que
              nous vous demandons.
            </p>
            <p>
              Et si une émotion plus forte que prévu remonte pendant une séance&nbsp;: c&apos;est normal, et
              même bon signe&nbsp;— c&apos;est souvent que ce moment méritait d&apos;être raconté.
            </p>
          </div>

          <h2 className="font-display text-2xl text-encre mb-6">Questions fréquentes</h2>
          <FAQAccordion items={FAQ_FONCTIONNEMENT} />
        </div>
      </article>
    </main>
  );
}
