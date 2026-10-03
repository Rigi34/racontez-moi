// Messages d'erreur Supabase Auth traduits en français simple — partagé
// entre l'inscription classique (app/sign-in/page.tsx) et la conversion
// d'un compte anonyme en compte permanent (app/components/Seance.tsx),
// pour ne pas faire dériver deux traductions du même jeu d'erreurs.
//
// Le motif "already.*registered" couvre volontairement deux formulations
// distinctes observées : "User already registered" (signUp) et "A user
// with this email address has already been registered" (updateUser,
// vérifié empiriquement le 23/09/2026 en TEST) — un texte différent pour
// la même situation selon l'appel Supabase utilisé.
export function messageErreurAuth(raw: string): string {
  if (/invalid login credentials/i.test(raw)) return "Email ou mot de passe incorrect.";
  if (/already.*registered/i.test(raw)) return "Un compte existe déjà avec cet email. Connectez-vous.";
  if (/password should be at least/i.test(raw)) return "Mot de passe trop court (8 caractères minimum).";
  if (/unable to validate email|invalid email/i.test(raw)) return "Adresse email invalide.";
  return "Une erreur est survenue. Réessayez.";
}
