import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { assurerEnvironnementTest } from "./garde-environnement-test";

const ENV_ORIGINAL = { ...process.env };

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_ENV;
});

afterEach(() => {
  process.env = { ...ENV_ORIGINAL };
});

describe("assurerEnvironnementTest", () => {
  it("refuse si NEXT_PUBLIC_SUPABASE_URL est absente", () => {
    process.env.SUPABASE_ENV = "test";
    expect(() => assurerEnvironnementTest()).toThrow(/absente ou invalide/);
  });

  it("refuse si NEXT_PUBLIC_SUPABASE_URL n'est pas une URL valide", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "pas-une-url";
    process.env.SUPABASE_ENV = "test";
    expect(() => assurerEnvironnementTest()).toThrow(/absente ou invalide/);
  });

  it("refuse l'hôte Supabase de production, même si SUPABASE_ENV=test", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fasvqpokgdvzahqmjlxz.supabase.co";
    process.env.SUPABASE_ENV = "test";
    expect(() => assurerEnvironnementTest()).toThrow(/PRODUCTION/);
  });

  it("refuse si SUPABASE_ENV n'est pas exactement \"test\", même sur un hôte non-production", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://un-projet-quelconque.supabase.co";
    process.env.SUPABASE_ENV = "";
    expect(() => assurerEnvironnementTest()).toThrow(/SUPABASE_ENV/);
  });

  it("refuse une valeur approximative de SUPABASE_ENV (ex. \"testing\")", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://un-projet-quelconque.supabase.co";
    process.env.SUPABASE_ENV = "testing";
    expect(() => assurerEnvironnementTest()).toThrow(/SUPABASE_ENV/);
  });

  it("passe si l'hôte n'est pas la production et SUPABASE_ENV vaut exactement \"test\"", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://un-projet-de-test.supabase.co";
    process.env.SUPABASE_ENV = "test";
    expect(() => assurerEnvironnementTest()).not.toThrow();
  });
});
