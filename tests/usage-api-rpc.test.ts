import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import crypto from "node:crypto";

// Exécute la vraie migration 0019_usage_api.sql contre un Postgres réel
// (PGlite, WASM, aucun service externe) plutôt que de mocker le SQL — vérifie
// le contrat exact de la fonction incrementer_et_verifier_usage et ses cas
// limites.
//
// CE QUE CES TESTS PROUVENT : la logique séquentielle de la fonction
// (incrémentation, seuil, indépendance user/route/jour, garde d'autorisation).
//
// CE QU'ILS NE PROUVENT PAS : l'atomicité sous concurrence réelle. PGlite
// traite les requêtes séquentiellement (une seule connexion, pas de
// parallélisme au niveau moteur) — deux appels envoyés "en parallèle" depuis
// Node via Promise.all seraient de toute façon exécutés l'un après l'autre
// par PGlite, donc un tel test passerait même avec une implémentation NON
// atomique (lire-puis-écrire). La garantie d'atomicité elle-même repose sur
// le comportement documenté de Postgres pour INSERT ... ON CONFLICT DO
// UPDATE (verrouillage de ligne, cf. supabase/migrations/0019_usage_api.sql
// et le compte rendu d'analyse A4) — non démontrée par exécution ici.
// La concurrence réelle (deux connexions distinctes contre une instance
// Supabase) reste "à valider après déploiement", non testée par cette suite.

const MIGRATION_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "supabase",
  "migrations",
  "0019_usage_api.sql"
);

let db: PGlite;

async function creerUtilisateur(): Promise<string> {
  const id = crypto.randomUUID();
  await db.query("insert into auth.users (id) values ($1)", [id]);
  return id;
}

async function commeUtilisateur<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  await db.query("select set_config('app.current_user_id', $1, false)", [userId]);
  return fn();
}

async function appeler(userId: string, route: string, limite: number) {
  const r = await db.query<{ autorise: boolean; compteur: number }>(
    "select * from incrementer_et_verifier_usage($1, $2, $3)",
    [userId, route, limite]
  );
  return r.rows[0];
}

beforeAll(async () => {
  db = new PGlite();
  // Stub minimal de ce que Supabase fournit en production et qui est absent
  // de Postgres vanilla : schéma auth (table users + fonction uid() pilotée
  // par une variable de session plutôt qu'un vrai JWT) et rôles réservés
  // référencés par les grant/revoke de la migration.
  await db.exec(`
    create schema if not exists auth;
    create table auth.users (id uuid primary key default gen_random_uuid());
    create or replace function auth.uid() returns uuid as $$
      select nullif(current_setting('app.current_user_id', true), '')::uuid;
    $$ language sql stable;
    create role authenticated;
    create role anon;
  `);
  await db.exec(readFileSync(MIGRATION_PATH, "utf8"));
});

afterAll(async () => {
  await db.close();
});

describe("incrementer_et_verifier_usage — contrat de base", () => {
  it("premier appel du jour : compteur=1, autorise=true", async () => {
    const userId = await creerUtilisateur();
    const r = await commeUtilisateur(userId, () => appeler(userId, "seance", 30));
    expect(r).toEqual({ autorise: true, compteur: 1 });
  });

  it("incrémente séquentiellement à chaque appel pour le même (user, route, jour)", async () => {
    const userId = await creerUtilisateur();
    for (let i = 1; i <= 5; i++) {
      const r = await commeUtilisateur(userId, () => appeler(userId, "transcribe", 30));
      expect(r).toEqual({ autorise: true, compteur: i });
    }
  });
});

describe("incrementer_et_verifier_usage — seuil (cas limite)", () => {
  it("autorise=true pile au seuil, autorise=false juste au-dessus", async () => {
    const userId = await creerUtilisateur();
    const limite = 3;
    let dernier;
    for (let i = 1; i <= limite; i++) {
      dernier = await commeUtilisateur(userId, () => appeler(userId, "seance", limite));
    }
    expect(dernier).toEqual({ autorise: true, compteur: limite });

    const depassement = await commeUtilisateur(userId, () => appeler(userId, "seance", limite));
    expect(depassement).toEqual({ autorise: false, compteur: limite + 1 });
  });

  it("continue d'incrémenter au-delà du seuil (comptage informatif, pas de plafond dur en base)", async () => {
    const userId = await creerUtilisateur();
    const limite = 1;
    await commeUtilisateur(userId, () => appeler(userId, "seance", limite));
    const r2 = await commeUtilisateur(userId, () => appeler(userId, "seance", limite));
    const r3 = await commeUtilisateur(userId, () => appeler(userId, "seance", limite));
    expect(r2).toEqual({ autorise: false, compteur: 2 });
    expect(r3).toEqual({ autorise: false, compteur: 3 });
  });
});

describe("incrementer_et_verifier_usage — indépendance des compteurs", () => {
  it("deux routes différentes pour le même utilisateur ne partagent pas de compteur", async () => {
    const userId = await creerUtilisateur();
    const rSeance = await commeUtilisateur(userId, () => appeler(userId, "seance", 30));
    const rTranscribe = await commeUtilisateur(userId, () => appeler(userId, "transcribe", 30));
    expect(rSeance.compteur).toBe(1);
    expect(rTranscribe.compteur).toBe(1);
  });

  it("deux utilisateurs différents ne partagent pas de compteur", async () => {
    const userA = await creerUtilisateur();
    const userB = await creerUtilisateur();
    await commeUtilisateur(userA, () => appeler(userA, "seance", 30));
    await commeUtilisateur(userA, () => appeler(userA, "seance", 30));
    const rB = await commeUtilisateur(userB, () => appeler(userB, "seance", 30));
    expect(rB.compteur).toBe(1);
  });

  it("un jour différent repart avec un compteur à zéro (reset quotidien)", async () => {
    const userId = await creerUtilisateur();
    await commeUtilisateur(userId, () => appeler(userId, "seance", 30));
    await commeUtilisateur(userId, () => appeler(userId, "seance", 30));
    // Simule le passage au lendemain : on ne peut pas changer l'horloge
    // système de PGlite, donc on fait vieillir directement la ligne du jour
    // pour vérifier que la contrainte (user_id, route, jour) crée bien une
    // nouvelle ligne à compteur=1 quand "jour" change, plutôt que de
    // supposer ce comportement.
    await db.query(
      "update usage_api set jour = current_date - interval '1 day' where user_id = $1 and route = 'seance'",
      [userId]
    );
    const r = await commeUtilisateur(userId, () => appeler(userId, "seance", 30));
    expect(r).toEqual({ autorise: true, compteur: 1 });
  });
});

describe("incrementer_et_verifier_usage — garde d'autorisation", () => {
  it("lève une exception si p_user_id ne correspond pas à auth.uid()", async () => {
    const userId = await creerUtilisateur();
    const autreUserId = await creerUtilisateur();
    await db.query("select set_config('app.current_user_id', $1, false)", [userId]);
    await expect(
      db.query("select * from incrementer_et_verifier_usage($1, $2, $3)", [autreUserId, "seance", 30])
    ).rejects.toThrow(/non autorisé/);
  });
});
