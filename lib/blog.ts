import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  body: string;
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
  };
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
