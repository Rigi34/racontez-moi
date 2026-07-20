import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confidentialité — Racontez-moi",
  description:
    "Ce que nous collectons, ce que nous ne conservons pas, et pourquoi.",
};

export default function Confidentialite() {
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

      <article className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display font-normal text-4xl md:text-5xl text-encre mb-10 leading-[1.2]">
            Confidentialité
          </h1>

          <div className="space-y-7 font-serif text-lg leading-[1.85] text-encre">
            <p>
              Cette page dit précisément ce qui est collecté aujourd&apos;hui sur
              Racontez-moi, ce qui ne l&apos;est pas, et par qui vos données
              transitent. Pas de texte générique&nbsp;: c&apos;est l&apos;état réel
              du service.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">
              Ce que nous collectons à la création d&apos;un compte
            </h2>
            <p>
              Une adresse e-mail et un mot de passe, gérés par Supabase (notre
              hébergeur d&apos;authentification). C&apos;est tout ce qui est
              nécessaire pour vous reconnaître d&apos;une visite à l&apos;autre.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">
              Ce qui se passe pendant une séance vocale
            </h2>
            <p>
              Votre voix est envoyée à Groq (fournisseur de transcription) pour
              être convertie en texte, puis ce texte est envoyé à Anthropic
              (fournisseur du modèle qui vous relance et compose vos fragments).
              Ces échanges sont nécessaires au fonctionnement de la conversation.
            </p>
            <p>
              <strong className="font-semibold">
                L&apos;audio de votre voix n&apos;est jamais conservé
              </strong>{" "}
              — il est envoyé à Groq pour être transcrit en texte, puis
              immédiatement supprimé de leur côté. Le texte de vos séances et les
              fragments composés à partir de vos réponses sont, eux, enregistrés
              dans notre base de données (hébergée par Supabase, en Europe), pour
              que votre parcours se poursuive d&apos;une séance à l&apos;autre et
              que votre livre puisse être assemblé.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">
              Ce que nous ne faisons jamais
            </h2>
            <p>
              Nous ne vendons aucune donnée à un tiers. Nous ne partageons rien de
              ce que vous racontez avec qui que ce soit sans votre accord explicite.
              Il n&apos;y a aujourd&apos;hui aucun outil de suivi publicitaire sur
              le site. Vos séances ne servent jamais à entraîner un modèle d&apos;IA.
            </p>

            <h2 className="font-display font-normal text-2xl text-encre mt-12 mb-4">
              Vos droits
            </h2>
            <p>
              Depuis votre{" "}
              <Link href="/tableau-de-bord" className="text-petrole hover:text-encre transition-colors">
                tableau de bord
              </Link>
              , vous pouvez à tout moment télécharger l&apos;intégralité de vos
              données (droit à la portabilité) ou supprimer définitivement votre
              compte et toutes vos séances (droit à l&apos;effacement), en libre
              accès, sans avoir à nous écrire. Pour toute autre question sur vos
              données, la page{" "}
              <Link href="/contact" className="text-petrole hover:text-encre transition-colors">
                Contact
              </Link>{" "}
              reste ouverte.
            </p>
          </div>
        </div>
      </article>

      {/* ─── FOOTER ───────────────────────────────────────────────── */}
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
