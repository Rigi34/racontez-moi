import { describe, it, expect } from "vitest";
import { messageErreurAuth } from "./auth-erreurs";

describe("messageErreurAuth", () => {
  it("traduit un identifiant/mot de passe incorrect", () => {
    expect(messageErreurAuth("Invalid login credentials")).toBe("Email ou mot de passe incorrect.");
  });

  it("traduit un email déjà utilisé sur signUp (\"User already registered\")", () => {
    expect(messageErreurAuth("User already registered")).toBe(
      "Un compte existe déjà avec cet email. Connectez-vous."
    );
  });

  // Formulation réellement observée sur updateUser() (conversion d'un
  // compte anonyme), vérifiée empiriquement le 23/09/2026 contre le projet
  // TEST — distincte du message de signUp, d'où le motif large partagé.
  it("traduit un email déjà utilisé sur updateUser (\"...has already been registered\")", () => {
    expect(messageErreurAuth("A user with this email address has already been registered")).toBe(
      "Un compte existe déjà avec cet email. Connectez-vous."
    );
  });

  it("traduit un mot de passe trop court", () => {
    expect(messageErreurAuth("Password should be at least 6 characters.")).toBe(
      "Mot de passe trop court (8 caractères minimum)."
    );
  });

  it("traduit un email invalide", () => {
    expect(messageErreurAuth("Unable to validate email address: invalid format")).toBe(
      "Adresse email invalide."
    );
  });

  it("traduit une demande trop rapprochée (mot de passe oublié)", () => {
    expect(messageErreurAuth("For security purposes, you can only request this after 42 seconds.")).toBe(
      "Trop de demandes rapprochées. Patientez une minute, puis réessayez."
    );
  });

  it("traduit un nouveau mot de passe identique à l'ancien", () => {
    expect(messageErreurAuth("New password should be different from the old password.")).toBe(
      "Choisissez un mot de passe différent de l'ancien."
    );
  });

  it("traduit un lien de réinitialisation expiré (plus de session)", () => {
    expect(messageErreurAuth("Auth session missing!")).toBe(
      "Le lien a expiré. Redemandez un lien depuis la page de connexion."
    );
  });

  it("retombe sur un message générique pour une erreur inconnue", () => {
    expect(messageErreurAuth("Something completely unexpected")).toBe("Une erreur est survenue. Réessayez.");
  });
});
