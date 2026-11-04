import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/blog";

const SITE = "https://racontez-moi.com";

const PAGES_PUBLIQUES = [
  "",
  "/fonctionnement",
  "/manifeste",
  "/offrir",
  "/blog",
  "/contact",
  "/confidentialite",
  "/confidentialite/sujets-sensibles",
  "/mentions-legales",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PAGES_PUBLIQUES.map((chemin) => ({ url: `${SITE}${chemin}` })),
    ...getAllSlugs().map((slug) => ({ url: `${SITE}/blog/${slug}` })),
  ];
}
