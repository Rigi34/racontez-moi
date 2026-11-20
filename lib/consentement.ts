// Identifiant de version du texte de consentement (annexe du document
// juridique du 30/07/2026) — à incrémenter si le texte de la case à cocher
// change, pour pouvoir prouver quelle version exacte a été acceptée.
export const VERSION_CONSENTEMENT = "v1.0 — 30/07/2026";

// Métadonnées enregistrées sur le compte quand la case est cochée.
export function metadonneesConsentement(maintenant = new Date()) {
  return {
    consentement_donnees_sensibles: true,
    consentement_donnees_sensibles_le: maintenant.toISOString(),
    consentement_donnees_sensibles_version: VERSION_CONSENTEMENT,
  };
}
