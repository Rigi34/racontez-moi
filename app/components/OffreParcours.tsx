import Link from "next/link";

// Ce que contient réellement l'offre à 155 € — 02/10/2026. Chaque ligne est
// vérifiée contre le code et les CGV (app/mentions-legales, art. 2 à 6) ;
// ne rien ajouter ici qui ne soit pas réellement construit :
// - séances sans limite de nombre (CGV art. 2) ;
// - deux relances par question + mémoire des séances (lib/redaction, RAG
//   sur les fragments précédents) ;
// - photos : PHOTOS_MAX_TOTAL = 80 (lib/photos.ts) ;
// - livre relié couleur, prix identique quel que soit le nombre de pages
//   (CGV art. 2) — expédition Lulu "MAIL" payée par Racontez-moi, adresse
//   par défaut en France (FormulaireAdresse) ;
// - PDF + ePub (routes manuscrit/apercu et manuscrit/epub) ;
// - aperçu complet avant impression (BAT, /mon-livre).
// Il n'y a pas de « crédits » : on achète un Parcours, débloqué en une fois.
export const CE_QUI_EST_COMPRIS = [
  "Des conversations à la voix, sans limite de nombre de séances",
  "Deux relances à chaque question, et un interlocuteur qui se souvient de vos séances précédentes",
  "Un texte composé à partir de vos mots, que vous relisez et corrigez",
  "Jusqu'à 80 photos intégrées à votre récit",
  "Le livre imprimé et relié en couleur, au même prix quel que soit le nombre de pages",
  "Le manuscrit en PDF et en ePub",
  "Un aperçu complet du livre avant l'impression",
  "La livraison du livre en France",
];

export function ListeCompris({ sombre = false }: { sombre?: boolean }) {
  return (
    <ul className="grid sm:grid-cols-2 gap-x-10 gap-y-3 text-left">
      {CE_QUI_EST_COMPRIS.map((ligne) => (
        <li
          key={ligne}
          className={`flex gap-3 font-serif text-base leading-relaxed ${sombre ? "text-papier/90" : "text-encre"}`}
        >
          <span aria-hidden="true" className={`mt-[0.7em] h-px w-3 shrink-0 ${sombre ? "bg-sauge" : "bg-ambre"}`} />
          <span>{ligne}</span>
        </li>
      ))}
    </ul>
  );
}

// Bloc « Avant de vous engager » (03/10/2026). La première version (02/10)
// mettait en avant l'ancienne garantie (remboursement sans délai jusqu'à
// l'impression) et l'export du récit : Régis l'a écartée, elle incitait à
// suivre tout le parcours puis à se faire rembourser. Garantie ramenée à 30
// jours après le paiement (CGV art. 6) : on présente l'essai gratuit, puis
// ces 30 jours, sans plus.
export function ChangementAvis({ sombre = false }: { sombre?: boolean }) {
  const texte = sombre ? "text-papier/85" : "text-encre/85";
  const discret = sombre ? "text-papier/60" : "text-grege";
  const lien = sombre ? "text-sauge decoration-sauge/50" : "text-petrole decoration-sauge";
  return (
    <div className="space-y-3 text-left">
      <p className={`font-display text-xl ${sombre ? "text-papier" : "text-encre"}`}>
        Avant de vous engager
      </p>
      <p className={`font-serif text-base leading-relaxed ${texte}`}>
        La première séance est offerte, sans compte et sans carte bancaire. Vous découvrez
        l&apos;interlocuteur, vous racontez un premier souvenir, et vous décidez ensuite, en
        connaissance de cause. Si le parcours ne vous convient pas, vous êtes remboursé
        intégralement, sans justification, dans les 30 jours qui suivent le paiement.
      </p>
      <p className={`font-sans text-sm leading-relaxed ${discret}`}>
        <Link
          href="/mentions-legales#garantie"
          className={`underline underline-offset-4 hover:opacity-80 transition-opacity ${lien}`}
        >
          Conditions détaillées
        </Link>
      </p>
    </div>
  );
}
