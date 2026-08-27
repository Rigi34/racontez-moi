# Topo complet — Racontez-moi (27/08/2026)

*Document préparé pour être transmis aux conversations Claude Pro d'origine (développement technique et développement des idées) afin de les mettre à jour et de comparer avec ce qu'elles contiennent. Basé exclusivement sur l'état réel du dépôt Git (`main`, commit `b692daf` et suivants) — aucun accès n'a été possible aux deux conversations Claude Pro elles-mêmes (liens `claude.ai/share/...` non lisibles depuis cet outil).*

---

## 1. Ce qu'est le produit, en une phrase

Une application web française qui transforme des entretiens vocaux enregistrés en livre de mémoires imprimé : le narrateur répond à voix haute à une question, reçoit deux relances IA, et l'ensemble est composé en un fragment littéraire à la première personne. Les fragments s'assemblent au fil des séances en un manuscrit illustré de photos, mis en page et imprimé (Lulu Print API) en livre relié 6×9po.

---

## 2. Prix et modèle commercial

- **Prix fixe unique : 155€, tout compris** (livre imprimé inclus) — décision du **28/07/2026**. Pas de palier, pas d'abonnement récurrent.
- ⚠️ **Point à vérifier avec la conversation « idées »** : un commentaire dans le code (`lib/lulu.ts`, décision datée du 23/07/2026) évoque une « offre tout-compris ~179€ » juste avant, avec un raisonnement sur le coût réel de l'impression couleur reliée (~29€ tout compris en France). Le prix final retenu (155€) est *plus bas* que cette estimation du 23/07 — cohérent avec une négociation ou un ajustement ultérieur, mais ça vaut la peine de confirmer que 155€ est bien le dernier mot et pas un chiffre à recroiser.
- **Parcours cadeau séparé** : code d'activation à 8 caractères (alphabet sans caractères ambigus), pas de compte requis côté acheteur ; activation par le destinataire sur `/activer`, qui nécessite elle un compte.
- Une table `abonnements` existe en base (vestige d'un ancien modèle à paiement récurrent, jamais réactivé depuis la décision du prix fixe).

---

## 3. Stack technique (état actuel)

| Domaine | Choix |
|---|---|
| Framework | Next.js 16.2.10 (App Router) + React 19.2.4, TypeScript strict |
| Style | Tailwind CSS 4 — palette éditoriale définie dans `app/globals.css` (`@theme`) : papier, blanc, sauge, encre, pétrole, pétrole foncé, ambre, grège ; polices Fraunces/Source Serif/IBM Plex/Caveat |
| Données | Supabase (Postgres + pgvector + Auth + Storage) |
| IA rédaction | Anthropic — `claude-sonnet-4-6` (fragments), `claude-haiku-4-5` (relances, extraction de profil, résumé) |
| Transcription | Groq (Whisper `large-v3`), avec retry réseau/5xx/429 depuis le 26/08 |
| Embeddings | HuggingFace Inference, multilingue 768-d, gratuit |
| Composition PDF | Typst (`@myriaddreamin/typst-ts-node-compiler`), double passe pour la pagination |
| Impression | Lulu Print API — sandbox par défaut, bascule prod par variable d'environnement |
| Paiement | Stripe — paiement unique + flux cadeau séparé |
| Email | Brevo (contact uniquement) |
| Analytics | **PostHog** (organisation Cohérencelab, projet renommé `racontez-moi.com`) — découvert le 26/08 via une ancienne session, pas documenté jusqu'ici dans le dépôt : dashboard actif, résumé hebdo par email chaque lundi 8h UTC, session replay/heatmaps/web analytics activés |
| Tests | Vitest — 63 tests (rate limiting, RPC usage, redaction, codes-cadeau, typst, couverture) |
| CI | GitHub Actions depuis le 26/08 — lint, typecheck, tests sur chaque push/PR |

---

## 4. Fonctionnalités du site (état actuel, complet)

1. **Moteur d'entretien** — question d'ouverture (fixe puis adaptative sur une banque de 205 questions / 17 sections), 2 relances IA, RAG sur 14 ouvrages de référence, profil narrateur persistant, bouton « passer » systématique, protocole de report sur les questions à charge émotionnelle forte.
2. **Transcription vocale** — Whisper via Groq, filtrage des hallucinations sur silence, retry réseau.
3. **Rédaction** — composition littéraire séparée du moteur de questions, régénération ciblée sur instruction du narrateur.
4. **Photos** — upload par fragment (max 6/fragment, 80 total), Storage privé.
5. **Fabrication du livre** — gabarit Typst conforme Lulu, aperçu (BAT) et commande réelle partagent le même code de compilation.
6. **Personnalisation du livre** *(nouveau, 26/08/2026)* — titre, sous-titre et couleur de couverture modifiables par le narrateur (4 couleurs de marque), propagés à la couverture, à la page de garde intérieure et aux métadonnées EPUB. Photo de couverture délibérément écartée (voir §7).
7. **Commerce** — Stripe paiement unique, parcours cadeau distinct.
8. **Compte** — export de données, suppression de compte, gestion d'adresse de livraison.
9. **Contenu marketing** — landing page, blog, FAQ, manifeste public, pages légales/RGPD.
10. **Export EPUB** — même source de contenu que le PDF.

---

## 5. Travail réalisé lors de cette reprise (21 → 27/08/2026)

Repris après l'interruption du 22/08 (raisons techniques + vacances). Dans l'ordre :

| # | Sujet | Statut |
|---|---|---|
| A1 | Suppression des routes de debug exposées | ✅ Fait (avant cette reprise, 21/08) |
| A4/A5 | Rate limiting sur séance/transcription/contact/certificat | ✅ Fait (avant cette reprise, 21/08) |
| A2 | Injection HTML dans l'email de contact | ✅ Corrigé (26/08) |
| — | 3 erreurs ESLint préexistantes | ✅ Corrigées (26/08) |
| A8 | CI minimale (lint, typecheck, tests) | ✅ Mise en place (26/08) |
| A7 | Panne transitoire d'API tierce en séance | ✅ Retry ajouté sur Groq (absent avant) ; réponse brute du narrateur sauvegardée *avant* l'appel Anthropic plutôt qu'après (26/08). Correction au passage : le retry Anthropic existait déjà nativement dans le SDK, contrairement à ce que l'audit initial suggérait. |
| A9 | Audit RLS exhaustif (21 migrations relues) | ✅ Fait (26/08). **Trou réel trouvé et corrigé** : `commandes_livre` n'avait qu'une policy SELECT alors que le code y écrit — la commande réelle de livre était probablement cassée en production. Migration `0021` écrite. |
| A10 | Revue des usages `service role` | ✅ Fait (26/08) — 6 usages dans tout le dépôt, tous corrects |
| — | Personnalisation du livre (titre/sous-titre/couleur) | ✅ Fait (26/08) — migration `0022`, nouvelle route API, nouveau composant UI, tests |
| A11 | Extension de la couverture de test | ✅ Bien avancé (26/08) — 32 nouveaux tests sur `lib/typst.ts`, `lib/codes-cadeau.ts`, `lib/redaction.ts` |
| — | Nettoyage infra (sessions tmux orphelines) | ✅ Fait (27/08) — sans rapport avec le code du site |

---

## 6. Ce qui reste à faire

### 🔴 Action manuelle requise avant que tout fonctionne réellement

- **Appliquer les migrations `0021` et `0022`** à la base Supabase en ligne (dashboard SQL Editor, ou `supabase db push`) — écrites et testées, mais jamais exécutées sur la vraie base depuis ces sessions de travail. Tant que ce n'est pas fait, la commande réelle de livre reste cassée et la personnalisation du livre n'est pas utilisable.

### En pause, dépend de vous

- **A12 (error tracking, Sentry)** — en pause jusqu'à samedi (problème de connexion, vous le ferez depuis le PC).
- **A6 (alerting coûts)** — configuration manuelle sur les consoles Anthropic, Groq, et Lulu si disponible ; rien à construire côté code.
- **A3 (protection Vercel)** — le compte Vercel connecté aux outils Claude n'héberge pas le projet ; à vérifier vous-même sur le bon compte (Settings → Deployment Protection), avec la nuance qu'un plan Hobby ne permet pas les protections avancées de toute façon.

### Chantiers techniques restants (non bloquants)

- Audit de l'idempotence du webhook Stripe (dernier point non couvert par les tests, sur les 4 initialement identifiés pour A11).

### Produit / idées à recroiser avec la conversation « idées »

- Le prix 155€ vs la mention à ~179€ du 23/07 (§2).
- La photo de couverture a été explicitement écartée (faisable techniquement, mais jugée disproportionnée face au risque de qualité d'impression et de lisibilité) — à confirmer que c'est aligné avec l'intention produit d'origine.
- Le dépôt référence une **« étude HÉRITAGE 2026 »** comme source de plusieurs décisions structurantes (banque de 205 questions, décision d'inclure des photos par défaut, durée de 2 à 4 mois du parcours) et un partenaire nommé **« Le Révélateur »** qui a fourni des retours terrain (tests réels, brief cadeau) — si la conversation « idées » est la source de cette étude ou de ces échanges, c'est le point de recoupement le plus direct entre le dépôt et cette conversation.

---

## 7. Décision produit actée cette semaine (à documenter côté « idées » si pertinent)

**Personnalisation du livre limitée à titre, sous-titre et couleur** — la photo de couverture a été jugée techniquement faisable (le compilateur Typst le permet) mais écartée : résolution des photos du narrateur non garantie pour un agrandissement en couverture, lisibilité du texte blanc variable selon la photo. Argument retenu : « le contenu qui compte est dedans, pas sur la jaquette ».

---

*Document généré par Claude Code à partir de la lecture directe du dépôt (code, migrations, historique Git) — pas des conversations Claude Pro d'origine, non accessibles depuis cet outil.*
