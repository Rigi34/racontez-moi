import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// "Le Parcours" : forfait création unique de 129€ — séances illimitées,
// fragments, PDF/ebook (décision révisée le 22 juillet 2026). Positionné au
// milieu de la fourchette des concurrents étudiés (Raconteo 89€, Remento
// ~137€ PDF inclus) plutôt qu'à 348€ (ancien total 29€×12, jamais confronté
// aux prix du marché). Le livre imprimé n'est plus inclus — deviendra un
// paiement séparé une fois le pipeline de commande Lulu terminé (adresse de
// livraison, BAT, compte Lulu production).
export const PRIX_PARCOURS_EUROS = 129;
