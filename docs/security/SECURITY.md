# Racontez-moi.com — Architecture de sécurité

> Document vivant. Décrit ce qui existe réellement dans le code au moment de
> la dernière relecture — jamais une protection présentée comme existante
> sans avoir été vérifiée dans le code. Voir `SECURITY-AUDIT.md` pour le
> registre des vulnérabilités et `SECURITY-CHANGELOG.md` pour l'historique.
>
> Dernière relecture complète : 12/09/2026 (audit initial + V2, cf.
> `SECURITY-CHANGELOG.md`). La V2 a couvert les 24 routes API du dépôt
> (l'audit initial n'en avait réellement lu que 23 — `app/api/manuscrit/couverture/route.ts`
> avait été omis ; sa lecture a révélé le contournement de paywall
> documenté ci-dessous, §3 et §12).

## 1. Architecture générale

Next.js 16 (App Router) + TypeScript strict, hébergé sur Vercel. Backend de
données : Supabase (Postgres + Auth + Storage). Paiement : Stripe (Checkout
+ webhooks). IA : Anthropic (relances/fragments), Groq Whisper
(transcription). Impression : Lulu Print API (sandbox par défaut).

## 2. Authentification

- Fournisseur : Supabase Auth (`@supabase/ssr`), session portée par cookies
  HTTP-only gérés par le SDK — jamais manipulés à la main.
- Deux clients Supabase distincts :
  - `utils/supabase/server.ts` — client serveur (Server Components, routes
    API), lit/écrit les cookies de la requête en cours. Soumis à RLS.
  - `utils/supabase/client.ts` — client navigateur, utilisé uniquement pour
    `auth.getSession()`/`signInAnonymously()` côté composants `"use client"`
    (ex. `app/activer/page.tsx`, `app/components/Seance.tsx`). Soumis à RLS.
- `middleware.ts` protège uniquement `/tableau-de-bord/*` et `/seance/*`
  (redirection vers `/sign-in` si aucune session). **Ce n'est pas le seul
  rempart** : les autres pages sensibles (`/mon-livre`) et **toutes** les
  routes API font leur propre `supabase.auth.getUser()` côté serveur —
  vérifié route par route, cf. `SECURITY-CHECKLIST.md`.
- Séance gratuite anonyme (`app/components/Seance.tsx`, prop `modeInvite`,
  montée sur `app/page.tsx`) : `supabase.auth.signInAnonymously()` crée un
  vrai utilisateur Supabase (avec `user_id` propre), qui suit ensuite le même
  circuit RLS que tout autre compte. Se convertit en compte réel si
  l'utilisateur paie plus tard (même `user_id` conservé). Voir
  `SECURITY-AUDIT.md` (A-2026-09-12-02) pour le risque associé.
- Callback OAuth (`app/auth/callback/route.ts`) : le paramètre `next` est
  concaténé à `origin` avant redirection (`${origin}${next}`) — pas
  d'open-redirect possible, vérifié dans le code.

## 3. Autorisation — principe appliqué partout

Chaque route qui lit ou écrit une ressource liée à un utilisateur combine
**systématiquement** deux couches, jamais une seule :

1. **RLS Postgres** (`auth.uid() = user_id`) sur la table concernée.
2. **Filtre applicatif explicite** `.eq("user_id", user.id)` dans la requête
   Supabase elle-même, côté serveur.

Cette redondance délibérée (défense en profondeur) a été vérifiée sur les 24
routes API du dépôt (`app/api/**/route.ts`) — aucune ne fait confiance à un
identifiant de ressource fourni par le client sans revérifier la propriété
via la session serveur. Aucun IDOR trouvé dans le périmètre analysé (cf.
`SECURITY-AUDIT.md`, verdict du 12/09/2026).

Quatre portails additionnels vérifient en plus le **statut de paiement**
(`abonnements.status === "active"`), pas seulement l'authentification :
`/mon-livre` (page), `/seance` (page), `/api/manuscrit/apercu`,
`/api/commande/livre`. Ce contrôle a été ajouté le 11/09/2026 (cf.
`SECURITY-CHANGELOG.md`) après qu'un audit précédent a trouvé que ces
surfaces ne vérifiaient que l'authentification.

**`/api/manuscrit/epub` fait aussi partie de ce groupe — mais
`/api/manuscrit/couverture`, elle, ne vérifie QUE l'authentification, pas
le paiement.** C'est un contournement de paywall confirmé (compte gratuit
ou d'essai anonyme = PDF de couverture gratuit), trouvé le 12/09/2026 lors
d'une vérification de cohérence documentaire, documenté en détail dans
`SECURITY-AUDIT.md` (A-2026-09-12-04) — **non corrigé au moment de la
rédaction de ce document**, cette section décrit l'état réel du code, pas
l'état souhaité.

`/api/seance` et `/api/transcribe` n'ont **volontairement pas** de garde de
paiement — c'est le point d'entrée de la séance gratuite anonyme
(modeInvite ci-dessus), protégé uniquement par un quota quotidien (section
5). Ce n'est pas un oubli : la page `/seance` (accès complet narrateur),
elle, est bien gardée par le statut d'abonnement.

## 4. Supabase / Row Level Security

Toutes les tables contenant des données utilisateur ont RLS activée
(`alter table ... enable row level security`), avec policy
`auth.uid() = user_id` (lecture et/ou écriture selon le besoin réel de la
table). Détail table par table : voir `SECURITY-AUDIT.md`.

Deux tables sont **volontairement sans policy RLS** : `usage_api` et
`usage_anonyme` — le seul point d'accès est une fonction
`SECURITY DEFINER` (`incrementer_et_verifier_usage[_anonyme]`) qui revérifie
`auth.uid()` (côté authentifié) avant d'écrire, jamais accessible en
lecture/écriture directe par le client (`revoke all ... from public`).

Deux tables sont partagées et en lecture publique volontaire :
`livres_reference`, `banque_questions` — contenu éditorial, pas de donnée
utilisateur, écriture réservée au service role (scripts d'ingestion).

## 5. Rate limiting / quotas

`lib/rate-limit.ts` — deux mécanismes, tous deux "fail-closed" (une erreur
de vérification bloque l'appel facturé plutôt que de le laisser passer) :

- **Authentifié**, clé = `user_id` : `/api/seance` (30/jour) et
  `/api/transcribe` (30/jour), via la RPC `incrementer_et_verifier_usage`.
- **Anonyme**, clé = IP (`x-forwarded-for`, non falsifiable sur Vercel hors
  Enterprise) : `/api/contact` (5/jour) et
  `/api/cadeau/certificat/apercu` (20/jour), via
  `incrementer_et_verifier_usage_anonyme`.

`/api/cadeau/certificat/[code]/image` et `/pdf` (même coût de compilation
que `certificat_apercu`) n'ont **pas** ce throttle — cf.
`SECURITY-AUDIT.md` A-2026-09-12-03.

## 6. Supabase Storage

Deux buckets privés identifiés dans le code :

- **`photos`** — policy trackée en migration
  (`supabase/migrations/0012_photos.sql`), isolation par dossier
  `(storage.foldername(name))[1] = auth.uid()::text`. Vérifiée correcte.
  URLs signées à la volée (1h), jamais d'URL publique directe.
- **`manuscrits`** — utilisé par `app/api/commande/livre/route.ts` (upload
  + URL signée pour transmission à Lulu) avec le client authentifié
  standard (pas le service role), donc une policy d'écriture doit exister
  pour que cette route fonctionne en production. **Sa policy n'est PAS
  versionnée** (créée séparément via psql d'après le commentaire de
  `0012_photos.sql`) — non vérifiable depuis le dépôt seul. Voir
  `SECURITY-AUDIT.md` A-2026-09-12-01.

**Cloisonnement (V2)** : une policy Storage incorrecte a une portée plus
large qu'une policy RLS de table — elle s'applique à tout le bucket, pas à
une ligne. Une erreur d'isolation sur `manuscrits` exposerait
potentiellement les manuscrits de *tous* les utilisateurs en une fois, pas
un seul — ce qui fait de A-2026-09-12-01 un point de cloisonnement à
surveiller en priorité, pas seulement une case de documentation manquante.

## 7. Privilèges élevés / service role

`SUPABASE_SERVICE_ROLE_KEY` (contourne RLS) est utilisée dans 8 fichiers,
tous côté serveur, jamais exposée au navigateur :

| Fichier | Pourquoi le service role est nécessaire |
|---|---|
| `app/api/stripe/webhook/route.ts` | Pas de session utilisateur (appel Stripe→serveur) |
| `app/api/cadeau/activer/route.ts` | Écrit `codes_cadeau`/`abonnements`, tables sans policy d'update pour le client |
| `app/api/cadeau/certificat/[code]/image/route.ts` | Route publique, sans session |
| `app/api/cadeau/certificat/[code]/pdf/route.ts` | Route publique, sans session |
| `app/api/compte/supprimer/route.ts` | `auth.admin.deleteUser()`, API admin Supabase |
| `app/offrir/merci/page.tsx` | Page publique (post-paiement), sans session |
| `scripts/seed-banque-questions.ts` | Script d'ingestion hors requête utilisateur |
| `scripts/ingest-livres-reference.ts` | Script d'ingestion hors requête utilisateur |

Aucune fonction `SECURITY DEFINER` autre que les deux RPC de quota
(section 5) n'a été trouvée dans les migrations.

**Moindre privilège (V2)** : parmi ces 8 usages, 3 (`certificat/[code]/image`,
`certificat/[code]/pdf`, `offrir/merci`) ne font jamais qu'une lecture
d'une seule ligne `codes_cadeau` par code, mais détiennent pour cela un
accès total lecture/écriture à toutes les tables. Le code de ces 3
fichiers est court et audité — ce n'est pas une faille active — mais une
RPC `SECURITY DEFINER` étroite (lecture seule, 3 colonnes) serait plus
proche du minimum nécessaire, sur le modèle des RPC de quota. Voir
`SECURITY-AUDIT.md` A-2026-09-12-08.

## 8. Paiement (Stripe)

- Signature webhook vérifiée (`stripe.webhooks.constructEvent`) avant tout
  traitement — un événement non signé correctement est rejeté (400).
- Écritures `abonnements`/`codes_cadeau` déclenchées uniquement par les
  événements Stripe (`checkout.session.completed`,
  `.async_payment_succeeded`, `charge.refunded`), jamais par une action
  client directe.
- Garantie satisfait-remboursé (décision du 11/09/2026) : un remboursement
  intégral (`charge.refunded === true`) repasse `abonnements.status` à
  `"rembourse"`, ce qui coupe l'accès partout où le statut `"active"` est
  vérifié (section 3) — réutilise les contrôles existants, aucune logique
  de révocation séparée à maintenir.

## 9. Contenu marqué tant que la commande n'est pas passée

Décision du 11/09/2026 : tant qu'aucune ligne `commandes_livre` en statut
`en_cours`/`confirmee` n'existe pour l'utilisateur, l'aperçu PDF
(`/api/manuscrit/apercu`) porte un tampon visuel "APERÇU" et l'EPUB
(`/api/manuscrit/epub`) une mention textuelle en début de chaque chapitre.
Le fichier réel transmis à Lulu (`app/api/commande/livre/route.ts`) appelle
`compilerInterieur` **sans** ce drapeau — jamais de marquage sur ce qui part
à l'impression (vérifié dans le code).

## 10. Données sensibles

- Pas de secret (clé API, token) codé en dur ou loggué directement trouvé
  dans les appels `console.error`/`.log` passés en revue dans `app/api` et
  `lib`. **Nuance ajoutée en V2** : plusieurs de ces appels loguent le
  texte brut d'une réponse d'erreur tierce (`await res.text()` pour Lulu,
  Hugging Face) — le contenu exact de ces réponses (échoient-elles des
  données soumises par l'utilisateur, ex. adresse postale ou texte
  narratif ?) n'a pas été vérifié. Ni confirmé ni infirmé — voir
  `SECURITY-AUDIT.md`, axe 9 (V2).
- Réponses d'erreur renvoyées **au client** (pas seulement aux logs) :
  `/api/manuscrit/apercu`, `/epub`, `/couverture` renvoient un champ
  `details` contenant le message d'erreur brut dans le corps HTTP 500 —
  divulgation d'information interne de faible gravité, cf.
  `SECURITY-AUDIT.md` A-2026-09-12-06 (V2).
- Seule valeur `NEXT_PUBLIC_*` en dehors de l'URL/clé publique Supabase :
  `NEXT_PUBLIC_SENTRY_DSN` — un DSN Sentry est conçu pour être public par
  Sentry lui-même, pas un secret.
- Export de compte (`/api/compte/export`) et suppression de compte
  (`/api/compte/supprimer`) tous deux gardés par `auth.getUser()`, opèrent
  uniquement sur les données du compte courant.

## 11bis. Suppression de compte et conservation des données (V2)

`POST /api/compte/supprimer` annule l'abonnement Stripe puis appelle
`auth.admin.deleteUser(user.id)`, ce qui déclenche la cascade `ON DELETE
CASCADE` sur toutes les tables Postgres liées (`sessions`, `fragments`,
`tours_conversation`, `profil_narrateur`, `abonnements`,
`adresses_livraison`, `commandes_livre`, `photos`, `fragments_historique`).

**Mais aucun fichier Storage n'est supprimé** — ni les photos (`bucket
photos`) ni les PDF de manuscrit/couverture (`bucket manuscrits`)
associés au compte. Contrairement à `/api/photos/[id]` (DELETE), qui
nettoie correctement le Storage avant de supprimer la ligne DB, le flux
de suppression de compte ne le fait pas du tout. **Les fichiers les plus
sensibles du système (photos personnelles, texte intégral d'une vie
racontée) survivent donc à une suppression de compte que l'utilisateur
croit définitive.** Confirmé par lecture du code, gravité ÉLEVÉ — cf.
`SECURITY-AUDIT.md` A-2026-09-12-05 pour le détail complet et la
correction recommandée.

Autres éléments de conservation recensés : les transcriptions
(`sessions.transcript`) et l'historique de fragments
(`fragments_historique`) vivent indéfiniment tant que le compte existe —
cohérent avec la proposition de valeur du produit, supprimés en cascade
avec le compte (partie DB uniquement, cf. ci-dessus pour Storage). Les
compteurs de quota (`usage_api`/`usage_anonyme`) croissent sans purge
visible dans les migrations — faible sensibilité, mentionné pour
complétude. Les politiques de rétention des sauvegardes automatiques
Supabase ne sont pas vérifiables depuis le dépôt.

## 11ter. Séparation des environnements (Phase 7, 12/09/2026)

**État avant cette phase** : un seul environnement Supabase existait
réellement — la production (`fasvqpokgdvzahqmjlxz`). `.env.local` et
`.env.localum` contenaient tous deux des placeholders Supabase littéraux
(`https://placeholder.supabase.co`), sans pointer vers aucun projet
utilisable. Aucun `.env.example` n'était versionné. Aucune protection ne
distinguait un environnement de test d'un environnement de production
dans le code.

**Architecture cible** (conception, adaptée à la taille du produit — pas
de sur-ingénierie à 3 projets synchronisés en continu) :

- **PROD** : le projet Supabase existant, utilisé uniquement par le site
  déployé (variables d'environnement Vercel, jamais touchées par cette
  phase).
- **TEST** : un second projet Supabase dédié, à créer une fois
  manuellement (cf. `SECURITY-AUDIT.md`, Phase 7, pour la procédure
  détaillée), contenant une copie du schéma (migrations rejouées) et des
  buckets Storage vides — sert à la fois au développement local
  quotidien et aux futurs tests dynamiques de sécurité.
- Pas de 3ᵉ projet séparé "DEV" : à cette échelle, LOCAL pointe
  directement vers TEST.

**Garde-fou anti-production** : `scripts/garde-environnement-test.ts`
(`assurerEnvironnementTest()`) — à appeler en tout premier dans tout
futur script de test destructif (Phase 8). Refuse si l'hôte Supabase
chargé correspond à la production, et refuse également si la variable
`SUPABASE_ENV` ne vaut pas exactement `"test"` — deux vérifications
indépendantes, toutes deux obligatoires. Ne protège que les scripts qui
l'appellent explicitement, pas une commande manuelle ponctuelle
(`psql`, dashboard) — reste une question de discipline humaine pour ce
second cas, aucun mécanisme automatique ne peut la remplacer entièrement.

**`.env.example`** (nouveau, versionné) documente désormais tous les noms
de variables attendues par le code (recherche exhaustive de
`process.env.*`), sans aucune valeur réelle.

**`.mcp.json` (Phase 8, 20/09/2026)** : le serveur MCP Supabase déclaré
dans ce fichier — utilisé par Claude Code, pas par l'application — pointe
volontairement vers le projet **TEST** (`zxlagkkujufmhwprwued`), et non
vers la production, bien que ce fichier soit committé et donc hérité par
défaut par quiconque clone le dépôt. Objectif : qu'une session Claude Code
ouverte sur ce repo ne puisse pas exécuter d'opération accidentelle
(lecture ou écriture) contre la base de production via les outils MCP,
sans action explicite pour reconfigurer ce fichier vers un autre projet.
Cohérent avec le principe déjà énoncé plus haut (« LOCAL pointe directement
vers TEST »), étendu ici à l'outillage MCP en plus de `.env.local`.

## 12. Ce que ce document ne garantit pas

Cette description reflète une analyse **statique** du code présent dans le
dépôt. Elle ne remplace pas un test dynamique réel contre l'environnement de
production, et ne couvre pas la configuration qui vit uniquement côté
plateforme (policy Storage `manuscrits` créée hors migration, limites de
taux natives de Supabase Auth). Voir `SECURITY-AUDIT.md`, section "Ce qui
n'a pas pu être vérifié" de chaque audit.
