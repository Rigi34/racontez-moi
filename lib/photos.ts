// Constantes de la collecte photo (décision du 23 juillet 2026, chapitre
// 5.3/11.4 de l'étude HÉRITAGE 2026 : 300 DPI minimum à la taille
// d'impression, contrôlé à l'envoi plutôt qu'à l'assemblage final pour
// pouvoir redemander une photo tout de suite).

// Résolution minimale sur le plus petit côté — heuristique, pas un calcul
// exact : la taille de placement finale dans le livre n'est pas encore
// fixée (dépend de la mise en page Typst à construire), 1000px sur le plus
// petit côté couvre confortablement une photo insérée à ~8cm de large en
// 300 DPI (300 × 8 / 2.54 ≈ 945px) avec une marge de sécurité.
export const RESOLUTION_MIN_PX = 1000;

// 3 à 6 photos par "chapitre" dans la proposition initiale — transposé ici
// en "par fragment", l'unité la plus proche qui existe réellement dans
// cette architecture (pas de découpage en chapitres fixes, cf. décision du
// 22 juillet de garder le cycle adaptatif 17-sections).
export const PHOTOS_MAX_PAR_FRAGMENT = 6;
export const PHOTOS_MAX_TOTAL = 80;
