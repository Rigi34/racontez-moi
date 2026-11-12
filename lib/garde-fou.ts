// Garde-fou de séance (12/11/2026, test réel de Régis avec une oreillette) :
// des réponses vides ou incompréhensibles faisaient écrire à l'IA un
// message (« Il n'y a pas assez de matière narrative… ») enregistré comme
// souvenir — donc imprimé — et des relances hors cadre (« Pourriez-vous me
// la rappeler ? »). Ici : repérage de ces deux cas, en plus des consignes
// données aux IA (lib/prompts.ts).

// Signal convenu que l'IA de rédaction renvoie quand il n'y a rien à écrire.
export const SIGNAL_MATIERE_INSUFFISANTE = "MATIERE_INSUFFISANTE";

export class MatiereInsuffisante extends Error {
  constructor() {
    super("Pas assez de matière pour composer un souvenir");
    this.name = "MatiereInsuffisante";
  }
}

const sansAccents = (texte: string) =>
  texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Tournures d'un message de l'IA qui parle de la séance au lieu de raconter.
const MOTIFS_MESSAGE_SANS_SOUVENIR = [
  /matiere (narrative|suffisante)/,
  /pas assez (de|d')\s*(matiere|elements|details|informations|contenu)/,
  /aucun (souvenir|element|detail)[^.]{0,60}(evoque|partage|mentionne)/,
  /des que vous me confierez/,
  /je (ne )?(peux|pourrai|pourrais) (pas )?(commencer|composer|ecrire)[^.]{0,40}(fragment|souvenir|recit)/,
];

export function estMessageSansSouvenir(texte: string): boolean {
  const t = sansAccents(texte.trim());
  if (t.includes(sansAccents(SIGNAL_MATIERE_INSUFFISANTE))) return true;
  return MOTIFS_MESSAGE_SANS_SOUVENIR.some((m) => m.test(t));
}

// Relance de remplacement, validée par Régis le 12/11/2026.
export const RELANCE_NEUTRE =
  "Prenons notre temps. Quel lieu, quel visage ou quel objet vous revient en pensant à cette période ?";

// Tournures d'une relance qui sort de son rôle (parle de l'échange, demande
// de répéter) au lieu de poser une vraie question sur le souvenir.
const MOTIFS_RELANCE_HORS_CADRE = [
  /question precedente/,
  /me (la |le )?rappeler/,
  /(pourriez|pouvez)-vous (me )?(repeter|reformuler|preciser votre reponse)/,
  /je suis pret a (recevoir|ecouter)/,
  /votre (derniere )?reponse (est|semble|etait) (vide|incomplete|absente)/,
  /je n'ai pas (bien )?(compris|recu|entendu)/,
  /formule(r)? ma relance/,
];

export function estRelanceHorsCadre(texte: string): boolean {
  const t = sansAccents(texte.trim());
  if (!t) return true;
  return MOTIFS_RELANCE_HORS_CADRE.some((m) => m.test(t));
}

export function relanceSure(texte: string): string {
  if (estRelanceHorsCadre(texte)) {
    console.error("garde-fou: relance hors cadre remplacée", { relance: texte.slice(0, 200) });
    return RELANCE_NEUTRE;
  }
  return texte;
}
