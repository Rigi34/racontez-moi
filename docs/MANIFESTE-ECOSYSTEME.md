# Manifeste de l'écosystème — Racontez-moi

*Document de référence vivant, initié le 21/08/2026 à partir de l'état du dépôt sur `main` (commit `1eb7473`), du contenu de `README.md`, `AGENTS.md`, `CLAUDE.md`, de `docs/ETAT-DES-LIEUX-2026-08-20.md`, `docs/AUDIT-SECURITE-DEBUG-RATE-LIMITING-2026-08-21.md`, `docs/PLAN-ACTION-TECHNIQUE-2026-08-21.md`, et d'une vérification directe du code.*

## À quoi sert ce document

Les trois autres documents de `docs/` sont des **photographies datées** : un état des lieux, un audit, un plan d'action, chacun figé à la date de son analyse. Ce manifeste est différent : c'est un **document de synthèse évolutif**, destiné à être mis à jour au fil des décisions plutôt que remplacé par un nouveau fichier daté. Il répond à une question simple — *où en est réellement l'écosystème Racontez-moi aujourd'hui, qu'est-ce qui a été tranché, qu'est-ce qui reste ouvert ?*

Il distingue explicitement quatre catégories, reprises tout au long du document :

- **État actuel** — ce qui existe et fonctionne, vérifié dans le code.
- **Décision prise** — un choix explicite, assumé, avec sa raison.
- **Futur / à faire** — identifié comme nécessaire mais pas encore réalisé.
- **À vérifier** — ni confirmé ni infirmé par la seule lecture du dépôt (config hors dépôt, comportement en production, etc.).

Quand un point change de catégorie (une hypothèse tranchée, un chantier terminé), ce fichier doit être édité en conséquence — pas dupliqué dans un nouveau document daté.

---

## 1. Ce qu'est le produit (état actuel)

Racontez-moi est une application web française qui transforme des **entretiens vocaux enregistrés** en **livre de mémoires imprimé**. Un narrateur répond à une question à la voix, reçoit deux relances IA successives, puis l'ensemble est composé en un fragment littéraire à la première personne. Les fragments s'assemblent au fil des séances en un manuscrit illustré de photos, mis en page, et envoyé à l'impression (Lulu Print API) pour recevoir un livre relié 6×9po chez soi.

Un export ebook (EPUB) et un parcours cadeau (code d'activation à 8 caractères, sans compte requis côté acheteur) existent en complément du parcours narrateur principal.

## 2. Stack technique (état actuel)

| Domaine | Choix | Rôle |
|---|---|---|
| Framework | Next.js 16.2.10 (App Router) + React 19.2.4, TypeScript strict | Application web |
| Style | Tailwind CSS 4 | Palette éditoriale (ivoire/terracotta/forêt), polices Fraunces/Source Serif/IBM Plex/Caveat |
| Données | Supabase (Postgres + pgvector + Auth + Storage), client SSR `@supabase/ssr` | Persistance, RAG, authentification, stockage photos |
| IA rédaction | Anthropic SDK — `claude-sonnet-4-6` (fragments), `claude-haiku-4-5` (relances, extraction de profil, résumé) | Cœur du produit |
| Transcription | Groq (Whisper `large-v3`) | Voix → texte |
| Embeddings | HuggingFace Inference, `paraphrase-multilingual-mpnet-base-v2` (768-d, gratuit) | RAG sur bibliothèque de référence |
| Composition PDF | Typst (`@myriaddreamin/typst-ts-node-compiler`), double passe | Manuscrit + couverture, gabarit conforme Lulu |
| Impression | Lulu Print API | Impression à la demande, bascule sandbox/prod par variable d'environnement (§6.3) |
| Paiement | Stripe | Paiement unique 155€ + flux cadeau séparé |
| Email | Brevo | Contact uniquement |
| Tests | Vitest | `lib/rate-limit.test.ts`, `tests/usage-api-rpc.test.ts`, `tests/usage-anonyme-rpc.test.ts` |

> **Point d'attention transmis par `AGENTS.md`** (chargé automatiquement par `CLAUDE.md` via `@AGENTS.md`) : cette version de Next.js 16 comporte des différences par rapport aux conventions connues — la documentation à jour vit dans `node_modules/next/dist/docs/`, à consulter avant d'écrire du code dessus plutôt que de se fier à des connaissances génériques.

## 3. Organisation du dépôt (état actuel)

```
app/            pages (App Router) + 22 routes API (route.ts)
lib/            logique métier pure (18 fichiers) — cœur du produit
supabase/migrations/   21 migrations SQL séquentielles, documentées
scripts/        ingestion bibliothèque de référence (14 ouvrages) + banque de 205 questions
utils/supabase/ clients Supabase (browser/server)
content/blog/   articles Markdown (1 à ce jour)
docs/           documents de gouvernance technique (ce fichier + 3 photographies datées)
tests/          tests d'intégration RPC (usage_api, usage_anonyme)
```

Pages produit notables : `tableau-de-bord`, `seance`, `mon-livre`, `offrir`, `parcours`, `activer`, `fonctionnement`, `manifeste` (page marketing publique — *à ne pas confondre avec ce document*, voir encadré ci-dessous), `confidentialite`, `mentions-legales`, `contact`, `blog`.

> ⚠️ **Distinction importante** : `app/manifeste/page.tsx` est une page publique du produit (« Pourquoi Racontez-moi existe », argumentaire éditorial destiné aux visiteurs). `docs/MANIFESTE-ECOSYSTEME.md` (ce fichier) est un document technique interne de gouvernance du dépôt. Les deux portent un nom proche par coïncidence de vocabulaire, sans lien de contenu.

## 4. Modèle de données (état actuel)

21 migrations SQL séquentielles. Tables clés : `sessions`, `fragments` (+ `fragments_historique`), `tours_conversation`, `profil_narrateur`, `banque_questions`, `livres_reference` (RAG), `abonnements`, `codes_cadeau`, `commandes_livre`, `adresses_livraison`, `photos`, et depuis le 21/08/2026 `usage_api` (migration `0019`) et `usage_anonyme` (migration `0020`) pour le rate limiting (§6.2). Migration `0021` (26/08/2026) : correctif RLS sur `commandes_livre` (§7, A9).

RLS activé, policies `auth.uid() = user_id` — l'exhaustivité table par table de cette couverture reste un point à vérifier (§7).

## 5. Fonctionnement général du parcours narrateur (état actuel)

1. Inscription → onboarding (destinataire + prénom) → première question fixe.
2. Boucle séance : question → relance IA ×2 → fragment composé et sauvegardé (3 tours fixes par séance).
3. Sélection adaptative des questions suivantes dans une banque de 205 questions / 17 sections, avec RAG sur 14 ouvrages de référence pour ancrer les relances.
4. Progression affichée (pages estimées + % de couverture des sections).
5. Paiement (155€ ou code cadeau activé) débloque le parcours complet.
6. Aperçu (BAT) du manuscrit compilé disponible à tout moment.
7. Commande finale → compilation PDF intérieur + couverture → upload Storage → envoi à Lulu → livre imprimé expédié.

---

## 6. Décisions prises

Choix explicites retrouvés dans le code, les migrations ou les documents datés, avec leur raison quand elle est connue.

### 6.1 Produit / commerce

- **Prix fixe unique de 155€, tout compris** — décision datée du 28/07/2026 (mentionnée dans `docs/ETAT-DES-LIEUX-2026-08-20.md`), livre imprimé inclus. Pas de palier ni d'abonnement récurrent malgré la table `abonnements`.
- **Parcours cadeau séparé du parcours narrateur** — code d'activation à 8 caractères, alphabet volontairement sans caractères ambigus (`ABCDEFGHJKMNPQRSTUVWXYZ23456789`, ni `0/O` ni `1/I/L`) car destiné à être recopié à la main depuis un certificat imprimé. Espace de recherche : 32⁸ ≈ 1,1 × 10¹² combinaisons.
- **Activation cadeau exige un compte authentifié**, même si l'achat lui-même n'en nécessite pas — confirmé par relecture de code lors de l'audit du 21/08 (corrige une lecture initiale erronée du premier audit).
- **Aucune question n'est jamais forcée** — bouton « passer » systématique, et protocole de report explicite sur les questions à charge émotionnelle forte (« nucléaires »). Choix produit assumé, pas une omission technique.

### 6.2 Sécurité et coûts (issues du plan d'action du 21/08/2026)

- **Suppression pure et simple des routes de debug** `/api/chapitre-test` et `/api/test-typst` plutôt que de les gater par environnement ou de les protéger par authentification (option retenue : A1-a). **Fait** — commit `8adbb12` (21/08/2026). Le gabarit Typst réel continue de vivre dans `lib/typst.ts`, sans perte fonctionnelle.
- **Rate limiting via compteur Postgres atomique** plutôt que via un service externe (Upstash/Redis) ou une limitation en mémoire par instance — décision explicite de cohérence avec la stack déjà 100% Postgres, en réutilisant le pattern verrou applicatif + contrainte unique déjà en place pour `codes_cadeau`. **Fait** pour les routes authentifiées `/api/seance` et `/api/transcribe` (migration `0019_usage_api.sql`, commit `8adbb12`) et pour les routes anonymes `/api/contact` et `/api/cadeau/certificat/apercu` (migration `0020_usage_anonyme.sql`, commit `1eb7473`).
  - Quotas retenus, explicitement documentés comme *provisoires, à ajuster* : `seance` et `transcribe` à 30/jour/utilisateur (≈10 séances complètes/jour) ; `contact` à 5/jour/IP ; `certificat_apercu` à 20/jour/IP.
  - Clé de comptage : `user_id` pour les routes authentifiées, IP (`x-forwarded-for`, non falsifiable sur Vercel hors proxy de confiance) pour les routes anonymes.
  - **Fail-closed délibéré** sur `verifierQuota` : si la vérification RPC elle-même échoue, l'appel est bloqué plutôt que laissé passer — choix inverse du comportement fail-open déjà présent ailleurs dans le code (ex. `lib/retrieval.ts`), assumé ici car un appel facturé sans plafond vérifié est jugé plus coûteux qu'un faux refus.
- **Bascule Lulu sandbox/production pilotée par une seule variable d'environnement explicite** (`LULU_PRODUCTION=true`), avec des clés API distinctes selon l'environnement (`LULU_CLIENT_KEY`/`LULU_CLIENT_SECRET` en prod, `LULU_SANDBOX_CLIENT_KEY`/`LULU_SANDBOX_CLIENT_SECRET` en sandbox) — mécanisme vérifié directement dans `lib/lulu.ts`. Ce point figurait comme hypothèse non tranchée dans `docs/PLAN-ACTION-TECHNIQUE-2026-08-21.md` (A14) ; il est **confirmé** par ce document comme correctement implémenté (pas de valeur en dur, pas de risque de croisement accidentel des clés).

### 6.3 Ingénierie

- **Idempotence traitée comme un invariant de conception**, pas un correctif ponctuel — webhooks Stripe et activation de codes cadeau, verrous applicatifs + contraintes uniques SQL.
- **Usage de `after()`** (fire-and-forget serverless Vercel) pour les traitements différés non bloquants.
- **Compilation Typst partagée** entre l'aperçu (BAT) et la commande réelle — décision explicite pour garantir que ce que le narrateur prévisualise correspond exactement à ce qui sera imprimé.
- **Commentaires de code historicisés** — décisions datées, incidents passés et raisons de conception documentés directement dans le code (ex. le décommissionnement du domaine HuggingFace `api-inference.huggingface.co`, détecté et corrigé début juillet 2026, avec ajout de logging pour éviter une régression silencieuse).

---

## 7. Futur / chantiers identifiés mais non réalisés

Repris et mis à jour depuis `docs/PLAN-ACTION-TECHNIQUE-2026-08-21.md`. Priorité d'origine conservée entre parenthèses.

| # | Chantier | Statut au 21/08/2026 |
|---|---|---|
| A2 (🟡 moyenne) | Échapper le HTML injecté (`nom`, `message`) dans l'email de contact (`app/api/contact/route.ts`) | **Fait** — commit `681d4e8` (26/08/2026). Fonction `echapperHtml` ajoutée, appliquée à `nom`, `email` et `message` (le champ `email` a aussi été inclus par cohérence : le regex de validation n'exclut pas `<`/`>`/`"`) |
| A3 (🟠 haute) | Vérifier/mettre en place une protection plateforme Vercel (Deployment Protection, Firewall) | **Non fait, hors de portée outillée** — vérifié le 26/08/2026 : `racontez-moi.com` est en ligne et fonctionnel, mais le compte Vercel connecté aux outils Claude (`rigi34000-2908's projects`, plan Hobby) n'a aucun projet dessus. Le site est donc déployé sous un autre compte/login Vercel, ou un plan Pro serait de toute façon requis pour la Deployment Protection avancée sur ce plan Hobby. À vérifier manuellement par Régis sur le bon dashboard |
| A6 (🟡 moyenne) | Alerting sur dépassement de coût / usage anormal (budgets natifs Anthropic/Groq/Lulu ou dashboard agrégé) | **Non fait** |
| A7 (🟠 haute) | Comportement en cas de panne transitoire d'une API tierce pendant une séance (retry/backoff, sauvegarde de la transcription brute avant tout traitement IA) | **Fait**, avec une correction au passage — commit(s) du 26/08/2026. **Correction** : l'appel Anthropic (`client.messages.create`) retry déjà 2 fois par défaut (comportement natif du SDK `@anthropic-ai/sdk`, jamais surchargé dans le code) — la recherche `retry`/`backoff` de l'audit initial ne portait que sur le code applicatif, pas sur le comportement par défaut des SDK tiers. Deux vrais trous corrigés : (1) l'appel Groq (`app/api/transcribe/route.ts`) était un `fetch()` brut sans aucun retry — ajout de `transcrireAvecRetry` (2 tentatives, backoff, uniquement sur erreur réseau ou 5xx/429) ; (2) dans `app/api/seance/route.ts`, aux étapes `relance`/`relance2`/`fragment`, la réponse brute du narrateur n'était persistée dans `sessions.transcript` qu'*après* le retour réussi de l'appel Anthropic — désormais sauvegardée avant l'appel, avec une garde d'idempotence (comparaison au dernier élément du transcript) pour ne pas dupliquer l'entrée si le client retente la même requête après un échec. `lib/embeddings.ts` non touché : l'échec silencieux y est un choix de conception déjà documenté (dégrade juste le contexte mémoire du fragment, ne bloque rien) |
| A8 (🟠 haute) | CI minimale (lint + typecheck, puis tests) | **Fait** — commit `aa430c1` (26/08/2026), `.github/workflows/ci.yml`. Sur push/PR vers `main` : `npm ci`, `npm run lint`, `tsc --noEmit`, `npm test` (vitest — pas de secrets requis, tests basés sur PGlite). `next build` volontairement exclu du périmètre (nécessiterait des secrets Anthropic/Supabase/Stripe non gérés ici). A précédé de trois corrections de lint préexistantes sans lien avec A8 (commit `1b19d76`) pour que la CI parte au vert dès son activation |
| A9 (🟠 haute) | Audit RLS exhaustif, policy par policy, en particulier `photos`, `adresses_livraison`, `commandes_livre`, `fragments_historique` | **Fait** — audit du 26/08/2026, les 21 migrations relues intégralement. 7 tables/ressources correctement couvertes en `for all` scopé `auth.uid() = user_id` (`sessions`, `fragments`, `profil_narrateur`, `tours_conversation`, `adresses_livraison`, `fragments_historique`, `photos` + bucket Storage `photos`). 6 tables/fonctions volontairement en lecture seule côté client, écritures via service role ou RPC `security definer` — confirmé cohérent avec le code (`livres_reference`, `banque_questions`, `abonnements`, `codes_cadeau`, `usage_api`, `usage_anonyme`). **🔴 Trou réel trouvé et corrigé** : `commandes_livre` n'avait qu'une policy SELECT (migration `0009`), alors que `app/api/commande/livre/route.ts` y écrit (insert + 2 update) via le client authentifié standard, soumis au RLS — pas le service role. Sans policy insert/update, ces écritures échouaient forcément sous RLS en production, bloquant silencieusement toute commande réelle de livre imprimé (pas une fuite de données entre utilisateurs, mais une fonctionnalité payante probablement cassée). Corrigé par la migration `0021_commandes_livre_rls_ecriture.sql` (policy `for all`, même motif que les 7 tables déjà correctes) — **migration écrite mais pas encore appliquée à la base Supabase en ligne**, aucun accès outillé à la base de production depuis cette session ; à exécuter manuellement (dashboard SQL ou `supabase db push`) |
| A10 (🟡 moyenne) | Revue exhaustive des usages `service role` (contournement RLS volontaire) sur l'ensemble du dépôt | **Fait** — 26/08/2026, les 6 usages du dépôt passés en revue (grep exhaustif sur `SUPABASE_SERVICE_ROLE_KEY`). Les 3 déjà connus (webhook Stripe, suppression de compte, activation cadeau) restent corrects. Les 3 nouveaux également corrects : `cadeau/certificat/[code]/image` et `.../pdf` ne lisent `codes_cadeau` que par `code` exact (32⁸ combinaisons, le code fait office de clé d'accès — design assumé dès la migration 0015) et ne renvoient que des champs non sensibles ; `offrir/merci` vérifie d'abord via l'API Stripe elle-même (`payment_status`, `metadata.type`) que la session est payée avant de lire le code, sur un `session_id` Stripe opaque non devinable. Aucune correction nécessaire |
| A11 (🟠 haute) | Couverture de test étendue au-delà du rate limiting — `lib/redaction.ts`, `lib/codes-cadeau.ts`, idempotence webhook Stripe, `lib/typst.ts` | **Partiellement fait** — Vitest est désormais en place (`vitest.config.mts`, ajouté commit `8adbb12`) et couvre le rate limiting (`lib/rate-limit.test.ts`, `tests/usage-api-rpc.test.ts`, `tests/usage-anonyme-rpc.test.ts`) ; les chemins financiers/critiques listés restent sans test |
| A12 (🟡🟠 moyenne-haute) | Error tracking structuré (Sentry ou équivalent) | **Non fait** — gestion d'erreur toujours limitée à `console.error`/`console.log`/`console.warn` |
| A13 (⚪ basse) | Centraliser la logique de rate limiting dans un module partagé unique | **Partiellement fait** — `lib/rate-limit.ts` existe déjà et regroupe les deux mécanismes (authentifié et anonyme) mis en place à date ; à réévaluer si une nouvelle route à protéger apparaît |

Aucun élément de la roadmap produit au-delà de ces chantiers techniques n'a été identifié dans le dépôt à ce jour (pas de fichier de roadmap, pas de `TODO`/`ROADMAP.md`).

---

## 8. Points restant à vérifier

Ni confirmés ni infirmés par la seule lecture du dépôt — dépendent d'une configuration ou d'un comportement hors code versionné.

- **Protection plateforme Vercel réelle** — Deployment Protection, Firewall, Attack Challenge Mode : configuration dashboard, non versionnée, non visible en revue de code (lié à A3).
- **Rate limits par défaut de Supabase Auth et de Stripe** — présentés dans l'audit comme des protections indirectes plausibles, mais leur configuration exacte vit dans les dashboards respectifs, hors dépôt.
- **Niveau d'usage réel en production** — aucune donnée d'usage n'est disponible dans le dépôt pour dimensionner finement les quotas actuels (`seance`/`transcribe` à 30/jour, `contact` à 5/jour, `certificat_apercu` à 20/jour), explicitement qualifiés de provisoires dans le code.
- **Exhaustivité des policies RLS** table par table (lié à A9) et **scoping exhaustif des usages `service role`** sur l'ensemble du dépôt, pas seulement les 3 routes inspectées (lié à A10).
- **Occurrence réelle d'un abus ou d'un incident** sur les routes de debug supprimées ou sur les routes désormais limitées — rien dans le code n'indique un incident passé documenté sur ces points précis (contrairement au décommissionnement HuggingFace, lui documenté).
- **Comportement exact ressenti par le narrateur** en cas de panne transitoire d'une API tierce en cours de séance (perte du tour vocal ? message clair ? reprise possible ?) — l'absence de retry est confirmée, mais l'expérience utilisateur en cas d'échec n'a pas été auditée dans le détail (lié à A7).

---

## 9. Historique de ce document

| Date | Changement |
|---|---|
| 21/08/2026 | Création initiale, à partir de l'état du dépôt au commit `1eb7473` et de la synthèse des trois documents datés existants dans `docs/` |
| 26/08/2026 | A2 et A8 passés à **Fait** (commits `681d4e8`, `1b19d76`, `aa430c1`) — reprise du travail après l'interruption du 22/08 |
| 26/08/2026 | A3 vérifié et classé "hors de portée outillée" (site en ligne, mais mauvais compte Vercel connecté aux outils Claude). A7 passé à **Fait**, avec correction : le retry Anthropic était déjà natif au SDK, seuls Groq (transcription) et la persistance de la réponse brute avant appel IA (`app/api/seance`) présentaient un vrai trou |
| 26/08/2026 | A9 passé à **Fait** — audit RLS complet des 21 migrations. Trou réel trouvé sur `commandes_livre` (policy SELECT seule, alors que le code y écrit via le client RLS) : commande réelle de livre probablement cassée en production. Migration `0021` écrite pour corriger, mais pas encore appliquée à la base en ligne (hors de portée outillée depuis cette session) — **à exécuter par Régis**. A10 passé à **Fait** — 6 usages `service role` du dépôt revus, tous correctement scopés, aucune correction nécessaire |

*Prochaine mise à jour attendue : dès qu'un point de la section 7 change de statut, ou qu'une hypothèse de la section 8 est tranchée.*
