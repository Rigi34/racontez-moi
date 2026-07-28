import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// "Le Parcours" : prix fixe unique de 155€, tout compris — séances
// illimitées, manuscrit PDF/ebook ET livre imprimé relié couleur (décision
// du 28 juillet 2026, remplace le split 129€+50€ du 23 juillet). Un seul
// prix, sans palier ni fourchette, y compris pour un achat-cadeau — coût
// réel de fabrication Lulu vérifié entre 21€ et 32€ sur toute la plage
// réaliste de pages, marge large donc aucun risque à ne jamais facturer de
// dépassement (modèle inspiré de Raconteo, le concurrent direct le plus
// proche, plutôt que le palier à l'achat de Meminto).
export const PRIX_PARCOURS_EUROS = 155;
