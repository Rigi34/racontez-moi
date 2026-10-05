// Contenu de la présentation du livre sur l'accueil (04/10/2026).
//
// Règle : tout ce qui est montré est RÉEL. Pages et couvertures sont des
// rendus du moteur de production (scripts/generer-visuels-livre.mts, à
// relancer si la mise en page change) ; la séance est une vraie séance de
// test, recopiée telle quelle depuis la base (tours_conversation et
// fragments, 23/09/2026). Daniel est le narrateur du livre d'exemple : on le
// dit au visiteur, et on ne le présente jamais comme un client.

import { PALETTE_COUVERTURE } from "@/lib/couverture";
import visuels from "./visuels.json";

// Dimensions des rendus (pixels), pour réserver la place des images.
export const PAGE = { largeur: 1201, hauteur: 1801 };
export const COUVERTURE = { largeur: 1225, hauteur: 1850 };

// Légende commune à toute la présentation du livre (05/10/2026, décision de
// Régis, qui atteste que ces récits sont vécus).
export const MENTION_EXEMPLE = "Livre d'exemple · rendu numérique · récit authentique composé à partir d'une vraie séance";

export type PageExemple = { src: string; alt: string; legende: string };

// Quelques pages représentatives, dans l'ordre du livre. Pas un livre entier :
// le visiteur doit pouvoir imaginer le sien. Uniquement des pages qu'un client
// peut recevoir (04/10/2026 : pas de page de citation, ce choix n'existe pas
// dans le parcours).
export const PAGES_EXEMPLE: PageExemple[] = [
  {
    src: visuels.pages["1"],
    alt: "Page de titre : « Le figuier au fond du jardin », sous-titre « Souvenirs de Daniel »",
    legende: "La page de titre, avec le titre que vous choisissez",
  },
  {
    src: visuels.pages["3"],
    alt: "Sommaire listant onze chapitres, de « Racines et petite enfance » à « Bilan de vie »",
    legende: "Le sommaire\u00a0: une vie en chapitres",
  },
  {
    src: visuels.pages["5"],
    alt: "Ouverture du chapitre I, « Racines et petite enfance », suivie du premier souvenir",
    legende: "L'ouverture d'un chapitre",
  },
  {
    src: visuels.pages["7"],
    alt: "Page de récit avec en-tête courant, paragraphes justifiés et numéro de page",
    legende: "Une page de récit",
  },
  {
    src: visuels.pages["51"],
    alt: "Page de récit avec une photographie insérée au milieu du souvenir",
    legende: "Une photo au milieu d'un souvenir",
  },
];

// Mêmes couleurs que celles proposées dans /mon-livre (lib/couverture.ts).
export const COULEURS_COUVERTURE = PALETTE_COUVERTURE.map((c) => ({
  ...c,
  src: visuels.couvertures[c.cle as keyof typeof visuels.couvertures],
}));

// Séance de test réelle du 23/09/2026 : la question d'ouverture, les trois
// réponses telles que transcrites (reponse_brute), puis le début du souvenir
// composé (les deux premiers paragraphes, ceux du livre d'exemple). Les deux
// questions de relance sont celles réellement posées. Le souvenir est celui de
// scripts/data/livre-exemple.json (même texte que la page du livre, vérifié par
// donnees.test.ts) : texte composé, relu comme le ferait le narrateur — une
// faute de grammaire corrigée et deux détails ramenés à ce qui a été dit (le
// muret « chauffé par le soleil de l'après-midi », la maison « en pierre »).
export const SEANCE_REELLE = {
  date: "23 septembre 2026",
  echanges: [
    {
      question: "Quelle est la première maison dont vous vous souvenez\u00a0?",
      reponse:
        "La première maison dont je me souviens est une petite maison en pierre, dans un village de montagne, avec un grand jardin plein de lavande et un vieux puits en pierre au fond de la cour.",
    },
    {
      question: "Vous rappelez-vous l'odeur de cette lavande, particulièrement à certains moments de la journée\u00a0?",
      reponse:
        "Je me souviens surtout de l'odeur du pain que ma grand-mère faisait cuire le matin, et du bruit des volets en bois qu'on ouvrait chaque jour au lever du soleil.",
    },
    {
      question: "Vous rappelez-vous la sensation du bois sous vos doigts quand vous aidiez à ouvrir ces volets\u00a0?",
      reponse:
        "Le jardin était immense pour moi, enfant. Il y avait un vieux figuier au fond, et je passais des heures à observer les lézards sur le muret chauffé par le soleil de l'après-midi.",
    },
  ],
  souvenir: [
    "Le figuier était au fond du jardin, là où le muret chauffait au soleil de l'après-midi. Je m'allongeais près des pierres et je regardais les lézards sans bouger, comme si le moindre geste allait tout effacer. Le jardin me semblait immense — il l'était peut-être, ou peut-être que j'étais simplement très petit dedans.",
    "Le matin, c'était autre chose. L'odeur du pain de ma grand-mère traversait la maison avant que j'ouvre les yeux. Puis venait le bruit des volets — ce claquement sec du bois contre la pierre, régulier, presque cérémoniel — et la lumière entrait d'un coup dans la chambre. La maison était petite, en pierre, avec des murs épais. Il y avait un vieux puits dans la cour, et de la lavande partout dans le jardin, mais c'est l'odeur du pain que je portais en moi sans le savoir, comme quelque chose qu'on ne choisit pas de garder et qui reste quand même.",
  ],
  page: visuels.pages["5"],
};

// Extrait audio de cette séance : aucun n'a été conservé (l'audio n'était pas
// gardé le 23/09). À renseigner avec un vrai enregistrement, accord écrit à
// l'appui ; tant que c'est null, aucun lecteur n'est affiché.
export const AUDIO_SEANCE: string | null = null;

// Extrait de voix de démonstration pour « Le livre qui garde la voix » : le
// jeton d'un vrai extrait gardé dans l'application (page /v/[jeton]). Sans
// jeton, aucun QR ni bouton d'écoute n'est affiché : on n'imprime jamais un
// QR qui ne mène nulle part.
export const JETON_VOIX_DEMO: string | null = process.env.NEXT_PUBLIC_DEMO_VOIX_JETON || null;

// Photos d'un exemplaire imprimé, à ajouter si elles apportent quelque chose
// (livre fermé, en main, ouvert, tranche, papier, reliure). Vide : la section
// n'apparaît pas.
export const PHOTOS_EXEMPLAIRE: { src: string; alt: string; largeur: number; hauteur: number }[] = [];
