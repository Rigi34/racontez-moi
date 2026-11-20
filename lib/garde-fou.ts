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
  /je suis pret a (vous )?(recevoir|ecouter)/,
  /votre (derniere )?reponse (est|semble|etait) (vide|incomplete|absente)/,
  /je n'ai pas (bien )?(compris|recu|entendu)/,
  /formule(r)? ma relance/,
];

export function estRelanceHorsCadre(texte: string): boolean {
  const t = sansAccents(texte.trim());
  if (!t) return true;
  return MOTIFS_RELANCE_HORS_CADRE.some((m) => m.test(t));
}

// Phrases d'ouverture où l'IA acquiesce ou parle d'elle-même avant sa
// question (test réel de Régis, 19/11/2026 : « Entendu. Je suis prêt à vous
// écouter simplement, sans surcharger. Pouvez-vous me parler… ? »). On les
// retire pour garder la vraie question qui suit.
const ACQUIESCEMENT = /^(entendu|d'accord|tres bien|bien sur|je comprends|compris|parfait|tout a fait|merci|ok|bien)\b/;
const MOTIFS_PREAMBULE = [
  /^je (suis|reste) (pret|la|a votre ecoute)/,
  /^je vous ecoute/,
];

function estPreambule(phrase: string): boolean {
  const t = sansAccents(phrase.trim());
  if (t.endsWith("?")) return false;
  if (ACQUIESCEMENT.test(t)) {
    return t.split(/\s+/).length <= 8; // un acquiescement court, jamais une vraie phrase de récit
  }
  return MOTIFS_PREAMBULE.some((m) => m.test(t));
}

export function retirerPreambule(texte: string): string {
  const phrases = texte.trim().match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) ?? [];
  let i = 0;
  while (i < phrases.length - 1 && estPreambule(phrases[i])) i++;
  return phrases.slice(i).join("").trim();
}

export function relanceSure(texte: string): string {
  const nettoyee = retirerPreambule(texte);
  if (estRelanceHorsCadre(nettoyee)) {
    console.error("garde-fou: relance hors cadre remplacée", { relance: texte.slice(0, 200) });
    return RELANCE_NEUTRE;
  }
  if (nettoyee !== texte.trim()) {
    console.warn("garde-fou: préambule retiré de la relance", { relance: texte.slice(0, 200) });
  }
  return nettoyee;
}
