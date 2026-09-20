# Résultats des scénarios dynamiques A–J — 2026-09-20

Projet TEST exclusivement : `zxlagkkujufmhwprwued`. Référence de comparaison :
`docs/security/TEST-BASELINE-2026-09-20.md`. Chaque scénario est exécuté un
par un, sur feu vert explicite, jamais en chaîne.

---

## Scénario A — Suppression normale du compte Alpha

**Statut : PASS**

### Méthode

Exécution de la **vraie route** `POST /api/compte/supprimer` (aucun mock,
aucun nettoyage manuel), via un serveur `next dev` lancé localement sur le
projet TEST (`.env.local`, `SUPABASE_ENV=test`), avec une **session réelle**
obtenue par `auth.signInWithPassword` pour Alpha (`narrateur-test-alpha@example.com`),
convertie en cookie `sb-zxlagkkujufmhwprwued-auth-token` avec l'encodage
exact utilisé par `@supabase/ssr` (`base64-` + base64url de `JSON.stringify(session)`,
vérifié dans `node_modules/@supabase/ssr/dist/main/cookies.js`). L'authenticité
du cookie a été vérifiée au préalable par un appel non destructif à
`GET /api/photos`, qui a renvoyé exactement les 2 photos d'Alpha.

### État ciblé juste avant l'appel (relevé frais, conforme au baseline)

| | Valeur |
|---|---|
| Compte Auth Alpha | présent |
| `abonnements` | 1 |
| `adresses_livraison` | 1 |
| `sessions` | 1 |
| `fragments` | 20 |
| `photos` (DB) | 2 |
| Objets Storage `photos/{alpha_id}/` | 2 |
| Objets Storage `manuscrits/{alpha_id}/` | 3 |

### Appel

`POST /api/compte/supprimer` → **HTTP 200**
```json
{"ok":true,"photos_supprimees":2,"manuscrits_supprimes":3}
```
Compte rendu par la route lui-même cohérent avec l'état ciblé ci-dessus (2
photos, 3 manuscrits).

### Vérifications post-exécution (lecture seule)

| Vérification | Résultat |
|---|---|
| Compte Auth Alpha supprimé | ✅ `count(*) from auth.users where id=alpha` = **0** |
| `abonnements`/`adresses_livraison`/`sessions`/`fragments`/`photos` (DB) d'Alpha | ✅ toutes à **0** (cascade `ON DELETE CASCADE` confirmée) |
| Objets sous `photos/{alpha_id}/` | ✅ **0** objet restant |
| Objets sous `manuscrits/{alpha_id}/` | ✅ **0** objet restant |
| Beta intact | ✅ 13 objets Storage (inchangé) |
| Gamma intact | ✅ 2 objets Storage, 1 `commandes_livre` (inchangé) |
| Zeta intact | ✅ 1 objet Storage (inchangé) |
| Delta / Epsilon intacts | ✅ 0 objet chacun (inchangé) |
| Total comptes Auth restants | ✅ **5** (6 − 1) |
| Total objets Storage restants | ✅ **16** (21 − 5, exactement les 5 objets d'Alpha) |

### Comparaison au baseline

Écart strictement limité aux données d'Alpha (1 compte Auth, 1 abonnement, 1
adresse, 1 session, 20 fragments, 2 lignes `photos`, 5 objets Storage) — tout
le reste de l'état (Beta, Gamma, Delta, Epsilon, Zeta, migrations, policies)
identique au baseline `TEST-BASELINE-2026-09-20.md`.

### Preuves conservées

- Réponse HTTP exacte de la route (ci-dessus).
- Comptages avant/après par requête `SELECT` directe (ci-dessus).
- Cookie de session et mot de passe : générés localement, jamais affichés,
  supprimés du disque immédiatement après l'exécution du test.

### Conclusion

Valide dynamiquement, pour la première fois contre un environnement réel, le
comportement de la correction **A-2026-09-12-05** (Phase 5) sur son chemin
nominal : le nettoyage Storage s'exécute avant `auth.admin.deleteUser`, les
comptages renvoyés par la route correspondent à la réalité, et la cascade DB
fonctionne comme prévu. Aucun effet de bord sur les autres comptes.

**Scénario A : PASS.** Aucun autre scénario exécuté après celui-ci.

---

## Scénario B — Récursion Storage (plusieurs niveaux, plusieurs fichiers)

**Statut : PASS**

### Méthode

Même méthode que A : vraie route `POST /api/compte/supprimer`, aucun mock,
session réelle de Beta (`narrateur-test-beta@example.com`) obtenue par
`signInWithPassword`, cookie `@supabase/ssr` reconstruit à l'identique.
Authenticité vérifiée par un appel non destructif à `GET /api/photos`
(`{"photos":[]}` — attendu, Beta n'a jamais eu de ligne dans la table
`photos`, seulement des objets Storage déposés directement).

### État ciblé juste avant l'appel (relevé frais, conforme au baseline)

13 objets sous `3c392239-.../` répartis sur **2 niveaux de profondeur** et
**plusieurs fichiers par dossier** :
- `photos/` : `b-fragment-1/{photo-a.jpg, photo-b.jpg}`, `b-fragment-2/{photo-c.jpg, photo-d.jpg}`, `i-concurrence/photo.jpg`, `j-isolation/photo.jpg` — 6 fichiers
- `manuscrits/` : `b-commande-1/{interieur.pdf, couverture.pdf}`, `b-commande-2/{interieur.pdf, couverture.pdf}`, `i-concurrence/interieur.pdf`, `j-isolation/{interieur.pdf, couverture.pdf}` — 7 fichiers

⚠️ Signalé avant exécution : ce scénario supprime le compte Beta dans son
intégralité, donc consomme aussi les fixtures `i-concurrence/` (préparées
pour I) et `j-isolation/` (préparées pour J). Ces deux scénarios devront
être re-préparés sur un compte avant de pouvoir être exécutés.

### Appel

`POST /api/compte/supprimer` → **HTTP 200**
```json
{"ok":true,"photos_supprimees":6,"manuscrits_supprimes":7}
```
Comptages exacts (6 + 7 = 13), cohérents avec l'état ciblé — confirme que la
récursion sur les 2 niveaux (`b-fragment-*/`, `b-commande-*/`, plus
`i-concurrence/`, `j-isolation/`) et tous les fichiers qu'ils contiennent ont
bien été pris en compte par `listerRecursivement`, en conditions réelles
(jamais vérifié dynamiquement jusqu'ici, seulement mocké).

### Vérifications post-exécution (lecture seule)

| Vérification | Résultat |
|---|---|
| Compte Auth Beta supprimé | ✅ **0** dans `auth.users` |
| Données DB de Beta (abonnements/adresses/sessions/fragments/photos/commandes) | ✅ toutes à **0** (Beta n'en avait aucune au départ, par conception du scénario B) |
| Objets sous `photos/{beta_id}/` | ✅ **0** restant |
| Objets sous `manuscrits/{beta_id}/` | ✅ **0** restant |
| 2 niveaux de profondeur + plusieurs fichiers pris en compte | ✅ 6+7=13 supprimés, exactement le compte attendu sur les 4 sous-dossiers |
| Alpha toujours absent | ✅ **0** dans `auth.users` |
| Gamma intact | ✅ 2 objets Storage, 1 `commandes_livre` |
| Zeta intact | ✅ 1 objet Storage |
| Delta / Epsilon intacts | ✅ 0 objet chacun |
| Total comptes Auth restants | ✅ **4** (6 − Alpha − Beta) |
| Total objets Storage restants | ✅ **3** (16 − 13, exactement Gamma+Zeta) |

### Comparaison au baseline

Écart cumulé (A + B) strictement limité à Alpha et Beta — Gamma, Delta,
Epsilon, Zeta, migrations et policies identiques au baseline
`TEST-BASELINE-2026-09-20.md`.

### Preuves conservées

Réponse HTTP exacte, comptages avant/après par `SELECT` direct (ci-dessus),
listing complet des 13 chemins avant suppression. Cookie/mot de passe
supprimés du disque après exécution.

### Conclusion

Valide dynamiquement, pour la première fois contre le vrai Storage Supabase,
la récursion multi-niveaux de `listerRecursivement` (`lib/nettoyage-storage.ts`)
— jusqu'ici seulement vérifiée par des mocks. Aucun effet de bord sur les
autres comptes.

**Scénario B : PASS.** Aucun autre scénario exécuté après celui-ci. **I et J
nécessitent une nouvelle préparation de données avant de pouvoir être
exécutés** (leurs fixtures Beta ont été supprimées par ce scénario).

---

## Scénario C — Manuscrit + couverture (sans Lulu)

**Statut : PASS**

### Méthode

Même méthode qu'A et B : vraie route `POST /api/compte/supprimer`, aucun
mock, session réelle de Gamma (`narrateur-test-gamma@example.com`) obtenue
par `signInWithPassword`, cookie `@supabase/ssr` reconstruit à l'identique.
Authenticité vérifiée par un appel non destructif à `GET /api/photos`
(`{"photos":[]}` — attendu, Gamma n'a jamais eu de ligne `photos`).

### État ciblé juste avant l'appel (relevé frais, conforme au baseline)

- `commandes_livre` : 1 ligne (`id=c0000000-...-001`, `statut='confirmee'`)
- `manuscrits/{gamma_id}/c-commande/` : exactement 2 fichiers, `interieur.pdf` et `couverture.pdf`
- Aucune ligne `photos`, aucun objet dans le bucket `photos`

### Appel

`POST /api/compte/supprimer` → **HTTP 200**
```json
{"ok":true,"photos_supprimees":0,"manuscrits_supprimes":2}
```
Comptage exact (0 photo, 2 manuscrits), cohérent avec l'état ciblé.

### Vérifications post-exécution (lecture seule)

| Vérification | Résultat |
|---|---|
| Compte Auth Gamma supprimé | ✅ **0** dans `auth.users` |
| Ligne `commandes_livre` de Gamma | ✅ **0** restante — supprimée par cascade `ON DELETE CASCADE` (`user_id → auth.users`, migration 0009), pas par le code applicatif (la route ne supprime jamais explicitement de ligne `commandes_livre`) |
| `manuscrits/{gamma_id}/.../interieur.pdf` | ✅ supprimé |
| `manuscrits/{gamma_id}/.../couverture.pdf` | ✅ supprimé |
| Objets de Zeta | ✅ 1 objet, inchangé |
| Objets/données de Delta | ✅ 0, inchangé |
| Objets/données d'Epsilon | ✅ 0, inchangé |
| Alpha et Beta toujours absents | ✅ **0** dans `auth.users` pour les deux |
| Total comptes Auth restants | ✅ **3** (6 − Alpha − Beta − Gamma) |
| Total `commandes_livre` restantes (tout le projet) | ✅ **0** (celle de Gamma était la seule) |
| Total objets Storage restants (tout le projet) | ✅ **1** (Zeta uniquement) |

### Comparaison au baseline et aux résultats A+B

Écart cumulé (A+B+C) strictement limité à Alpha, Beta et Gamma. Zeta, Delta,
Epsilon, migrations et policies identiques au baseline
`TEST-BASELINE-2026-09-20.md`. Cohérent avec la trajectoire attendue :
21 objets Storage initiaux → 16 après A → 3 après B → 1 après C.

### Preuves conservées

Réponse HTTP exacte, comptages avant/après par `SELECT` direct (ci-dessus).
Cookie/mot de passe supprimés du disque après exécution.

### Conclusion

Confirme, en conditions réelles (sans passer par Lulu, conformément au
prérequis de ce scénario), que le nettoyage Storage supprime correctement un
dossier manuscrit contenant à la fois `interieur.pdf` et `couverture.pdf`, et
que la ligne `commandes_livre` associée disparaît par la cascade DB déjà en
place — comportement jamais vérifié dynamiquement jusqu'ici. Aucun effet de
bord sur les autres comptes.

**Scénario C : PASS.** Aucun autre scénario exécuté après celui-ci.

---

## Scénario D — Double suppression / idempotence

**Statut : PASS** (avec une nuance importante sur le mécanisme réellement observé — voir Conclusion)

### Méthode

Vraie route `POST /api/compte/supprimer`, aucun mock, session réelle de
Delta (`narrateur-test-delta@example.com`) obtenue **une seule fois** par
`signInWithPassword` — le même cookie est réutilisé pour les deux appels,
sans ré-authentification entre les deux, pour reproduire fidèlement un
scénario de double-clic/retry côté client. Authenticité vérifiée au
préalable par `GET /api/photos` (`{"photos":[]}` — attendu).

### État avant le premier appel

Delta confirmé présent dans `auth.users`, sans aucune donnée DB ni Storage
(conforme à sa spécification : compte seul).

### Premier appel

`POST /api/compte/supprimer` → **HTTP 200**
```json
{"ok":true,"photos_supprimees":0,"manuscrits_supprimes":0}
```

### Second appel (même cookie, sans nouvelle authentification)

`POST /api/compte/supprimer` → **HTTP 401**
```json
{"error":"Non authentifié."}
```

### Vérifications post-exécution (lecture seule)

| Vérification | Résultat |
|---|---|
| Compte Auth Delta supprimé | ✅ **0** dans `auth.users` |
| Zeta intact | ✅ 1 objet Storage, toujours présent dans `auth.users` |
| Epsilon intact | ✅ 0 objet Storage, toujours présent dans `auth.users` |
| Total comptes Auth restants | ✅ **2** (Zeta + Epsilon) |
| Total objets Storage restants | ✅ **1** (Zeta) |
| Total `commandes_livre` restantes | ✅ **0** |

### Comparaison au baseline et aux résultats A–C

Écart cumulé (A+B+C+D) strictement limité à Alpha/Beta/Gamma/Delta. Zeta et
Epsilon identiques au baseline `TEST-BASELINE-2026-09-20.md`.

### Preuves conservées

Les deux réponses HTTP exactes (ci-dessus), comptages avant/après par
`SELECT` direct. Cookie/mot de passe supprimés du disque après exécution.

### Conclusion — nuance importante sur le mécanisme réel

Le comportement observé **diffère de ce que couvrait le test unitaire
mocké** (`app/api/compte/supprimer/route.test.ts`, cas "C — un deleteUser
déjà effectué (404) est traité comme un succès"). Ce test-là mockait
`auth.getUser()` pour qu'il continue de réussir même après suppression, afin
d'isoler et vérifier uniquement la gestion du code 404 de `deleteUser`
(lignes 60-71 de la route).

En conditions réelles, le second appel ne franchit jamais cette branche : `auth.getUser()`
lui-même échoue dès que le compte n'existe plus (le token JWT reste
signé valide mais Supabase Auth ne retrouve plus l'utilisateur associé), et
la route renvoie **401 "Non authentifié."** à la ligne 10, avant même
d'atteindre le nettoyage Storage ou `deleteUser`. Le comportement est **sûr
et sans effet de bord** — pas de crash, pas d'erreur 500, pas de double
traitement — mais la branche spécifique "`deleteUser` 404 = succès" reste
**non exercée par un simple rejeu séquentiel avec la même session**. Elle ne
serait potentiellement atteignable que dans une vraie course concurrente
(deux requêtes passant `getUser()` avant que l'une des deux ne termine
`deleteUser`) — c'est-à-dire le terrain du scénario **I**, pas de D tel que
rejoué ici.

**Scénario D : PASS** sur le critère réellement testable (idempotence côté
utilisateur : rejouer l'action ne casse rien, ne produit aucun effet
inattendu, échoue proprement). **Point ouvert à noter pour I** : c'est ce
scénario, pas D, qui pourra effectivement exercer la branche 404 de
`deleteUser` si une vraie concurrence est obtenue. Aucun autre scénario
exécuté après D.

---

## Scénario E — Objet déjà absent

**Statut : PASS**

### Méthode

Vraie route `POST /api/compte/supprimer`, aucun mock, session réelle
d'Epsilon (`narrateur-test-epsilon@example.com`) obtenue par
`signInWithPassword`, cookie `@supabase/ssr` reconstruit à l'identique.
Authenticité vérifiée par `GET /api/photos` (`{"photos":[]}` — attendu).

### État avant l'appel (relevé frais, conforme au baseline)

- Epsilon présent dans `auth.users`
- **0** objet sous `photos/{epsilon_id}/`
- **0** objet sous `manuscrits/{epsilon_id}/`
- **0** ligne dans `abonnements`, `adresses_livraison`, `sessions`, `fragments`, `photos`, `commandes_livre` pour Epsilon

### Appel

`POST /api/compte/supprimer` → **HTTP 200**
```json
{"ok":true,"photos_supprimees":0,"manuscrits_supprimes":0}
```
**0 objet supprimé sur les deux préfixes**, exactement comme prévu.

### Comportement de `viderPrefixeUtilisateur` sur un préfixe inexistant

Confirmé en conditions réelles : `listerRecursivement` sur un préfixe qui
n'a jamais existé renvoie une liste vide dès le premier appel à
`storage.list()` (pas d'erreur Storage), donc `viderPrefixeUtilisateur`
retourne `{videe: true, supprimes: 0}` sans jamais appeler `remove()` — et
la route poursuit normalement jusqu'à `deleteUser`, sans traitement
particulier requis pour ce cas. Comportement jamais vérifié dynamiquement
jusqu'ici (les tests unitaires mockaient directement le retour de
`viderPrefixeUtilisateur`, sans jamais exercer `listerRecursivement`
lui-même sur un vrai bucket Storage vide).

### Vérifications post-exécution (lecture seule)

| Vérification | Résultat |
|---|---|
| Compte Auth Epsilon supprimé | ✅ **0** dans `auth.users` |
| Zeta — objets Storage | ✅ **1**, inchangé |
| Zeta — présent dans `auth.users` | ✅ toujours présent |
| Total comptes Auth restants | ✅ **1** (Zeta uniquement) |
| Total objets Storage restants | ✅ **1** (Zeta) |
| Total `commandes_livre` restantes | ✅ **0** |

### Comparaison au baseline et aux résultats A–D

Écart cumulé (A+B+C+D+E) strictement limité à Alpha/Beta/Gamma/Delta/Epsilon.
Zeta identique au baseline `TEST-BASELINE-2026-09-20.md`. Trajectoire
Storage : 21 → 16 → 3 → 1 → 1 → 1 (E ne change rien, conforme à l'attendu).

### Preuves conservées

Réponse HTTP exacte, comptages avant/après par `SELECT` direct. Cookie/mot
de passe supprimés du disque après exécution.

### Conclusion

Confirme en conditions réelles que le nettoyage Storage est idempotent sur
un compte n'ayant jamais rien uploadé : aucune erreur, aucun objet
fantôme supprimé (0 partout), suppression du compte aboutissant normalement.
Aucun effet de bord sur Zeta.

**Scénario E : PASS.** Aucun autre scénario exécuté après celui-ci.

---

## Scénario F — Échec partiel du nettoyage Storage

**Statut : NON EXÉCUTABLE**

### Analyse préalable (avant toute action)

Fixture confirmée avant tentative : Zeta présent dans Auth, 1 objet
`photos/{zeta_id}/`, 0 objet `manuscrits/{zeta_id}/`. Buckets `photos`/
`manuscrits` toujours `public=false`, `file_size_limit=null`,
`allowed_mime_types=null` (inchangés depuis la vérification initiale).

La route (`app/api/compte/supprimer/route.ts:40-43`) appelle
`viderPrefixeUtilisateur` sur les deux buckets via un client **`service_role`**,
qui contourne systématiquement RLS. Les cinq points requis avant exécution :

1. **Fonction réelle** : `viderPrefixeUtilisateur` (`lib/nettoyage-storage.ts`), via le vrai client `service_role`.
2. **Appel qui doit réussir** : `photos` (1 objet réel à supprimer).
3. **Appel qui doit échouer** : `manuscrits`.
4. **État final attendu** : `deleteUser` jamais appelé, compte et objet `photos` intacts.
5. **Vérification que `deleteUser` n'a pas tourné** : code 500 de la vraie route, compte toujours dans `auth.users`, objet `photos` toujours présent.

**Le point 3 ne peut pas être démontré sous les contraintes imposées**
(aucune policy, aucune configuration Storage, aucune panne réseau, aucune
intervention PROD) : `service_role` contourne RLS par construction, et les
deux buckets n'ont aucune limite de taille/type configurée — il n'existe
donc aucune donnée capable de faire échouer réellement un `list()`/`remove()`
de ce client sur les buckets réels `photos`/`manuscrits`. La seule
alternative data-only (cibler un nom de bucket inexistant) sortirait de la
vraie route `/api/compte/supprimer`, rendant le point 5 invérifiable (on ne
saurait plus si "deleteUser n'a pas tourné" pour la vraie route, puisqu'on ne
l'aurait jamais appelée).

### Conclusion

**F : NON EXÉCUTABLE** dans ce périmètre strict. Le mécanisme de garde
`if (!photos.videe || !manuscrits.videe)` de la route reste non exercé
dynamiquement — seuls les tests unitaires mockés (`route.test.ts`, cas "B")
le couvrent. Déblocage possible mais hors périmètre ici : modification
réversible et temporaire du `file_size_limit` d'un bucket, à valider
séparément si souhaité.

**Aucune action destructive tentée. Aucun autre scénario exécuté.**

---

## Scénario G — Upload partiel commande → rollback

**Statut : NON EXÉCUTABLE**

Confirmé sans aucune tentative, en relisant à froid les policies `storage.objects`
(`own manuscrits objects` / `own photos objects`, toutes deux conditionnées
uniquement sur `(storage.foldername(name))[1] = auth.uid()::text`) : les
deux `upload()` de `commande/livre` utilisent le client authentifié RLS-bound
(pas `service_role`) et ciblent le même préfixe autorisé
`{user.id}/{commande.id}/` pour `interieur.pdf` et `couverture.pdf` — les
deux chemins sont donc strictement équivalents du point de vue RLS. Aucune
donnée ne peut faire échouer l'un sans l'autre sans toucher policy,
configuration Storage, réseau ou production. Même blocage structurel que F.

---

## Scénario H — Retry commande échouée → réutilisation du même commande_id

**Statut : NON EXÉCUTABLE** (blocage externe découvert en cours d'exécution)

### Préparation et état avant l'appel

Compte **Eta** (`8bb9e35a-8915-4eda-86b5-e1bc50b4ee60`) : abonnement actif,
adresse complète, 20 fragments (24 020 mots). 1 ligne `commandes_livre`
pré-seedée : `commande_id_avant = ffcf4e33-7549-4a4a-bb33-790659340ee2`,
`statut='echouee'`. Dossier `manuscrits/{eta_id}/ffcf4e33.../interieur.pdf`
(240 octets, factice) déjà en place.

### Premier appel réel — révèle un problème de fixture (pas de l'app)

`POST /api/commande/livre` → **HTTP 400**
```json
{"error":"Votre manuscrit fait 22 pages — il en faut au moins 24 pour un livre relié. Continuez vos séances."}
```
**Découverte** : l'estimation initiale (« 24 020 mots dépassent largement 24
pages ») était fausse — jamais vérifiée empiriquement avant ce test. Ratio
réel mesuré : ~1092 mots/page pour ce gabarit Typst (11pt, trim 6×9po).
Ce contrôle a lieu **avant** la logique de réutilisation de commande — la
ligne `echouee` n'a pas été touchée par cet appel (vérifié : toujours
`statut='echouee'`, même id, après ce premier appel).

**Correction du fixture** (Eta uniquement, aucun autre compte touché) : 20
fragments supplémentaires ajoutés (~15 200 mots), total 39 240 mots sur 40
fragments — largement au-dessus du seuil recalculé.

### Second appel réel

`POST /api/commande/livre` → **HTTP 500**
```json
{"error":"Échec de la commande. Réessayez, ou contactez-nous."}
```

Log serveur exact :
```
Commande livre échouée: Error: Authentification Lulu échouée: {"error":"invalid_client","error_description":"Invalid client or Invalid client credentials"}
    at obtenirToken (lib/lulu.ts:39:22)
    at async dimensionsCouverture (lib/lulu.ts:61:17)
    at async compilerCouverture (lib/manuscrit.ts:85:16)
    at async POST (app/api/commande/livre/route.ts:96:30)
```

**Cause identifiée : les identifiants Lulu sandbox (`LULU_SANDBOX_CLIENT_KEY`/
`SECRET` dans `.env.local`) sont invalides ou expirés** — blocage externe,
survenu **avant** l'étape d'upload Storage (la récupération des dimensions
de couverture auprès de Lulu a lieu pendant `compilerCouverture`, avant les
deux `upload()`). Conformément à la consigne (« ne touche à aucune
configuration »), ces identifiants n'ont pas été modifiés ni régénérés.

### Vérifications post-appel (lecture seule)

| Vérification | Résultat |
|---|---|
| `commandes_livre` pour Eta | 1 seule ligne, **même id** `ffcf4e33-...` (aucune nouvelle commande créée — la logique UPDATE-plutôt-qu'INSERT a bien tourné) |
| `statut` final | `echouee` (repassé par `en_cours` en interne, remis à `echouee` par le bloc `catch`) |
| `lulu_print_job_id` | `NULL` (jamais atteint) |
| Contenu du dossier Storage `manuscrits/{eta_id}/ffcf4e33.../` | **inchangé** — toujours uniquement le fichier factice initial (240 octets) ; aucun nouvel upload n'a eu lieu puisque l'échec survient avant cette étape |
| Aucun nouveau dossier créé | ✅ confirmé (1 seul dossier sous le préfixe Eta) |
| Zeta / Theta / Iota / Kappa | ✅ tous strictement inchangés (1/2/3/3 objets respectivement) |
| Total comptes Auth | ✅ **5**, inchangé |

### Verdict

**H : NON EXÉCUTABLE.** Le point précis que ce scénario devait démontrer —
la réutilisation du **dossier Storage** via un nouvel upload (`upsert:true`
écrasant le fichier existant) — n'a pas pu être observé, l'échec Lulu
survenant avant l'étape d'upload. **Preuve partielle obtenue malgré tout** :
la réutilisation de la **ligne `commandes_livre`** (même id, UPDATE et non
INSERT) est confirmée, y compris après un aller-retour `echouee → en_cours →
echouee`. Débloquer la validation complète nécessiterait des identifiants
Lulu sandbox valides — hors périmètre de cette session (aucune modification
de configuration autorisée). Aucun autre compte touché, aucune policy ni
configuration modifiée.

---

### H — Retenté après correction des identifiants Lulu sandbox

**Statut final : PASS**

**Diagnostic entre-temps** (lecture seule, hors périmètre du scénario) :
les 4 variables Lulu de `.env.local` valaient littéralement `placeholder`
(11 caractères) — jamais renseignées, pas des identifiants expirés. Régis a
mis à jour `LULU_SANDBOX_CLIENT_KEY`/`SECRET` avec de vraies valeurs.
Authentification OAuth2 testée isolément contre
`https://api.sandbox.lulu.com/auth/realms/glasstree/protocol/openid-connect/token`
→ `HTTP 200`, `access_token` présent — confirmé indépendamment de la route
applicative, sans toucher à Eta ni afficher aucun secret.

**État initial revérifié juste avant le nouvel appel** : identique à la
tentative précédente — `commande_id_avant = ffcf4e33-...`, `statut='echouee'`,
dossier avec uniquement le fichier factice (240 octets).

**Appel** : `POST /api/commande/livre` → **HTTP 200**
```json
{"ok":true,"nombre_pages":42}
```

**Vérifications post-exécution (lecture seule)** :

| Vérification | Résultat |
|---|---|
| Nombre de `commandes_livre` pour Eta | ✅ **1** (aucune nouvelle ligne) |
| `commande_id` | ✅ **inchangé** — toujours `ffcf4e33-7549-4a4a-bb33-790659340ee2` |
| `statut` final | ✅ `confirmee` |
| `lulu_print_job_id` | ✅ `"337240"` (vrai print job Lulu sandbox, jamais facturé/imprimé) |
| `nombre_pages` | ✅ `42` |
| Contenu du dossier `manuscrits/{eta_id}/ffcf4e33.../` | ✅ `interieur.pdf` **remplacé** (240 → 201 354 octets, vrai PDF compilé) ; `couverture.pdf` **créé** (10 722 octets) — `upsert:true` a fonctionné comme prévu |
| Nombre de dossiers distincts sous le préfixe Eta | ✅ **1** — aucun nouveau dossier créé |
| Zeta / Theta / Iota / Kappa | ✅ tous strictement inchangés (1/2/3/3 objets) |
| Total `commandes_livre` (tout le projet) | ✅ **1** (celle d'Eta) |
| Total comptes Auth | ✅ **5**, inchangé |

### Conclusion

Valide dynamiquement, pour la première fois contre le vrai Storage et la
vraie API Lulu sandbox, le comportement complet de la Correction B (Phase
5) : une commande `echouee` est reprise par **UPDATE** (jamais un nouvel
`INSERT`), le même `commande_id` et le même dossier Storage sont réutilisés
d'un bout à l'autre, `upsert:true` remplace/ajoute correctement les
fichiers, et la commande aboutit à un vrai print job Lulu. Aucun effet de
bord sur les autres comptes.

**Scénario H : PASS.** Aucun autre scénario exécuté après celui-ci. Aucune
policy, migration, configuration ou donnée de production modifiée. Aucun
secret Lulu affiché à aucun moment.

---

## Scénario I — Suppressions concurrentes

**Statut : PASS**

### État initial (relevé frais, avant tout appel)

Theta (`47b8e434-2162-4f6f-8520-55e542312226`) présent dans `auth.users`,
1 fichier `photos/i-test/photo.jpg`, 1 fichier `manuscrits/i-test/interieur.pdf`.

### Méthode

**Aucune panne forcée, aucune modification de policy/configuration.** Une
seule session Theta obtenue par `signInWithPassword`, le même cookie utilisé
pour les deux requêtes. Les deux `POST /api/compte/supprimer` lancées en
arrière-plan dans le même bloc shell (`(...) & (...) & wait`), chacune
horodatée juste avant et après l'appel `curl`.

### Ce qui est directement observé

| Élément | req1 | req2 |
|---|---|---|
| Horodatage de départ | 1789918612.408311502 | 1789918612.408774342 |
| **Écart de départ** | **0,46 ms** | |
| Code HTTP | 200 | 200 |
| Réponse | `{"ok":true,"photos_supprimees":1,"manuscrits_supprimes":1}` | `{"ok":true,"photos_supprimees":1,"manuscrits_supprimes":1}` |
| Durée d'exécution | 2,3 s | 2,6 s |

Les deux durées se chevauchent largement dans le temps (démarrage à moins
de 0,5 ms d'écart, fin à 2,3 s et 2,6 s après ce même départ) — les deux
requêtes étaient bien **en vol simultanément**, pas traitées l'une après
l'autre. Log serveur : **aucune ligne `console.error`** pour les deux
requêtes (les deux se sont terminées en `200`, sans passer par le chemin
d'erreur qui logue).

### Ce qui est déduit (pas observé directement)

Les deux réponses renvoient **le même compte** (`photos_supprimees:1,
manuscrits_supprimes:1`) alors qu'il n'existait qu'1 seul fichier par
bucket au total — ce qui signifie que **les deux requêtes ont exécuté leur
propre `listerRecursivement` avant qu'aucune des deux n'ait supprimé le
fichier** (chacune a vu la liste initiale complète, indépendamment).
Puisque **les deux ont reçu un code 200** (aucune n'a reçu 401 ni 500), et
qu'un compte ne peut être réellement supprimé qu'une seule fois par
`auth.admin.deleteUser` :

**→ l'une des deux requêtes a nécessairement reçu un code 404 de
`deleteUser` (l'utilisateur venait d'être supprimé par l'autre) et l'a
traité comme un succès** — c'est la branche `route.ts:60-71`
(`if (error.status !== 404) return 500`) qui a permis à cette seconde
requête de renvoyer 200 malgré un utilisateur déjà absent. **Ceci n'est pas
observé directement** (les deux réponses sont identiques en forme, rien ne
permet de savoir de l'extérieur laquelle des deux a pris cette branche) —
c'est une déduction logique à partir de l'impossibilité que les deux
`deleteUser` réussissent "normalement" sur le même utilisateur, combinée à
l'absence de code 500.

Ce point comble exactement la lacune notée dans le scénario D : la branche
404 de `deleteUser`, jamais atteinte par un rejeu séquentiel, **a
vraisemblablement été exercée ici** par une vraie course concurrente.

### Vérifications post-exécution (lecture seule)

| Vérification | Résultat |
|---|---|
| Compte Auth Theta supprimé | ✅ **0** dans `auth.users` |
| Objets sous `photos/{theta_id}/` et `manuscrits/{theta_id}/` | ✅ **0** — liste vide, aucune donnée résiduelle |
| Zeta intact | ✅ 1 objet Storage |
| Iota intact | ✅ 3 objets Storage |
| Kappa intact | ✅ 3 objets Storage |
| Eta et sa commande `confirmee` | ✅ toujours présents, `commandes_livre` = 1 au total (celle d'Eta) |
| Total comptes Auth restants | ✅ **4** (Eta, Zeta, Iota, Kappa) |

### Conclusion

**I : PASS.** Directement observé : deux suppressions réellement
concurrentes (écart de départ < 0,5 ms, exécutions qui se chevauchent),
toutes deux `200`, aucune erreur, aucune donnée résiduelle, aucun effet de
bord sur les autres comptes. Déduit avec un haut niveau de confiance (pas
observé directement) : la branche 404 de `deleteUser` a été exercée par
l'une des deux requêtes — point resté ouvert depuis D, désormais couvert.
Aucune panne forcée, aucune policy/configuration/migration/production
touchée.

**Aucun autre scénario (J) exécuté après I.**

---

## Scénario J — Isolation complète A/B (Iota/Kappa)

**Statut : PASS**

### État initial (relevé frais, avant toute tentative)

| | Iota (`59d28d24-...`) | Kappa (`1ec48fbf-...`) |
|---|---|---|
| Auth | présent | présent |
| Objets Storage | 3 (photo + interieur + couverture) | 3 (idem) |
| Ligne `photos` (DB) | 1 | 1 |

Aucune tentative croisée effectuée avant ce relevé.

### Méthode

Authentification **uniquement comme Kappa** (`signInWithPassword`, vraie
session). Aucune session Iota utilisée pendant les tentatives d'accès.
Canal 1 via la vraie route applicative (`GET /api/photos`, cookie
`@supabase/ssr`) ; canaux 2 et 3 via le **vrai client `@supabase/supabase-js`
authentifié comme Kappa** (anon key + session réelle), en appelant
directement `storage.from(bucket).download(chemin)` — c'est exactement
l'appel qu'un navigateur ferait, soumis à RLS comme n'importe quel client
front-end. Aucun mock, aucune policy modifiée.

### Canal 1 — `GET /api/photos` en tant que Kappa

**Directement observé** : `HTTP 200`, la réponse contient **exactement 1**
photo, avec `id=733a2c42-...`, `fragment_id=c44813a3-...`,
`chemin=1ec48fbf-.../j-isolation/photo.jpg` — **tous les identifiants
correspondent à Kappa**, aucun à Iota (`dc4fa656-...`/`0920a5f2-...`/
`59d28d24-...`).

**Conclusion sur ce canal** : aucune déduction nécessaire — le résultat est
sans ambiguïté.

### Canal 2 — téléchargement direct de la photo d'Iota

**Directement observé** : `supabaseKappa.storage.from("photos").download("59d28d24-.../j-isolation/photo.jpg")` → **erreur `"Object not found"`**, aucune donnée reçue.

**Déduit** : Supabase Storage renvoie la même erreur générique qu'un objet
inexistant, que l'objet existe réellement (mais hors de portée RLS) ou pas
du tout — le message ne confirme ni n'infirme l'existence de l'objet à un
attaquant, ce qui est le comportement souhaité (pas de fuite d'information
par la forme de l'erreur). Le fait que **nous savons** (côté audit) que
l'objet existe réellement, combiné à cette erreur, confirme que c'est bien
la policy `own photos objects` qui bloque, pas une absence de fichier.

### Canal 3 — manuscrit et couverture d'Iota

**Directement observé** :
- `storage.from("manuscrits").download(".../interieur.pdf")` → erreur `"Object not found"`
- `storage.from("manuscrits").download(".../couverture.pdf")` → erreur `"Object not found"`
- `storage.from("photos").list("59d28d24-...")` (listage direct du préfixe d'Iota) → `[]` (liste vide)
- `storage.from("manuscrits").list("59d28d24-...")` → `[]` (liste vide)
- `supabaseKappa.from("photos").select("*")` **sans aucun filtre** → renvoie **exclusivement** la ligne de Kappa, jamais celle d'Iota (RLS table appliquée automatiquement, même sans clause `WHERE` côté client)

**Déduit** : « aucun accès croisé possible par identifiant/chemin » est
confirmé à deux niveaux — (1) même en connaissant le chemin exact
(construit par l'audit, pas deviné), l'accès est refusé ; (2) même un
listage ou une lecture de table sans filtre ne laisse rien fuiter, la
policy s'applique de façon transparente. Complément structurel (non testé
en direct ici, déjà établi par le schéma) : `fragment_id`/`photo_id`/
`commande_id` sont générés par `gen_random_uuid()` — non énumérables même
si la protection RLS venait à faillir ailleurs.

### Vérifications post-tests (lecture seule)

| Vérification | Résultat |
|---|---|
| Iota toujours présent, non supprimé | ✅ |
| Kappa toujours présent, non supprimé | ✅ |
| Objets Storage d'Iota | ✅ **3**, inchangés |
| Objets Storage de Kappa | ✅ **3**, inchangés |
| Eta inchangé | ✅ 2 objets Storage, sa commande `confirmee` toujours unique sur le projet |
| Zeta inchangé | ✅ 1 objet Storage |
| Policies `storage.objects` | ✅ identiques (`own photos objects`, `own manuscrits objects`, conditions inchangées) |
| Total comptes Auth | ✅ **4** (Eta, Zeta, Iota, Kappa) — aucune suppression |

### Conclusion

**J : PASS.** Les trois canaux confirment l'isolation complète entre
comptes : RLS Storage et RLS table bloquent tout accès croisé, même avec le
chemin exact connu, sans laisser fuiter d'information distinguant "objet
inexistant" de "objet protégé". Aucune policy, migration, configuration ou
donnée de production modifiée. Iota et Kappa n'ont pas été supprimés.
Aucun autre scénario exécuté.

---

## Récapitulatif final A–J

| # | Scénario | Statut |
|---|---|---|
| A | Suppression normale | **PASS** |
| B | Récursion Storage | **PASS** |
| C | Manuscrit + couverture (sans Lulu) | **PASS** |
| D | Double suppression / idempotence | **PASS** (nuance : branche 404 non atteinte par rejeu séquentiel) |
| E | Objet déjà absent | **PASS** |
| F | Échec partiel du nettoyage Storage | **NON EXÉCUTABLE** (blocage structurel : `service_role` contourne RLS) |
| G | Upload partiel commande → rollback | **NON EXÉCUTABLE** (même blocage structurel que F) |
| H | Retry commande échouée | **PASS** (après correction des identifiants Lulu sandbox par Régis) |
| I | Suppressions concurrentes | **PASS** (branche 404 de D vraisemblablement exercée ici) |
| J | Isolation complète A/B | **PASS** |

**8 PASS, 2 NON EXÉCUTABLE, 0 FAIL.** A-2026-09-12-05 (Correction A et B, Phase 5) validée dynamiquement sur tous les points testables sans modification de policy/configuration/production.
