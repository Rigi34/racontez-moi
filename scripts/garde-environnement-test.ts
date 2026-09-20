// Garde-fou anti-production — Phase 7 de l'audit sécurité (12/09/2026).
// À appeler en tout premier, avant toute opération destructive, dans tout
// futur script de test dynamique (Phase 8, TEST A-J). Deux vérifications
// indépendantes, toutes deux obligatoires — volontairement simple, pas de
// détection implicite : le marqueur SUPABASE_ENV doit être explicitement
// positionné à "test", jamais deviné.
//
// Usage : import { assurerEnvironnementTest } from "./garde-environnement-test";
//         assurerEnvironnementTest(); // lève une exception et arrête tout si ce n'est pas sûr

// Hôtes Supabase connus de production — jamais la cible d'un test.
const HOTES_PRODUCTION_INTERDITS = ["fasvqpokgdvzahqmjlxz.supabase.co"];

export function assurerEnvironnementTest(): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const marqueur = process.env.SUPABASE_ENV ?? "";

  let hote: string;
  try {
    hote = new URL(url).hostname;
  } catch {
    throw new Error(
      `Garde-fou anti-production : NEXT_PUBLIC_SUPABASE_URL absente ou invalide ("${url}") — ` +
        `impossible de confirmer qu'il s'agit d'un environnement de test. Arrêt.`
    );
  }

  if (HOTES_PRODUCTION_INTERDITS.includes(hote)) {
    throw new Error(
      `Garde-fou anti-production : "${hote}" est l'hôte Supabase de PRODUCTION. ` +
        `Aucun test destructif ne peut s'exécuter contre cet environnement. Arrêt.`
    );
  }

  if (marqueur !== "test") {
    throw new Error(
      `Garde-fou anti-production : SUPABASE_ENV doit valoir exactement "test" pour exécuter ` +
        `un test destructif (valeur actuelle : "${marqueur || "(absente)"}"). Ceci confirme ` +
        `explicitement que l'environnement chargé est un vrai projet de test, pas seulement ` +
        `"différent de la production". Arrêt.`
    );
  }
}
