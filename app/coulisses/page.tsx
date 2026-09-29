import type { Metadata } from "next";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { A_RETENIR, CHEMIN, FAMILLES, FICHES, PANNES, type Famille, type Fiche } from "./contenu";

// Page interne et personnelle (29/09/2026) : explique l'architecture
// technique à un débutant. Jamais visible en Production — 404 dès que
// Vercel signale un déploiement de production (VERCEL_ENV est fournie
// automatiquement par Vercel, aucune variable à créer). Visible en local
// et sur les déploiements Preview. Reliée à aucun menu, non indexée.
export const metadata: Metadata = {
  title: "Racontez-moi — Les coulisses",
  robots: { index: false, follow: false },
};

const PETROLE = "#1F4B4C";
const AMBRE = "#B8823D";
const ENCRE = "#242220";
const GREGE = "#6B6660";

const PARFICHE = new Map(FICHES.map((f) => [f.id, f]));

const SOMMAIRE = [
  { ancre: "chaine", titre: "Du code au site" },
  { ancre: "carte", titre: "La carte" },
  { ancre: "environnements", titre: "TEST ≠ Production" },
  { ancre: "fiches", titre: "Les fiches" },
  { ancre: "chemin", titre: "Le chemin d'une histoire" },
  { ancre: "pannes", titre: "Quand ça ne marche pas" },
  { ancre: "retenir", titre: "À retenir" },
];

function Pastille({ id }: { id: string }) {
  const fiche = PARFICHE.get(id);
  if (!fiche) return null;
  const famille = FAMILLES[fiche.famille];
  return (
    <a
      href={`#fiche-${id}`}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-medium no-underline transition-opacity hover:opacity-80"
      style={{ background: famille.fond, color: famille.couleur }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: famille.couleur }} />
      {fiche.nom}
    </a>
  );
}

function EnTete({ numero, ancre, titre, chapeau }: { numero: string; ancre: string; titre: string; chapeau: string }) {
  return (
    <header id={ancre} className="mb-10 scroll-mt-24 max-w-2xl">
      <p className="font-manuscrit text-2xl text-ambre">{numero}</p>
      <h2 className="font-display text-3xl leading-tight text-petrole sm:text-4xl">{titre}</h2>
      <p className="mt-3 font-serif text-lg text-grege">{chapeau}</p>
    </header>
  );
}

// ── 1. Du code au site ────────────────────────────────────────────────────

const CHAINE = [
  { nom: "Mon ordinateur", role: "J'écris ou je modifie le code.", geste: "git push" },
  { nom: "GitHub", role: "Le code est rangé, avec son historique.", geste: "Vercel le récupère" },
  { nom: "Vercel", role: "Il construit le site et le met en ligne.", geste: "le site démarre" },
  { nom: "L'application", role: "Next.js répond aux visiteurs.", geste: "elle appelle" },
  { nom: "Supabase & services", role: "Données, IA, paiement, impression.", geste: "" },
];

function Chaine() {
  return (
    <ol className="flex flex-col lg:grid lg:grid-cols-[1fr_5.5rem_1fr_5.5rem_1fr_5.5rem_1fr_5.5rem_1fr]">
      {CHAINE.map((etape, i) => (
        <Fragment key={etape.nom}>
          <li className="rounded-2xl border border-sauge/70 bg-blanc p-5 text-center shadow-[0_1px_0_rgba(36,34,32,0.04)]">
            <p className="font-manuscrit text-xl text-ambre">{i + 1}</p>
            <p className="font-display text-xl leading-tight text-petrole">{etape.nom}</p>
            <p className="mt-1 text-[15px] leading-snug text-grege">{etape.role}</p>
          </li>
          {etape.geste && (
            <li className="flex flex-col items-center justify-center px-1 py-2 lg:py-0" aria-hidden>
              <svg viewBox="0 0 24 40" className="h-8 w-5 lg:hidden">
                <path d="M12 2v32M5 27l7 8 7-8" fill="none" stroke={AMBRE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg viewBox="0 0 60 24" className="hidden h-5 w-14 lg:block">
                <path d="M2 12h52M47 5l8 7-8 7" fill="none" stroke={AMBRE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-center text-[12px] leading-tight text-grege">{etape.geste}</span>
            </li>
          )}
        </Fragment>
      ))}
    </ol>
  );
}

// ── 2. La carte d'ensemble ────────────────────────────────────────────────

type Boite = { x: number; y: number; w: number; h: number; titre: string; sous?: string; couleur: string; fond: string; taille?: number };

function BoiteSvg({ b }: { b: Boite }) {
  return (
    <g>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="14" fill={b.fond} stroke={b.couleur} strokeWidth="1.5" />
      <text x={b.x + b.w / 2} y={b.y + (b.sous ? b.h / 2 - 3 : b.h / 2 + 6)} textAnchor="middle" fontSize={b.taille ?? 17} fontWeight="600" fill={b.couleur}>
        {b.titre}
      </text>
      {b.sous && (
        <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 17} textAnchor="middle" fontSize="13" fill={GREGE}>
          {b.sous}
        </text>
      )}
    </g>
  );
}

const F = FAMILLES;
const GROUPES: { titre: string; x: number; couleur: string; fond: string; boites: { titre: string; sous: string; taille?: number }[] }[] = [
  {
    titre: "SUPABASE",
    x: 20,
    couleur: F.donnees.couleur,
    fond: F.donnees.fond,
    boites: [
      { titre: "Auth", sous: "comptes" },
      { titre: "Database", sous: "lignes" },
      { titre: "Storage", sous: "fichiers" },
    ],
  },
  {
    titre: "INTELLIGENCE ARTIFICIELLE",
    x: 350,
    couleur: F.ia.couleur,
    fond: F.ia.fond,
    boites: [
      { titre: "Groq", sous: "voix → texte" },
      { titre: "Claude", sous: "écrit" },
      { titre: "Hugging Face", sous: "embeddings", taille: 13.5 },
    ],
  },
  {
    titre: "SERVICES EXTÉRIEURS",
    x: 680,
    couleur: F.livre.couleur,
    fond: F.livre.fond,
    boites: [
      { titre: "Stripe", sous: "paiement" },
      { titre: "Lulu", sous: "impression" },
      { titre: "Brevo", sous: "emails" },
    ],
  },
];

function Fleche({ d, couleur = PETROLE, pointille = false }: { d: string; couleur?: string; pointille?: boolean }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={couleur}
      strokeWidth="1.8"
      strokeDasharray={pointille ? "6 5" : undefined}
      markerEnd={`url(#pointe-${couleur === AMBRE ? "ambre" : couleur === PETROLE ? "petrole" : "grise"})`}
    />
  );
}

function CarteSvg() {
  const groupeY = 470;
  const groupeW = 300;
  return (
    <svg viewBox="0 0 1000 640" className="h-auto w-full" role="img" aria-label="Schéma de l'architecture de Racontez-moi" style={{ fontFamily: "var(--font-plex-sans), sans-serif" }}>
      <defs>
        {[
          ["petrole", PETROLE],
          ["ambre", AMBRE],
          ["grise", GREGE],
        ].map(([nom, c]) => (
          <marker key={nom} id={`pointe-${nom}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill={c} />
          </marker>
        ))}
      </defs>

      <BoiteSvg b={{ x: 410, y: 14, w: 180, h: 50, titre: "Visiteur", couleur: ENCRE, fond: "#FFFEFB" }} />
      <Fleche d="M500 66 V98" />
      <BoiteSvg b={{ x: 410, y: 100, w: 180, h: 50, titre: "Navigateur", couleur: ENCRE, fond: "#FFFEFB" }} />
      <Fleche d="M500 152 V190" />
      <text x="512" y="176" fontSize="12" fill={GREGE}>internet</text>

      {/* Vercel contient l'application Next.js */}
      <rect x="300" y="192" width="400" height="190" rx="20" fill="#E4ECEA" stroke={PETROLE} strokeWidth="1.5" strokeDasharray="7 5" />
      <text x="322" y="222" fontSize="14" fontWeight="600" letterSpacing="2" fill={PETROLE}>VERCEL · l&apos;hébergeur</text>
      <rect x="340" y="240" width="320" height="120" rx="14" fill={PETROLE} />
      <text x="500" y="282" textAnchor="middle" fontSize="22" fontWeight="600" fill="#FFFEFB" style={{ fontFamily: "var(--font-fraunces), serif" }}>
        Next.js
      </text>
      <text x="500" y="308" textAnchor="middle" fontSize="13" fill="#D9CFA9">pages · routes API</text>
      <text x="500" y="332" textAnchor="middle" fontSize="13" fill="#D9CFA9">Typst (mise en page du livre)</text>

      {/* GitHub → Vercel */}
      <BoiteSvg b={{ x: 40, y: 250, w: 190, h: 70, titre: "GitHub", sous: "le code source", couleur: ENCRE, fond: "#FFFEFB" }} />
      <Fleche d="M232 285 H296" couleur={AMBRE} />
      <text x="240" y="274" fontSize="12" fill={AMBRE}>code</text>

      {/* Next.js → Sentry */}
      <BoiteSvg b={{ x: 770, y: 250, w: 190, h: 70, titre: "Sentry", sous: "les erreurs", couleur: F.veille.couleur, fond: F.veille.fond }} />
      <Fleche d="M702 285 H766" couleur={GREGE} pointille />
      <text x="708" y="274" fontSize="12" fill={GREGE}>alertes</text>

      {/* Next.js → les trois familles de services */}
      <Fleche d="M420 362 C420 420 170 410 170 466" />
      <Fleche d="M500 362 V466" />
      <Fleche d="M580 362 C580 420 830 410 830 466" />

      {GROUPES.map((g) => {
        const bw = (groupeW - 40) / 3;
        return (
          <g key={g.titre}>
            <rect x={g.x} y={groupeY} width={groupeW} height="150" rx="18" fill="none" stroke={g.couleur} strokeWidth="1.5" />
            <text x={g.x + groupeW / 2} y={groupeY + 26} textAnchor="middle" fontSize="12.5" fontWeight="600" letterSpacing="1.5" fill={g.couleur}>
              {g.titre}
            </text>
            {g.boites.map((b, i) => (
              <BoiteSvg
                key={b.titre}
                b={{ x: g.x + 10 + i * (bw + 10), y: groupeY + 44, w: bw, h: 90, titre: b.titre, sous: b.sous, taille: b.taille, couleur: g.couleur, fond: g.fond }}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// Version mobile de la carte : le SVG serait illisible à 360 px de large.
function BlocMobile({ titre, sous, sombre = false }: { titre: string; sous?: string; sombre?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-center ${sombre ? "border-petrole bg-petrole text-blanc" : "border-sauge bg-blanc text-encre"}`}>
      <p className={`font-semibold ${sombre ? "font-display text-xl" : ""}`}>{titre}</p>
      {sous && <p className={`text-[13px] ${sombre ? "text-sauge" : "text-grege"}`}>{sous}</p>}
    </div>
  );
}

function FlecheBas() {
  return <p className="py-1 text-center text-ambre" aria-hidden>↓</p>;
}

function CarteMobile() {
  return (
    <div className="mx-auto max-w-sm">
      <BlocMobile titre="Visiteur" />
      <FlecheBas />
      <BlocMobile titre="Navigateur" />
      <FlecheBas />
      <div className="rounded-2xl border border-dashed border-petrole bg-[#E4ECEA] p-3">
        <p className="mb-2 text-[12px] font-semibold tracking-widest text-petrole">VERCEL · l&apos;hébergeur</p>
        <BlocMobile titre="Next.js" sous="pages · routes API · Typst" sombre />
      </div>
      <p className="py-1 text-center text-[13px] text-grege">↑ le code vient de <strong>GitHub</strong> · les erreurs partent vers <strong>Sentry</strong></p>
      <FlecheBas />
      <div className="space-y-3">
        {GROUPES.map((g) => (
          <div key={g.titre} className="rounded-2xl border p-3" style={{ borderColor: g.couleur }}>
            <p className="mb-2 text-center text-[12px] font-semibold tracking-widest" style={{ color: g.couleur }}>{g.titre}</p>
            <div className="grid grid-cols-3 gap-2">
              {g.boites.map((b) => (
                <div key={b.titre} className="rounded-lg px-1 py-2 text-center" style={{ background: g.fond, color: g.couleur }}>
                  <p className="text-[14px] font-semibold">{b.titre}</p>
                  <p className="text-[11px] leading-tight text-grege">{b.sous}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 3. TEST ≠ Production ──────────────────────────────────────────────────

const LIGNES_ENV: { brique: string; test: string; prod: string }[] = [
  { brique: "Hébergement", test: "Déploiement Preview Vercel", prod: "Déploiement Production Vercel" },
  { brique: "Base de données", test: "Projet Supabase TEST", prod: "Projet Supabase Production" },
  { brique: "Paiement", test: "Stripe mode test · fausses cartes", prod: "Stripe mode live · vrais paiements" },
  { brique: "Impression", test: "Lulu sandbox · rien n'est imprimé", prod: "Lulu réel · de vrais livres" },
  { brique: "Clés secrètes", test: "Clés de TEST", prod: "Clés de Production" },
  { brique: "Qui l'utilise", test: "Moi, avec des données de test", prod: "Les vrais narrateurs" },
];

function SchemaEnvironnements() {
  return (
    <div>
      {/* Le même code en haut, qui se sépare en deux */}
      <div className="mx-auto w-fit rounded-2xl border border-sauge bg-blanc px-6 py-3 text-center">
        <p className="text-[12px] font-semibold tracking-widest text-grege">GITHUB</p>
        <p className="font-display text-xl text-encre">Le même code</p>
      </div>
      <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="block h-12 w-full" aria-hidden>
        <path d="M200 0 V20 M200 20 C200 40 100 30 100 58 M200 20 C200 40 300 30 300 58" fill="none" stroke={AMBRE} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {[
          { cle: "test" as const, nom: "TEST", devise: "On peut casser sans risque", couleur: AMBRE, fond: "#F5EBDC", texte: ENCRE },
          { cle: "prod" as const, nom: "PRODUCTION", devise: "Le vrai site, avec prudence", couleur: PETROLE, fond: PETROLE, texte: "#FFFEFB" },
        ].map((env) => (
          <div key={env.nom} className="rounded-3xl border-2 p-3 sm:p-6" style={{ borderColor: env.couleur, background: env.fond, color: env.texte }}>
            <p className="font-display text-xl sm:text-3xl">{env.nom}</p>
            <p className="mb-4 text-[13px] opacity-80 sm:text-[15px]">{env.devise}</p>
            <ul className="space-y-2">
              {LIGNES_ENV.map((l) => (
                <li
                  key={l.brique}
                  className="rounded-xl px-3 py-2"
                  style={{ background: env.cle === "prod" ? "rgba(255,254,251,0.08)" : "rgba(255,254,251,0.7)" }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">{l.brique}</p>
                  <p className="text-[14px] leading-snug sm:text-[15px]">{env.cle === "test" ? l.test : l.prod}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <p className="rounded-full bg-encre px-5 py-2 text-center text-[15px] font-medium text-blanc">
          Aucun pont entre les deux : les données de l&apos;un n&apos;arrivent jamais dans l&apos;autre.
        </p>
      </div>
    </div>
  );
}

// ── 4. Les fiches ─────────────────────────────────────────────────────────

const QUESTIONS: { cle: keyof Fiche; libelle: string }[] = [
  { cle: "sert", libelle: "À quoi ça sert ?" },
  { cle: "entre", libelle: "Ce qui entre" },
  { cle: "sort", libelle: "Ce qui sort" },
  { cle: "donnees", libelle: "Où sont les données ?" },
  { cle: "environnement", libelle: "TEST ou Production ?" },
];

function CarteFiche({ fiche }: { fiche: Fiche }) {
  const famille = FAMILLES[fiche.famille];
  return (
    <article id={`fiche-${fiche.id}`} className="scroll-mt-24 overflow-hidden rounded-3xl border border-sauge/60 bg-blanc">
      <div className="flex items-center gap-4 px-6 pb-4 pt-6" style={{ background: famille.fond }}>
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-display text-2xl text-blanc"
          style={{ background: famille.couleur }}
          aria-hidden
        >
          {fiche.nom.replace(/^(Le |La |L')/, "").charAt(0).toUpperCase()}
        </span>
        <div>
          <h3 className="font-display text-xl leading-tight text-encre">{fiche.nom}</h3>
          <p className="text-[14px]" style={{ color: famille.couleur }}>{fiche.sousTitre}</p>
        </div>
      </div>
      <div className="px-6 pb-6 pt-4">
        <p className="mb-4 font-serif text-[17px] italic leading-snug text-encre">{fiche.resume}</p>
        <dl className="space-y-3">
          {QUESTIONS.map((q) => (
            <div key={q.cle}>
              <dt className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: famille.couleur }}>{q.libelle}</dt>
              <dd className="text-[15px] leading-relaxed text-encre/85">{fiche[q.cle]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function CoulissesPage() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const familles = Object.keys(FAMILLES) as Famille[];

  return (
    <div className="min-h-screen bg-papier text-encre">
      <nav className="sticky top-0 z-10 border-b border-sauge/50 bg-papier/90 backdrop-blur">
        <ul className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 py-3 text-[14px] sm:px-8">
          {SOMMAIRE.map((s) => (
            <li key={s.ancre} className="shrink-0">
              <a href={`#${s.ancre}`} className="text-grege no-underline hover:text-petrole">{s.titre}</a>
            </li>
          ))}
        </ul>
      </nav>

      <main className="mx-auto max-w-6xl px-4 sm:px-8">
        {/* Ouverture */}
        <section className="py-16 sm:py-24">
          <p className="mb-6 inline-block rounded-full border border-ambre/50 px-3 py-1 text-[13px] text-ambre">
            Page interne · invisible sur le vrai site
          </p>
          <h1 className="font-display text-5xl leading-[1.05] text-petrole sm:text-7xl">
            Racontez-moi,
            <br />
            <em className="text-ambre">les coulisses</em>
          </h1>
          <p className="mt-6 max-w-2xl font-serif text-xl leading-relaxed text-grege">
            Je comprends ce qui se passe derrière. Chaque histoire racontée traverse une petite chaîne d&apos;outils :
            voici qui fait quoi, où vont les données, et où regarder quand quelque chose coince.
          </p>
        </section>

        <section className="pb-24">
          <EnTete
            numero="un"
            ancre="chaine"
            titre="Du code au site"
            chapeau="Le code ne va pas directement aux visiteurs. Il fait un petit voyage, toujours le même."
          />
          <Chaine />
        </section>

        <section className="pb-24">
          <EnTete
            numero="deux"
            ancre="carte"
            titre="La carte d'ensemble"
            chapeau="Le visiteur ne parle qu'à Next.js. C'est Next.js qui, en coulisses, appelle tous les autres."
          />
          <div className="rounded-3xl border border-sauge/60 bg-blanc p-4 sm:p-8">
            <div className="hidden md:block"><CarteSvg /></div>
            <div className="md:hidden"><CarteMobile /></div>
          </div>
        </section>

        <section className="pb-24">
          <EnTete
            numero="trois"
            ancre="environnements"
            titre="TEST ≠ Production"
            chapeau="Deux environnements séparés. Même recette, deux cuisines : ce qu'on rate dans la cuisine d'essai n'arrive jamais à table."
          />
          <SchemaEnvironnements />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-blanc p-6">
              <p className="font-display text-xl text-petrole">Le code peut être identique…</p>
              <p className="mt-2 text-[16px] text-grege">
                C&apos;est le même programme, parfois exactement le même commit. Il ne sait pas tout seul s&apos;il est en TEST ou en Production.
              </p>
            </div>
            <div className="rounded-3xl bg-blanc p-6">
              <p className="font-display text-xl text-petrole">…ce sont les clés qui changent.</p>
              <p className="mt-2 text-[16px] text-grege">
                Chaque environnement reçoit ses propres variables d&apos;environnement. Ce sont elles qui disent : « parle à cette base, à ce Stripe-là ».
              </p>
            </div>
            <div className="rounded-3xl bg-blanc p-6">
              <p className="font-display text-xl text-petrole">Attention aux exceptions</p>
              <p className="mt-2 text-[16px] text-grege">
                Claude, Groq et Brevo n&apos;ont pas de mode test : même en TEST, un appel coûte vraiment et un email part vraiment.
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-[14px] text-grege">
            <span className="font-semibold text-ambre">À vérifier :</span> quel déploiement reçoit quelles clés se règle dans le tableau de bord
            Vercel, pas dans le code. Ce schéma décrit le principe voulu ; la configuration réelle se contrôle là-bas.
          </p>
        </section>

        <section className="pb-24">
          <EnTete
            numero="quatre"
            ancre="fiches"
            titre="Les fiches"
            chapeau="Une fiche par outil, toujours les mêmes cinq questions."
          />
          <div className="space-y-14">
            {familles.map((fam) => (
              <div key={fam}>
                <h3 className="mb-5 flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.2em]" style={{ color: FAMILLES[fam].couleur }}>
                  <span className="h-px w-8" style={{ background: FAMILLES[fam].couleur }} />
                  {FAMILLES[fam].nom}
                </h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {FICHES.filter((f) => f.famille === fam).map((f) => (
                    <CarteFiche key={f.id} fiche={f} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-24">
          <EnTete
            numero="cinq"
            ancre="chemin"
            titre="Le chemin d'une histoire"
            chapeau="De la première visite au livre dans la boîte aux lettres, en douze étapes."
          />
          <ol className="relative mx-auto max-w-3xl">
            <span className="absolute bottom-6 left-[23px] top-6 w-px bg-sauge" aria-hidden />
            {CHEMIN.map((etape, i) => (
              <li key={etape.titre} className="relative flex gap-5 pb-8 last:pb-0">
                <span className="z-[1] flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-petrole bg-papier font-display text-lg text-petrole">
                  {i + 1}
                </span>
                <div className="pt-1.5">
                  <p className="font-display text-xl leading-snug text-encre">{etape.titre}</p>
                  <p className="text-[16px] text-grege">{etape.detail}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {etape.outils.map((o) => <Pastille key={o} id={o} />)}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="pb-24">
          <EnTete
            numero="six"
            ancre="pannes"
            titre="Quand quelque chose ne marche pas"
            chapeau="Pas de panique : chaque symptôme pointe vers un ou deux endroits où regarder en premier."
          />
          <div className="grid gap-5 md:grid-cols-2">
            {PANNES.map((p) => (
              <article key={p.symptome} className="rounded-3xl border border-sauge/60 bg-blanc p-6">
                <p className="font-display text-xl text-encre">« {p.symptome} »</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[13px] text-grege">Regarder →</span>
                  {p.ouRegarder.map((o) => <Pastille key={o} id={o} />)}
                </div>
                <p className="mt-3 text-[16px] leading-relaxed text-encre/85">{p.conseil}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="retenir" className="scroll-mt-24 pb-24">
          <div className="rounded-[2rem] bg-petrole px-6 py-12 text-blanc sm:px-14 sm:py-16">
            <p className="font-manuscrit text-2xl text-ambre">sept</p>
            <h2 className="font-display text-3xl sm:text-4xl">Ce que je dois retenir</h2>
            <ol className="mt-8 grid gap-x-12 gap-y-5 md:grid-cols-2">
              {A_RETENIR.map((phrase, i) => (
                <li key={phrase} className="flex gap-4">
                  <span className="w-8 shrink-0 font-display text-2xl leading-none text-ambre">{i + 1}</span>
                  <span className="font-serif text-lg leading-snug">{phrase}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-sauge/50 py-8 text-center text-[13px] text-grege">
        Page interne, masquée en Production. Référence complète : docs/MANIFESTE-ECOSYSTEME.md
      </footer>
    </div>
  );
}
