# Plan d'action technique — Racontez-moi

*Basé sur `docs/ETAT-DES-LIEUX-2026-08-20.md`, `docs/AUDIT-SECURITE-DEBUG-RATE-LIMITING-2026-08-21.md`, et vérification directe du code au commit `2abc146` (aucun changement de code depuis l'audit du 21/08/2026).*

Légende priorité : 🔴 critique · 🟠 haute · 🟡 moyenne · ⚪ basse

---

## Étape 1 — Sécurité (bloquant, gratuit à corriger)

### A1. Supprimer les deux routes de debug exposées
1. **Problème** : `GET /api/chapitre-test` et `GET /api/test-typst` sont publiques, sans auth, sans paramètre, et déclenchent chacune une compilation Typst réelle (CPU-bound) à chaque appel.
2. **Fichiers** : `app/api/chapitre-test/route.ts`, `app/api/test-typst/route.ts`.
3. **Risque actuel** : sécurité faible (contenu fictif codé en dur, aucune donnée narrateur) ; coût réel — vecteur de DoS applicatif gratuit pour un attaquant.
4. **Priorité** : 🔴 critique — corrigible en 2 minutes, sans aucune contrepartie fonctionnelle (aucune référence interne, confirmé par recherche exhaustive dans le dépôt).
5. **Difficulté** : triviale.
6. **Dépendances** : aucune.
7. **À tester** : `next build` passe toujours ; les deux routes renvoient 404 après déploiement ; aucune page/bouton ne les référence (déjà confirmé).
8. **Résultat attendu** : suppression du vecteur de coût gratuit, code mort éliminé.

### A2. Échapper le HTML injecté dans l'email de contact
1. **Problème** : `nom` et `message` sont insérés tels quels dans le HTML de l'email Brevo, sans échappement — injection HTML possible dans l'email reçu par le propriétaire.
2. **Fichiers** : `app/api/contact/route.ts`.
3. **Risque actuel** : faible (destinataire `to` codé en dur, donc pas de relais ouvert exploitable contre des tiers) mais réel pour le propriétaire (rendu HTML piégé dans sa boîte mail — lien trompeur, faux bouton).
4. **Priorité** : 🟡 moyenne.
5. **Difficulté** : triviale (fonction d'échappement HTML basique sur `nom`, `message`).
6. **Dépendances** : aucune.
7. **À tester** : envoyer un message contenant `< > & " '` et vérifier que le HTML reçu affiche ces caractères tels quels sans être interprété.
8. **Résultat attendu** : contenu utilisateur toujours affiché comme texte brut dans l'email.

### A3. Vérifier/mettre en place une protection plateforme (Vercel)
1. **Problème** : aucun `vercel.json`, aucune configuration de Deployment Protection ou Firewall versionnée dans le dépôt — protection potentiellement absente ou non documentée.
2. **Fichiers** : `vercel.json` (à créer si pertinent), configuration dashboard Vercel (hors dépôt).
3. **Risque actuel** : **hypothèse à vérifier** — non confirmable depuis le code seul, ni exclue.
4. **Priorité** : 🟠 haute (à vérifier en premier — peut réduire l'urgence relative de A4/A5 de l'étape 2, ou au contraire confirmer qu'ils sont indispensables).
5. **Difficulté** : faible si le plan Vercel le permet ; sinon nécessite un abonnement supérieur.
6. **Dépendances** : aucune, mais informe le dimensionnement de l'étape 2.
7. **À tester** : vérifier que les vrais utilisateurs ne sont pas bloqués (faux positifs) ; vérifier que le webhook Stripe reste joignable (IPs Stripe à autoriser si règles par IP).
8. **Résultat attendu** : visibilité claire sur ce qui protège déjà `/api`, ou mise en place d'une couche de défense complémentaire au code applicatif.

---

## Étape 2 — Maîtrise des coûts

### A4. Quota/rate limiting sur `/api/seance` et `/api/transcribe`
1. **Problème** : aucun compteur ni throttle. Ces deux routes enchaînent des appels facturés à l'usage (Anthropic, Groq Whisper) derrière un simple compte authentifié gratuit — rien n'empêche de les boucler en continu.
2. **Fichiers** : `app/api/seance/route.ts`, `app/api/transcribe/route.ts`, nouvelle table Postgres (ex. `rate_limits` ou compteur par `user_id`), nouveau `lib/rate-limit.ts`.
3. **Risque actuel** : **confirmé, élevé** — c'est le risque financier le plus sérieux identifié dans l'audit, sans plafond aujourd'hui.
4. **Priorité** : 🔴 critique.
5. **Difficulté** : moyenne — le pattern verrou applicatif + contrainte unique existe déjà dans le code (`codes_cadeau`), à réutiliser pour éviter les races.
6. **Dépendances** : aucune bloquante ; gagne à être testé (Étape 5) et surveillé (Étape 6) une fois en place.
7. **À tester** : comportement sous requêtes concurrentes (deux appels simultanés ne doivent pas doubler le quota) ; message d'erreur clair côté narrateur en cas de dépassement ; dimensionnement du quota par rapport à un usage légitime réel (pas de faux positif sur un narrateur assidu).
8. **Résultat attendu** : plafond journalier/horaire par utilisateur, requêtes au-delà rejetées en 429, facture bornée.

### A5. Rate limiting ou captcha sur les routes anonymes à coût réel
1. **Problème** : `POST /api/contact` (envoi Brevo) et `GET /api/cadeau/certificat/apercu` (compilation Typst + `sharp`) sont anonymes, sans captcha, sans throttle — flood trivial.
2. **Fichiers** : `app/api/contact/route.ts`, `app/api/cadeau/certificat/apercu/route.ts`, `lib/certificat.ts`.
3. **Risque actuel** : confirmé, réel — coût par appel (Brevo facturé au volume, compute Typst/sharp) et spam potentiel de la boîte mail.
4. **Priorité** : 🟠 haute.
5. **Difficulté** : faible (rate limit mémoire par IP, solution provisoire) à moyenne (intégration Turnstile/hCaptcha, solution durable).
6. **Dépendances** : aucune.
7. **À tester** : le formulaire de contact fonctionne toujours normalement pour un utilisateur légitime ; un flood simulé (script en boucle) est bloqué ou ralenti ; l'aperçu de certificat cadeau reste utilisable dans le parcours normal.
8. **Résultat attendu** : coût borné sur les deux routes anonymes les plus exposées.

### A6. Alerting sur dépassement de coût / usage anormal
1. **Problème** : même avec un quota (A4), rien ne signale aujourd'hui une dérive de facturation Anthropic/Groq/Lulu avant qu'elle ne devienne visible sur la facture.
2. **Fichiers** : nouveau — budgets/alertes natives des consoles Anthropic et Groq, ou tableau de bord agrégé.
3. **Risque actuel** : **hypothèse** (pas de données d'usage réel disponibles dans le dépôt) mais cohérent avec le risque coût confirmé en A4.
4. **Priorité** : 🟡 moyenne.
5. **Difficulté** : faible (alertes natives des consoles fournisseurs) à moyenne (dashboard custom).
6. **Dépendances** : postérieur à A4 (le quota) et bénéficie de l'observabilité de l'étape 6.
7. **À tester** : configuration des seuils vérifiée manuellement ; si possible, déclenchement contrôlé pour valider la réception de l'alerte.
8. **Résultat attendu** : alerte avant que la facture ne devienne un problème, indépendamment du quota applicatif.

---

## Étape 3 — Fiabilité

### A7. Comportement en cas de panne transitoire d'une API tierce pendant une séance
1. **Problème** : aucune logique de retry détectée sur les appels Anthropic, Groq ou HuggingFace (embeddings). Le précédent du domaine HuggingFace décommissionné (détecté et corrigé début juillet, documenté dans le code) montre qu'une panne tierce peut passer inaperçue en silence sans logging adapté.
2. **Fichiers** : `app/api/seance/route.ts`, `app/api/transcribe/route.ts`, `lib/embeddings.ts`, `lib/redaction.ts`.
3. **Risque actuel** : **hypothèse à vérifier** — confirmé qu'aucun retry n'existe (recherche `retry`/`backoff` négative), mais le comportement exact ressenti par le narrateur en cas d'échec transitoire (perte du tour vocal déjà transcrit ? message d'erreur clair ? possibilité de réessayer sans tout reperdre ?) n'a pas été audité en détail.
4. **Priorité** : 🟠 haute — un narrateur qui perd une réponse enregistrée pendant une séance émotionnellement chargée est un risque produit sérieux, pas seulement technique.
5. **Difficulté** : à préciser après investigation ciblée ; probablement moyenne (retry avec backoff sur l'appel LLM, sauvegarde de la transcription brute avant tout traitement IA pour ne jamais la perdre).
6. **Dépendances** : aucune.
7. **À tester** : simuler un timeout/erreur 500 de l'API tierce en cours de séance et vérifier qu'aucun contenu narrateur n'est perdu.
8. **Résultat attendu** : dégradation gracieuse, jamais de perte de contenu déjà produit par le narrateur.

### A8. CI minimal (lint + typecheck, puis tests)
1. **Problème** : aucun répertoire `.github/workflows`, aucune vérification automatique avant merge/déploiement.
2. **Fichiers** : `.github/workflows/ci.yml` (à créer).
3. **Risque actuel** : confirmé — absence totale de CI/CD, régressions non détectées avant mise en production.
4. **Priorité** : 🟠 haute.
5. **Difficulté** : faible (workflow standard `npm run lint` + `tsc --noEmit`, extensible avec les tests de l'étape 5).
6. **Dépendances** : indépendant, mais gagne en valeur une fois l'étape 5 (tests) démarrée.
7. **À tester** : provoquer volontairement une erreur de lint/type sur une branche et vérifier que le workflow échoue.
8. **Résultat attendu** : chaque push/PR vérifié automatiquement, filet de sécurité minimal avant tout futur changement.

---

## Étape 4 — Protection des données

### A9. Audit RLS exhaustif, policy par policy
1. **Problème** : le RLS est présent (mentionné dans 9 des 18 migrations) et l'état des lieux affirme des policies `auth.uid() = user_id` partout, mais cet audit n'a pas vérifié table par table que chaque opération (SELECT/INSERT/UPDATE/DELETE) est bien couverte, en particulier sur `photos`, `adresses_livraison`, `commandes_livre`, `fragments_historique`.
2. **Fichiers** : `supabase/migrations/*.sql` (18 fichiers).
3. **Risque actuel** : **hypothèse à vérifier** — RLS globalement confirmé présent, mais exhaustivité non vérifiée précisément par cette analyse.
4. **Priorité** : 🟠 haute (données personnelles et photos de narrateurs).
5. **Difficulté** : moyenne (revue manuelle systématique + tests d'accès croisé).
6. **Dépendances** : gagne à suivre A8/tests (Étape 5) pour produire des tests reproductibles plutôt qu'une vérification ponctuelle.
7. **À tester** : pour chaque table sensible, tenter en tant qu'utilisateur A de lire/modifier/supprimer une ligne appartenant à l'utilisateur B — doit systématiquement échouer.
8. **Résultat attendu** : confirmation documentée qu'aucune donnée n'est accessible entre narrateurs, ou correctifs sur les policies manquantes trouvées.

### A10. Revue des écritures via `service role` (contournement RLS volontaire)
1. **Problème** : plusieurs routes utilisent le client `service role` pour contourner RLS (webhook Stripe, suppression de compte, activation cadeau) — légitime, mais chaque usage doit être strictement scopé à ce qu'il doit faire.
2. **Fichiers** : `app/api/stripe/webhook/route.ts`, `app/api/compte/supprimer/route.ts`, `app/api/cadeau/activer/route.ts`, tout autre usage de `SUPABASE_SERVICE_ROLE_KEY`.
3. **Risque actuel** : **hypothèse** — usage légitime a priori (déjà confirmé correctement scopé sur les 3 routes inspectées : signature Stripe vérifiée, `user.id` de la session authentifiée utilisé), mais pas passé en revue exhaustivement sur l'ensemble du dépôt.
4. **Priorité** : 🟡 moyenne.
5. **Difficulté** : faible (revue de code ciblée, grep sur `SUPABASE_SERVICE_ROLE_KEY`).
6. **Dépendances** : peut être fait en même temps que A9.
7. **À tester** : pas de test automatisé spécifique — revue de code avec checklist (chaque usage service role limite bien ses requêtes à des identifiants déjà authentifiés/vérifiés en amont).
8. **Résultat attendu** : confirmation qu'aucun usage service role n'expose une écriture non scopée.

---

## Étape 5 — Tests

### A11. Mettre en place un framework de test et couvrir les chemins financiers/critiques
1. **Problème** : **zéro fichier de test dans tout le dépôt**, aucun `test`/`spec` trouvé, aucune dépendance de test (`vitest`, `jest`, `playwright`) installée. Seul `npm run lint` existe comme vérification.
2. **Fichiers** : nouvelle config (`vitest.config.ts` recommandé, léger et compatible Next/TS strict), tests prioritaires sur `lib/redaction.ts`, `lib/codes-cadeau.ts` (génération + unicité), `app/api/stripe/webhook/route.ts` (idempotence déjà en place dans le code, à figer par un test), `lib/typst.ts` (pagination/gouttière — logique la plus fragile et la moins visuellement vérifiable).
3. **Risque actuel** : **confirmé** — absence totale de filet de sécurité automatisé ; le précédent HuggingFace montre qu'une régression peut vivre en silence jusqu'à détection manuelle.
4. **Priorité** : 🟠 haute.
5. **Difficulté** : moyenne à élevée — la mise en place initiale est simple, mais écrire des tests significatifs sur la génération Typst et le RAG demandera du temps de conception (fixtures, mocks des API tierces).
6. **Dépendances** : aucune bloquante ; gagne à suivre les correctifs des étapes 1-2 pour les tester aussi (quota, échappement HTML).
7. **À tester** : les tests eux-mêmes constituent la vérification — la CI (A8) doit les exécuter à chaque push.
8. **Résultat attendu** : couverture des chemins où une régression coûte cher (paiement, code cadeau, pagination du livre imprimé) ou est difficile à repérer visuellement.

---

## Étape 6 — Observabilité

### A12. Error tracking structuré (Sentry ou équivalent)
1. **Problème** : gestion d'erreur limitée à `console.error`/`console.log`/`console.warn` dans 14 fichiers, aucun agrégateur, aucune alerte automatique — un incident n'est visible qu'en consultant manuellement les logs Vercel.
2. **Fichiers** : nouvelle intégration (SDK Sentry Next.js ou équivalent natif Vercel), instrumentation dans les route handlers `app/api/*`.
3. **Risque actuel** : confirmé — absence totale d'observabilité structurée.
4. **Priorité** : 🟡 moyenne-haute — utile dès maintenant pour surveiller les correctifs coût (A4-A6), mais moins urgent que la sécurité/coût directs.
5. **Difficulté** : faible-moyenne (SDK standard, bien documenté pour Next.js).
6. **Dépendances** : bénéficie d'être en place après A4 (pour observer aussi les rejets de quota) et avant toute nouvelle fonctionnalité (pour ne pas ajouter de surface non observée).
7. **À tester** : déclencher une erreur volontaire en environnement de test/staging et vérifier sa remontée dans le dashboard.
8. **Résultat attendu** : visibilité proactive sur les erreurs 5xx et les échecs d'API tierces, sans dépendre d'une consultation manuelle des logs.

---

## Étape 7 — Améliorations structurelles (non urgentes)

### A13. Centraliser la logique de rate limiting dans un module partagé
1. **Problème** : une fois A4/A5 en place, éviter que la logique de throttle soit dupliquée et incohérente entre routes.
2. **Fichiers** : `lib/rate-limit.ts` (à concevoir comme point d'entrée unique).
3. **Risque actuel** : aucun aujourd'hui — action préventive une fois A4/A5 livrés.
4. **Priorité** : ⚪ basse.
5. **Difficulté** : faible si conçu dès A4.
6. **Dépendances** : postérieur à A4/A5.
7. **À tester** : couvert par les tests de A4/A5 s'ils utilisent le module partagé.
8. **Résultat attendu** : un seul endroit à faire évoluer si la stratégie de rate limiting change (ex. migration vers Upstash si le produit grossit).

### A14. Vérifier la posture de bascule sandbox → production Lulu
1. **Problème** : l'état des lieux mentionne « sandbox par défaut, bascule prod manuelle » sans détail sur le mécanisme exact (variable d'environnement ? valeur en dur ?).
2. **Fichiers** : `lib/lulu.ts`.
3. **Risque actuel** : **hypothèse, non auditée en détail** — ni confirmée ni infirmée par cette analyse.
4. **Priorité** : ⚪ basse (à vérifier, pas de signal actuel de problème).
5. **Difficulté** : à déterminer après lecture du fichier.
6. **Dépendances** : aucune.
7. **À tester** : vérifier qu'aucune commande sandbox ne peut atterrir en prod par erreur de config, et inversement.
8. **Résultat attendu** : confirmation ou correction du mécanisme de bascule.

---

## Confirmé vs hypothèse vs recommandé non urgent

**Confirmé par lecture directe du code (session du 21/08/2026 + audit du 21/08/2026) :**
- A1 (routes debug), A2 (injection HTML contact), A4 (absence de rate limit sur seance/transcribe), A5 (absence de rate limit sur contact/apercu certificat), A7 (absence de retry — recherche négative), A8 (absence totale de CI), A11 (zéro test), A12 (absence d'error tracking structuré, uniquement `console.*`).

**Hypothèses à vérifier (non tranchées par le code seul) :**
- A3 (protection Vercel réelle en prod), A6 (usage réel actuel, pertinence des seuils d'alerte), A9 (exhaustivité RLS table par table), A10 (scoping exhaustif du service role sur tout le dépôt), A14 (mécanisme exact de bascule Lulu).

**Recommandé mais non urgent :**
- A13 (centralisation du rate limiting), et plus généralement toute migration vers Upstash/Redis (évoquée dans l'audit comme étape ultérieure si le produit grossit — inutile tant que le volume reste faible).

---

## Proposition de Phase 1 (avant toute nouvelle fonctionnalité)

Le sous-ensemble suivant est celui considéré comme raisonnable de boucler avant de reprendre le développement produit — tout est soit gratuit et confirmé (sécurité/coût), soit un filet de sécurité minimal qui protège les correctifs eux-mêmes :

1. **A1** — Supprimer les deux routes de debug (2 min, aucune contrepartie).
2. **A4** — Quota sur `/api/seance` et `/api/transcribe` (le vrai risque financier).
3. **A5** — Rate limit ou captcha sur `/api/contact` et `/api/cadeau/certificat/apercu`.
4. **A2** — Échapper le HTML de l'email de contact (5 min, fait en même temps que A5).
5. **A8** — CI minimale (lint + typecheck) pour que les 4 points précédents ne puissent pas régresser silencieusement.
6. **A11 (version réduite)** — Au minimum, des tests sur le nouveau code de quota (A4) et sur l'idempotence du webhook Stripe déjà en place, pas besoin de couvrir tout le dépôt dès cette phase.

Sont délibérément laissés hors de cette Phase 1 : A3 (nécessite d'abord de vérifier la config Vercel existante, pas un blocage), A6/A12 (observabilité — utile mais pas bloquant pour reprendre les features en toute sécurité), A9/A10 (audit RLS — important mais aucun signal actuel de faille, peut suivre en parallèle sans bloquer), et A7 (fiabilité API tierces — mérite une investigation dédiée avant chiffrage, pas un correctif « rapide »).
