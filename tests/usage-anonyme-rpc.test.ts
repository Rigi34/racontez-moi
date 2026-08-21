import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Exécute la vraie migration 0020_usage_anonyme.sql contre un Postgres réel
// (PGlite, WASM, aucun service externe) plutôt que de mocker le SQL — même
// démarche que tests/usage-api-rpc.test.ts (A4) pour incrementer_et_verifier_usage.
//
// CE QUE CES TESTS PROUVENT : la logique séquentielle de la fonction
// (incrémentation, seuil, indépendance ip/route/jour). Pas de garde
// d'autorisation à tester ici (contrairement à A4) : la RPC anonyme n'a pas
// d'équivalent auth.uid(), c'est le code appelant (routes /api/contact et
// /api/cadeau/certificat/apercu) qui reste seul responsable de fournir la
// bonne IP.
//
// CE QU'ILS NE PROUVENT PAS : l'atomicité sous concurrence réelle (PGlite
// traite les requêtes séquentiellement, cf. commentaire détaillé dans
// tests/usage-api-rpc.test.ts) — repose sur le comportement documenté de
// Postgres pour INSERT ... ON CONFLICT DO UPDATE, non démontré par exécution
// ici.

const MIGRATION_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "supabase",
  "migrations",
  "0020_usage_anonyme.sql"
);

let db: PGlite;

async function appeler(ip: string, route: string, limite: number) {
  const r = await db.query<{ autorise: boolean; compteur: number }>(
    "select * from incrementer_et_verifier_usage_anonyme($1, $2, $3)",
    [ip, route, limite]
  );
  return r.rows[0];
}

beforeAll(async () => {
  db = new PGlite();
  // Stub minimal des rôles réservés référencés par les grant/revoke de la
  // migration (aucun schéma auth nécessaire ici, contrairement à
  // tests/usage-api-rpc.test.ts, puisque la RPC anonyme ne dépend pas de
  // auth.uid()).
  await db.exec(`
    create role authenticated;
    create role anon;
  `);
  await db.exec(readFileSync(MIGRATION_PATH, "utf8"));
});

afterAll(async () => {
  await db.close();
});

describe("incrementer_et_verifier_usage_anonyme — contrat de base", () => {
  it("premier appel du jour : compteur=1, autorise=true", async () => {
    const r = await appeler("203.0.113.1", "contact", 5);
    expect(r).toEqual({ autorise: true, compteur: 1 });
  });

  it("incrémente séquentiellement à chaque appel pour la même (ip, route, jour)", async () => {
    const ip = "203.0.113.2";
    for (let i = 1; i <= 5; i++) {
      const r = await appeler(ip, "certificat_apercu", 20);
      expect(r).toEqual({ autorise: true, compteur: i });
    }
  });
});

describe("incrementer_et_verifier_usage_anonyme — seuil (cas limite)", () => {
  it("autorise=true pile au seuil, autorise=false juste au-dessus", async () => {
    const ip = "203.0.113.3";
    const limite = 3;
    let dernier;
    for (let i = 1; i <= limite; i++) {
      dernier = await appeler(ip, "contact", limite);
    }
    expect(dernier).toEqual({ autorise: true, compteur: limite });

    const depassement = await appeler(ip, "contact", limite);
    expect(depassement).toEqual({ autorise: false, compteur: limite + 1 });
  });

  it("continue d'incrémenter au-delà du seuil (comptage informatif, pas de plafond dur en base)", async () => {
    const ip = "203.0.113.4";
    const limite = 1;
    await appeler(ip, "contact", limite);
    const r2 = await appeler(ip, "contact", limite);
    const r3 = await appeler(ip, "contact", limite);
    expect(r2).toEqual({ autorise: false, compteur: 2 });
    expect(r3).toEqual({ autorise: false, compteur: 3 });
  });
});

describe("incrementer_et_verifier_usage_anonyme — indépendance des compteurs", () => {
  it("deux routes différentes pour la même IP ne partagent pas de compteur", async () => {
    const ip = "203.0.113.5";
    const rContact = await appeler(ip, "contact", 5);
    const rApercu = await appeler(ip, "certificat_apercu", 20);
    expect(rContact.compteur).toBe(1);
    expect(rApercu.compteur).toBe(1);
  });

  it("deux IP différentes ne partagent pas de compteur", async () => {
    const ipA = "203.0.113.6";
    const ipB = "203.0.113.7";
    await appeler(ipA, "contact", 5);
    await appeler(ipA, "contact", 5);
    const rB = await appeler(ipB, "contact", 5);
    expect(rB.compteur).toBe(1);
  });

  it('le seau partagé "unknown" cumule les appels de tous les clients sans IP détectable', async () => {
    const r1 = await appeler("unknown", "contact", 5);
    const r2 = await appeler("unknown", "contact", 5);
    expect(r1.compteur).toBe(1);
    expect(r2.compteur).toBe(2);
  });

  it("un jour différent repart avec un compteur à zéro (reset quotidien)", async () => {
    const ip = "203.0.113.8";
    await appeler(ip, "contact", 5);
    await appeler(ip, "contact", 5);
    // Simule le passage au lendemain en faisant vieillir directement la
    // ligne du jour, comme dans tests/usage-api-rpc.test.ts.
    await db.query(
      "update usage_anonyme set jour = current_date - interval '1 day' where ip = $1 and route = 'contact'",
      [ip]
    );
    const r = await appeler(ip, "contact", 5);
    expect(r).toEqual({ autorise: true, compteur: 1 });
  });
});
