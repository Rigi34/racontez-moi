// Chargement avec une seconde tentative (12/11/2026, retour de Régis) :
// en revenant sur un onglet ouvert la veille, la session expirée est
// renouvelée au même moment par le site et par le navigateur ; la première
// requête peut alors repartir en « non authentifié ». Avant, les photos
// affichaient « 0 photo » sans explication. On réessaie une fois, puis on
// signale l'échec au lieu de montrer une liste vide.

export async function chargerJsonAvecReessai<T>(
  url: string,
  { delaiMs = 1500, fetcher = fetch }: { delaiMs?: number; fetcher?: typeof fetch } = {},
): Promise<T | null> {
  for (let tentative = 0; tentative < 2; tentative++) {
    if (tentative > 0) await new Promise((r) => setTimeout(r, delaiMs));
    try {
      const res = await fetcher(url, { cache: "no-store" });
      if (res.ok) return (await res.json()) as T;
    } catch {
      // réseau : on retente
    }
  }
  return null;
}
