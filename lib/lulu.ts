// Intégration Lulu Print API — impression et expédition à la demande du
// livre final. Sandbox par défaut (jamais facturé, jamais imprimé pour de
// vrai). Bascule en production uniquement si LULU_PRODUCTION=true ET les
// identifiants LULU_CLIENT_KEY/LULU_CLIENT_SECRET (compte production, carte
// bancaire — action manuelle de Régis, jamais faite) sont renseignés —
// jamais un simple changement de code.
const EN_PRODUCTION = process.env.LULU_PRODUCTION === "true";
const LULU_BASE_URL = EN_PRODUCTION ? "https://api.lulu.com" : "https://api.sandbox.lulu.com";
const LULU_CLIENT_KEY = EN_PRODUCTION ? process.env.LULU_CLIENT_KEY : process.env.LULU_SANDBOX_CLIENT_KEY;
const LULU_CLIENT_SECRET = EN_PRODUCTION ? process.env.LULU_CLIENT_SECRET : process.env.LULU_SANDBOX_CLIENT_SECRET;

// Format retenu le 23 juillet 2026 (offre tout-compris ~179€, décision
// prise après vérification du coût réel : couleur relié ~29€ tout compris
// en France, pas le facteur 3-5x redouté) : 6x9po (US Trade), couleur,
// relié (casewrap), couverture brillante. Remplace le format N&B broché du
// spike Typst de juin.
export const POD_PACKAGE_ID_PARCOURS = "0600X0900FCSTDCW080CW444GXX";

// Contrainte physique du relié casewrap, vérifiée en direct auprès de
// l'API Lulu (pas une supposition) : en dessous de ce seuil, Lulu refuse
// ("Wrong pages number") — impossible de relier un livre trop fin.
export const PAGES_MINIMUM_RELIE = 24;

let tokenCache: { token: string; expireA: number } | null = null;

async function obtenirToken(): Promise<string> {
  if (tokenCache && tokenCache.expireA > Date.now()) return tokenCache.token;

  const credentials = Buffer.from(`${LULU_CLIENT_KEY}:${LULU_CLIENT_SECRET}`).toString("base64");

  const res = await fetch(`${LULU_BASE_URL}/auth/realms/glasstree/protocol/openid-connect/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("Authentification Lulu échouée: " + (await res.text()));

  const data = await res.json();
  tokenCache = { token: data.access_token, expireA: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

export type AdresseLivraison = {
  name: string;
  street1: string;
  city: string;
  country_code: string;
  postcode: string;
  phone_number: string;
};

// Dimensions exactes de la couverture (front + dos + quatrième de
// couverture + fond perdu), en points (1pt = 1/72po) — la largeur du dos
// dépend du nombre de pages intérieures et doit être demandée à Lulu,
// jamais calculée à la main (pas de formule publique fiable pour le
// casewrap couleur).
export async function dimensionsCouverture(nombrePages: number): Promise<{ largeurPt: number; hauteurPt: number }> {
  const token = await obtenirToken();
  const res = await fetch(`${LULU_BASE_URL}/cover-dimensions/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ pod_package_id: POD_PACKAGE_ID_PARCOURS, interior_page_count: nombrePages }),
  });
  if (!res.ok) throw new Error("Calcul des dimensions de couverture Lulu échoué: " + (await res.text()));
  const data = await res.json();
  return { largeurPt: Number(data.width), hauteurPt: Number(data.height) };
}

export async function calculerCoutImpression(adresse: AdresseLivraison, nombrePages: number) {
  const token = await obtenirToken();
  const res = await fetch(`${LULU_BASE_URL}/print-job-cost-calculations/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      shipping_address: adresse,
      shipping_option: "MAIL",
      line_items: [{ quantity: 1, pod_package_id: POD_PACKAGE_ID_PARCOURS, page_count: nombrePages }],
    }),
  });
  if (!res.ok) throw new Error("Calcul de coût Lulu échoué: " + (await res.text()));
  return res.json();
}

export async function creerCommandeImpression(
  adresse: AdresseLivraison,
  email: string,
  interieurUrl: string,
  couvertureUrl: string
) {
  const token = await obtenirToken();
  const res = await fetch(`${LULU_BASE_URL}/print-jobs/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      contact_email: email,
      shipping_address: { ...adresse, email },
      shipping_level: "MAIL",
      line_items: [
        {
          quantity: 1,
          title: "Racontez-moi — Le Parcours",
          printable_normalization: {
            pod_package_id: POD_PACKAGE_ID_PARCOURS,
            interior: { source_url: interieurUrl },
            cover: { source_url: couvertureUrl },
          },
        },
      ],
    }),
  });
  if (!res.ok) throw new Error("Création de commande Lulu échouée: " + (await res.text()));
  return res.json();
}
