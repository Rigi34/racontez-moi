import type { Metadata } from "next";
import Link from "next/link";
import FAQAccordion from "../components/FAQAccordion";

export const metadata: Metadata = {
  title: "Comment fonctionne Racontez-moi",
  description: "Durée des séances, rythme, silence, corrections — la mécanique expliquée simplement.",
};

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
    reponse: "Pas aujourd'hui — un paiement unique de 155€. C'est une question ouverte, pas encore tranchée.",
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
          </div>

          <h2 className="font-display text-2xl text-encre mb-6">Questions fréquentes</h2>
          <FAQAccordion items={FAQ_FONCTIONNEMENT} />
        </div>
      </article>
    </main>
  );
}
