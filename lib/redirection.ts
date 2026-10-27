// Destination après connexion (paramètres redirect_url de /sign-in et next
// de /auth/callback) : seulement un chemin interne au site. Une adresse
// complète, un chemin commençant par // ou \ (interprétés comme un autre
// site), ou le caractère @ (racontez-moi.com@site-piege.example une fois
// collé derrière l'origine) renvoient vers le tableau de bord — audit de
// clôture du 27/10/2026, constat B-6.
const DESTINATION_PAR_DEFAUT = "/tableau-de-bord";

export function destinationInterne(valeur: string | null | undefined): string {
  if (!valeur) return DESTINATION_PAR_DEFAUT;
  if (!valeur.startsWith("/") || valeur.startsWith("//") || valeur.startsWith("/\\")) return DESTINATION_PAR_DEFAUT;
  if (/[@\\\s]/.test(valeur)) return DESTINATION_PAR_DEFAUT;
  return valeur;
}
