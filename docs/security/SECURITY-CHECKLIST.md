# Racontez-moi.com — Checklist de sécurité réutilisable

> À reparcourir à chaque audit de suivi (cf. `SECURITY-MASTER-AUDIT.md`,
> section 24) et à chaque évolution importante du site (section 25 du même
> document : nouvelle table, nouveau bucket, nouvelle API, changement de
> RLS, nouveau type de compte...).

## Authentification
- [x] Routes privées protégées — `middleware.ts` pour `/tableau-de-bord` et
      `/seance`, vérification `auth.getUser()` server-side ailleurs
      (`/mon-livre`, toutes les routes API)
- [x] Session vérifiée côté serveur (jamais côté client seul)
- [x] Cookies/session correctement gérés (`@supabase/ssr`, jamais manipulés
      à la main)
- [x] Aucun accès basé uniquement sur le frontend

## Autorisation
- [x] Chaque ressource utilisateur possède un contrôle de propriété (RLS +
      filtre `.eq("user_id", user.id)` applicatif, sur les 24 routes)
- [x] Aucun ID client considéré comme preuve d'autorisation
- [x] Tests IDOR effectués (analyse statique — aucun test dynamique réel)
- [x] Broken Access Control recherché — aucun trouvé au 12/09/2026

## Supabase
- [x] RLS activée sur les tables concernées (22 migrations relues)
- [x] SELECT vérifié
- [x] INSERT vérifié
- [x] UPDATE vérifié
- [x] DELETE vérifié
- [x] RPC vérifiées (`incrementer_et_verifier_usage[_anonyme]`, revérifient
      `auth.uid()` correctement)
- [x] SECURITY DEFINER vérifiées — seules les deux RPC ci-dessus en
      possèdent

## Storage
- [x] Buckets vérifiés — 2 identifiés (`photos`, `manuscrits`)
- [ ] Policies vérifiées — `photos` : OUI (versionnée, correcte).
      `manuscrits` : **NON, policy non versionnée, à confirmer
      manuellement** (cf. `SECURITY-AUDIT.md` A-2026-09-12-01)
- [x] Accès inter-utilisateurs impossible sur `photos` (vérifié)
- [ ] Accès inter-utilisateurs impossible sur `manuscrits` — **à confirmer
      manuellement, policy non versionnée** (cf. A-2026-09-12-01 ; portée
      d'une policy Storage incorrecte = tout le bucket, pas une ligne —
      point de cloisonnement à traiter en priorité)
- [x] Chemins non considérés comme mécanisme d'autorisation à eux seuls
      (policy Storage réelle exigée en plus du chemin)

## API
- [x] Routes recensées — 24 routes dans `app/api/**/route.ts` (les 24
      réellement lues et vérifiées individuellement depuis la V2 — l'audit
      initial n'en avait lu que 23, cf. `SECURITY-CHANGELOG.md`)
- [x] Authentification vérifiée sur chaque route (sauf routes
      volontairement publiques : `/api/contact`,
      `/api/cadeau/certificat/*`, webhook Stripe — toutes documentées
      comme telles dans `SECURITY.md`). **Correction V2** :
      `/api/cadeau/activer` retiré de cette liste — cette route vérifie
      bien `auth.getUser()` et renvoie 401 sinon, elle n'est pas
      partiellement publique (seul son mécanisme d'autorisation interne,
      le code comme clé, est particulier).
- [x] Autorisation vérifiée (filtre `user_id` systématique)
- [x] Paramètres contrôlés (validation de forme sur les routes qui
      acceptent un corps de requête)
- [ ] Erreurs vérifiées — pas de fuite de détails internes dans les
      réponses HTTP : **PARTIEL**. 404 générique confirmé sur ressource
      non trouvée/non possédée, mais `/api/manuscrit/{apercu,epub,couverture}`
      renvoient un champ `details` avec l'erreur brute au client sur
      échec 500 (cf. A-2026-09-12-06, V2)
- [ ] Toutes les fonctionnalités payantes vérifient le statut de paiement
      côté serveur — **PROBLÈME** : `/api/manuscrit/couverture` ne le
      fait pas (cf. A-2026-09-12-04, V2, CONFIRMÉ)

## Secrets
- [x] Service role jamais exposée au client — 8 fichiers server-only
      recensés (cf. `SECURITY.md` section 7)
- [x] Secrets absents du dépôt (vérifié : seuls `.env.local` et
      `.env.localum` présents localement, non trackés par git)
- [x] Logs vérifiés — aucun secret/PII trouvé dans les `console.*` de
      `app/api` et `lib`
- [x] Réponses API vérifiées — pas de secret renvoyé au client

## Rate limiting / coût
- [x] Routes à coût réel (IA, envoi email, compilation PDF/image)
      identifiées et pour la plupart plafonnées (`/api/seance`,
      `/api/transcribe`, `/api/contact`, `/api/cadeau/certificat/apercu`)
- [ ] **Manquant** : `/api/cadeau/certificat/[code]/image` et `/pdf` sans
      throttle (cf. `SECURITY-AUDIT.md` A-2026-09-12-03)
- [ ] **À évaluer** : quota `/api/seance`/`/api/transcribe` contournable
      via identités anonymes multiples (cf. `SECURITY-AUDIT.md`
      A-2026-09-12-02)

## Paiement
- [x] Signature webhook Stripe vérifiée avant traitement
- [x] Écritures `abonnements`/`codes_cadeau` déclenchées uniquement par
      événements Stripe authentiques, jamais par le client
- [x] Révocation d'accès sur remboursement intégral testée dans le code
      (`charge.refunded` → `status: "rembourse"`)
- [ ] Portails payants (manuscrit, commande, séance complète) vérifient le
      statut réel en base, pas un paramètre client — **PROBLÈME** :
      `/api/manuscrit/couverture` ne vérifie pas le paiement (cf.
      A-2026-09-12-04, CONFIRMÉ). `/api/manuscrit/apercu`, `/epub`,
      `/api/commande/livre`, `/mon-livre`, `/seance` : OK.

## Cloisonnement (V2)
- [x] Une session utilisateur compromise reste limitée aux données de ce
      seul compte (RLS + filtre applicatif systématiques)
- [ ] Le point de compromission le plus large du système (clé
      `service_role`, contourne RLS partout) est identifié et documenté —
      son vecteur de fuite réel n'est pas vérifiable depuis le dépôt
- [ ] Le bucket Storage `manuscrits` (portée = tout le bucket si mal
      configuré, pas une ligne) reste **à confirmer** (cf. Storage
      ci-dessus)
- [x] `profil_narrateur` et les autres tables sensibles ne sont reliées à
      aucune autre via une clé étrangère qui romprait le cloisonnement
      par utilisateur

## Moindre privilège (V2)
- [x] RPC `incrementer_et_verifier_usage[_anonyme]` : accès minimal,
      revérifient `auth.uid()`, modèle à suivre
- [ ] 3 usages de `service_role` (`certificat/[code]/image`,
      `certificat/[code]/pdf`, `offrir/merci`) sont plus larges que
      nécessaire (accès total pour une simple lecture d'une ligne) — pas
      une faille active, axe de durcissement (cf. A-2026-09-12-08)

## Scraping / extraction massive (V2)
- [x] `/api/seance`, `/api/transcribe` : plafonnés par jour et par
      `user_id`, fail-closed
- [ ] Quota séance/transcribe contournable via comptes anonymes multiples
      (cf. A-2026-09-12-02)
- [ ] `/api/manuscrit/{apercu,epub,couverture}` : **aucun plafond** (cf.
      A-2026-09-12-07)
- [x] `/api/compte/export`, `/api/photos` (GET) : non plafonnés mais
      bornés par construction (propres données, `PHOTOS_MAX_TOTAL`) —
      vérifié, pas un problème

## Détection / traçabilité (V2)
- [ ] Table d'audit applicative dédiée pour les opérations sensibles
      (suppression de compte, remboursement, activation de code cadeau) —
      **absente**. Signaux partiels seulement : `fragments_historique`
      (fragments uniquement), compteurs `usage_api`/`usage_anonyme`
      (volume, pas de détail par appel). Évalué INFORMATION, proportionné
      à la taille du projet (pas une urgence) — cf. `SECURITY-AUDIT.md`
      axe 5
- [ ] Aucun mécanisme de détection d'anomalie (pic d'usage, login
      inhabituel) trouvé dans le code

## Conservation des données (V2)
- [x] Cascade DB (`ON DELETE CASCADE`) confirmée sur toutes les tables
      liées à `auth.users` lors d'une suppression de compte
- [x] Fichiers Storage (`photos`, `manuscrits`) supprimés lors de la
      suppression de compte — **CORRIGÉ DANS LE CODE (Phase 5,
      12/09/2026), NON VALIDÉ DYNAMIQUEMENT** : `deleteUser` n'est plus
      appelé tant que les deux préfixes ne sont pas vérifiés vides (cf.
      A-2026-09-12-05). À revalider contre un environnement Supabase réel
      avant de considérer la case définitivement acquise.

## Intégrations externes (V2)
- [x] Chaque flux externe (Supabase, Stripe, Anthropic, Groq, Lulu,
      Hugging Face, Brevo) transmet uniquement les données nécessaires à
      sa fonction — aucune donnée manifestement superflue trouvée
- [x] Tous les secrets d'intégration sont server-only, jamais
      `NEXT_PUBLIC_*`
- [ ] Contenu des réponses d'erreur tierces (Lulu, Hugging Face) non
      vérifié pour fuite de données utilisateur échoïes (adresse, texte
      narratif) — ni confirmé ni infirmé

---

Cases cochées `[x]` = vérifié sain au dernier audit (V2, 12/09/2026).
Cases `[ ]` = point ouvert ou problème confirmé, voir l'entrée
`SECURITY-AUDIT.md` référencée.
