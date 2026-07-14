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
          {/* Sommaire */}
          {toc.length > 0 && (
            <nav
              aria-label="Sommaire de l'article"
              className="mb-16 bg-sauge p-6 shadow-[4px_4px_0px_#DAD4C5]"
            >
              <p className="font-sans text-sm text-encre tracking-widest uppercase mb-4">
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
                      className="font-serif text-base text-encre hover:text-petrole transition-colors"
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
                  <h1 className="font-display font-normal text-4xl md:text-5xl text-encre mb-10 leading-[1.2]">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => {
                  const id = slugify(headingText(children));
                  return (
                    <h2
                      id={id}
                      className="font-display font-normal text-2xl md:text-3xl text-encre mt-16 mb-6 leading-[1.3] scroll-mt-10"
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
                      className="font-display font-normal text-xl md:text-2xl text-encre mt-10 mb-4 leading-[1.3] scroll-mt-10"
                    >
                      {children}
                    </h3>
                  );
                },
                p: ({ children }) => (
                  <p className="font-serif text-lg leading-[1.85] text-encre mb-7">
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
                    className="text-petrole underline decoration-petrole/40 hover:decoration-petrole transition-colors"
                  >
                    {children}
                  </Link>
                ),
                ul: ({ children }) => (
                  <ul className="font-serif text-lg leading-[1.85] text-encre list-disc pl-6 mb-7 space-y-2">
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
            <div className="mt-16 bg-sauge p-6">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className="font-sans text-sm text-grege leading-relaxed">
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
          <div className="mt-16 pt-10 border-t border-grege flex items-center justify-between">
            <Link
              href="/blog"
              className="font-sans text-sm text-encre hover:text-petrole transition-colors"
            >
              ← Tous les articles
            </Link>
            <Link
              href="/#premiere-question"
              className="inline-block bg-encre text-blanc rounded-full font-sans font-medium text-base px-7 py-3 hover:bg-[#3A3632] transition-colors duration-200"
            >
              Commencer mon histoire →
            </Link>
          </div>
        </div>
      </article>

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
