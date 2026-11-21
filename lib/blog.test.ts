import { describe, it, expect } from "vitest";
import { lireDate, dureeLisible, splitIntro, donneesStructurees, type BlogPost } from "./blog";

describe("dureeLisible", () => {
  it("arrondit à la minute", () => {
    expect(dureeLisible("PT4M13S")).toBe("4 min");
    expect(dureeLisible("PT4M45S")).toBe("5 min");
    expect(dureeLisible("PT20S")).toBe("1 min");
    expect(dureeLisible("PT1H2M")).toBe("62 min");
  });
  it("renvoie une chaîne vide si le format est faux", () => {
    expect(dureeLisible("4:13")).toBe("");
  });
});

describe("splitIntro", () => {
  it("coupe avant le premier intertitre", () => {
    const md = "# Titre\n\nIntro.\n\n## Partie 1\n\nTexte.\n\n## Partie 2";
    expect(splitIntro(md)).toEqual({
      intro: "# Titre\n\nIntro.",
      suite: "## Partie 1\n\nTexte.\n\n## Partie 2",
    });
  });
  it("ne coupe pas sur un ###", () => {
    expect(splitIntro("Intro\n\n### Sous-partie").suite).toBe("");
  });
});

describe("donneesStructurees", () => {
  const base: BlogPost = { slug: "s", title: "T", description: "D", body: "", date: "2026-11-24" };
  it("article seul sans vidéo", () => {
    const d = donneesStructurees(base) as Record<string, unknown>[];
    expect(d).toHaveLength(1);
    expect(d[0]["@type"]).toBe("BlogPosting");
    expect(d[0].datePublished).toBe("2026-11-24");
  });
  it("ajoute la vidéo avec embed sans cookies", () => {
    const d = donneesStructurees({
      ...base,
      video: { youtube: "abcdefghijk", duree: "PT4M13S", date: "2026-11-24", vignette: "/blog/s.jpg" },
    }) as Record<string, unknown>[];
    expect(d[1]["@type"]).toBe("VideoObject");
    expect(d[1].embedUrl).toBe("https://www.youtube-nocookie.com/embed/abcdefghijk");
    expect(d[1].thumbnailUrl).toEqual(["https://racontez-moi.com/blog/s.jpg"]);
    expect(d[1].duration).toBe("PT4M13S");
  });
});

describe("lireDate", () => {
  it("accepte une date YAML sans guillemets (objet Date) ou une chaîne", () => {
    expect(lireDate(new Date("2026-11-24"))).toBe("2026-11-24");
    expect(lireDate("2026-11-24")).toBe("2026-11-24");
    expect(lireDate("24/11/2026")).toBeUndefined();
  });
});
