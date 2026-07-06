import type { Metadata } from "next";
import { Playfair_Display, Lora, Inter, EB_Garamond } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
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
      className={`${playfair.variable} ${lora.variable} ${inter.variable} ${ebGaramond.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-ivoire text-presque-noir">
        {children}
      </body>
    </html>
  );
}
