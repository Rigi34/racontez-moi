import type { Metadata } from "next";
import Link from "next/link";
import FormulaireContact from "./FormulaireContact";
import FondVivant from "@/app/components/FondVivant";

export const metadata: Metadata = {
  title: "Contact — Racontez-moi",
  description: "Une question ? Écrivez-nous directement.",
};

export default function Contact() {
  return (
    <main className="relative isolate min-h-screen bg-blanc">
      {/* ─── EN-TÊTE ───────────────────────────────────────────────── */}
      <FondVivant entete />
      <header className="relative px-6 py-8">
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
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-display font-normal text-4xl md:text-5xl text-encre mb-6 leading-[1.2]">
            Une <em className="italic text-ambre-texte">question</em>&nbsp;?
          </h1>
          <p className="font-serif text-lg leading-[1.85] text-encre mb-10 max-w-lg mx-auto">
            Écrivez-nous directement — nous répondons personnellement à chaque
            message.
          </p>
          <FormulaireContact />
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
