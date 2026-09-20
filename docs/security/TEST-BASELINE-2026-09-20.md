# État initial — projet TEST avant exécution des scénarios A–J

**Date** : 2026-09-20, ~13:16–13:20 UTC (horodatage du dernier objet Storage créé avant ce relevé).
**Projet** : `zxlagkkujufmhwprwued` (confirmé via `get_project_url`).
**Méthode** : relevé strictement en lecture seule (`SELECT` uniquement, `list_migrations`, `get_project_url`) — aucune insertion, modification, suppression, migration ni changement de configuration effectué pour produire cet état.
**Objectif** : référence de comparaison à rejouer après chaque scénario A–J (Phase 8), pour objectiver ce qui a changé.

Contexte : suite à la Phase 7 (cf. `SECURITY-CHANGELOG.md`, environnement TEST mis en place) et à la préparation de données des étapes 1 à 2C+ de cette session (comptes Alpha–Zeta, fixtures A/B/C/F/I/J), ce document fige l'état juste avant le lancement du premier scénario dynamique.

---

## 1. Comptes Auth (6/6 attendus)

| Compte | UUID | Email | Confirmé | Créé à |
|---|---|---|---|---|
| Alpha | `bd18ccb7-b61b-47af-a31d-478ffa0db494` | narrateur-test-alpha@example.com | oui | 2026-09-20 12:57:50.13 UTC |
| Beta | `3c392239-d689-433a-b79d-a4b450b271b0` | narrateur-test-beta@example.com | oui | 2026-09-20 12:57:50.58 UTC |
| Gamma | `80c3c56c-efa5-414a-aaae-011d5e1ae8e3` | narrateur-test-gamma@example.com | oui | 2026-09-20 12:57:51.01 UTC |
| Delta | `44e1e6ff-7a69-4771-8e73-0cccc5c51ce6` | narrateur-test-delta@example.com | oui | 2026-09-20 12:57:51.46 UTC |
| Epsilon | `0f51022f-f0d1-4bb9-9d98-d484b5f4fea4` | narrateur-test-epsilon@example.com | oui | 2026-09-20 12:57:51.72 UTC |
| Zeta | `81fed8c4-30bf-4ffd-87c3-9c00236200cb` | narrateur-test-zeta@example.com | oui | 2026-09-20 12:57:51.98 UTC |

`select count(*) from auth.users` = **6** — aucun compte étranger sur le projet TEST.

---

## 2. Migrations appliquées (23/23)

`0001_sessions_fragments` → `0023_manuscrits_rls`, toutes appliquées (liste complète via `list_migrations`, dernière : `0023_manuscrits_rls` à `20260919163314`). Identique à l'état vérifié lors de la vérification de connexion initiale de cette session — pas de dérive.

---

## 3. Lignes par table métier (`public.*`)

| Table | Lignes | Détail |
|---|---|---|
| `abonnements` | 1 | Alpha, `status='active'` |
| `adresses_livraison` | 1 | Alpha |
| `sessions` | 1 | Alpha, `status='completed'` |
| `fragments` | 20 | Alpha, toutes liées à l'unique session (24 020 mots au total) |
| `photos` | 2 | Alpha — 1 pour le scénario A, 1 pour le scénario J |
| `commandes_livre` | 1 | Gamma (détail §4) |
| `fragments_historique` | 0 | — |
| `profil_narrateur` | 0 | — |
| `tours_conversation` | 0 | — |
| `banque_questions` | 0 | — |
| `codes_cadeau` | 0 | — |
| `usage_api` | 0 | — |
| `usage_anonyme` | 0 | — |
| `livres_reference` | 0 | — |
| `book_chunks` | 3862 | Pré-existant, non lié aux comptes de test (table de référence globale, pas de colonne `user_id`) — sans rapport avec les scénarios A–J |

---

## 4. Commande(s) `commandes_livre`

| id | user_id | statut | lulu_print_job_id | nombre_pages | created_at |
|---|---|---|---|---|---|
| `c0000000-0000-4000-8000-000000000001` | Gamma | `confirmee` | NULL | NULL | 2026-09-20 13:10:40.34 UTC |

Une seule ligne au total sur tout le projet. Note conservée depuis l'étape 2C : cet `id` ne correspond pas au nom littéral du dossier Storage `c-commande/` — volontaire, cette ligne sert de référence documentaire pour le scénario C (qui ne passe jamais par la route réelle `/api/commande/livre`), elle n'est lue par aucun code de nettoyage.

---

## 5. Objets Storage — 21 au total, par utilisateur et bucket

### Alpha (`bd18ccb7-...`) — 5 objets
| Bucket | Chemin | Octets | Créé à |
|---|---|---|---|
| photos | `120d6108-.../02d502ba-....jpg` (fixture A) | 287 | 13:06:41.66 |
| photos | `j-isolation/f34650ae-....jpg` (fixture J) | 287 | 13:16:20.73 |
| manuscrits | `d6506193-.../interieur.pdf` (fixture A, sans couverture) | 240 | 13:06:42.13 |
| manuscrits | `j-isolation/interieur.pdf` (fixture J) | 240 | 13:16:21.19 |
| manuscrits | `j-isolation/couverture.pdf` (fixture J) | 240 | 13:16:21.43 |

### Beta (`3c392239-...`) — 13 objets
| Bucket | Chemin | Octets |
|---|---|---|
| photos | `b-fragment-1/photo-a.jpg` | 287 |
| photos | `b-fragment-1/photo-b.jpg` | 287 |
| photos | `b-fragment-2/photo-c.jpg` | 287 |
| photos | `b-fragment-2/photo-d.jpg` | 287 |
| photos | `i-concurrence/photo.jpg` | 287 |
| photos | `j-isolation/photo.jpg` | 287 |
| manuscrits | `b-commande-1/interieur.pdf` | 240 |
| manuscrits | `b-commande-1/couverture.pdf` | 240 |
| manuscrits | `b-commande-2/interieur.pdf` | 240 |
| manuscrits | `b-commande-2/couverture.pdf` | 240 |
| manuscrits | `i-concurrence/interieur.pdf` | 240 |
| manuscrits | `j-isolation/interieur.pdf` | 240 |
| manuscrits | `j-isolation/couverture.pdf` | 240 |

### Gamma (`80c3c56c-...`) — 2 objets
| Bucket | Chemin | Octets |
|---|---|---|
| manuscrits | `c-commande/interieur.pdf` | 240 |
| manuscrits | `c-commande/couverture.pdf` | 240 |

### Zeta (`81fed8c4-...`) — 1 objet
| Bucket | Chemin | Octets |
|---|---|---|
| photos | `f-test/photo.jpg` | 287 |

### Delta (`44e1e6ff-...`) — 0 objet
### Epsilon (`0f51022f-...`) — 0 objet

**Total** : 5 + 13 + 2 + 1 + 0 + 0 = **21 objets**, tous mimetype/octets cohérents avec les fichiers factices déposés (JPEG 287 octets, PDF 240 octets).

---

## 6. Policies actuellement présentes

### `storage.objects`
| Policy | Bucket | Condition |
|---|---|---|
| `own photos objects` | `photos` | `(storage.foldername(name))[1] = auth.uid()::text` |
| `own manuscrits objects` | `manuscrits` | `(storage.foldername(name))[1] = auth.uid()::text` |

### `public.*` (tables impliquées dans les scénarios)
| Table | Policy | Commande | Condition |
|---|---|---|---|
| `abonnements` | Lecture de son propre abonnement | SELECT | `auth.uid() = user_id` |
| `adresses_livraison` | own adresse_livraison | ALL | `auth.uid() = user_id` |
| `sessions` | own sessions | ALL | `auth.uid() = user_id` |
| `fragments` | own fragments | ALL | `auth.uid() = user_id` |
| `photos` | own photos | ALL | `auth.uid() = user_id` |
| `commandes_livre` | own commandes_livre | ALL | `auth.uid() = user_id` |

Aucune policy Storage ni table modifiée depuis la vérification de configuration précédente (buckets `photos`/`manuscrits` : `public=false`, `file_size_limit=null`, `allowed_mime_types=null`, inchangés).

---

## 7. Étanchéité — aucune donnée étrangère aux 6 comptes

Vérifié par requête croisée sur toutes les tables métier (`abonnements`, `adresses_livraison`, `sessions`, `fragments`, `photos`, `commandes_livre`) et sur le premier segment de tous les chemins `storage.objects` :

- `user_ids_etrangers_tables` = **0**
- `prefixes_storage_etrangers` = **0**

Aucune ligne ni aucun objet n'appartient à un utilisateur en dehors d'Alpha, Beta, Gamma, Delta, Epsilon, Zeta.

---

## 8. Utilisation prévue de cette référence

Ce document doit être comparé à l'état du projet après exécution de chaque scénario A–J (mêmes requêtes, mêmes tables, mêmes préfixes Storage) pour objectiver précisément ce qui a changé et détecter tout effet de bord non prévu (ex. suppression partielle, fuite cross-user, ligne orpheline). Aucun scénario n'a été exécuté à la date de ce relevé.
