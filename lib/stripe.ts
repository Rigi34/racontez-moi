import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// "Le Parcours" : paiement unique de 348€ (décision révisée le 22 juillet
// 2026, sur recommandation de l'étude HÉRITAGE 2026 — un format étalé sur
// un an favorise structurellement l'abandon ; le coût de l'IA étant devenu
// marginal, un paiement unique aligné sur un parcours resserré de 8 à 12
// semaines est plus cohérent qu'un abonnement mensuel plafonné).
export const PRIX_PARCOURS_EUROS = 348;
