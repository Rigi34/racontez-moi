import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

/** Vidéo YouTube liée à l'article (même sujet, même lot). */
export type BlogVideo = {
  /** Identifiant YouTube (la partie après « v= »). */
  youtube: string;
  /** Durée au format ISO 8601, par exemple « PT4M13S ». */
  duree: string;
  /** Date de mise en ligne sur YouTube, « AAAA-MM-JJ ». */
  date: string;
  /** Vignette servie par le site, par exemple « /blog/mon-article.jpg ». */
  vignette: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  body: string;
  /** Date de publication de l'article, « AAAA-MM-JJ ». */
  date?: string;
  video?: BlogVideo;
};

export function getAllSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title as string,
    description: data.description as string,
    body: content.trim(),
    date: lireDate(data.date),
    video: lireVideo(data.video),
  };
}

/** Date du front-matter (chaîne ou objet Date selon les guillemets) → « AAAA-MM-JJ ». */
export function lireDate(d: unknown): string | undefined {
  if (d instanceof Date && !isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  return undefined;
}

function lireVideo(v: unknown): BlogVideo | undefined {
  if (!v || typeof v !== "object") return undefined;
  const { youtube, duree, date, vignette } = v as Record<string, unknown>;
  if (typeof youtube !== "string" || !/^[\w-]{11}$/.test(youtube)) return undefined;
  if (typeof duree !== "string" || !/^PT(\d+H)?(\d+M)?(\d+S)?$/.test(duree)) return undefined;
  if (typeof vignette !== "string" || !vignette.startsWith("/")) return undefined;
  const jour = lireDate(date);
  if (!jour) return undefined;
  return { youtube, duree, date: jour, vignette };
}

/** « PT4M13S » → « 4 min » (arrondi à la minute la plus proche, 1 min au moins). */
export function dureeLisible(iso: string): string {
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return "";
  const secondes = Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
  return `${Math.max(1, Math.round(secondes / 60))} min`;
}

/** Sépare l'introduction (avant le premier intertitre « ## ») du reste. */
export function splitIntro(markdown: string): { intro: string; suite: string } {
  const idx = markdown.search(/^## /m);
  if (idx <= 0) return { intro: markdown, suite: "" };
  return { intro: markdown.slice(0, idx).trim(), suite: markdown.slice(idx).trim() };
}

const SITE = "https://racontez-moi.com";

/** Données structurées lues par Google : l'article, et sa vidéo s'il y en a une. */
export function donneesStructurees(post: BlogPost): object[] {
  const url = `${SITE}/blog/${post.slug}`;
  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: url,
    inLanguage: "fr-FR",
    publisher: { "@type": "Organization", name: "Racontez-moi", url: SITE },
  };
  if (post.date) article.datePublished = post.date;
  if (!post.video) return [article];
  const v = post.video;
  article.image = `${SITE}${v.vignette}`;
  const video = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: post.title,
    description: post.description,
    thumbnailUrl: [`${SITE}${v.vignette}`],
    uploadDate: v.date,
    duration: v.duree,
    embedUrl: `https://www.youtube-nocookie.com/embed/${v.youtube}`,
    url: `https://www.youtube.com/watch?v=${v.youtube}`,
    inLanguage: "fr-FR",
    publisher: { "@type": "Organization", name: "Racontez-moi", url: SITE },
  };
  return [article, video];
}

export function getAllPosts(): BlogPost[] {
  return getAllSlugs()
    .map((slug) => getPostBySlug(slug))
    .filter((post): post is BlogPost => post !== null);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export type TocItem = { text: string; slug: string; level: 2 | 3 };

export function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  for (const line of markdown.split("\n")) {
    const h3 = line.match(/^###\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    if (h3) {
      items.push({ text: h3[1].trim(), slug: slugify(h3[1].trim()), level: 3 });
    } else if (h2) {
      items.push({ text: h2[1].trim(), slug: slugify(h2[1].trim()), level: 2 });
    }
  }
  return items;
}

/** Sépare le corps principal du bloc de sources final (paragraphe après le dernier "---"). */
export function splitSources(markdown: string): { main: string; sources: string | null } {
  const marker = "\n---\n";
  const idx = markdown.lastIndexOf(marker);
  if (idx === -1) return { main: markdown, sources: null };
  return {
    main: markdown.slice(0, idx).trim(),
    sources: markdown.slice(idx + marker.length).trim(),
  };
}
