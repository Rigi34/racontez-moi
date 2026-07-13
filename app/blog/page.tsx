import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Journal — Racontez-moi",
  description:
    "Ce que la recherche dit sur l'écriture de ses mémoires — santé, transmission, mémoire.",
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-papier">
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

      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display font-normal text-4xl md:text-5xl text-encre mb-4 leading-[1.2]">
            Journal
          </h1>
          <p className="font-serif text-lg leading-[1.85] text-grege mb-16">
            Ce que la recherche dit sur l&apos;écriture de ses mémoires.
          </p>

          <div className="space-y-8">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="bg-white p-8 shadow-[5px_5px_0px_#DAD4C5]"
              >
                <h2 className="font-display font-normal text-2xl text-encre mb-3 leading-[1.3]">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="hover:text-petrole transition-colors"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="font-serif text-lg leading-[1.7] text-encre/80 mb-4">
                  {post.description}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="font-sans text-sm text-petrole hover:text-encre transition-colors"
                >
                  Lire l&apos;article →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

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
