// Intégration Lulu Print API — impression et expédition à la demande du
// livre final. Sandbox pour l'instant (jamais facturé, jamais imprimé pour
// de vrai) ; passage en production quand le pipeline d'assemblage du livre
// complet (couverture + relecture finale) existera.

const LULU_BASE_URL = "https://api.sandbox.lulu.com";

// Format retenu depuis le spike Typst de juin : 6x9po (US Trade), noir et
// blanc, broché, papier blanc 60#, couverture mate.
export const POD_PACKAGE_ID_PARCOURS = "0600X0900BWSTDPB060UC444MXX";

let tokenCache: { token: string; expireA: number } | null = null;

async function obtenirToken(): Promise<string> {
  if (tokenCache && tokenCache.expireA > Date.now()) return tokenCache.token;

  const credentials = Buffer.from(
    `${process.env.LULU_SANDBOX_CLIENT_KEY}:${process.env.LULU_SANDBOX_CLIENT_SECRET}`
  ).toString("base64");

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
