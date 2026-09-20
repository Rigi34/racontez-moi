# Racontez-moi.com — Historique des audits de sécurité

> Chaque audit ajoute une entrée. L'historique précédent n'est jamais
> supprimé.

## 2026-09-12 — Audit initial

- Cartographie complète de l'architecture (framework, auth, Supabase,
  Storage, API, service role, paiement) — cf. `SECURITY.md`.
- Cartographie des données utilisateur sur toutes les tables et 24 routes
  API.
- Audit IDOR / Broken Access Control sur les 24 routes API.
- Audit Supabase / RLS sur les 22 migrations.
- Audit Storage (buckets `photos`, `manuscrits`).
- Audit authentification et sessions (middleware, callback OAuth, séance
  anonyme).
- Audit privilèges élevés / service role (8 fichiers).
- Audit rate limiting / quotas.
- Résultats : 0 CRITIQUE, 0 ÉLEVÉ, 2 MOYEN, 1 FAIBLE. Aucun IDOR trouvé.
  Deux incidents historiques (commandes_livre sans policy d'écriture ;
  manuscrit accessible sans paiement) reconfirmés corrigés. Détail complet
  dans `SECURITY-AUDIT.md`.
- Documentation créée : `docs/security/SECURITY-MASTER-AUDIT.md` (cahier
  des charges, source Google Drive), `SECURITY.md`, `SECURITY-AUDIT.md`,
  `SECURITY-CHANGELOG.md` (ce fichier), `SECURITY-CHECKLIST.md`.
- Analyse strictement statique — aucun test dynamique, aucune modification
  de code, migration, policy ou donnée en base durant cet audit.

## 2026-09-12 — Vérification de cohérence documentaire

- Relecture des 5 fichiers de `docs/security/` pour vérifier la cohérence
  interne de l'audit initial (aucune modification effectuée à ce stade).
- Découverte que l'audit initial n'avait en réalité lu que 23 des 24
  routes API du dépôt — `app/api/manuscrit/couverture/route.ts` avait été
  omis.
- 5 incohérences documentaires identifiées (formulations, statuts, cases à
  cocher) — cf. détail dans la conversation, corrigées dans l'entrée V2
  ci-dessous.
- Aucun fichier modifié durant cette étape — relecture et signalement
  uniquement.

## 2026-09-12 — Audit V2 (extension : cloisonnement, moindre privilège,
## extraction massive, traçabilité, exposition indirecte, conservation,
## intégrations externes)

- Déclenchée directement par la découverte ci-dessus (route manquante →
  contournement de paywall réel trouvé dès sa lecture).
- **Résultats de l'audit initial intégralement conservés** — aucune entrée
  supprimée ni réécrite dans `SECURITY-AUDIT.md`, seul le statut de
  A-2026-09-12-03 a été corrigé (À VÉRIFIER → CONFIRMÉ, avec justification
  ajoutée en place).
- Lecture complète de la 24ᵉ route manquante (`manuscrit/couverture`),
  de `lib/embeddings.ts`, de `app/mon-livre/BoutonCommande.tsx`, et
  recherche exhaustive de tout usage de Supabase Storage dans le dépôt.
- Nouvelles entrées ajoutées à `SECURITY-AUDIT.md` :
  - A-2026-09-12-04 — Paywall bypass CONFIRMÉ sur `/api/manuscrit/couverture`
    (MOYEN)
  - A-2026-09-12-05 — Fichiers Storage non supprimés après suppression de
    compte (ÉLEVÉ)
  - A-2026-09-12-06 — Détails d'erreur internes renvoyés au client sur 3
    routes manuscrit (FAIBLE)
  - A-2026-09-12-07 — Absence de rate limiting sur
    `/api/manuscrit/{apercu,epub,couverture}` (FAIBLE)
  - A-2026-09-12-08 — Usage du service_role plus large que nécessaire sur
    3 routes à lecture seule (INFORMATION)
- 9 axes supplémentaires audités : cloisonnement, moindre privilège,
  extraction massive/scraping, détection/traçabilité, data exposure
  indirecte, autorisation métier (paywall), données et conservation,
  intégrations externes, tests dynamiques proposés (liste de 10 tests, non
  exécutés).
- Compteurs cumulés (V1+V2) : 0 CRITIQUE, 1 ÉLEVÉ, 3 MOYEN, 3 FAIBLE, 2
  INFORMATION.
- Corrections des incohérences documentaires de l'étape précédente
  appliquées directement dans `SECURITY.md` et `SECURITY-CHECKLIST.md`
  (couverture retirée de la liste des routes protégées, case Storage
  `manuscrits` décochée, `/api/cadeau/activer` retiré de la liste des
  routes publiques, formulation sur les logs nuancée).
- Toujours strictement en lecture seule : aucune modification de code, de
  migration, de policy Supabase, ni de donnée en base. Aucun commit
  effectué.

## 2026-09-12 — Phase 3 : cartographie complète du cycle de vie Storage

- Analyse dédiée, déclenchée avant toute correction de A-2026-09-12-05, pour
  comprendre précisément le cycle de vie de tous les fichiers liés à un
  utilisateur (buckets, conventions de chemin, points de création/lecture/
  suppression, scénarios de fichiers orphelins, policies Storage,
  service_role, copies externes).
- Recherche exhaustive confirmée : 2 buckets seulement (`photos`,
  `manuscrits`), aucun cron/trigger/job de nettoyage nulle part dans le
  dépôt.
- **A-2026-09-12-05 reconfirmée et précisée** (pas réécrite) : un second
  scénario orphelin indépendant identifié dans
  `app/api/commande/livre/route.ts` (échec partiel d'upload lors d'une
  commande, et dossier orphelin à chaque nouvelle tentative après échec) —
  détail complet ajouté directement sous l'entrée existante dans
  `SECURITY-AUDIT.md`, historique conservé intégralement.
- Architecture de correction proposée (non codée) et plan de test
  dynamique détaillé (compte de test A/B) — communiqués dans la
  conversation, pas encore ajoutés au corps de `SECURITY-AUDIT.md` sous
  forme d'entrée séparée (à faire lors de la correction effective si jugé
  utile).
- Toujours strictement en lecture seule : aucune modification de code, de
  migration, de policy Supabase, ni de donnée/fichier Storage. Aucun
  commit, aucun push.

## 2026-09-12 — Phase 5 : implémentation des corrections A et B

- **Première phase avec modification de code réelle**, sur feu vert
  explicite — Phases 1 à 4 strictement lecture seule.
- **Correction A** (A-2026-09-12-05) : nouveau `lib/nettoyage-storage.ts`
  (`viderPrefixeUtilisateur`) ; `app/api/compte/supprimer/route.ts`
  modifié pour nettoyer `photos/{user.id}/` et `manuscrits/{user.id}/`
  et vérifier qu'ils sont vides avant d'appeler
  `auth.admin.deleteUser` — jamais appelé si le nettoyage échoue ou reste
  incomplet.
- **Correction B** : `app/api/commande/livre/route.ts` modifié — rollback
  Storage si un seul des deux uploads (intérieur/couverture) réussit ;
  réutilisation de la ligne `commandes_livre` `"echouee"` existante au
  lieu d'un nouveau dossier à chaque tentative.
- Tests ajoutés : `lib/nettoyage-storage.test.ts` (5),
  `app/api/compte/supprimer/route.test.ts` (9),
  `app/api/commande/livre/route.test.ts` (7) — 21 nouveaux tests, 96/96
  au total sur l'ensemble du dépôt. Typecheck, lint et build de
  production tous vérifiés.
- Statut de A-2026-09-12-05 : **CONFIRMÉ → CORRIGÉ DANS LE CODE, NON
  VALIDÉ DYNAMIQUEMENT** — précision ajoutée sous l'entrée existante dans
  `SECURITY-AUDIT.md`, historique V1/V2/Phase 3/Phase 4 intégralement
  conservé, rien réécrit.
- Périmètre strictement respecté : aucune modification de Stripe, Lulu,
  Anthropic, Groq, Hugging Face, Brevo, des policies ou des migrations —
  seuls les 2 fichiers de route concernés, 1 nouveau fichier `lib/`, et
  leurs tests.
- **Rien commité, rien pushé** — `git diff --stat` et la liste des
  fichiers modifiés communiqués dans le rapport Phase 5 de la
  conversation, décision de commit à prendre séparément.

## 2026-09-12 — Phase 6 : validation dynamique — arrêtée au contrôle de sécurité

- Tentative de validation dynamique des corrections A et B contre un
  environnement Supabase de test, conformément au plan de test proposé en
  Phase 4.
- **Arrêtée avant toute exécution**, au contrôle de sécurité obligatoire
  de début de phase : `NEXT_PUBLIC_SUPABASE_URL` vaut
  `https://placeholder.supabase.co` dans `.env.local` et
  `.env.localum` (domaine non résolvable, ni test ni production) — aucun
  environnement Supabase de test utilisable localement, et aucun projet
  Supabase de test dédié à racontez-moi.com connu par ailleurs.
- **Aucune donnée créée ou supprimée, aucun compte de test créé, aucune
  requête envoyée à Supabase.** Seules les validations non destructives
  ont été refaites : typecheck, lint, 96/96 tests (mocks, inchangés
  depuis la Phase 5), build de production — tous verts, aucune régression.
- Statut de A-2026-09-12-05 : **inchangé** — toujours CORRIGÉ DANS LE
  CODE, jamais VALIDÉ DYNAMIQUEMENT. Précision ajoutée sous l'entrée
  existante dans `SECURITY-AUDIT.md`, historique V1/V2/Phase 3/4/5
  intégralement conservé.
- Rien commité, rien pushé.

## 2026-09-12 — Phase 7 : conception et mise en place de l'environnement de test

- Audit en lecture seule de la configuration existante confirmant et
  élargissant le diagnostic de la Phase 6 : `.env.local`/`.env.localum`
  correctement ignorés par git, mais Supabase toujours en placeholder ;
  aucun `.env.example` versionné ; aucun CLI/`config.toml` Supabase ; 22
  migrations historiquement appliquées à la main sur la production.
- Architecture PROD/TEST conçue (pas de 3ᵉ projet "DEV" séparé — LOCAL
  pointe directement vers TEST, adapté à la taille du produit).
- **Fichiers créés** (locaux uniquement, rien touché côté production) :
  `.env.example` (18 variables documentées, aucune valeur réelle),
  `scripts/garde-environnement-test.ts` (garde-fou anti-production, 2
  vérifications indépendantes obligatoires) et ses 6 tests
  (`scripts/garde-environnement-test.test.ts`). `docs/security/SECURITY.md`
  mis à jour (nouvelle section §11ter).
- Typecheck, lint et tests re-vérifiés après ajout : **102/102** (96
  précédents + 6 nouveaux), tous verts.
- **Projet Supabase TEST non créé** — action de compte/facturation hors
  de portée de cette session ; étapes manuelles précises communiquées à
  Régis dans le rapport Phase 7 de la conversation.
- Statut de A-2026-09-12-05 : inchangé, toujours CORRIGÉ DANS LE CODE —
  VALIDATION INCOMPLÈTE. **NO-GO pour la Phase 8** tant que le projet
  TEST n'existe pas.
- Rien commité, rien pushé.

- Phase de conception pure, déclenchée par les résultats de la Phase 3 —
  toujours aucune implémentation, aucune modification de code.
- 3 architectures comparées pour A-2026-09-12-05 (Storage non nettoyé à la
  suppression de compte) : nettoyage synchrone avant suppression du
  compte (retenue), suppression immédiate + nettoyage différé par tâche
  de fond (écartée), machine à états persistée (écartée).
- Analyse de 12 cas d'échec, ordre des opérations justifié, stratégie
  d'idempotence, de gestion d'erreurs, de logs (sans contenu sensible),
  d'évaluation de performance (bornée par `PHOTOS_MAX_TOTAL = 80`),
  architecture de correction distincte pour le second scénario (upload
  partiel de `commande/livre`), et plan de test futur en 10 scénarios
  (TEST A à J) — aucun exécuté.
- **A-2026-09-12-05 précisée à nouveau** (pas réécrite) : ajout d'un
  paragraphe "Architecture de correction retenue — Phase 4" directement
  sous la précision Phase 3 déjà présente, dans `SECURITY-AUDIT.md`.
  Statut inchangé : CONFIRMÉ.
- Toujours strictement en lecture seule : aucune modification de code, de
  migration, de policy Supabase, ni de donnée/fichier Storage. Aucun
  commit, aucun push.

## 2026-09-20 — Phase 8 (partie 1) : préparation de l'environnement de test dynamique, aucun scénario A–J exécuté

- Levée du blocage NO-GO de la Phase 7 : projet Supabase TEST
  `zxlagkkujufmhwprwued` confirmé opérationnel (23 migrations appliquées
  dont `0023_manuscrits_rls`, buckets `photos`/`manuscrits` créés, vides
  et privés, sans limite de taille/type — vérifié par lecture directe de
  `storage.buckets`).
- Plan des 10 scénarios dynamiques recalé sur le plan Phase 4 original
  retrouvé par Régis (A : suppression normale ; B : récursion Storage ;
  C : manuscrit+couverture sans Lulu ; D : idempotence deleteUser ;
  E : objet déjà absent ; F : échec partiel du nettoyage ; G : rollback
  upload partiel ; H : retry commande échouée ; I : suppressions
  concurrentes ; J : isolation cross-user) — ma reconstruction précédente
  de H/I/J (autre plan) explicitement abandonnée.
- **6 comptes Auth de test créés** (`auth.admin.createUser`,
  `email_confirm: true`, mots de passe générés localement jamais
  affichés) : Alpha, Beta, Gamma, Delta, Epsilon, Zeta — domaine
  `@example.com` (RFC 2606, non routable).
- **Données DB et Storage préparées par étapes successives, chacune sur
  feu vert explicite** : Alpha (abonnement actif, adresse, 1 session, 20
  fragments ≈24 000 mots pour dépasser largement le seuil de 24 pages ;
  fixtures Storage A et J) ; Beta (fixtures Storage B/I/J, isolées sous
  des préfixes dédiés non ambigus) ; Gamma (1 commande `confirmee` +
  manuscrit/couverture factices, sans Lulu) ; Zeta (1 fichier `photos`
  uniquement, `manuscrits` vide, pour F) ; Delta et Epsilon volontairement
  laissés sans données (D et E l'exigent).
- État initial figé en référence de comparaison :
  `docs/security/TEST-BASELINE-2026-09-20.md` (comptes, migrations,
  lignes par table, commande Gamma, 21 objets Storage détaillés par
  utilisateur/bucket, policies actuelles, vérification croisée : aucune
  donnée n'appartient à un utilisateur hors des 6 comptes de test).
- **Aucun scénario A–J exécuté à ce stade.** Aucune policy, migration ou
  configuration modifiée. Rien touché en production.

## 2026-09-20 — Phase 8 (partie 2) : premier scénario dynamique exécuté — A (suppression normale)

- **Scénario A : PASS.** Exécution de la vraie route `POST /api/compte/supprimer`
  (aucun mock, aucun nettoyage manuel) via `next dev` sur le projet TEST, avec
  une session réelle d'Alpha obtenue par mot de passe et convertie en cookie
  `@supabase/ssr` conforme (base64url, vérifié dans le code source du
  paquet). Authenticité du cookie vérifiée au préalable par un appel non
  destructif à `GET /api/photos`.
- Réponse de la route : `{"ok":true,"photos_supprimees":2,"manuscrits_supprimes":3}`,
  cohérente avec l'état ciblé (2 objets `photos`, 3 objets `manuscrits`).
  Vérifié après coup : compte Auth Alpha supprimé, toutes ses lignes DB à 0
  (cascade), tous ses objets Storage disparus, Beta/Gamma/Delta/Epsilon/Zeta
  strictement intacts (13/2/0/0/1 objets, 1 commande, inchangés). Détail
  complet et preuves : `docs/security/TEST-RESULTATS-A-J-2026-09-20.md`.
- **A-2026-09-12-05** : premier scénario de son plan de test dynamique
  (Phase 4) exécuté avec succès contre un environnement réel — statut
  toujours **CORRIGÉ DANS LE CODE, VALIDATION PARTIELLE** (1/10 scénarios),
  pas encore "validé dynamiquement" dans son ensemble tant que B à J ne sont
  pas exécutés.
- Aucun autre scénario lancé après A, conformément à la consigne. Rien
  commité, rien pushé.

## 2026-09-20 — Phase 8 (partie 3) : scénario B (récursion Storage)

- **Scénario B : PASS.** Même méthode qu'A (vraie route, session réelle de
  Beta, cookie `@supabase/ssr` conforme). 13 objets Beta répartis sur 2
  niveaux de profondeur et plusieurs fichiers par dossier
  (`b-fragment-1/2`, `b-commande-1/2`, `i-concurrence`, `j-isolation`).
  Réponse de la route : `{"ok":true,"photos_supprimees":6,"manuscrits_supprimes":7}`
  — comptage exact, confirme `listerRecursivement` en conditions réelles
  (jusqu'ici seulement mocké). Vérifié après coup : Auth Beta supprimé, tous
  ses objets Storage disparus, Alpha toujours absent, Gamma/Zeta/Delta/Epsilon
  strictement intacts. Détail : `docs/security/TEST-RESULTATS-A-J-2026-09-20.md`.
- **Effet de bord attendu et documenté** : ce scénario a aussi supprimé les
  fixtures `i-concurrence/` et `j-isolation/` préparées sur Beta pour les
  scénarios I et J — ces deux-là nécessitent une nouvelle préparation de
  données avant exécution.
- A-2026-09-12-05 : 2/10 scénarios validés dynamiquement. Toujours
  VALIDATION PARTIELLE. Aucun autre scénario lancé après B. Rien commité,
  rien pushé.

## 2026-09-20 — Phase 8 (partie 4) : scénario C (manuscrit + couverture, sans Lulu)

- **Scénario C : PASS.** Même méthode (vraie route, session réelle de
  Gamma, cookie `@supabase/ssr` conforme), sans jamais appeler Lulu. Réponse
  de la route : `{"ok":true,"photos_supprimees":0,"manuscrits_supprimes":2}`
  — comptage exact. Vérifié après coup : Auth Gamma supprimé, sa ligne
  `commandes_livre` disparue par cascade DB (pas par le code applicatif,
  qui ne supprime jamais explicitement cette ligne), les deux fichiers
  `interieur.pdf`/`couverture.pdf` supprimés, Zeta/Delta/Epsilon intacts,
  Alpha et Beta toujours absents. Détail :
  `docs/security/TEST-RESULTATS-A-J-2026-09-20.md`.
- Trajectoire Storage cumulée conforme à l'attendu : 21 → 16 (après A) → 3
  (après B) → 1 (après C, Zeta uniquement).
- A-2026-09-12-05 : 3/10 scénarios validés dynamiquement. Toujours
  VALIDATION PARTIELLE. Aucun autre scénario lancé après C. Rien commité,
  rien pushé.

## 2026-09-20 — Phase 8 (partie 5) : scénario D (double suppression / idempotence) — nuance importante trouvée

- **Scénario D : PASS**, avec une découverte notable sur le mécanisme réel.
  Même cookie de session Delta réutilisé pour 2 appels séquentiels sans
  ré-authentification (reproduit un double-clic/retry réel). 1er appel :
  `HTTP 200 {"ok":true,"photos_supprimees":0,"manuscrits_supprimes":0}`. 2e
  appel (même cookie) : **`HTTP 401 {"error":"Non authentifié."}`**.
- **Le test unitaire mocké (`route.test.ts`, cas "C") ne correspond pas au
  comportement réel** : il isolait la gestion du code 404 de `deleteUser` en
  mockant `getUser()` pour qu'il continue de réussir après suppression. En
  réalité, `auth.getUser()` échoue dès que le compte est supprimé (401 dès
  la ligne 10 de la route) — la branche "`deleteUser` 404 = succès" n'est
  **jamais atteinte par un simple rejeu séquentiel**, seulement par une
  vraie course concurrente (terrain du scénario I, pas D). Comportement
  observé sûr : pas de crash, pas de 500, pas d'effet de bord.
- Vérifié : Zeta (1 objet) et Epsilon (0 objet, compte toujours présent)
  strictement intacts. Détail complet :
  `docs/security/TEST-RESULTATS-A-J-2026-09-20.md`.
- A-2026-09-12-05 : 4/10 scénarios validés dynamiquement. Toujours
  VALIDATION PARTIELLE. Aucun autre scénario lancé après D. Rien commité,
  rien pushé.

## 2026-09-20 — Phase 8 (partie 6) : scénario E (objet déjà absent)

- **Scénario E : PASS.** Même méthode (vraie route, session réelle
  d'Epsilon). Épsilon vérifié vierge avant l'appel (0 objet Storage, 0
  donnée métier). Réponse : `{"ok":true,"photos_supprimees":0,"manuscrits_supprimes":0}`
  — 0 supprimé sur les deux préfixes, exactement attendu. Confirme en
  conditions réelles que `listerRecursivement` sur un préfixe jamais créé
  renvoie une liste vide sans erreur, jamais vérifié dynamiquement jusqu'ici
  (les tests unitaires mockaient directement le retour de
  `viderPrefixeUtilisateur`). Vérifié après coup : Auth Epsilon supprimé,
  Zeta strictement intact (1 objet, compte toujours présent). Détail :
  `docs/security/TEST-RESULTATS-A-J-2026-09-20.md`.
- A-2026-09-12-05 : 5/10 scénarios validés dynamiquement. Toujours
  VALIDATION PARTIELLE. Aucun autre scénario lancé après E. Rien commité,
  rien pushé.

## 2026-09-20 — Phase 8 (partie 7) : scénario F classé NON EXÉCUTABLE

- **Scénario F : NON EXÉCUTABLE**, sans aucune tentative destructive.
  Analyse préalable (5 points requis) montre que le nettoyage
  `viderPrefixeUtilisateur` tourne, dans la vraie route, via un client
  `service_role` qui contourne RLS par construction ; les buckets
  `photos`/`manuscrits` n'ont aucune limite de taille/type configurée —
  aucune donnée ne peut donc faire échouer réellement un seul des deux
  appels sans toucher à une policy, une configuration de bucket, le réseau
  ou la production, ce que cette consigne excluait explicitement. Cibler un
  bucket inexistant hors de la vraie route rendrait invérifiable le point
  "deleteUser jamais appelé par la vraie route". Détail complet du
  raisonnement : `docs/security/TEST-RESULTATS-A-J-2026-09-20.md`.
- Fixture Zeta vérifiée intacte avant et after (aucune tentative
  d'exécution) : 1 objet `photos`, 0 `manuscrits`, compte toujours présent.
  Aucune policy, configuration ou donnée modifiée.
- A-2026-09-12-05 : toujours 5/10 scénarios validés dynamiquement (F ne
  s'ajoute pas au compteur, n'ayant pas été exécuté). Aucun autre scénario
  lancé après F. Rien commité, rien pushé.

## 2026-09-20 — Phase 8B : reconstitution des fixtures G/H/I/J — préparation uniquement, aucun scénario exécuté

- **G confirmé NON EXÉCUTABLE** avant toute tentative (même blocage
  structurel que F, revérifié à froid) : les deux `upload()` de
  `commande/livre` utilisent le client RLS-bound (pas `service_role`) et
  ciblent le même préfixe autorisé `{user.id}/{commande.id}/` — les
  policies `own manuscrits/photos objects` sont strictement identiques pour
  les deux chemins, aucun levier data-only ne peut faire échouer l'un sans
  l'autre.
- **4 nouveaux comptes créés** : Eta (G/H), Theta (I), Iota + Kappa (J,
  dédiés exclusivement à ce scénario cette fois, sans autre fixture mêlée).
- **Eta** : abonnement actif, adresse, 1 session, 20 fragments (24 020
  mots) — mêmes prérequis qu'Alpha à l'origine. **État `echouee` seedé pour
  H** : 1 ligne `commandes_livre` (`statut='echouee'`), dossier
  `manuscrits/{eta_id}/{cet_id}/interieur.pdf` déposé directement (pas de
  panne provoquée — état de départ, pas un résultat).
- **Theta** : 1 fichier par bucket sous préfixe `i-test/`. Méthode de
  concurrence vérifiée sur une route non destructive (`GET /api/photos`) :
  2 requêtes lancées en arrière-plan démarrent à moins de 0,4 ms d'écart et
  s'exécutent en parallèle — technique validée pour I, aucun appel à
  `/api/compte/supprimer` effectué.
- **Iota + Kappa** : fixture symétrique complète (1 session, 1 fragment, 1
  ligne `photos`, 1 photo + manuscrit interieur+couverture chacun).
  Vérification de préparation des 3 canaux d'isolation : chaque compte
  interrogé **individuellement** voit uniquement sa propre photo (aucune
  tentative croisée Kappa→Iota effectuée, réservée à l'exécution réelle de
  J) ; policies Storage confirmées inchangées ; `fragment_id`/`photo_id`
  générés par `gen_random_uuid()`, non séquentiels.
- Zeta vérifié intact (1 objet) tout au long. Aucune policy, migration ou
  configuration modifiée. Rien commité, rien pushé.

## 2026-09-20 — Phase 8B (suite) : scénario H tenté — NON EXÉCUTABLE (identifiants Lulu sandbox invalides)

- Premier appel réel sur Eta : `HTTP 400` — manuscrit à 22 pages, sous le
  seuil de 24. **Découverte** : l'estimation initiale de volume de texte
  (24 020 mots "largement" suffisants) était fausse, jamais vérifiée
  empiriquement avant ce test — ratio réel ~1092 mots/page pour ce gabarit
  Typst. Fixture corrigée (Eta uniquement) : 20 fragments ajoutés, 39 240
  mots au total.
- Second appel réel : `HTTP 500` — `Authentification Lulu échouée:
  {"error":"invalid_client",...}`. **Les identifiants
  `LULU_SANDBOX_CLIENT_KEY`/`SECRET` dans `.env.local` sont invalides ou
  expirés** — échec avant l'étape d'upload Storage (récupération des
  dimensions de couverture). Non modifiés, conformément à la consigne.
- **Preuve partielle obtenue** : la ligne `commandes_livre` d'Eta reste
  unique (même id `ffcf4e33-...`, UPDATE et non INSERT confirmé), y compris
  après l'aller-retour `echouee → en_cours → echouee`. **Non observable en
  revanche** : la réutilisation du dossier Storage via un nouvel upload
  (jamais atteint).
- **H : NON EXÉCUTABLE** dans cette session — déblocage nécessiterait des
  identifiants Lulu sandbox valides, hors périmètre (aucune configuration
  modifiée). Zeta/Theta/Iota/Kappa strictement intacts. Détail complet :
  `docs/security/TEST-RESULTATS-A-J-2026-09-20.md`.

## 2026-09-20 — Phase 8B (suite) : H retenté et validé — PASS

- **Diagnostic** : les 4 variables Lulu de `.env.local` valaient
  littéralement `placeholder` (jamais renseignées, pas des identifiants
  expirés). Régis a mis à jour `LULU_SANDBOX_CLIENT_KEY`/`SECRET`.
  Authentification OAuth2 sandbox testée isolément (`HTTP 200`,
  `access_token` présent) avant tout nouvel appel applicatif, sans toucher
  à Eta ni afficher aucun secret.
- **H retenté sur Eta** (même `commande_id_avant = ffcf4e33-...`) :
  `POST /api/commande/livre` → `HTTP 200 {"ok":true,"nombre_pages":42}`.
- Vérifié : 1 seule ligne `commandes_livre` pour Eta, **même id** inchangé,
  `statut='confirmee'`, `lulu_print_job_id="337240"` (vrai print job
  sandbox), `nombre_pages=42`. Dossier Storage réutilisé :
  `interieur.pdf` remplacé (240 → 201 354 octets, vrai PDF), `couverture.pdf`
  créé (10 722 octets) — `upsert:true` confirmé fonctionnel. Un seul
  dossier sous le préfixe Eta, aucun nouveau créé.
  Zeta/Theta/Iota/Kappa strictement intacts.
- **A-2026-09-12-05 / Correction B (Phase 5) : validée dynamiquement pour
  la première fois de bout en bout**, y compris l'appel réel à Lulu
  sandbox. **Scénario H : PASS.** Aucun autre scénario lancé après H. Rien
  commité, rien pushé, aucun secret affiché.

## 2026-09-20 — Phase 8B (suite) : scénario I (suppressions concurrentes) — PASS, branche 404 vraisemblablement exercée

- **Scénario I : PASS.** Une seule session Theta, même cookie, 2 requêtes
  `POST /api/compte/supprimer` lancées en arrière-plan dans le même bloc
  shell — écart de départ mesuré : **0,46 ms**, exécutions qui se
  chevauchent (2,3s/2,6s de durée depuis le même départ). Aucune panne
  forcée, aucune policy/configuration touchée.
- **Observé directement** : les deux réponses `HTTP 200`, identiques
  (`photos_supprimees:1, manuscrits_supprimes:1`), aucune ligne
  `console.error` au log.
- **Déduit (pas observé directement)** : puisque les deux ont vu la liste
  Storage complète avant suppression et que les deux ont reçu `200` (pas de
  401/500), l'une des deux a nécessairement reçu un `404` de `deleteUser`
  et l'a traité comme un succès (`route.ts:60-71`) — **comble la lacune
  laissée ouverte par le scénario D**, où cette branche n'était jamais
  atteinte par un rejeu séquentiel.
- Vérifié : Theta supprimé, 0 objet résiduel, Zeta/Iota/Kappa/Eta
  strictement intacts. Détail complet, avec la distinction stricte
  observé/déduit : `docs/security/TEST-RESULTATS-A-J-2026-09-20.md`.
- Aucun scénario J lancé après I. Rien commité, rien pushé.

## 2026-09-20 — Phase 8B (fin) : scénario J (isolation complète Iota/Kappa) — PASS, clôture des 10 scénarios A–J

- **Scénario J : PASS.** Authentification uniquement comme Kappa (vraie
  session), aucune session Iota utilisée pendant les tentatives. Canal 1
  via la route réelle (`GET /api/photos`) ; canaux 2/3 via le vrai client
  `@supabase/supabase-js` authentifié comme Kappa (pas de mock).
- **Canal 1** : `HTTP 200`, exactement 1 photo renvoyée, tous les
  identifiants correspondent à Kappa, aucun à Iota.
- **Canal 2/3** : téléchargement direct de la photo, de `interieur.pdf` et
  de `couverture.pdf` d'Iota (chemins exacts connus, pas devinés) →
  **"Object not found"** à chaque fois (RLS Storage). Listage direct du
  préfixe Iota (`photos` et `manuscrits`) → liste vide. `SELECT * FROM
  photos` sans filtre depuis le contexte Kappa → ne renvoie que la ligne de
  Kappa (RLS table transparente, même sans clause `WHERE`).
- Vérifié après coup : Iota et Kappa **non supprimés**, tous deux toujours
  3 objets Storage chacun, Eta et Zeta inchangés, policies `storage.objects`
  identiques, 4 comptes Auth restants. Détail complet, distinction
  observé/déduit : `docs/security/TEST-RESULTATS-A-J-2026-09-20.md`.
- **Clôture des 10 scénarios du plan Phase 4 : 8 PASS (A, B, C, D, E, H, I,
  J), 2 NON EXÉCUTABLE (F, G — blocage structurel identique : `service_role`
  et RLS symétrique empêchent toute simulation data-only sans toucher
  policy/config), 0 FAIL.** A-2026-09-12-05 (Correction A et B, Phase 5)
  validée dynamiquement sur tous les points testables. Aucune policy,
  migration, configuration ou donnée de production modifiée à aucun moment
  de la Phase 8. Rien commité, rien pushé.
