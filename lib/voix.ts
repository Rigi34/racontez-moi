// « La voix choisie » — conservation volontaire d'extraits de voix et QR codes
// dans le livre (chantier VOIX-CHOISIE, cf. docs/CHANTIER-VOIX-CHOISIE.md).
//
// Principe : rien n'est gardé par défaut. À la fin d'une séance, le narrateur
// peut réécouter ses réponses et en garder UNE pour le passage qui vient
// d'être composé. Ce qui n'est pas choisi n'est jamais envoyé au serveur.
//
// Toute la fonctionnalité est derrière un interrupteur, DÉSACTIVÉ par défaut :
// tant que NEXT_PUBLIC_VOIX_CHOISIE !== "1", aucune route ne répond, aucun
// bouton n'apparaît, aucun QR n'est imprimé, et la page de confidentialité
// garde sa promesse actuelle (« L'audio de votre voix n'est jamais
// conservé »). À n'activer en production qu'après sur-audit de sécurité,
// relecture juridique et feu vert de Régis.

// Lu à l'appel (et non figé au chargement du module) pour rester testable ;
// côté navigateur, Next remplace process.env.NEXT_PUBLIC_* au build.
export function voixChoisieActive(): boolean {
  return process.env.NEXT_PUBLIC_VOIX_CHOISIE === "1";
}

// Version du texte de consentement affiché au moment du choix — à
// incrémenter si ce texte change, pour pouvoir prouver quelle version exacte
// a été acceptée (même principe que VERSION_CONSENTEMENT de app/sign-in).
export const VERSION_CONSENTEMENT_VOIX = "voix-v1 — 03/10/2026";

export const TEXTE_CONSENTEMENT_VOIX =
  "J'accepte que cet extrait de ma voix soit conservé, écouté depuis mon parcours et rendu accessible par un QR code imprimé dans mon livre. Je peux le supprimer à tout moment.";

export const BUCKET_VOIX = "voix";

// Un extrait = une réponse enregistrée pendant la séance. 25 Mo couvre
// largement une longue réponse (opus ≈ 0,5 Mo/min, MP4 Safari un peu plus).
export const TAILLE_MAX_OCTETS = 25 * 1024 * 1024;

// Types produits par MediaRecorder selon les navigateurs (Chrome/Firefox :
// webm/ogg ; Safari : mp4). Les paramètres (« ;codecs=opus ») sont ignorés.
export const TYPES_AUDIO_ACCEPTES: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
};

export function extensionAudio(typeMime: string): string | null {
  const base = typeMime.split(";")[0].trim().toLowerCase();
  return TYPES_AUDIO_ACCEPTES[base] ?? null;
}

// Jeton imprimé dans le QR code : 16 octets aléatoires (128 bits), encodés
// en base64url — impossible à deviner, court à imprimer (22 caractères).
// Web Crypto (disponible dans Node et dans le navigateur) : ce module reste
// importable par les composants client. Appelé uniquement côté serveur.
export function genererJeton(): string {
  const octets = crypto.getRandomValues(new Uint8Array(16));
  return Buffer.from(octets).toString("base64url");
}

export function jetonValide(jeton: string): boolean {
  return /^[A-Za-z0-9_-]{22}$/.test(jeton);
}

// Adresse imprimée dans le QR code. Domaine de production par défaut : un
// livre imprimé doit toujours pointer vers l'adresse publique durable, jamais
// vers un déploiement de prévisualisation.
export function urlEcoute(jeton: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://racontez-moi.com").replace(/\/$/, "");
  return `${base}/v/${jeton}`;
}
