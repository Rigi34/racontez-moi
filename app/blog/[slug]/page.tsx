import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getAllSlugs,
  getPostBySlug,
  extractToc,
  splitSources,
  slugify,
} from "@/lib/blog";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

function headingText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(headingText).join("");
  return "";
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { main, sources } = splitSources(post.body);
  const toc = extractToc(main);

  return (
    <main className="min-h-screen bg-ivoire">
      {/* ─── EN-TÊTE ───────────────────────────────────────────────── */}
      <header className="px-6 py-8 border-b border-sable">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="font-garamond italic text-xl text-presque-noir hover:text-gris-chaud transition-colors"
          >
            Racontez-moi
          </Link>
          <Link
            href="/#premiere-question"
            className="font-sans text-sm text-gris-chaud hover:text-presque-noir transition-colors"
          >
            Commencer mon histoire →
          </Link>
        </div>
      </header>

      <article className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Sommaire */}
          {toc.length > 0 && (
            <nav
              aria-label="Sommaire de l'article"
              className="mb-16 pb-8 border-b border-sable"
            >
              <p className="font-sans text-sm text-gris-chaud tracking-widest uppercase mb-4">
                Dans cet article
              </p>
              <ul className="space-y-2">
                {toc.map((item) => (
                  <li
                    key={item.slug}
                    className={item.level === 3 ? "pl-5" : ""}
                  >
                    <a
                      href={`#${item.slug}`}
                      className="font-serif text-base text-presque-noir hover:text-terracotta transition-colors"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Corps de l'article */}
          <div className="fr-typography">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="font-display font-normal text-4xl md:text-5xl text-presque-noir mb-10 leading-[1.2]">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => {
                  const id = slugify(headingText(children));
                  return (
                    <h2
                      id={id}
                      className="font-display font-normal text-2xl md:text-3xl text-presque-noir mt-16 mb-6 leading-[1.3] scroll-mt-10"
                    >
                      {children}
                    </h2>
                  );
                },
                h3: ({ children }) => {
                  const id = slugify(headingText(children));
                  return (
                    <h3
                      id={id}
                      className="font-display font-normal text-xl md:text-2xl text-presque-noir mt-10 mb-4 leading-[1.3] scroll-mt-10"
                    >
                      {children}
                    </h3>
                  );
                },
                p: ({ children }) => (
                  <p className="font-serif text-lg leading-[1.85] text-presque-noir mb-7">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                em: ({ children }) => <em className="italic">{children}</em>,
                a: ({ href, children }) => (
                  <Link
                    href={href ?? "#"}
                    className="text-terracotta underline decoration-terracotta/40 hover:decoration-terracotta transition-colors"
                  >
                    {children}
                  </Link>
                ),
                ul: ({ children }) => (
                  <ul className="font-serif text-lg leading-[1.85] text-presque-noir list-disc pl-6 mb-7 space-y-2">
                    {children}
                  </ul>
                ),
                li: ({ children }) => <li>{children}</li>,
              }}
            >
              {main}
            </ReactMarkdown>
          </div>

          {/* Bloc sources — discret */}
          {sources && (
            <div className="mt-16 pt-8 border-t border-sable">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className="font-sans text-sm text-gris-chaud leading-relaxed">
                      {children}
                    </p>
                  ),
                  em: ({ children }) => <em className="italic">{children}</em>,
                }}
              >
                {sources}
              </ReactMarkdown>
            </div>
          )}

          {/* Retour */}
          <div className="mt-16 pt-10 border-t border-sable flex items-center justify-between">
            <Link
              href="/blog"
              className="font-sans text-sm text-gris-chaud hover:text-presque-noir transition-colors"
            >
              ← Tous les articles
            </Link>
            <Link
              href="/#premiere-question"
              className="inline-block bg-terracotta text-ivoire font-sans font-medium text-base px-7 py-3 hover:bg-[#A8692E] transition-colors duration-200"
            >
              Commencer mon histoire →
            </Link>
          </div>
        </div>
      </article>

      {/* ─── FOOTER MINIMAL ───────────────────────────────────────── */}
      <footer className="py-10 px-6 border-t border-sable">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="font-sans text-sm text-gris-chaud hover:text-presque-noir transition-colors"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </footer>
    </main>
  );
}
