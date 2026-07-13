import type { Metadata } from "next";
import { Fraunces, Source_Serif_4, IBM_Plex_Sans, Caveat } from "next/font/google";
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

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Racontez-moi — Le livre de votre vie",
  description:
    "Des conversations de vingt minutes, à la voix. Un interlocuteur qui écoute, questionne, se souvient — et compose le livre de votre vie.",
  openGraph: {
    title: "Racontez-moi — Le livre de votre vie",
    description: "Votre histoire n'attend pas l'inspiration. Elle attend un interlocuteur.",
    locale: "fr_FR",
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
      className={`${fraunces.variable} ${sourceSerif.variable} ${plexSans.variable} ${caveat.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-papier text-encre">
        {children}
      </body>
    </html>
  );
}
