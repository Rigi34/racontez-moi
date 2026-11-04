import type { MetadataRoute } from "next";

// Constat du 04/11/2026 : /robots.txt et /sitemap.xml répondaient 404.
// Les espaces personnels (séance, tableau de bord, livre) n'ont rien à
// faire dans un moteur de recherche.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/seance", "/tableau-de-bord", "/mon-livre", "/sign-in", "/activer", "/offrir/merci"],
    },
    sitemap: "https://racontez-moi.com/sitemap.xml",
  };
}
