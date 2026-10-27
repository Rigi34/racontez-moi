import { describe, it, expect } from "vitest";
import { destinationInterne } from "./redirection";

describe("destinationInterne", () => {
  it("garde un chemin interne, avec sa requête", () => {
    expect(destinationInterne("/activer?code=ABCD-EFGH")).toBe("/activer?code=ABCD-EFGH");
    expect(destinationInterne("/mon-livre")).toBe("/mon-livre");
  });

  it("renvoie au tableau de bord sans paramètre", () => {
    expect(destinationInterne(null)).toBe("/tableau-de-bord");
    expect(destinationInterne("")).toBe("/tableau-de-bord");
  });

  it.each([
    "https://site-piege.example",
    "//site-piege.example",
    "/\\site-piege.example",
    "@site-piege.example",
    "/x@site-piege.example",
    "javascript:alert(1)",
    "tableau-de-bord",
  ])("refuse %s", (valeur) => {
    expect(destinationInterne(valeur)).toBe("/tableau-de-bord");
  });
});
