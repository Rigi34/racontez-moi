import { describe, it, expect, afterEach, vi } from "vitest";
import { origineRetourStripe } from "./origine-site";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("origineRetourStripe", () => {
  it("ignore une origine étrangère et revient à l'adresse du site", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://racontez-moi.com");
    expect(origineRetourStripe("https://site-piege.example")).toBe("https://racontez-moi.com");
  });

  it("refuse l'astuce userinfo (racontez-moi.com@site-piege.example)", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://racontez-moi.com");
    expect(origineRetourStripe("https://racontez-moi.com@site-piege.example")).toBe("https://racontez-moi.com");
  });

  it("garde l'adresse publique du site", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://racontez-moi.com/");
    expect(origineRetourStripe("https://racontez-moi.com")).toBe("https://racontez-moi.com");
  });

  it("garde le déploiement Vercel en cours (Preview TEST)", () => {
    vi.stubEnv("VERCEL_BRANCH_URL", "racontez-moi-git-test-equipe.vercel.app");
    expect(origineRetourStripe("https://racontez-moi-git-test-equipe.vercel.app")).toBe(
      "https://racontez-moi-git-test-equipe.vercel.app"
    );
  });

  it("refuse un autre déploiement vercel.app", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://racontez-moi.com");
    vi.stubEnv("VERCEL_URL", "racontez-moi-abc.vercel.app");
    expect(origineRetourStripe("https://projet-piege.vercel.app")).toBe("https://racontez-moi.com");
  });

  it("accepte localhost hors production, jamais en production", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://racontez-moi.com");
    vi.stubEnv("NODE_ENV", "development");
    expect(origineRetourStripe("http://localhost:3000")).toBe("http://localhost:3000");
    vi.stubEnv("NODE_ENV", "production");
    expect(origineRetourStripe("http://localhost:3000")).toBe("https://racontez-moi.com");
  });

  it("revient à l'adresse par défaut sans origine ni variable", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(origineRetourStripe(null)).toBe("https://racontez-moi.com");
  });
});
