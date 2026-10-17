import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@myriaddreamin/typst-ts-node-compiler"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // En-têtes de sécurité sur toutes les réponses (A-2026-10-16-01,
  // 17/10/2026). Le site ne s'intègre jamais dans un cadre (aucun iframe) et
  // seule la séance utilise le micro ; le paiement passe par la page Stripe
  // hébergée. Une CSP complète sera construite et testée à part
  // (Next, Supabase, Sentry), d'abord en mode rapport seul.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
