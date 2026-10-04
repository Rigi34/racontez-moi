import Image from "next/image";
import { qrSvg } from "@/lib/qr";
import { urlEcoute, voixChoisieActive } from "@/lib/voix";
import EmplacementPreuve, { AFFICHER_EMPLACEMENTS } from "../EmplacementPreuve";
import CouleursCouverture from "./CouleursCouverture";
import {
  AUDIO_SEANCE,
  COULEURS_COUVERTURE,
  COUVERTURE,
  JETON_VOIX_DEMO,
  MENTION_EXEMPLE,
  PAGE,
  PAGES_EXEMPLE,
  PHOTOS_EXEMPLAIRE,
  SEANCE_REELLE,
} from "./donnees";

// Présentation du livre sur l'accueil (04/10/2026) : des rendus réels du
// moteur, présentés comme tels (jamais comme des photographies), pour que le
// visiteur imagine SON livre. Voir app/components/livre/donnees.ts.

const etiquette = "font-sans text-xs tracking-widest uppercase";

// Image du premier écran : la couverture et l'ouverture du premier chapitre,
// posées à plat. Remplace une image générée qui montrait un autre livre.
export function VisuelLivre() {
  return (
    <figure>
      <div className="relative mx-auto w-full max-w-[420px] aspect-[4/3.4]">
        <div className="absolute right-0 top-[6%] w-[52%] shadow-[6px_6px_0px_#DAD4C5] ring-1 ring-grege/20">
          <Image
            src={SEANCE_REELLE.page}
            alt="Ouverture du chapitre « Racines et petite enfance » du livre d'exemple"
            width={PAGE.largeur}
            height={PAGE.hauteur}
            sizes="(max-width: 1024px) 50vw, 220px"
            className="w-full h-auto"
            loading="eager"
          />
        </div>
        <div className="absolute left-[4%] top-0 w-[50%] shadow-[6px_6px_0px_#DAD4C5]">
          <Image
            src={COULEURS_COUVERTURE.find((c) => c.cle === "petrole")!.src}
            alt="Couverture du livre d'exemple « Le figuier au fond du jardin », couleur pétrole"
            width={COUVERTURE.largeur}
            height={COUVERTURE.hauteur}
            sizes="(max-width: 1024px) 50vw, 210px"
            className="w-full h-auto"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </div>
      <figcaption className="mt-4 font-sans text-[11px] text-grege tracking-wide text-center lg:text-right">
        {MENTION_EXEMPLE}
      </figcaption>
    </figure>
  );
}

function FicheLivre() {
  const lignes: [string, string][] = [
    ["Le livre", "Relié, couverture rigide, format 15\u00a0×\u00a023\u00a0cm."],
    ["La couverture", "Quatre couleurs au choix, avec le titre et le sous-titre de votre livre."],
    ["L'intérieur", "Imprimé en couleur sur papier blanc\u00a0: vos souvenirs en chapitres, vos photos dans le récit."],
    ["Les pages", "Autant que votre histoire en demande, à partir de 24 pages. Le prix ne change pas."],
    ...(voixChoisieActive()
      ? ([["La voix", "Si vous le souhaitez, un QR code sous certains souvenirs pour réentendre votre voix."]] as [string, string][])
      : []),
    ["Avant l'impression", "Vous voyez le livre entier, page par page, et vous corrigez ce que vous voulez."],
    ["Aussi", "Le même récit en PDF et en ePub."],
    ["Le prix", "155 € tout compris, livraison en France incluse."],
  ];
  return (
    <dl className="divide-y divide-grege/20 border-y border-grege/20">
      {lignes.map(([terme, definition]) => (
        <div key={terme} className="grid sm:grid-cols-[150px_1fr] gap-1 sm:gap-6 py-3">
          <dt className={`${etiquette} text-grege pt-1`}>{terme}</dt>
          <dd className="font-serif text-base leading-relaxed text-encre">{definition}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SectionVotreLivre() {
  return (
    <section className="py-20 md:py-24 px-6 bg-papier" aria-labelledby="titre-votre-livre">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl">
          <p className={`${etiquette} text-grege mb-4`}>Ce que vous recevez</p>
          <h2
            id="titre-votre-livre"
            className="font-display font-normal text-3xl md:text-4xl leading-[1.2] text-encre mb-5 text-balance"
          >
            Votre histoire, reliée.
          </h2>
          <p className="font-serif text-lg leading-[1.8] text-encre/85">
            Un livre à couverture rigide, vos souvenirs en chapitres, vos photos au fil des pages. Voici
            quelques pages d&apos;un livre d&apos;exemple composé par Racontez-moi. Les vôtres
            raconteront votre histoire.
          </p>
        </div>

        {/* Défilement horizontal natif (balayage sur mobile), sans JavaScript. */}
        <ul
          className="mt-10 -mx-6 px-6 md:mx-0 md:px-0 scroll-pl-6 md:scroll-pl-0 flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-4"
          aria-label="Pages du livre d'exemple"
        >
          {PAGES_EXEMPLE.map((page) => (
            <li key={page.src} className="snap-start shrink-0 w-[62%] sm:w-[38%] md:w-[24%] lg:w-[19%]">
              <a href={page.src} target="_blank" rel="noopener" className="block group">
                <Image
                  src={page.src}
                  alt={page.alt}
                  width={PAGE.largeur}
                  height={PAGE.hauteur}
                  sizes="(max-width: 640px) 62vw, (max-width: 768px) 38vw, 240px"
                  className="w-full h-auto bg-blanc ring-1 ring-grege/25 shadow-[4px_4px_0px_#DAD4C5] group-hover:ring-grege/60 transition"
                />
              </a>
              <p className="mt-3 font-sans text-xs leading-snug text-grege">{page.legende}</p>
            </li>
          ))}
        </ul>
        <p className="mt-2 font-sans text-[11px] text-grege tracking-wide">
          {MENTION_EXEMPLE}. Faites défiler, touchez une page pour l&apos;agrandir.
        </p>

        <div className="mt-16 grid lg:grid-cols-[260px_1fr] gap-12 lg:gap-16 items-start">
          <CouleursCouverture />
          <FicheLivre />
        </div>

        {PHOTOS_EXEMPLAIRE.length > 0 ? (
          <div className="mt-14 grid grid-cols-2 md:grid-cols-3 gap-4">
            {PHOTOS_EXEMPLAIRE.map((photo) => (
              <Image
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                width={photo.largeur}
                height={photo.hauteur}
                sizes="(max-width: 768px) 50vw, 33vw"
                className="w-full h-auto"
              />
            ))}
          </div>
        ) : (
          AFFICHER_EMPLACEMENTS && (
            <div className="mt-14">
              <EmplacementPreuve
                format="min-h-32"
                titre="Photos d'un exemplaire imprimé (facultatif)"
                attendu="Livre fermé, en main, ouvert, tranche, papier. À ajouter dans PHOTOS_EXEMPLAIRE (app/components/livre/donnees.ts) si elles apportent quelque chose."
              />
            </div>
          )
        )}
      </div>
    </section>
  );
}

function Etape({ numero, titre, children }: { numero: string; titre: string; children: React.ReactNode }) {
  return (
    <li className="relative pl-10 md:pl-0">
      <p className="absolute left-0 top-0 md:static font-display text-2xl text-sauge leading-none md:mb-3">
        {numero}
      </p>
      <p className={`${etiquette} text-sauge mb-3`}>{titre}</p>
      {children}
    </li>
  );
}

function EcouterLaVoix({ jeton }: { jeton: string }) {
  const url = urlEcoute(jeton);
  return (
    <div className="mt-14 pt-10 border-t border-papier/15 grid md:grid-cols-[1fr_auto] gap-8 items-center">
      <div>
        <h3 className="font-display text-2xl mb-3">Certaines pages peuvent garder votre voix.</h3>
        <p className="font-serif text-base leading-relaxed text-papier/85 max-w-xl">
          Sous un souvenir, un QR code&nbsp;: on le scanne avec un téléphone, et on vous entend le
          raconter. Vous choisissez les extraits gardés, et vous pouvez les retirer à tout moment. Ils
          restent écoutables tant que votre compte existe.
        </p>
        <audio controls preload="none" src={`/v/${jeton}`} className="mt-5 w-full max-w-sm md:hidden">
          <a href={`/v/${jeton}`}>Écouter ce souvenir</a>
        </audio>
      </div>
      <figure className="hidden md:flex flex-col items-center gap-3">
        <div className="bg-blanc p-3 w-36" dangerouslySetInnerHTML={{ __html: qrSvg(url) }} />
        <figcaption className="font-sans text-xs text-papier/70">Scannez pour écouter</figcaption>
      </figure>
    </div>
  );
}

export function SectionDeLaVoixAuLivre() {
  const jeton = voixChoisieActive() ? JETON_VOIX_DEMO : null;
  return (
    <section className="py-20 md:py-24 px-6 bg-petrole text-papier" aria-labelledby="titre-voix-livre">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-12">
          <p className={`${etiquette} text-sauge mb-4`}>De la voix au livre</p>
          <h2 id="titre-voix-livre" className="font-display font-normal text-3xl md:text-4xl leading-[1.2] mb-5 text-balance">
            Vous racontez. Le souvenir s&apos;écrit. Il devient une page.
          </h2>
          <p className="font-sans text-sm text-papier/70">
            Extrait d&apos;une vraie séance de test, le {SEANCE_REELLE.date}&nbsp;: les réponses sont
            reproduites telles qu&apos;elles ont été transcrites.
          </p>
        </div>

        <ol className="grid gap-12 md:grid-cols-3 md:gap-10">
          <Etape numero="1" titre="Vous répondez à voix haute">
            {AUDIO_SEANCE ? (
              <audio controls preload="none" src={AUDIO_SEANCE} className="w-full mb-5" />
            ) : (
              AFFICHER_EMPLACEMENTS && (
                <div className="mb-5">
                  <EmplacementPreuve sombre format="min-h-20" titre="Extrait audio" attendu="Enregistrement réel de cette séance, avec accord écrit (AUDIO_SEANCE)." />
                </div>
              )
            )}
            <div className="space-y-4">
              {SEANCE_REELLE.echanges.map((e) => (
                <div key={e.question}>
                  <p className="font-sans text-sm text-sauge leading-snug mb-1">{e.question}</p>
                  <p className="font-sans text-sm leading-relaxed text-papier/80">«&nbsp;{e.reponse}&nbsp;»</p>
                </div>
              ))}
            </div>
          </Etape>

          <Etape numero="2" titre="Le souvenir est composé">
            <div className="font-serif text-[15px] leading-[1.75] text-papier/90 space-y-3">
              {SEANCE_REELLE.souvenir.map((p) => (
                <p key={p.slice(0, 20)}>{p}</p>
              ))}
            </div>
            <p className="mt-4 font-sans text-xs leading-relaxed text-papier/65">
              À partir de vos mots, un récit prend forme. Vous le relisez, vous le corrigez, vous
              retirez ce qui ne vous ressemble pas.
            </p>
          </Etape>

          <Etape numero="3" titre="Il devient une page du livre">
            <a href={SEANCE_REELLE.page} target="_blank" rel="noopener" className="block max-w-[300px]">
              <Image
                src={SEANCE_REELLE.page}
                alt="La même page dans le livre : ouverture du chapitre « Racines et petite enfance » avec ce souvenir"
                width={PAGE.largeur}
                height={PAGE.hauteur}
                sizes="(max-width: 768px) 80vw, 300px"
                className="w-full h-auto bg-blanc shadow-[6px_6px_0px_rgba(0,0,0,0.25)]"
              />
            </a>
            <p className="mt-3 font-sans text-xs text-papier/65">Page du livre d&apos;exemple, rendu numérique.</p>
          </Etape>
        </ol>

        {jeton && <EcouterLaVoix jeton={jeton} />}
      </div>
    </section>
  );
}
