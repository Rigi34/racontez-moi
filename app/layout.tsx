import type { Metadata } from "next";
import { Fraunces, Source_Serif_4, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Adresse principale du site (10/11/2026) : Search Console signalait
// l'accueil « en double » car www.racontez-moi.com répondait aussi (redirigé
// en 308 depuis, dans Vercel). metadataBase rend absolues les adresses
// relatives (canonical, og:image) ; chaque page publique déclare la sienne.
// Pas de canonical ici : il serait hérité par toutes les pages.
export const metadata: Metadata = {
  metadataBase: new URL("https://racontez-moi.com"),
  title: "Racontez-moi — Le livre de votre vie",
  description:
    "Des conversations de trente à quarante-cinq minutes, à la voix. Un interlocuteur qui écoute, questionne, se souvient — et compose le livre de votre vie.",
  openGraph: {
    title: "Racontez-moi — Le livre de votre vie",
    description: "Votre histoire n'attend pas l'inspiration. Elle attend un interlocuteur.",
    locale: "fr_FR",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Une personne tenant le livre Racontez-moi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Racontez-moi — Le livre de votre vie",
    description: "Votre histoire n'attend pas l'inspiration. Elle attend un interlocuteur.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${sourceSerif.variable} ${plexSans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-papier text-encre">
        {children}
      </body>
    </html>
  );
}
