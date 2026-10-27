// Origine utilisée pour les adresses de retour Stripe (success_url,
// cancel_url). Ne jamais reprendre telle quelle l'en-tête Origin : il est
// fourni par le client, et une session de paiement créée avec
// Origin: https://site-piege.example renverrait l'acheteur, avec son
// session_id, vers ce site — qui pourrait alors lire le code cadeau sur
// /offrir/merci (audit de clôture du 27/10/2026, constat B-1).
//
// L'origine du client n'est retenue que si elle figure dans la liste :
// adresse publique du site, déploiement Vercel en cours (Preview TEST
// comprise, via les variables système VERCEL_URL / VERCEL_BRANCH_URL) et,
// hors production, localhost. Sinon : l'adresse publique du site.

const SITE_PAR_DEFAUT = "https://racontez-moi.com";

function adresseSite(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || SITE_PAR_DEFAUT).replace(/\/$/, "");
}

function originesAutorisees(): Set<string> {
  const origines = new Set<string>([adresseSite(), SITE_PAR_DEFAUT]);
  for (const hote of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
    if (hote) origines.add(`https://${hote}`);
  }
  return origines;
}

function estLocalhost(origine: string): boolean {
  try {
    const url = new URL(origine);
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

export function origineRetourStripe(origineClient: string | null): string {
  if (!origineClient) return adresseSite();
  if (originesAutorisees().has(origineClient)) return origineClient;
  if (process.env.NODE_ENV !== "production" && estLocalhost(origineClient)) return origineClient;
  return adresseSite();
}
