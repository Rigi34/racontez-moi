import { describe, it, expect, beforeAll, vi } from "vitest";
import { createHmac } from "node:crypto";

// Le secret est lu au chargement du module (sandbox tant que
// LULU_PRODUCTION n'est pas « true ») : on le fixe avant l'import.
const SECRET = "secret-de-test";
let lulu: typeof import("./lulu");

beforeAll(async () => {
  vi.stubEnv("LULU_PRODUCTION", "false");
  vi.stubEnv("LULU_SANDBOX_CLIENT_SECRET", SECRET);
  lulu = await import("./lulu");
});

const corps = JSON.stringify({ topic: "PRINT_JOB_STATUS_CHANGED", data: { id: 42 } });
const hmac = () => createHmac("sha256", SECRET).update(corps, "utf8").digest();

describe("POD_PACKAGE_ID_PARCOURS", () => {
  it("utilise le nouveau format à points, couverture mate", () => {
    expect(lulu.POD_PACKAGE_ID_PARCOURS).toBe("0600X0900.FC.STD.CW.080CW444.MXX");
  });
});

describe("impressionBloqueeEnLigne", () => {
  it("bloque seulement sur le site en ligne quand Lulu est en mode essai", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(lulu.impressionBloqueeEnLigne()).toBe(true);
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(lulu.impressionBloqueeEnLigne()).toBe(false);
    vi.stubEnv("VERCEL_ENV", "");
    expect(lulu.impressionBloqueeEnLigne()).toBe(false);
  });
});

describe("signatureWebhookLuluValide", () => {
  it("accepte une signature hexadécimale correcte", () => {
    expect(lulu.signatureWebhookLuluValide(corps, hmac().toString("hex"))).toBe(true);
  });
  it("accepte une signature base64 correcte", () => {
    expect(lulu.signatureWebhookLuluValide(corps, hmac().toString("base64"))).toBe(true);
  });
  it("refuse une signature absente, fausse, ou un corps modifié", () => {
    expect(lulu.signatureWebhookLuluValide(corps, null)).toBe(false);
    expect(lulu.signatureWebhookLuluValide(corps, "abc")).toBe(false);
    expect(lulu.signatureWebhookLuluValide(corps + " ", hmac().toString("hex"))).toBe(false);
  });
});

describe("statutsProblemeLulu", () => {
  it("ne signale rien pour un parcours normal", () => {
    expect(lulu.statutsProblemeLulu({ status: { name: "IN_PRODUCTION" }, line_items: [{ status: { name: "ACCEPTED" } }] })).toEqual([]);
  });
  it("signale un rejet au niveau de la commande ou d'une ligne, sans doublon", () => {
    expect(lulu.statutsProblemeLulu({ status: { name: "REJECTED" }, line_items: [{ status: { name: "REJECTED" } }] })).toEqual(["REJECTED"]);
    expect(lulu.statutsProblemeLulu({ status: { name: "CREATED" }, line_items: [{ status: { name: "ERROR" } }] })).toEqual(["ERROR"]);
    expect(lulu.statutsProblemeLulu({ status: { name: "CANCELED" } })).toEqual(["CANCELED"]);
  });
});

describe("titreCommandeLulu", () => {
  it("assemble titre et prénom", () => {
    expect(lulu.titreCommandeLulu("Mes Mémoires", "Daniel")).toBe("Mes Mémoires — Daniel");
  });
  it("garde le titre seul sans prénom, et « Racontez-moi » si le titre est vide", () => {
    expect(lulu.titreCommandeLulu("Mes Mémoires", null)).toBe("Mes Mémoires");
    expect(lulu.titreCommandeLulu("  ", " ")).toBe("Racontez-moi");
  });
  it("borne la longueur à 120 caractères", () => {
    expect(lulu.titreCommandeLulu("a".repeat(200), "Daniel").length).toBe(120);
  });
});
