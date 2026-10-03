import Image from "next/image";
import Link from "next/link";

// En-tête public commun (accueil, /offrir) — 02/10/2026, étude « Racontez-moi
// face au marché » : jusqu'ici l'accueil n'offrait que « Se connecter », sans
// accès direct au fonctionnement ni au cadeau, et /offrir n'avait aucun
// en-tête. Navigation volontairement courte, sans icônes ni panier : ce n'est
// pas une boutique. Sur mobile, le menu passe par <details> (aucun JS requis)
// et seul le bouton « Commencer » reste visible à côté du logo.
const LIENS = [
  { href: "/fonctionnement", label: "Fonctionnement" },
  { href: "/offrir", label: "Offrir" },
  { href: "/blog", label: "Journal" },
];

export default function EnTeteSite({
  lienCommencer = "/#premiere-question",
}: {
  lienCommencer?: string;
}) {
  return (
    <header className="relative z-30 px-6 pt-6 pb-2">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/brand/logo-R-encre-2048.png"
            alt=""
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="font-display text-xl text-encre">Racontez-moi</span>
        </Link>

        {/* Ordinateur */}
        <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-8 font-sans text-sm">
          {LIENS.map((lien) => (
            <Link key={lien.href} href={lien.href} className="text-encre hover:text-petrole transition-colors">
              {lien.label}
            </Link>
          ))}
          <Link href="/sign-in" className="text-grege hover:text-petrole transition-colors">
            Se connecter
          </Link>
          <a
            href={lienCommencer}
            className="rounded-full border border-encre px-5 py-2 text-encre hover:bg-encre hover:text-blanc transition-colors"
          >
            Commencer
          </a>
        </nav>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-3">
          <a
            href={lienCommencer}
            className="rounded-full border border-encre px-4 py-1.5 font-sans text-sm text-encre"
          >
            Commencer
          </a>
          <details className="group relative">
            <summary
              className="list-none cursor-pointer font-sans text-sm text-encre px-1 py-1.5 [&::-webkit-details-marker]:hidden"
              aria-label="Ouvrir le menu"
            >
              <span className="group-open:hidden">Menu</span>
              <span className="hidden group-open:inline">Fermer</span>
            </summary>
            <nav
              aria-label="Navigation principale"
              className="absolute right-0 mt-3 w-56 bg-blanc border border-grege/30 shadow-[5px_5px_0px_#DAD4C5] py-2 font-sans text-base"
            >
              {LIENS.map((lien) => (
                <Link key={lien.href} href={lien.href} className="block px-5 py-3 text-encre">
                  {lien.label}
                </Link>
              ))}
              <Link href="/sign-in" className="block px-5 py-3 text-grege border-t border-grege/20">
                Se connecter
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
