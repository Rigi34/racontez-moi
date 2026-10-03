// Architecture éditoriale du livre imprimé (02/10/2026, étude « Racontez-moi
// face au marché », phase livre). Logique pure, sans Typst : elle décide
// QUOI va où (chapitres, photo d'ouverture), lib/typst.ts décide COMMENT
// c'est composé.
//
// Principe : le récit reste premier, la photographie accompagne le
// souvenir. Aucune règle ici ne touche au texte des fragments.

import type { PhotoShadow } from "./typst";

// Dimensions de la page avec fond perdu (6x9po + 3,18mm par côté, cf.
// lib/typst.ts) — utilisées pour juger si une photo tient en pleine page.
const PAGE_FOND_PERDU_LARGEUR_MM = 158.76;
const PAGE_FOND_PERDU_HAUTEUR_MM = 234.96;

// Ordre des chapitres : la colonne vertébrale chronologique de la banque de
// 205 questions (A à G), puis les sections thématiques (H à Q), et le bilan
// de vie (O) toujours en dernier — même logique que la sélection adaptative
// des séances, qui garde déjà O pour la fin (lib/banque-questions.ts).
export const ORDRE_SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "P", "Q", "O"];

// Titres de chapitre = titres des sections de la banque (scripts/data/
// banque-205-questions.md), à peine allégés pour l'imprimé (la tranche
// d'âge « (6-12 ans) » est un repère d'entretien, pas un titre de livre).
export const TITRES_CHAPITRES: Record<string, string> = {
  A: "Racines et petite enfance",
  B: "Enfance",
  C: "Adolescence",
  D: "Entrée dans la vie adulte, études, indépendance",
  E: "Amour, couple, mariage",
  F: "Vie professionnelle et vocation",
  G: "Parentalité",
  H: "Lieux et déplacements",
  I: "Épreuves, pertes et résilience",
  J: "Croyances, valeurs et spiritualité",
  K: "Événements historiques et société",
  L: "Passions, créativité et temps libre",
  M: "Amitiés",
  N: "Corps, santé et vieillir",
  O: "Bilan de vie, sagesse et transmission",
  P: "Grands-parents, petits-enfants et lignée",
  Q: "Argent, maison et vie matérielle",
};

export type FragmentPourLivre = {
  texte: string;
  // Section de la séance d'origine (sessions.section_ouverture). Absente
  // pour la toute première séance (question fixe, thématiquement section A).
  section?: string | null;
  photos: PhotoShadow[];
};

export type Chapitre = {
  section: string;
  titre: string;
  fragments: { texte: string; photos: PhotoShadow[] }[];
  // Photo composée en pleine page sur la page paire qui fait face à
  // l'ouverture du chapitre — retirée du flux du texte. null : la page
  // paire reste blanche, l'ouverture se fait seule sur la page impaire.
  photoOuverture: PhotoShadow | null;
};

function sectionValide(section: string | null | undefined): string {
  return section && TITRES_CHAPITRES[section] ? section : "A";
}

// Résolution effective (points par pouce) d'une photo étirée pour couvrir
// toute la page, et part de l'image perdue au recadrage.
export function aptitudePleinePage(photo: PhotoShadow): { dpi: number; partRecadree: number } {
  const echelleMmParPx = Math.max(
    PAGE_FOND_PERDU_LARGEUR_MM / photo.largeurPx,
    PAGE_FOND_PERDU_HAUTEUR_MM / photo.hauteurPx
  );
  const dpi = 25.4 / echelleMmParPx;
  const ratioPhoto = photo.largeurPx / photo.hauteurPx;
  const ratioPage = PAGE_FOND_PERDU_LARGEUR_MM / PAGE_FOND_PERDU_HAUTEUR_MM;
  const partRecadree = 1 - Math.min(ratioPhoto / ratioPage, ratioPage / ratioPhoto);
  return { dpi, partRecadree };
}

// Une photo ne passe en pleine page que si elle le supporte vraiment :
// résolution d'impression nette (Lulu recommande 300 ppp, 280 retenu comme
// plancher) et recadrage limité (≤ 15 % de l'image perdue) — jamais
// d'agrandissement artificiel, jamais de photo paysage mutilée en
// portrait.
export const PLEINE_PAGE_DPI_MIN = 280;
export const PLEINE_PAGE_RECADRAGE_MAX = 0.15;

export function convientPleinePage(photo: PhotoShadow): boolean {
  const { dpi, partRecadree } = aptitudePleinePage(photo);
  return dpi >= PLEINE_PAGE_DPI_MIN && partRecadree <= PLEINE_PAGE_RECADRAGE_MAX;
}

// Au plus une photo d'ouverture par chapitre : la mieux résolue parmi
// celles qui le supportent. Choix conservateur assumé — la variété du
// livre vient du contenu réel (nombre, orientation, qualité des photos),
// pas d'un gabarit qui imposerait une photo pleine page partout.
function choisirPhotoOuverture(fragments: { photos: PhotoShadow[] }[]): PhotoShadow | null {
  let meilleure: PhotoShadow | null = null;
  let meilleurDpi = 0;
  for (const fragment of fragments) {
    for (const photo of fragment.photos) {
      if (!convientPleinePage(photo)) continue;
      const { dpi } = aptitudePleinePage(photo);
      if (dpi > meilleurDpi) {
        meilleure = photo;
        meilleurDpi = dpi;
      }
    }
  }
  return meilleure;
}

// Regroupe les fragments par section de vie, dans l'ordre éditorial des
// chapitres ; à l'intérieur d'un chapitre, l'ordre d'enregistrement est
// conservé (les fragments arrivent déjà triés par date de création).
export function organiserEnChapitres(fragments: FragmentPourLivre[]): Chapitre[] {
  const parSection = new Map<string, { texte: string; photos: PhotoShadow[] }[]>();
  for (const fragment of fragments) {
    const section = sectionValide(fragment.section);
    const liste = parSection.get(section) ?? [];
    liste.push({ texte: fragment.texte, photos: fragment.photos });
    parSection.set(section, liste);
  }

  return ORDRE_SECTIONS.filter((section) => parSection.has(section)).map((section) => {
    const fragmentsChapitre = parSection.get(section)!;
    const photoOuverture = choisirPhotoOuverture(fragmentsChapitre);
    return {
      section,
      titre: TITRES_CHAPITRES[section],
      photoOuverture,
      fragments: photoOuverture
        ? fragmentsChapitre.map((f) => ({ ...f, photos: f.photos.filter((p) => p !== photoOuverture) }))
        : fragmentsChapitre,
    };
  });
}
