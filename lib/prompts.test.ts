import { describe, it, expect } from "vitest";
import { SYSTEM_FRAGMENT } from "./prompts";

// Garde-fou contre une régression des règles de fidélité (16/11/2026).
describe("SYSTEM_FRAGMENT — fidélité", () => {
  it("les détails des questions ne sont pas des faits", () => {
    expect(SYSTEM_FRAGMENT).toContain("un détail qui n'apparaît que dans une question");
  });
  it("garde les liens de parenté nommés", () => {
    expect(SYSTEM_FRAGMENT).toContain("Garde les liens de parenté");
  });
  it("n'allonge jamais en inventant quand la matière est mince", () => {
    expect(SYSTEM_FRAGMENT).toContain("ne jamais allonger en inventant");
  });
  it("conserve le signal de matière insuffisante", () => {
    expect(SYSTEM_FRAGMENT).toContain("MATIERE_INSUFFISANTE");
  });
});
