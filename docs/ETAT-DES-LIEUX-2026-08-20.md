# État des lieux — Racontez-moi

*Analyse réalisée le 20/08/2026, à partir de l'état du dépôt sur `main` (commit `619604c`).*

## Ce que fait le produit

Une app web française qui transforme des **entretiens vocaux enregistrés** en **livre de mémoires imprimé**. Un narrateur répond à une question à la voix, reçoit deux relances IA successives (sensorielles, courtes), puis l'ensemble est composé en un fragment littéraire à la première personne. Au fil des séances, ces fragments s'assemblent en manuscrit, illustré de photos, mis en page et envoyé à l'impression (Lulu Print API) pour recevoir un livre relié 6×9po chez soi.

## Stack technique

- **Next.js 16.2.10** (App Router) + **React 19.2.4**, TypeScript strict
- **Tailwind CSS 4** — palette éditoriale (ivoire/terracotta/forêt), polices Fraunces/Source Serif/IBM Plex/Caveat via `next/font`
- **Supabase** (Postgres + pgvector + Auth + Storage) — client SSR (`@supabase/ssr`)
- **Anthropic SDK** — `claude-sonnet-4-6` (rédaction des fragments) et `claude-haiku-4-5` (relances IA, extraction de profil, résumé de séance)
- **Groq** (Whisper `large-v3`) — transcription audio
- **HuggingFace Inference** — embeddings multilingues 768-d (`paraphrase-multilingual-mpnet-base-v2`), gratuits
- **Typst** (`@myriaddreamin/typst-ts-node-compiler`) — composition PDF du manuscrit et de la couverture, deux passes pour la pagination
- **Lulu Print API** — impression à la demande (sandbox par défaut, bascule prod manuelle)
- **Stripe** — paiement unique (155€ tout compris), et flux cadeau séparé
- **Brevo** — emails de contact
- `epub-gen-memory` en dépendance (export ebook, probablement via `/api/manuscrit/epub`)

> ⚠️ Note contextuelle : `AGENTS.md` prévient que ce Next.js 16 diffère du Next.js connu du modèle — à vérifier dans `node_modules/next/dist/docs/` avant d'écrire du code dessus.

## Organisation des fichiers

```
app/            pages (App Router) + routes API (route.ts)
  api/          19 endpoints — seance, auth, stripe, commande, manuscrit, photos, transcribe, contact, cadeau, compte
  tableau-de-bord/, seance/, mon-livre/, offrir/, parcours/, activer/   pages narrateur
lib/            logique métier pure (17 fichiers) — cœur du produit
supabase/migrations/   18 migrations SQL séquentielles, très documentées
scripts/        ingestion de la bibliothèque de référence (14 ouvrages) + banque de 205 questions
utils/supabase/ clients Supabase (browser/server)
content/blog/   articles Markdown
public/brand/   identité visuelle (logo R)
```

## Fonctionnalités existantes

### 1. Moteur d'entretien
*(`app/api/seance`, `lib/prompts.ts`, `lib/banque-questions.ts`)*

- Séance = question d'ouverture → relance 1 → relance 2 → composition d'un fragment (3 tours fixes)
- Question d'ouverture : fixe pour la toute première séance, puis sélection adaptative dans une **banque de 205 questions / 17 sections** (A–Q), avec quota de 4 questions/section (1 « nucléaire » + 3 de contexte)
- Deux pseudo-questions d'ouverture avant tout : « pour qui racontez-vous ? » et « comment vous appeler ? »
- RAG sur 14 ouvrages de référence (pgvector, HNSW) pour ancrer les relances dans des techniques d'entretien mémoriel documentées
- **Profil narrateur** persistant (périodes couvertes, ancrages sensoriels utilisés, sujets esquivés) mis à jour après chaque fragment via extraction LLM, réinjecté dans le prompt système
- Protocole de report explicite sur les questions à charge émotionnelle forte (« nucléaires »)
- Bouton « passer » — jamais forcer une question

### 2. Transcription vocale
*(`app/api/transcribe`)*

Whisper via Groq, avec filtrage des segments hallucinés (silence prolongé) par seuils `no_speech_prob`/`compression_ratio`.

### 3. Rédaction
*(`lib/redaction.ts`)*

Composition littéraire séparée du moteur de questions ; régénération ciblée sur instruction du narrateur ; résumé de séance pour continuité inter-séances.

### 4. Photos

Upload lié à un fragment, contrôle résolution (1000px min), max 6/fragment, 80 total ; Storage privé RLS par dossier `user_id`.

### 5. Fabrication du livre
*(`lib/typst.ts`, `lib/manuscrit.ts`, `lib/lulu.ts`, `lib/couverture.ts`)*

- Gabarit Typst conforme specs Lulu (fond perdu, gouttière variable selon pagination), typographie française (espaces fines insécables, guillemets français)
- Double passe de compilation (pagination réelle → gouttière correcte)
- Aperçu (BAT) et commande réelle partagent exactement le même code de compilation
- Export EPUB également disponible

### 6. Commerce

Stripe paiement unique 155€ (prix fixe, livre imprimé inclus, décision du 28/07) ; **parcours cadeau** distinct (code d'activation à 8 caractères, pas de compte requis côté acheteur, activation via `/activer`).

### 7. Compte

Export de données, suppression de compte, gestion d'adresse de livraison.

### 8. Contenu marketing

Landing page, blog Markdown, pages FAQ/fonctionnement/manifeste/confidentialité.

## Modèle de données

18 migrations SQL. Tables clés :

- `sessions`
- `fragments` (+ `fragments_historique` pour versioning)
- `tours_conversation` (traçabilité fine + RAG utilisé)
- `profil_narrateur`
- `banque_questions`
- `livres_reference` (RAG)
- `abonnements` (paiement)
- `codes_cadeau`
- `commandes_livre`
- `adresses_livraison`
- `photos`

RLS activé partout, policies `auth.uid() = user_id`, écritures sensibles (webhooks, activation cadeau) via service role.

## Fonctionnement général (parcours narrateur)

1. Inscription → onboarding (destinataire + prénom) → première question fixe
2. Boucle séance : question → relance IA ×2 → fragment composé et sauvegardé
3. Progression affichée (~pages estimées + % de couverture des 17 sections)
4. Paiement (155€ ou code cadeau activé) débloque le parcours complet
5. À tout moment : aperçu BAT du manuscrit compilé
6. Commande finale → compilation PDF intérieur+couverture → upload Storage → envoi à Lulu → livre imprimé expédié

## Points notables du code

- Commentaires très riches, historicisés (décisions datées, incidents passés, raisons de conception) — le code documente son propre historique
- Attention portée à l'idempotence (webhooks Stripe, codes cadeau), aux races conditions (verrous applicatifs + contraintes uniques SQL), et à la fiabilité serverless (usage de `after()` pour le fire-and-forget sur Vercel)
- Domaine HuggingFace `api-inference.huggingface.co` décommissionné détecté et corrigé début juillet — logging d'erreur ajouté pour éviter la régression silencieuse
