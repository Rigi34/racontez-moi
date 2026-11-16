// Promesses affichées au public sur la durée et le rythme (16/11/2026,
// décision de Régis) : une seule source, pour ne plus avoir à corriger sept
// pages à la main. Base du calcul : ~65 séances pour un parcours complet
// (16 sections × QUESTIONS_CIBLE_PAR_SECTION + ouverture, cf.
// lib/banque-questions.ts), séance mesurée à ~10 min (TEST, médiane 9,7 min,
// 16/11/2026). À 2-3 séances par semaine : environ six mois. Le livre reste
// imprimable dès PAGES_MINIMUM_RELIE pages (lib/lulu.ts).
export const DUREE_SEANCE = "une dizaine de minutes";
export const DUREE_SEANCE_MAX = "45 minutes";
export const RYTHME_SEANCES = "deux à trois fois par semaine";
export const DUREE_PARCOURS = "environ six mois";
export const IMPRESSION_LIBRE = "Votre livre peut être imprimé quand vous le décidez.";
// Délai Lulu relevé le 13-14/11/2026 (envoi MAIL vers la France = La Poste,
// suivi inclus, 9 à 11 jours de la commande à la livraison).
export const DELAI_LIVRAISON = "Comptez environ dix jours entre la validation et la réception en France (envoi par La Poste, avec suivi).";

export const majuscule = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);
