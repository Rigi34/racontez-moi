import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// "Le Parcours" : 29€/mois, plafonné à 12 mensualités (décision produit du
// 16 juillet 2026 — jamais un abonnement sans fin, jamais le mot "abonnement"
// côté interface).
export const NOMBRE_MENSUALITES_PARCOURS = 12;
