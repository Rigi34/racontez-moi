# Racontez-moi.com — Registre des vulnérabilités

> Registre vivant. Chaque audit ajoute ou met à jour des entrées — l'historique
> n'est jamais effacé. Statuts : À VÉRIFIER / CONFIRMÉ / CORRIGÉ / NON
> REPRODUCTIBLE / ACCEPTÉ (risque assumé). Gravités : CRITIQUE / ÉLEVÉ /
> MOYEN / FAIBLE / INFORMATION.

---

## Audit du 12/09/2026 — Audit initial

Méthode : analyse statique uniquement (lecture du code et des migrations
SQL présentes dans le dépôt). Aucun test dynamique effectué contre
l'environnement de production. Périmètre : les 24 routes API
(`app/api/**/route.ts`), les 22 migrations (`supabase/migrations/*.sql`),
`middleware.ts`, les clients Supabase (`utils/supabase/*.ts`), les
bibliothèques touchant aux données utilisateur (`lib/stripe.ts`,
`lib/codes-cadeau.ts`, `lib/rate-limit.ts`, `lib/photos.ts`,
`lib/profil-narrateur.ts`, `lib/lulu.ts`), les pages serveur sensibles
(`mon-livre`, `seance`, `tableau-de-bord`, `activer`, `offrir/merci`,
`auth/callback`) et le mécanisme de séance gratuite anonyme.

### A-2026-09-12-01 — Policy Storage du bucket `manuscrits` non versionnée

```
ID : A-2026-09-12-01
Date : 2026-09-12
Catégorie : Storage / documentation de sécurité
Gravité : MOYEN
Composant : Supabase Storage, bucket "manuscrits"
Fichier : app/api/commande/livre/route.ts (lignes 76-93) ; référence dans
          supabase/migrations/0012_photos.sql (commentaire ligne 24)
Fonction / route : POST /api/commande/livre
Statut : À VÉRIFIER
Description : Le bucket "manuscrits" est utilisé pour uploader
  interieur.pdf/couverture.pdf via le client Supabase authentifié standard
  (soumis à RLS, pas le service role), avec des chemins
  "${user.id}/${commande.id}/...". Pour que cet upload fonctionne en
  production (et il fonctionne, d'après le contexte produit), une policy
  Storage d'écriture doit exister sur ce bucket. Le commentaire de la
  migration 0012 indique que ce bucket, comme "photos", a été créé "via
  psql direct sur storage.buckets" — mais contrairement à "photos", dont
  la policy est versionnée dans la même migration, aucune migration du
  dépôt ne contient la policy de "manuscrits".
Impact : Si la policy réelle (non versionnée) est plus permissive que
  prévu — par exemple si elle ne vérifie pas correctement le premier
  segment du chemin contre auth.uid() — un utilisateur authentifié
  pourrait potentiellement lire ou écraser le manuscrit d'un autre
  utilisateur. Aucune preuve que ce soit le cas ; c'est l'absence de
  version-control qui empêche de le confirmer ou de l'infirmer depuis le
  dépôt.
Scénario : Non testé dynamiquement (aurait nécessité une requête Storage
  réelle avec un jeton d'un autre compte — hors périmètre lecture seule
  de cet audit).
Preuve dans le code : app/api/commande/livre/route.ts:76-93 (upload/
  createSignedUrl sur bucket "manuscrits" via client RLS-standard) ;
  supabase/migrations/0012_photos.sql:24 (commentaire mentionnant la
  création hors migration).
Correction recommandée : Récupérer la policy réelle du bucket
  "manuscrits" depuis le dashboard Supabase (ou `pg_policies` /
  `storage.objects`) et la verser dans une migration SQL versionnée,
  sur le même modèle que celle de "photos" (0012_photos.sql) — pour
  qu'elle soit auditable au même titre que le reste du schéma.
Dernière vérification : 2026-09-12
```

### A-2026-09-12-02 — Quota quotidien contournable via comptes anonymes multiples

```
ID : A-2026-09-12-02
Date : 2026-09-12
Catégorie : Abus de ressources / contrôle de coût
Gravité : MOYEN
Composant : Séance gratuite anonyme + quota quotidien
Fichier : app/components/Seance.tsx (lignes 395-413, signInAnonymously) ;
          lib/rate-limit.ts (verifierQuota, clé = user_id) ;
          supabase/migrations/0019_usage_api.sql
Fonction / route : POST /api/seance (step relance/relance2/fragment),
          POST /api/transcribe
Statut : À VÉRIFIER
Description : Le mode "séance gratuite" (app/page.tsx, <Seance
  modeInvite />) appelle supabase.auth.signInAnonymously() côté client,
  sans CAPTCHA ni throttle applicatif visible dans le dépôt. Chaque appel
  crée un nouvel utilisateur Supabase avec un user_id propre. Or le quota
  quotidien sur /api/seance et /api/transcribe (30 appels/jour, A4,
  21/08/2026) est indexé par user_id, pas par IP
  (supabase/migrations/0019_usage_api.sql). Répéter la création de
  sessions anonymes permet donc en théorie d'obtenir un quota frais à
  chaque fois.
Impact : Coût financier (appels Anthropic et Groq Whisper facturés) sans
  plafond réel pour un attaquant motivé, malgré l'intention documentée du
  quota (migration 0019 : "risque financier confirmé... aucun plafond
  jusqu'ici").
Scénario : Un script appelle signInAnonymously() en boucle, puis POST
  /api/seance avec step=start/relance/relance2/fragment pour chaque
  identité obtenue, dépassant très largement 30 séances/jour au total.
  Non testé dynamiquement (aurait généré un coût réel en API IA — hors
  périmètre de cet audit lecture seule).
Preuve dans le code : app/components/Seance.tsx:402-412 ;
  lib/rate-limit.ts:25-41 (clé = p_user_id, aucune dimension IP) ;
  supabase/migrations/0019_usage_api.sql (primary key (user_id, route,
  jour)).
Correction recommandée : Évaluer si une limite de taux Supabase Auth
  existe déjà côté plateforme sur signInAnonymously (à vérifier au
  dashboard, hors dépôt) ; si insuffisante, ajouter une dimension IP au
  quota de la séance gratuite (même mécanisme que
  incrementer_et_verifier_usage_anonyme, migration 0020, déjà utilisé
  pour /api/contact et certificat_apercu).
Dernière vérification : 2026-09-12
```

### A-2026-09-12-03 — Absence de throttle sur les routes de certificat cadeau par code

```
ID : A-2026-09-12-03
Date : 2026-09-12
Catégorie : Abus de ressources / rate limiting incohérent
Gravité : FAIBLE
Composant : Certificat cadeau (image/PDF) par code
Fichier : app/api/cadeau/certificat/[code]/image/route.ts ;
          app/api/cadeau/certificat/[code]/pdf/route.ts
Fonction / route : GET /api/cadeau/certificat/[code]/image,
          GET /api/cadeau/certificat/[code]/pdf
Statut : À VÉRIFIER
Description : Ces deux routes publiques (non authentifiées, le code sert
  de clé d'accès — décision assumée, migration 0015) compilent une image
  PNG (sharp) ou un PDF (Typst) à partir de codes_cadeau, sans aucun
  throttle. La route sœur /api/cadeau/certificat/apercu, qui fait le même
  travail de compilation, est elle explicitement protégée par
  verifierQuotaAnonyme (migration 0020, "compilation Typst + sharp pour
  certificat_apercu... route anonyme la plus coûteuse en CPU"). L'espace
  de codes (alphabet 32 caractères, 8 caractères → 32^8 ≈ 1,1×10^12
  combinaisons via lib/codes-cadeau.ts) rend l'énumération pour deviner
  un code valide impraticable — un code invalide renvoie 404 avant toute
  compilation, donc le coût réel d'une énumération à l'aveugle reste
  faible (recherches DB bon marché, pas de calcul CPU). Le risque réel
  concerne la ré-exécution non plafonnée de la compilation sur un code
  déjà connu (partagé, deviné une fois, ou appartenant à l'attaquant
  lui-même).
Impact : Coût CPU/serverless répétable sans limite sur un code connu ;
  incohérence de posture de sécurité avec la route sœur déjà protégée.
Scénario : Un script appelle en boucle /api/cadeau/certificat/<code
  connu>/pdf, forçant une recompilation Typst à chaque appel, sans quota.
  Non testé dynamiquement.
Preuve dans le code : app/api/cadeau/certificat/[code]/image/route.ts
  (aucun appel à verifierQuotaAnonyme) ;
  app/api/cadeau/certificat/[code]/pdf/route.ts (idem) ; comparer à
  app/api/cadeau/certificat/apercu/route.ts:20-32 (protégé).
Correction recommandée : Étendre verifierQuotaAnonyme (lib/rate-limit.ts)
  à ces deux routes, sur le même modèle que certificat_apercu.
Dernière vérification : 2026-09-12
```

**Correction du 12/09/2026 (V2)** : Statut relevé de À VÉRIFIER à
**CONFIRMÉ**. Relecture de cette entrée lors de la vérification de
cohérence documentaire du même jour : contrairement à A-2026-09-12-01 et
A-2026-09-12-02, qui dépendent d'éléments hors dépôt (policy Storage réelle,
configuration Supabase Auth), l'absence de `verifierQuotaAnonyme` sur ces
deux routes est une lecture directe et complète du code, sans aucune
dépendance externe non vérifiable. Rien dans le constat lui-même ne change ;
seul le statut était mal calibré.

### Points vérifiés et confirmés sains (pour mémoire, pas des vulnérabilités)

- **IDOR généralisé** : les 24 routes API combinent RLS et filtre
  `.eq("user_id", user.id)` — aucun accès croisé trouvé.
- **Historique A9 (26/08/2026, `commandes_livre` sans policy
  INSERT/UPDATE)** : corrigé par la migration 0021, toujours en place —
  reconfirmé le 12/09/2026.
- **Historique 11/09/2026 (`/mon-livre`, `/api/manuscrit/apercu`,
  `/api/manuscrit/epub` sans garde de paiement)** : corrigé, toujours en
  place — reconfirmé le 12/09/2026.
- **Signature webhook Stripe** : vérifiée avant tout traitement
  (`stripe.webhooks.constructEvent`), rejet 400 si invalide.
- **Service role** : jamais exposé au navigateur, usage limité à 8
  fichiers server-only, tous justifiés (cf. `SECURITY.md` section 7).
- **Open redirect via `auth/callback?next=`** : non exploitable, `next`
  est concaténé à `origin` avant redirection.
- **Logs** : aucun secret ni donnée sensible trouvé dans les
  `console.log`/`console.error` de `app/api` et `lib`.
- **Bucket `photos`** : policy versionnée et correcte (isolation par
  dossier `auth.uid()`).

---

## VERDICT — RÉALISME DU RISQUE IDOR (audit du 12/09/2026)

```
IDOR trouvée : NON

RLS correctement configurées :
OUI (réserve : bucket Storage "manuscrits" non tracké en migration)

Risque qu'un utilisateur accède aux données d'un autre :
NON, sauf À CONFIRMER pour le bucket "manuscrits" spécifiquement

Storage correctement isolé :
PARTIELLEMENT / À CONFIRMER — "photos" vérifié isolé et correct ;
"manuscrits" à confirmer (policy non versionnée)

Contrôles d'accès serveur :
OUI — auth.getUser() + filtre user_id systématique sur les 24 routes,
garde de paiement server-side sur les 5 surfaces qui l'exigent

Nombre de problèmes CRITIQUES :
0

Nombre de problèmes ÉLEVÉS :
0

Nombre de problèmes MOYENS :
2

Nombre de problèmes FAIBLES :
1

Niveau de confiance de l'audit :
MOYEN
```

Les trois à cinq points les plus importants :

1. Aucun IDOR ni Broken Access Control trouvé dans le code applicatif — le
   pattern RLS + filtre applicatif explicite est appliqué avec constance
   sur toutes les routes qui manipulent une ressource utilisateur.
2. Les deux incidents de sécurité déjà documentés avant cet audit
   (`commandes_livre` sans policy d'écriture ; manuscrit accessible sans
   paiement) restent corrigés — pas de régression.
3. Le point le plus incertain n'est pas dans le code versionné mais en
   dehors : la policy Storage du bucket "manuscrits" a été créée hors
   migration et ne peut pas être auditée depuis le dépôt seul.
4. Un risque de coût (pas d'accès aux données) existe sur le mécanisme de
   séance gratuite anonyme, dont le quota peut être réinitialisé en créant
   de nouvelles identités anonymes.
5. Cet audit est une analyse statique : aucun test dynamique réel n'a été
   exécuté contre l'environnement de production, conformément à la
   consigne de rester en lecture seule.

## Ce qui n'a PAS pu être vérifié

- Le contenu exact de la policy Storage du bucket `manuscrits` (créée hors
  migration SQL versionnée).
- La présence ou l'absence d'une limite de taux native de Supabase Auth
  sur `signInAnonymously` (configuration de plateforme, hors dépôt).
- Le comportement réel de RLS en production sous requêtes concurrentes ou
  adversariales (aurait nécessité un test dynamique, hors périmètre de
  cette première phase en lecture seule).
- Tout élément de configuration Vercel/Supabase (variables d'environnement,
  policies dashboard) qui ne serait pas reflété dans le dépôt.

---

## Audit du 12/09/2026 — V2 (cloisonnement, moindre privilège, extraction,
## traçabilité, exposition indirecte, conservation, intégrations externes)

Déclenché après qu'une vérification de cohérence documentaire de l'audit
initial a révélé qu'une 24ᵉ route API (`app/api/manuscrit/couverture/route.ts`)
n'avait jamais été lue — sa lecture a immédiatement révélé un contournement
de paywall réel (cf. A-2026-09-12-04 ci-dessous). Cette V2 conserve
intégralement les résultats de l'audit initial (rien n'a été supprimé
ci-dessus) et élargit l'analyse selon 9 axes supplémentaires, toujours en
lecture seule.

Méthode : toujours l'analyse statique uniquement. Aucun test dynamique
exécuté. Fichiers additionnels lus pour cette V2 :
`app/api/manuscrit/couverture/route.ts` (le fichier manquant),
`lib/embeddings.ts` (contenu complet), `app/mon-livre/BoutonCommande.tsx`,
et une recherche systématique de `storage.from(...)` dans tout le dépôt.

### Axe 1 — Contrôle d'accès / IDOR, chaînes de ressources

Vérification élargie : au-delà de « A peut-il lire B directement », chaque
route a été revérifiée pour les manipulations d'ID/UUID/slug/chemin
Storage/paramètre JSON listées dans la mission. Chaîne complète
compte → séance → enregistrement → transcription → mémoire → manuscrit →
livre → fichiers/export tracée dans le code :

- **Compte** : `auth.users` (Supabase Auth), jamais référencé par un ID
  autre que `auth.uid()` de la session.
- **Séance** : table `sessions`, toujours filtrée `.eq("user_id", user.id)`
  en plus de RLS (`app/api/seance/route.ts`, toutes les étapes).
- **Enregistrement audio** : **n'est jamais persisté**. Vérifié par une
  recherche exhaustive de `storage.from(...)` dans tout le dépôt (`app`,
  `lib`) : seuls les buckets `photos` et `manuscrits` sont utilisés. L'audio
  transite en mémoire vers Groq (`/api/transcribe`) et n'est jamais écrit
  sur disque ni en Storage — il n'existe donc aucune ressource
  « enregistrement » à protéger après coup.
- **Transcription** : vit uniquement dans `sessions.transcript` (jsonb),
  jamais exposée par un endpoint séparé prenant un ID arbitraire — toujours
  lue via la même requête filtrée par `user_id` que la séance parente.
- **Mémoire / fragments** : table `fragments`, RLS + filtre applicatif sur
  toutes les routes (`/api/fragments/[id]`, `/regenerer`, `/historique`).
  Le chemin Storage des photos associées est entièrement généré côté
  serveur (`${user.id}/${fragmentId}/${crypto.randomUUID()}.ext`,
  `lib/photos.ts`) — jamais construit à partir d'une valeur fournie par le
  client au-delà d'un `fragmentId` déjà revérifié comme appartenant à
  l'appelant avant l'upload.
- **Manuscrit** : `compilerInterieur`/`compilerCouverture` sont toujours
  alimentés par `chargerFragmentsAvecPhotos(supabase, user.id)` — le
  `user.id` provient systématiquement de la session serveur, jamais d'un
  paramètre client, dans les 4 routes qui les appellent
  (`manuscrit/apercu`, `manuscrit/epub`, `manuscrit/couverture`,
  `commande/livre`).
- **Livre / commande** : `commandes_livre`, RLS + filtre applicatif ; le
  dossier Storage `manuscrits/${user.id}/${commande.id}` est généré côté
  serveur, jamais reçu du client.
- **Fichiers / export** : `/api/compte/export`, `/api/photos`,
  `/api/photos/[id]` — tous filtrés par `user.id`, aucun paramètre client
  ne permet de cibler un autre compte.
- **Cas particulier `codes_cadeau`** : le `code` est volontairement une clé
  d'accès bearer-token (décision produit assumée, migration 0015) plutôt
  qu'un ID protégé par ownership — déjà documenté, cohérent avec le reste.

**Résultat : aucun IDOR trouvé, sur aucun des types d'identifiants
demandés** (ID, UUID, slug, chemin Storage, paramètre JSON, référence de
document/session/fichier/commande/manuscrit). Conclusion inchangée par
rapport à l'audit initial, désormais vérifiée sur un périmètre complet
(24/24 routes, y compris la route manquante de l'audit initial).

### Axe 2 — Cloisonnement (blast radius)

Question posée pour chaque maillon : si cette seule ressource/cet
endpoint était compromis, à quoi d'autre l'attaquant accéderait-il ?

- **Une session utilisateur compromise** (vol de cookie) : accès limité
  aux données de ce seul compte — RLS + filtre applicatif s'appliquent
  identiquement, aucun chemin trouvé pour élargir la portée depuis une
  session légitime d'un seul compte.
- **La clé `SUPABASE_SERVICE_ROLE_KEY` compromise** : c'est, par
  construction de la plateforme Supabase, le point de compromission total
  du système — elle contourne RLS sur toutes les tables. Utilisée dans 8
  fichiers server-only (cf. `SECURITY.md` §7), jamais transmise au client.
  Son seul vecteur de fuite réaliste serait une erreur de configuration
  (variable d'environnement mal exposée) ou un accès non autorisé au
  dashboard Vercel/Supabase — hors du périmètre de ce qui est vérifiable
  dans le code. **C'est le point de cloisonnement le plus important du
  système, et il repose sur une hypothèse (le secret ne fuit jamais) non
  vérifiable statiquement.**
- **Le bucket Storage `manuscrits` compromis (policy mal configurée)** :
  contrairement à une ligne de table (portée = 1 utilisateur), une policy
  Storage incorrecte a une portée plate sur **tout le bucket** — une
  erreur d'isolation y exposerait potentiellement les manuscrits de
  *tous* les utilisateurs en une fois, pas un seul. Ceci amplifie
  l'importance de A-2026-09-12-01 (policy non versionnée) : ce n'est pas
  seulement un problème de documentation, c'est un point de
  cloisonnement à portée large si jamais mal configuré.
- **`profil_narrateur` → autres données** : contient un profil
  comportemental (périodes couvertes, sujets esquivés) mais aucune
  clé étrangère ni jointure ne le relie à d'autres utilisateurs — cloisonné
  correctement, portée = 1 utilisateur.
- **Une route API compromise par un bug de code** : parce que chaque route
  revérifie indépendamment authentification + propriété + (le cas échéant)
  paiement, sans couche d'accès aux données partagée et non gardée, un bug
  dans une route ne se propage pas mécaniquement aux autres — point
  structurel positif à noter.

**Résultat : cloisonnement globalement correct entre comptes utilisateurs.
Les deux points de concentration de risque identifiés (service_role,
policy Storage manuscrits) sont des caractéristiques architecturales
connues, pas des bugs — mais ils méritent d'être documentés explicitement
comme les endroits où une seule erreur aurait le plus grand impact.**

### Axe 3 — Moindre privilège

| Client / fonction | Lecture possible | Écriture possible | Nécessaire ? | Réduction possible ? |
|---|---|---|---|---|
| `utils/supabase/server.ts` (RLS) | Données du user courant (RLS) | Idem | Oui | Non — c'est déjà le niveau minimal |
| `utils/supabase/client.ts` (RLS) | Idem, côté navigateur | Idem | Oui (auth only) | Non |
| RPC `incrementer_et_verifier_usage` | — | `usage_api`, revérifie `auth.uid()` | Oui | Déjà minimal — **exemple à suivre** |
| RPC `incrementer_et_verifier_usage_anonyme` | — | `usage_anonyme` | Oui (routes anonymes) | Déjà minimal |
| `service_role` — webhook Stripe | Toutes tables | Toutes tables | Oui (pas de session) | Non réductible sans refonte |
| `service_role` — cadeau/activer | Toutes tables | Toutes tables | Oui pour l'écriture (pas de policy client) | Non réductible facilement |
| `service_role` — compte/supprimer | Toutes tables | Toutes tables | Oui pour `auth.admin.deleteUser` | Non réductible (API admin) |
| `service_role` — certificat/[code]/image | Toutes tables | Toutes tables | **Non** — ne lit qu'une ligne `codes_cadeau` par code | **Oui** — une RPC `SECURITY DEFINER` en lecture seule suffirait |
| `service_role` — certificat/[code]/pdf | Toutes tables | Toutes tables | **Non** — idem | **Oui** — idem |
| `service_role` — offrir/merci (page) | Toutes tables | Toutes tables | **Non** — ne lit qu'une ligne `codes_cadeau` par session_id | **Oui** — idem |

**A-2026-09-12-08 — Usage du service_role plus large que nécessaire sur 3
surfaces à lecture seule.** Ces trois endroits (`certificat/[code]/image`,
`certificat/[code]/pdf`, `offrir/merci`) ne font jamais qu'une seule
lecture d'une ligne `codes_cadeau` par `code` ou `stripe_session_id`, mais
détiennent pour cela un client avec un accès total lecture/écriture à
toutes les tables. Le code actuel de ces 3 fichiers est court et ne fait
que ce qui est documenté — **ce n'est pas une faille active**, mais un
axe de durcissement légitime : remplacer ce client par une RPC
`SECURITY DEFINER` étroite (lecture seule, 3 colonnes, filtrée par code),
sur le modèle déjà appliqué avec succès pour les quotas
(`incrementer_et_verifier_usage`). Gravité : INFORMATION. Statut : CONFIRMÉ
(constat de conception, pas un bug).

**Résultat : le pattern RPC `SECURITY DEFINER` étroit est appliqué
correctement là où il existe (quotas) ; le service_role, plus large par
nature, est utilisé à bon escient dans 5 des 8 emplacements et pourrait
être resserré dans les 3 restants sans changer le comportement observable.**

### Axe 4 — Extraction massive / scraping (compte légitime)

Scénario : un attaquant possède un compte utilisateur réel et légitime.

- `/api/seance`, `/api/transcribe` : plafonnés à 30 appels/jour par
  `user_id` (RPC dédiée, fail-closed) — **mais contournable en créant de
  nouvelles identités anonymes** (A-2026-09-12-02, déjà documenté V1).
- `/api/contact`, `/api/cadeau/certificat/apercu` : plafonnés par IP.
- **`/api/manuscrit/apercu`, `/api/manuscrit/epub`, `/api/manuscrit/couverture`
  : aucun plafond.** Chacun déclenche une compilation Typst réelle (et, pour
  apercu/epub, un téléchargement de toutes les photos depuis Storage) —
  un compte payant pourrait appeler ces routes en boucle sans jamais
  recevoir de 429. Nouvelle entrée : **A-2026-09-12-07**, gravité FAIBLE
  (nécessite un compte payant pour apercu/epub ; aucun paiement requis
  pour couverture — cf. A-2026-09-12-04 — ce qui aggrave légèrement ce
  point pour cette route précise, puisqu'un compte gratuit y a accès).
- `/api/compte/export` : aucun plafond, mais exporte uniquement les
  propres données de l'appelant (droit à la portabilité RGPD) — coût DB
  faible, pas d'appel IA. **Vérifié — pas un problème.**
- `/api/photos` (GET) : renvoie toutes les photos de l'utilisateur en un
  appel (jusqu'à `PHOTOS_MAX_TOTAL = 80`, déjà plafonné à l'upload) — borné
  par construction, **pas un problème**.

**Résultat : les routes à coût IA réel (séance, transcribe) sont
protégées mais contournables par identités anonymes multiples (V1). Les
routes à coût de compilation (manuscrit/*) n'ont aucune protection du
tout — nouvelle FAIBLE, cf. A-2026-09-12-07. L'auto-extraction de ses
propres données (export, photos) est bornée et non problématique.**

### Axe 5 — Détection / traçabilité

*Conformément à la consigne : l'absence d'un SIEM ou d'un système de
détection d'anomalies n'est pas traitée ici comme une vulnérabilité
automatique — elle est évaluée au regard de ce qui est proportionné pour
l'architecture réelle de Racontez-moi (produit à un seul développeur,
hébergement Vercel + Supabase, pas d'équipe sécurité dédiée).*

Ce qui existe réellement :
- **Connexion / échec de connexion** : gérés par Supabase Auth en
  interne — logs éventuels non accessibles depuis le dépôt (plateforme,
  non vérifiable).
- **Accès aux ressources** : aucune table d'audit applicative. Seule trace
  indirecte : `fragments_historique` (conserve chaque version remplacée
  d'un fragment — utile en cas d'édition suspecte, mais ne couvre que les
  fragments, pas les autres tables).
- **Téléchargement** : aucune journalisation applicative des téléchargements
  réels (photos, manuscrits, exports) — seuls les échecs sont loggés
  (`console.error`), jamais les succès.
- **Génération de documents** : idem — seuls les échecs de compilation sont
  loggés.
- **Appels IA** : `usage_api` compte les appels (utile pour repérer un
  volume anormal a posteriori si quelqu'un va le consulter), mais ne
  journalise ni le contenu ni l'horodatage précis par appel — seulement un
  compteur agrégé par jour.
- **Suppression de compte** : seul un échec est loggé
  (`console.error("Suppression de compte échouée:", error)`) — **aucune
  trace d'une suppression réussie**, ni de qui/quand.
- **Changement de données sensibles** : pas de table d'audit dédiée ;
  `fragments_historique` couvre partiellement les fragments uniquement.

**Réponse à « si un compte était compromis aujourd'hui, aurait-on
suffisamment de traces pour comprendre ce qu'il a fait ? » : NON, pas de
façon fiable.** Au-delà des logs internes de Supabase Auth (non
vérifiables depuis le dépôt) et des logs de fonctions Vercel (éphémères,
orientés erreurs, non conçus pour l'investigation), il n'existe aucune
table d'audit applicative dédiée. `usage_api`/`usage_anonyme` donnent un
signal de volume, pas un journal d'actions.

**Réponse à « existe-t-il des mécanismes de détection d'anomalie ? » :
NON**, aucun mécanisme de détection automatique de comportement anormal
n'a été trouvé dans le code (pas d'alerte sur pic d'usage, pas de
détection de login depuis une localisation inhabituelle, etc.).

**Évaluation proportionnée** : pour un produit à un seul développeur sans
équipe sécurité, l'absence de SIEM n'est pas en soi anormale. Le point
réellement actionnable et peu coûteux serait une table d'audit minimale
pour les opérations sensibles (suppression de compte, remboursement,
activation de code cadeau) — pas un système de détection d'anomalie
complet. Gravité retenue : **INFORMATION** (pas un problème actif, un
axe d'amélioration proportionné à documenter, pas à corriger en urgence).

### Axe 6 — Data exposure indirecte

**A-2026-09-12-06 — Détails d'erreur internes renvoyés au client.**
`app/api/manuscrit/apercu/route.ts`, `/epub/route.ts` et
`/couverture/route.ts` renvoient tous les trois
`{ error: "...", details: String(error) }` en cas d'échec (HTTP 500) — la
valeur de `details` est directement le message de l'exception JavaScript
levée, potentiellement les diagnostics bruts du compilateur Typst ou une
erreur Supabase. Cette information part dans le **corps de la réponse
HTTP au client**, pas seulement dans les logs serveur. Gravité : FAIBLE
(contexte authentifié, erreur liée au compte de l'appelant lui-même — pas
une fuite cross-user — mais une divulgation d'information interne contraire
à l'hygiène habituelle, cf. OWASP A05:2021). Statut : CONFIRMÉ (lecture
directe du code des 3 fichiers, aucune dépendance externe). Correction
recommandée : renvoyer un message générique au client, garder `details`
uniquement côté `console.error` (déjà fait en parallèle sur ces 3 routes).

Autres points vérifiés sous cet axe, sans problème trouvé :
- URLs signées Storage (1h, jetons non réutilisables après expiration).
- Noms de fichiers Storage : toujours `crypto.randomUUID()`, jamais le nom
  original du fichier envoyé par le narrateur.
- Requêtes Supabase : listes de colonnes explicites partout, sauf
  `/api/compte/export` qui utilise `select("*")` — justifié, c'est
  littéralement un export complet des propres données du compte.
- En-têtes de réponse (`X-Nombre-Pages`, `X-Nombre-Fragments`) : aucune
  donnée sensible.

### Axe 7 — Paiement / autorisation métier

**A-2026-09-12-04 — Contournement de paywall CONFIRMÉ : `/api/manuscrit/couverture`.**
```
ID : A-2026-09-12-04
Date : 2026-09-12
Catégorie : Autorisation métier (paywall)
Gravité : MOYEN
Composant : Génération de la couverture PDF personnalisée
Fichier : app/api/manuscrit/couverture/route.ts (fichier entier —
          absent de l'audit initial du 12/09, jamais lu avant la
          vérification de cohérence documentaire du même jour)
Fonction / route : GET /api/manuscrit/couverture
Statut : CONFIRMÉ
Description : Cette route ne vérifie que l'authentification
  (auth.getUser()), jamais le statut de paiement (abonnements.status ===
  "active"). Ses deux routes sœurs, /api/manuscrit/apercu et
  /api/manuscrit/epub, avaient exactement ce défaut jusqu'au 11/09/2026
  (trou trouvé et corrigé ce jour-là) — cette troisième route n'a pas été
  corrigée en même temps, très probablement parce qu'elle n'a pas été
  identifiée lors de ce correctif.
Impact : Un compte authentifié mais sans abonnement "Le Parcours" actif
  peut générer et télécharger gratuitement le PDF de couverture
  personnalisée (titre, sous-titre, couleur). Pas de fuite cross-user
  (les données restent scopées à l'appelant, via
  lirePersonnalisationLivre(supabase, user.id)) — c'est un contournement
  de la barrière de paiement, pas un accès non autorisé aux données d'un
  tiers.
Scénario : Un compte créé gratuitement (y compris une session anonyme du
  mode essai, cf. A-2026-09-12-02) appelle GET /api/manuscrit/couverture
  et reçoit 200 avec un PDF complet, sans jamais avoir payé.
Preuve dans le code : app/api/manuscrit/couverture/route.ts:8-11 (seule
  vérification : if (!user) return 401 ; aucun appel à
  supabase.from("abonnements")...).
Correction recommandée : Ajouter la même garde que sur apercu/epub :
  vérifier abonnements.status === "active" avant de compiler, retourner
  403 sinon.
Dernière vérification : 2026-09-12
```

Recherche du même pattern sur les autres routes payantes : aucune autre
occurrence trouvée. `/api/compte/personnalisation` (qui stocke titre/
sous-titre/couleur en base) n'a délibérément pas besoin de cette garde :
elle ne génère aucun document coûteux, se contente d'enregistrer des
préférences — vérifié, pas un problème. `/api/commande/livre` est
correctement gardé (abonnement + adresse + absence de commande existante).
`/mon-livre`, `/seance` (pages) correctement gardés.

### Axe 8 — Données et conservation

**A-2026-09-12-05 — Fichiers Storage non supprimés après suppression de
compte.**
```
ID : A-2026-09-12-05
Date : 2026-09-12
Catégorie : Conservation des données / droit à l'effacement
Gravité : ÉLEVÉ
Composant : Suppression de compte
Fichier : app/api/compte/supprimer/route.ts (fichier entier)
Fonction / route : POST /api/compte/supprimer
Statut : CONFIRMÉ
Description : Cette route annule l'abonnement Stripe puis appelle
  serviceClient.auth.admin.deleteUser(user.id). La suppression de
  l'utilisateur Auth déclenche bien la cascade ON DELETE CASCADE sur
  toutes les tables Postgres qui référencent auth.users (sessions,
  fragments, tours_conversation, profil_narrateur, abonnements,
  adresses_livraison, commandes_livre, photos, fragments_historique) —
  mais **aucun appel à supabase.storage.from(...).remove(...) n'est fait
  avant ou après**, ni pour le bucket "photos" ni pour "manuscrits". À
  comparer avec app/api/photos/[id]/route.ts (DELETE), qui lui nettoie
  correctement le Storage avant de supprimer la ligne DB — le même soin
  n'a pas été appliqué au flux de suppression de compte.
Impact : Après une suppression de compte, les photos personnelles
  (bucket "photos") et les PDF complets du manuscrit/de la couverture
  (bucket "manuscrits", s'il y a eu une commande) restent physiquement
  présents dans Storage indéfiniment — orphelins, non référencés par
  aucune ligne DB survivante, mais toujours lisibles par quiconque
  obtiendrait (ou aurait déjà) une URL signée valide, et toujours présents
  dans le compte Supabase. C'est le type de contenu le plus sensible du
  système (photos de famille, texte intégral d'une histoire de vie) qui
  survit à une suppression de compte que l'utilisateur croit définitive
  — un problème de conformité RGPD (droit à l'effacement, art. 17)
  potentiel autant qu'un problème de sécurité (surface de données
  résiduelle non gouvernée).
Scénario : Un narrateur supprime son compte depuis le tableau de bord
  ("Supprimer mon compte"). Les lignes DB disparaissent (vérifiable),
  mais ses fichiers restent dans le bucket Supabase Storage — non testé
  dynamiquement dans cette V2 (aurait nécessité de créer puis supprimer un
  compte de test réel et d'inspecter le bucket après coup), mais confirmé
  au niveau du code : aucun chemin d'exécution ne les supprime.
Preuve dans le code : app/api/compte/supprimer/route.ts (absence totale
  d'appel à .storage. dans ce fichier) ; comparer à
  app/api/photos/[id]/route.ts:13 (`await supabase.storage.from("photos").remove(...)`,
  présent là, absent ici).
Correction recommandée : Avant (ou après) l'appel à
  auth.admin.deleteUser, lister et supprimer tous les objets Storage sous
  les préfixes `photos/${user.id}/` et `manuscrits/${user.id}/` (buckets
  "photos" et "manuscrits"), via le client service_role déjà présent dans
  ce fichier.
Dernière vérification : 2026-09-12
```

**Précision — Phase 3 (12/09/2026, cartographie complète du cycle de vie
Storage)** : la conclusion ci-dessus a été revérifiée indépendamment,
ligne par ligne, sur le code actuel — **elle est confirmée exacte et
même incomplète dans sa portée initiale**. Éléments supplémentaires
trouvés :

1. **Aucun mécanisme de nettoyage Storage n'existe nulle part dans le
   système** — pas seulement à la suppression de compte. Recherche
   exhaustive (`grep` sur `storage.from`, `.remove(`, `.upload(`,
   `.download(`, `createSignedUrl`, cron/trigger) : seuls 2 appels
   `.remove()` existent dans tout le dépôt, tous deux sur le bucket
   `photos` et tous deux dans des routes individuelles
   (`/api/photos` POST en cas d'échec d'insertion DB,
   `/api/photos/[id]` DELETE) — jamais dans un flux de suppression
   groupée. Aucun cron, trigger SQL, ou job planifié n'a été trouvé
   (recherche vercel.json, migrations, dossier `app/api` — aucune
   occurrence).
2. **Un second scénario orphelin, distinct de la suppression de compte,
   a été identifié dans `app/api/commande/livre/route.ts`** : la ligne
   `commandes_livre` est insérée (statut `"en_cours"`) *avant* l'upload
   Storage. Les deux uploads (`interieur.pdf`, `couverture.pdf`) sont
   lancés en parallèle via `Promise.all` — si l'un réussit et l'autre
   échoue, celui qui a réussi **reste en Storage sans jamais être
   nettoyé** (le catch ne fait que marquer la commande `"echouee"`, il
   ne supprime aucun objet Storage déjà écrit). De plus, chaque nouvelle
   tentative après un échec crée une **nouvelle** ligne `commandes_livre`
   (un nouvel `id`, donc un nouveau dossier `manuscrits/${user.id}/${id}/`)
   plutôt que de réutiliser l'ancien dossier — l'ancien dossier de la
   tentative échouée devient orphelin, indépendamment de toute suppression
   de compte.
3. **Aucune colonne DB ne stocke le chemin Storage des manuscrits** — à la
   différence de `photos.chemin_stockage` (stocké explicitement), le
   chemin `manuscrits/${user.id}/${commande.id}/...` est reconstruit par
   convention à chaque fois, jamais persisté. Conséquence pratique pour
   une future correction : une suppression par requête DB (« pour chaque
   commande de cet utilisateur, supprimer son dossier ») ne suffit pas
   après une cascade DB, puisque les lignes `commandes_livre` auraient
   déjà disparu — il faut lister directement le contenu du bucket sous le
   préfixe `manuscrits/{user_id}/` (`storage.from("manuscrits").list(user_id)`),
   pas interroger la base.
4. Le client `service_role` est déjà instancié dans
   `app/api/compte/supprimer/route.ts` (pour `auth.admin.deleteUser`) mais
   **n'est utilisé pour aucune opération Storage** — aucun changement de
   privilège ne serait nécessaire pour ajouter le nettoyage, le client
   adéquat est déjà présent dans le fichier.
5. `/api/manuscrit/apercu`, `/epub`, `/couverture` ne touchent **jamais**
   Storage (génération et réponse entièrement en mémoire, confirmé par
   l'absence de tout appel `.upload()` dans ces 3 fichiers) — aucun risque
   d'orphelin de ce côté, contrairement à une hypothèse possible.

**Conclusion de la Phase 3 sur A-2026-09-12-05** : la vulnérabilité n'est
pas seulement confirmée mais sa portée doit être élargie dans la
compréhension du problème — ce n'est pas un oubli isolé sur une route,
c'est l'absence structurelle de toute stratégie de nettoyage Storage dans
l'application, avec au moins deux déclencheurs indépendants (suppression
de compte ; échec/retry de commande d'impression). La gravité ÉLEVÉ et le
statut CONFIRMÉ restent inchangés — cette précision n'invalide rien,
elle documente une portée plus large que ce qui avait été écrit en V2.
Voir le rapport complet de cartographie Storage (Phase 3) dans la
conversation du 12/09/2026 pour le détail des 19 sections d'analyse
(buckets, points de création/lecture/suppression, scénarios orphelins A–J,
policies, service_role, intégrations externes, architecture de correction
recommandée, plan de test dynamique).

**Architecture de correction retenue — Phase 4 (12/09/2026, conception
uniquement, rien implémenté)** : après comparaison de 3 architectures
(nettoyage Storage synchrone avant `auth.admin.deleteUser` dans la même
requête ; suppression immédiate + nettoyage différé par tâche de fond ;
machine à états persistée), l'option retenue est la **première** —
synchrone, dans `/api/compte/supprimer` lui-même, avec `auth.admin.deleteUser`
appelé uniquement après vérification que les préfixes `photos/${user.id}/`
et `manuscrits/${user.id}/` sont vides. Écartée : la tâche de fond
(complexité et infrastructure — aucun cron n'existe dans ce dépôt,
confirmé par la recherche exhaustive de la Phase 3 — non justifiées au
volume réel de fichiers par compte, plafonné par `PHOTOS_MAX_TOTAL = 80`).
Écartée aussi : la machine à états persistée (l'idempotence est déjà
garantie sans elle, Storage faisant lui-même office d'état). Correction
associée pour le second scénario (upload partiel de
`commande/livre`) : nettoyer explicitement les objets déjà uploadés en cas
d'échec de l'autre, et réutiliser le dossier de la commande `"echouee"`
plutôt que d'en créer un nouveau à chaque tentative. Détail complet
(analyse de 12 cas d'échec, ordre des opérations justifié, gestion
d'erreurs, logs, performance, plan de test) dans le rapport de conception
Phase 4 de la conversation du 12/09/2026. Statut de A-2026-09-12-05 :
toujours CONFIRMÉ — cette section documente une architecture de
correction proposée, pas une correction appliquée.

**Implémentation — Phase 5 (12/09/2026)** : l'architecture retenue en
Phase 4 a été codée telle quelle, sur feu vert explicite. Nouveau fichier
`lib/nettoyage-storage.ts` (`viderPrefixeUtilisateur` : liste
récursivement un préfixe `${bucket}/${userId}`, supprime par lots de 100,
reliste pour confirmer un résultat vide plutôt que de faire confiance au
seul retour de `remove()`). `app/api/compte/supprimer/route.ts` appelle
cette fonction sur `photos` et `manuscrits` avant `auth.admin.deleteUser`
— si l'un des deux préfixes n'est pas confirmé vide, ou si le nettoyage
lève une exception, `deleteUser` n'est jamais appelé et le compte reste
intact et récupérable. Un appel `deleteUser` échouant avec le statut HTTP
404 (utilisateur déjà supprimé) est traité comme un succès, pas une
erreur, pour l'idempotence en cas de double appel.

`app/api/commande/livre/route.ts` a été corrigé pour le second scénario
(orphelinage d'upload partiel, découvert en Phase 3) : si un seul des
deux uploads (`interieur.pdf`/`couverture.pdf`) réussit, les deux chemins
sont supprimés avant de marquer la commande `"echouee"` (suppression d'un
fichier absent = no-op sûr) ; et une nouvelle tentative réutilise
désormais la ligne `commandes_livre` déjà `"echouee"` (même id, même
dossier Storage, `update` plutôt que nouvel `insert`) au lieu de créer un
nouveau dossier à chaque essai.

**Statut mis à jour : CORRIGÉ DANS LE CODE — NON VALIDÉ DYNAMIQUEMENT.**
Typecheck, lint et 16 tests dédiés (9 pour la suppression de compte, 7
pour l'upload partiel de commande, plus 5 tests unitaires sur
`viderPrefixeUtilisateur`) passent tous — voir le rapport complet
d'implémentation Phase 5 de la conversation du 12/09/2026 pour le détail
(fichiers modifiés, tests, cas non couverts, invariants de sécurité
revérifiés). **Non validé dynamiquement** : aucun test n'a été exécuté
contre un environnement Supabase réel (comptes de test, vrais buckets) —
le comportement réel de `.list()`/`.remove()` sur les buckets réels, et
le code HTTP exact renvoyé par `deleteUser` sur un utilisateur déjà
supprimé, restent à confirmer par le plan de test dynamique proposé en
Phase 4 (TEST A à J) avant de considérer cette correction définitivement
opérationnelle en production. Rien commité, rien déployé.

**Phase 6 (12/09/2026) — tentative de validation dynamique, arrêtée au
contrôle de sécurité préalable.** Avant toute exécution, vérification de
l'environnement Supabase configuré localement (`.env.local` et
`.env.localum`) : `NEXT_PUBLIC_SUPABASE_URL` vaut littéralement
`https://placeholder.supabase.co` dans les deux fichiers — un domaine qui
ne résout même pas, pas un projet Supabase réel, ni de test ni de
production. Aucun projet Supabase de test/dev dédié à racontez-moi.com
n'a été identifié à aucun moment de cet audit (le seul projet réel connu
est le projet de production `fasvqpokgdvzahqmjlxz`, cf. mémoire de
session). Conformément à la règle absolue de cette phase (« si tu ne peux
pas confirmer avec certitude que l'environnement est un environnement de
test → STOP »), **aucun test dynamique n'a été exécuté** — ni création de
compte, ni upload, ni suppression, ni aucune requête contre Supabase.
Statut de A-2026-09-12-05 : **inchangé, toujours CORRIGÉ DANS LE CODE —
VALIDATION INCOMPLÈTE** (jamais "validé dynamiquement", faute
d'environnement de test disponible). Détail complet et proposition pour
lever ce blocage dans le rapport Phase 6 de la conversation du
12/09/2026.

**Phase 7 (12/09/2026) — conception et mise en place sécurisée de
l'environnement de test.** Audit en lecture seule de la configuration
existante (`.env.local`, `.env.localum`, `.gitignore`, scripts,
`next.config.ts`, absence de CLI/`config.toml` Supabase) confirmant le
diagnostic de la Phase 6 et l'élargissant :

- `.env.local` et `.env.localum` correctement ignorés par git (`.env*` et
  `.env*.local` dans `.gitignore`) — aucun secret n'a jamais fuité côté
  dépôt.
- `.env.local` contient déjà de vraies clés Stripe **test** (`sk_test_...`,
  `whsec_...`) d'une session de travail antérieure (paiement Klarna) —
  seule la partie Supabase était restée en placeholder. `.env.localum`
  est une copie plus ancienne (webhook Stripe encore en placeholder) —
  source de confusion à clarifier par Régis (lequel des deux fichiers
  fait foi n'est pas documenté).
- Aucun `.env.example` n'était versionné — corrigé (cf. ci-dessous).
- Aucun CLI Supabase, aucun `supabase/config.toml` : les 22 migrations de
  `supabase/migrations/` ont toujours été appliquées manuellement sur la
  production — il n'existe aucune commande unique pour rejouer ce schéma
  sur un futur projet de test, il faudra les rejouer une par une, dans
  l'ordre.
- Les 8 usages applicatifs de `SUPABASE_SERVICE_ROLE_KEY` (déjà
  catalogués en V2) et les 2 scripts d'ingestion utilisant la variable
  `SUPABASE_URL` (sans préfixe `NEXT_PUBLIC_`) reconfirmés inchangés.

**Modifications effectuées** (toutes locales, aucune donnée ni
configuration de production touchée) :

- `.env.example` (nouveau, versionné) — documente les 18 variables
  réellement utilisées par le code (recherche exhaustive de
  `process.env.*`), sans aucune valeur réelle, avec un avertissement
  explicite sur `NEXT_PUBLIC_SUPABASE_URL` (toujours un projet de TEST en
  local, jamais la production) et une nouvelle variable `SUPABASE_ENV`
  (marqueur explicite, consommé uniquement par le garde-fou ci-dessous).
- `scripts/garde-environnement-test.ts` (nouveau) — exporte
  `assurerEnvironnementTest()` : refuse si l'hôte Supabase chargé
  correspond à un hôte de production connu (`fasvqpokgdvzahqmjlxz.supabase.co`),
  et refuse également si `SUPABASE_ENV` ne vaut pas exactement `"test"` —
  à appeler en tout premier dans tout futur script de test destructif
  (Phase 8). 6 tests unitaires (`scripts/garde-environnement-test.test.ts`)
  couvrant les deux refus, une URL absente/invalide, une valeur
  approximative de `SUPABASE_ENV` (ex. `"testing"`), et le cas passant.
- `docs/security/SECURITY.md` — nouvelle section §11ter décrivant
  l'architecture PROD/TEST retenue.

**Projet Supabase TEST — non créé, hors de portée de cette session.**
Créer un projet Supabase est une action au niveau du compte/de la
facturation de Régis — aucun credential ni autorisation pour le faire à
sa place. Étapes manuelles précises communiquées dans le rapport complet
de la Phase 7 (conversation du 12/09/2026) : création du projet,
rejeu des 22 migrations dans l'ordre, création des buckets `photos` et
`manuscrits`, activation des connexions anonymes (Auth), récupération
(recommandée mais optionnelle) de la vraie policy `manuscrits` depuis le
dashboard production pour résoudre A-2026-09-12-01 au passage, puis
remplissage de `.env.local` avec les vraies valeurs TEST +
`SUPABASE_ENV=test`.

**Statut de A-2026-09-12-05 : inchangé — toujours CORRIGÉ DANS LE CODE,
VALIDATION INCOMPLÈTE.** Cette phase prépare l'infrastructure de
validation, elle ne valide rien elle-même. **NO-GO pour la Phase 8** tant
que le projet TEST n'existe pas.

Recensement complémentaire des données et de leur conservation :
- **Transcriptions** : vivent indéfiniment dans `sessions.transcript`
  (jsonb) tant que le compte existe — cohérent avec la proposition de
  valeur du produit (mémoire permanente de l'entretien), pas une anomalie.
- **Anciennes versions de fragments** : `fragments_historique` conserve
  chaque version remplacée indéfiniment tant que le compte existe (par
  design, décision du 23/07/2026) — supprimé en cascade à la suppression
  de compte (DB uniquement, cf. ci-dessus pour Storage).
- **Compteurs d'usage** (`usage_api`, `usage_anonyme`) : aucune purge
  visible dans les migrations — croissance non bornée dans le temps.
  Faible sensibilité (compteurs + user_id/IP, pas de contenu), impact
  surtout en volume de stockage à très long terme. Non traité comme un
  problème de sécurité, mentionné pour complétude.
- **Sauvegardes Supabase** : les politiques de rétention des backups
  automatiques de la plateforme Supabase (durée, portée) ne sont pas
  visibles depuis le dépôt — **non vérifiable**.

### Axe 9 — Intégrations externes

| Service | Données transmises | Pourquoi | Nécessaire ? | Réponses journalisées ? | Secret protégé ? |
|---|---|---|---|---|---|
| Supabase | Toutes les données applicatives | Backend de données | Oui | N/A (interne) | Oui — clés server-only |
| Stripe | email (si connu), `client_reference_id` (user.id), métadonnées cadeau (prénom destinataire, nom offrant, message ≤500c) | Paiement | Oui, strict minimum | Erreurs non loggées explicitement (webhook loggue la signature invalide uniquement) | Oui — `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` server-only |
| Anthropic | Réponses brutes du narrateur, résumé de profil comportemental, résumé de séance précédente | Génération des relances et fragments — cœur du produit | Oui | Non (pas de log de contenu) | Oui — `ANTHROPIC_API_KEY` server-only |
| Groq (Whisper) | Audio brut de la séance | Transcription — cœur du produit | Oui | Non (pas de log d'audio) | Oui — `GROQ_API_KEY` server-only |
| Lulu | Adresse de livraison complète, email, **URLs signées (1h) vers le PDF intérieur + couverture complets** | Fabrication et expédition du livre imprimé | Oui | **Oui, en cas d'échec** — le texte de réponse Lulu brut est inclus dans le message d'erreur loggué (`lib/lulu.ts`, 3 endroits) — cf. nuance ci-dessous | Oui — clés Lulu server-only |
| Hugging Face | **Texte brut des fragments/réponses du narrateur** (contenu narratif personnel) | Génération d'embeddings pour le rappel mémoire (RAG) | Oui | **Oui, en cas d'échec** — `lib/embeddings.ts:26`, le texte de réponse HF brut est loggué ; le contenu exact de cette réponse (échoirait-elle le texte soumis ?) n'a pas été vérifié | Oui — `HF_API_KEY` server-only |
| Brevo | Nom, email, message du formulaire de contact public | Envoi d'email transactionnel | Oui, aucune donnée de narrateur transmise | Oui, en cas d'échec (`await res.text()`) | Oui — `BREVO_API_KEY` server-only |

**Nuance sur les réponses journalisées (Lulu, Hugging Face, Groq)** :
aucun secret n'est jamais loggué (vérifié V1). En revanche, le *contenu*
des messages d'erreur renvoyés par ces API tierces en cas d'échec n'a pas
été inspecté ligne à ligne pour vérifier s'il pourrait échoir des données
soumises par l'utilisateur — pour Lulu, potentiellement l'adresse postale
soumise (validation d'adresse échouée, par exemple) ; pour Hugging Face,
plus sensible encore, potentiellement un extrait du texte narratif soumis
si l'API renvoie ce qu'elle n'a pas pu traiter. **Ni confirmé ni infirmé —
seul le fait que ces erreurs finissent dans les logs serveur (Vercel) est
confirmé.** Ceci prolonge et précise le point E de l'audit initial.

**Résultat : tous les flux externes sont proportionnés à leur fonction,
aucune donnée manifestement superflue transmise. Le point le plus sensible
du système est la transmission à Lulu (manuscrit complet via URL signée)
et à Hugging Face (texte narratif brut) — nécessaires, mais à garder en
tête dans toute réflexion future sur la minimisation des données.**

### Axe 10 — Tests dynamiques proposés (non exécutés)

| # | Test | Objectif | Prérequis | Résultat attendu si sécurisé | Résultat indiquant une vulnérabilité |
|---|---|---|---|---|---|
| 1 | IDOR croisé sur fragments/photos/commandes | Confirmer qu'un compte A ne peut pas lire/modifier une ressource du compte B en changeant l'ID dans l'URL/le JSON | 2 comptes de test | 404 systématique | 200 avec les données de B |
| 2 | Isolation Storage bucket `manuscrits` | Confirmer que la policy réelle (non versionnée) isole bien par utilisateur | 2 comptes payants avec commande chacun | Accès direct au dossier de l'autre refusé | Lecture/écriture possible sur le dossier d'un autre `user_id` |
| 3 | Paywall `/api/manuscrit/couverture` | Confirmer en conditions réelles le contournement trouvé statiquement (A-2026-09-12-04) | Compte authentifié sans abonnement actif | 403 (une fois corrigé) | 200 avec le PDF (état actuel) |
| 4 | Contournement de quota via comptes anonymes | Mesurer si le quota séance/transcribe est réellement contournable en pratique | Script appelant `signInAnonymously()` en boucle | Blocage après N comptes/IP | Quota illimité par répétition |
| 5 | Rate limiting `certificat/[code]/{image,pdf}` | Confirmer l'absence de throttle en conditions réelles | Un code cadeau de test valide | 429 après N requêtes | 200 illimité |
| 6 | Fichiers Storage après suppression de compte | Vérifier si les fichiers du bucket restent présents après suppression du compte (A-2026-09-12-05) | Compte de test avec photos + commande, chemins notés avant suppression | Fichiers absents du bucket après suppression | Fichiers toujours présents/accessibles |
| 7 | RLS brut via clé anon + jeton de session | Vérifier que RLS bloque à la source, indépendamment du filtre applicatif | Clé anon publique + jeton de session d'un compte de test, requête directe à l'API Supabase (hors app Next.js) | Aucune ligne hors `user_id` renvoyée | Une ligne d'un autre compte renvoyée |
| 8 | Téléchargement massif `/api/manuscrit/apercu` | Mesurer le comportement sous appels répétés sans plafond | Un compte payant de test | Dégradation de latence mais pas de 500 en cascade ; absence de 429 documentée comme risque assumé si non corrigé | Situation inchangée, aucun code d'erreur, coût cumulable à l'infini |
| 9 | Revalidation `next=` sur `/auth/callback` | Revalider en conditions réelles l'analyse statique (pas d'open redirect) | Aucun (test manuel, URL forgée) | Redirection toujours interne au domaine | Redirection vers un domaine externe |
| 10 | Fuite de `details` sur erreur manuscrit | Confirmer qu'un échec réel de compilation expose bien des détails internes dans la réponse HTTP | Compte de test, déclencher une erreur de compilation (ex. fragment malformé) | Message générique seulement | `details` contient la stack/l'erreur brute (état actuel confirmé statiquement) |

### VERDICT V2

```
IDOR :                                OK
Broken Access Control :               PROBLÈME (paywall = une forme de
                                       contrôle d'accès métier défaillant,
                                       cf. A-2026-09-12-04)
Paywall bypass :                      PROBLÈME (A-2026-09-12-04, CONFIRMÉ)
RLS (tables Postgres) :               OK (22 migrations, toutes correctes)
Storage :                             PARTIEL (photos OK ; manuscrits non
                                       vérifiable, policy non versionnée)
Cloisonnement :                       PARTIEL (bon en général ; deux points
                                       de concentration de risque identifiés
                                       — service_role, bucket manuscrits)
Moindre privilège :                   PARTIEL (RPC quotas exemplaires ; 3
                                       usages service_role plus larges que
                                       nécessaire, non actifs comme faille)
Scraping / extraction massive :       PARTIEL (quotas existants
                                       contournables par comptes anonymes ;
                                       3 routes manuscrit sans aucun
                                       throttle)
Rate limiting :                       PARTIEL (présent et fail-closed sur 4
                                       routes coûteuses, absent sur 5 autres)
Détection / traçabilité :             PARTIEL (signaux partiels seulement ;
                                       pas traité comme faute vu la taille
                                       du projet, cf. axe 5)
Secrets :                             OK (aucun secret exposé côté client
                                       ou trouvé dans le dépôt)
Intégrations externes :               PARTIEL (flux proportionnés partout ;
                                       contenu des logs d'erreur tiers non
                                       vérifié pour fuite de contenu)
Conservation des données :            PROBLÈME (A-2026-09-12-05, fichiers
                                       Storage orphelins après suppression
                                       de compte, CONFIRMÉ)
```

### Compteurs mis à jour (V1 + V2 cumulés)

```
CRITIQUE :    0
ÉLEVÉ :       1  (A-2026-09-12-05)
MOYEN :       3  (A-2026-09-12-01, -02, -04)
FAIBLE :      3  (A-2026-09-12-03 [désormais CONFIRMÉ], -06, -07)
INFORMATION : 2  (A-2026-09-12-08 ; axe 5 détection/traçabilité)
```

### Ce qui n'a PAS pu être vérifié (complément V2)

- Le contenu réel des réponses d'erreur Lulu/Hugging Face (échoient-elles
  des données soumises par l'utilisateur ?).
- Les logs internes de Supabase Auth (connexions, échecs) — plateforme,
  hors dépôt.
- Les politiques de rétention des sauvegardes automatiques Supabase.
- La présence réelle de fichiers orphelins en Storage après une
  suppression de compte (confirmé au niveau du code, pas testé
  dynamiquement contre l'environnement réel).
- Tout ce qui, comme en V1, nécessiterait un test dynamique réel contre
  l'environnement de production (cf. Axe 10 ci-dessus pour la liste
  complète proposée).
