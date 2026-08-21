# Audit sécurité — Endpoints de debug exposés & absence de rate limiting

*Analyse réalisée le 21/08/2026, sur la base du dépôt `main` (commit `619604c`), en complément de l'état des lieux du 20/08/2026 (`docs/ETAT-DES-LIEUX-2026-08-20.md`).*

**Méthode** : lecture directe du code (`app/api/`, `middleware.ts`, `lib/`, `package.json`, `supabase/migrations/`), `git log --follow` sur les fichiers suspects, vérification croisée de chaque hypothèse dans le code réel. Aucun fichier n'a été modifié pendant cet audit.

**Périmètre** : `app/api/*` (24 routes), `middleware.ts`, `lib/certificat.ts`, `lib/codes-cadeau.ts`, `lib/typst.ts`, `package.json`, `supabase/migrations/*`.

---

## Synthèse

| # | Constat | Fichiers/routes | Risque coût | Risque sécurité |
|---|---|---|---|---|
| 1 | Deux endpoints de debug accessibles publiquement, sans authentification | `app/api/chapitre-test/route.ts`, `app/api/test-typst/route.ts` | Moyen | Faible |
| 2 | Aucun mécanisme de rate limiting sur les 24 routes de l'API | `app/api/*` (concentré sur 2 routes anonymes + 2 routes facturées à l'usage) | Élevé (sur `/api/seance`, `/api/transcribe`) | Faible directe |

Un point du premier audit est **réévalué à la baisse** dans cette analyse : `/api/cadeau/activer` avait été présenté comme potentiellement vulnérable au brute-force du code cadeau. La lecture du code confirme qu'il exige une authentification et que l'espace de recherche du code (32⁸ combinaisons) rend un brute-force impraticable, même sans rate limiting.

---

## 1. Les endpoints de debug exposés

### 1.1 Fichiers et routes concernés

| Route | Fichier | Méthode | Dernier commit |
|---|---|---|---|
| `/api/chapitre-test` | `app/api/chapitre-test/route.ts` | `GET` | 28/07/2026 |
| `/api/test-typst` | `app/api/test-typst/route.ts` | `GET` | 16/07/2026 |

Confirmé par `git log --follow` :
- `91b29ad` — *spike: route de test Typst (@myriaddreamin/typst-ts-node-compiler)* — 16/07/2026
- `5355196` — *feat: gabarit Typst conforme Lulu + chapitre test (spike faisabilité)* — 16/07/2026
- `e7ec40e` — *Insère les photos dans la mise en page du livre imprimé* — 28/07/2026

Ce sont des spikes de faisabilité du gabarit Typst/Lulu, sans commit depuis 23 jours au moment de l'audit.

### 1.2 Ce que fait réellement le code

Sur simple `GET`, sans aucun paramètre, sans aucune vérification d'identité :

**`app/api/chapitre-test/route.ts`** — réutilise le moteur exact du vrai livre (`lib/typst.ts`) :

```ts
import { NextResponse } from "next/server";
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import { genererSourceTypst, assemblerFragments } from "@/lib/typst";
import { FRAGMENTS_TEST_CHAPITRE } from "@/lib/contenu-test-chapitre";

// Chapitre test — spike de faisabilité gabarit Lulu (fond perdu, marges, gouttière,
// typographie française). Contenu fictif écrit pour ce test, pas du vrai contenu utilisateur.
export async function GET() {
  const start = Date.now();
  try {
    const fragmentsAplatis = FRAGMENTS_TEST_CHAPITRE.flatMap((f) =>
      f.split(/\n\n—\n\n/)
    );
    const corps = assemblerFragments(fragmentsAplatis.map((texte) => ({ texte, cheminsShadowPhotos: [] })));
    const source = genererSourceTypst(corps, {
      titre: "Chapitre test — Le Parcours",
    });

    const compiler = NodeCompiler.create();
    const result = compiler.pdf({ mainFileContent: source });
    const pdfBuffer = Buffer.from(result);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=chapitre-test.pdf",
        "X-Compile-Time-Ms": String(Date.now() - start),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Échec de compilation Typst.", details: String(error) },
      { status: 500 }
    );
  }
}
```

**`app/api/test-typst/route.ts`** — document statique, mais même mécanique de compilation :

```ts
import { NextResponse } from "next/server";
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";

const DOCUMENT_TEST = `
#set page(width: 15cm, height: 22cm, margin: 2cm)
#set text(lang: "fr", font: "Libertinus Serif", size: 11pt)

= Spike Typst — chapitre test

Ceci est un essai de compilation. Il vérifie les guillemets français automatiques
#quote[comme celui-ci], les espaces insécables avant~: les deux-points, et un
paragraphe assez long pour observer le comportement des veuves et orphelines
sur plusieurs lignes de texte justifié, condition normale d'un chapitre de
mémoire imprimé.
`;

export async function GET() {
  const start = Date.now();
  try {
    const compiler = NodeCompiler.create();
    const result = compiler.pdf({ mainFileContent: DOCUMENT_TEST });
    const pdfBuffer = Buffer.from(result);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=spike-typst.pdf",
        "X-Compile-Time-Ms": String(Date.now() - start),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Échec de compilation Typst.", details: String(error) },
      { status: 500 }
    );
  }
}
```

Chaque appel déclenche une compilation Typst réelle (CPU-bound) et renvoie le PDF binaire.

### 1.3 Protections directes ou indirectes vérifiées

- **`middleware.ts`** — le matcher est explicitement limité :

  ```ts
  export const config = {
    matcher: ["/tableau-de-bord/:path*", "/seance/:path*"],
  }
  ```

  `/api` **n'est pas inclus**. Ces deux routes ne passent jamais par la vérification d'authentification du middleware, ni par aucune autre.

- **`vercel.json`** — absent du dépôt. Aucune règle de Deployment Protection ou de Firewall versionnée.
- **Gating par environnement** — recherche de `NODE_ENV` / `VERCEL_ENV` dans tout `app/` et `lib/` : aucune occurrence. Rien ne désactive ces routes en production.
- **Références internes** — recherche de `chapitre-test` et `test-typst` dans tout le dépôt (code + Markdown) : aucune occurrence en dehors des fichiers eux-mêmes. Ce sont des culs-de-sac, jamais appelés par une page, un bouton ou un composant du produit.

**Conclusion** : aucune protection, ni directe ni indirecte, n'a été trouvée dans le code versionné. Une éventuelle protection au niveau plateforme (Vercel Deployment Protection, WAF) resterait hors de ce dépôt — ni confirmable, ni exclue depuis le code seul.

### 1.4 Risque concret

| Axe | Évaluation |
|---|---|
| Sécurité | **Faible** — contenu fictif codé en dur (`FRAGMENTS_TEST_CHAPITRE`, document statique), aucune donnée narrateur manipulée, aucune fuite possible |
| Coût | **Réel** — chaque appel déclenche une compilation Typst, opération CPU-bound facturée au temps d'exécution sur une fonction serverless |
| Abus possible | **Réel** — vecteur de déni de service applicatif à coût pour Racontez-moi : un tiers qui découvre ces URLs (scan automatisé, historique Git public, etc.) peut les boucler pour épuiser du quota de calcul |
| Impact utilisateur | **Indirect** — dégradation de performance possible pour les vrais utilisateurs en cas d'abus massif partageant la même plateforme serverless |

### 1.5 Confirmé vs hypothèse

**Confirmé dans le code :**
- Routes accessibles sans authentification, sans paramètre attendu
- Aucune référence interne — code mort du point de vue produit
- Aucun `vercel.json`, aucun gating d'environnement

**Hypothèse, hors code versionné :**
- Niveau réel d'exposition en production (dépend de la configuration Deployment Protection côté Vercel)
- Ces routes font l'objet d'un scan ou d'un abus déjà actif — rien dans le code n'indique un incident passé sur ce point précis
- Existence d'une protection au niveau plateforme (WAF, Attack Challenge Mode) non versionnée dans ce dépôt

### 1.6 Solutions, de la plus simple à la plus robuste

**a) Supprimer les deux fichiers**
Spikes de faisabilité déjà exploités ailleurs — le gabarit réel vit dans `lib/typst.ts`, aucune référence dans le produit.
✅ Simple, radical, coût nul.
⚠️ Perd la route de debug si besoin de re-tester rapidement le gabarit Typst plus tard.

**b) Gater sur `process.env.NODE_ENV !== "production"`**
Garde l'outil pour du debug local uniquement.
✅ Conserve l'outil pour un usage futur en développement.
⚠️ Moins fiable que la suppression si la variable d'environnement n'est pas correctement positionnée en production selon l'hébergeur.

**c) Protéger par un check d'authentification, comme le reste de l'API**
Ajouter un `getUser()` cohérent avec les 22 autres routes authentifiées du dépôt.
✅ Cohérent avec le reste du code.
⚠️ Sur-ingénierie pour deux routes de spike qui n'ont plus lieu d'être appelées en production.

**d) Ajouter une règle de Deployment Protection / Firewall au niveau Vercel**
Protège tout `/api` d'un coup, pas seulement ces deux routes (couvre aussi les points de la section 2).
✅ Couverture large avec un seul réglage.
⚠️ Configuration hors dépôt, non versionnée, non visible en revue de code.

### 1.7 Recommandation

**Supprimer purement et simplement `app/api/chapitre-test/route.ts` et `app/api/test-typst/route.ts`.** Ce sont des spikes de faisabilité déjà exploités (le gabarit réel vit dans `lib/typst.ts`), sans aucune référence dans le produit, non maintenus depuis fin juillet. Les garder ne présente aucun bénéfice mesurable et laisse un vecteur de coût gratuit ouvert.

---

## 2. L'absence de rate limiting sur les routes API

### 2.1 Fichiers et routes concernés

Recherche exhaustive sur les 24 fichiers `route.ts` sous `app/api/`, sur `package.json` et sur les migrations SQL. Aucune bibliothèque de rate limiting (`@upstash/ratelimit`, `ioredis`, `@vercel/kv`, etc.) n'est présente dans les dépendances. Aucun mécanisme de comptage ou de throttle n'existe dans `lib/`.

Le risque n'est pas uniforme — trois catégories :

**Catégorie A — routes non authentifiées, à coût de calcul ou d'envoi réel :**
- `POST /api/contact` (`app/api/contact/route.ts`) — appelle l'API Brevo à chaque requête
- `GET /api/cadeau/certificat/apercu` (`app/api/cadeau/certificat/apercu/route.ts`) — compile un PDF/PNG via Typst + sharp à chaque requête
- `POST /api/stripe/checkout-cadeau` (`app/api/stripe/checkout-cadeau/route.ts`) — crée une vraie session Stripe Checkout à chaque appel
- `GET /api/cadeau/certificat/[code]/image` et `/pdf` — sans check d'authentification (accès par connaissance du code, cohérent avec l'usage : le destinataire du cadeau n'a pas de compte)
- Les deux routes de debug de la section 1

**Catégorie B — routes authentifiées, coûteuses en API tierces facturées à l'usage :**
- `POST /api/seance` (`app/api/seance/route.ts`) — enchaîne Anthropic (relance/rédaction) + embeddings HuggingFace
- `POST /api/transcribe` (`app/api/transcribe/route.ts`) — appelle Groq Whisper
- `POST /api/fragments/[id]/regenerer` — réappelle la rédaction LLM

**Catégorie C — routes authentifiées à faible enjeu** (CRUD compte, photos, historique de fragments, etc.) — risque marginal, écartée de l'analyse détaillée.

### 2.2 Ce que fait réellement le code

Sur chacune de ces routes, aucun compteur, aucun throttle par IP ou cookie, aucune vérification de fréquence. Pour la catégorie B, la seule barrière est `supabase.auth.getUser()` : il faut un compte authentifié, mais rien ne limite le nombre d'appels une fois connecté.

**`app/api/contact/route.ts`** — aucune vérification d'authentification, aucun captcha :

```ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: { nom?: string; email?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { nom, email, message } = body;
  if (!nom?.trim() || !email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message?.trim()) {
    return NextResponse.json({ error: "Merci de remplir tous les champs avec une adresse email valide." }, { status: 400 });
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Racontez-moi — Contact", email: "regis@coherencelab.fr" },
      to: [{ email: "regis@coherencelab.fr" }],
      replyTo: { email, name: nom },
      subject: `Contact racontez-moi.com — ${nom}`,
      htmlContent: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #242220; line-height: 1.75;">
          <p><strong>Nom :</strong> ${nom}</p>
          <p><strong>Email :</strong> ${email}</p>
          <p style="margin-top: 1.5em; white-space: pre-line;">${message}</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    console.error("Brevo contact error:", await res.text());
    return NextResponse.json({ error: "Erreur lors de l'envoi. Réessayez." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

Note : le champ `message` (et `nom`) est injecté tel quel dans le HTML de l'email sans échappement — risque d'injection HTML dans l'email reçu. Le destinataire (`to`) est cependant codé en dur (`regis@coherencelab.fr`), donc ce n'est pas un relais ouvert exploitable contre des tiers.

**`lib/certificat.ts`** — appelé par `GET /api/cadeau/certificat/apercu` sans authentification :

```ts
import { NodeCompiler } from "@myriaddreamin/typst-ts-node-compiler";
import sharp from "sharp";
// …
const compiler = NodeCompiler.create();
const resultat = compiler.compile({ mainFileContent: source });
// …
return Buffer.from(compiler.pdf(resultat.result!));
```

Compilation Typst + traitement d'image `sharp` à chaque prévisualisation, sans aucune barrière.

### 2.3 Protections directes ou indirectes vérifiées

**Réévaluation par rapport au premier audit** : `app/api/cadeau/activer/route.ts` exige en réalité une authentification, contrairement à ce qu'un premier passage rapide pouvait laisser penser :

```ts
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { code } = await req.json();
  // ...
  const codeNormalise = code.trim().toUpperCase();

  const { data: ligneActivee, error: erreurUpdate } = await supabaseService
    .from("codes_cadeau")
    .update({ statut: "active", user_id_active: user.id, activated_at: new Date().toISOString() })
    .eq("code", codeNormalise)
    .eq("statut", "paye")
    .select("id")
    .maybeSingle();
  // ...
}
```

Le brute-force du code à 8 caractères nécessite donc un compte authentifié par tentative. De plus, la génération du code (`lib/codes-cadeau.ts`) utilise un alphabet de 32 caractères sans ambiguïté sur 8 positions :

```ts
// Alphabet volontairement sans caractères ambigus (0/O, 1/I/L) — le code
// est destiné à être recopié à la main depuis un certificat imprimé.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function genererCodeCadeau(): string {
  const bloc = () =>
    Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
  return `${bloc()}-${bloc()}`;
}
```

**Espace de recherche : 32⁸ ≈ 1,1 × 10¹² combinaisons.** Même sans rate limiting, un brute-force pratique reste très improbable. `Math.random()` n'est pas cryptographiquement sûr, mais ce n'est pas le facteur limitant ici — c'est la taille de l'espace de recherche.

Autres protections indirectes identifiées :
- **Supabase Auth** applique par défaut des limites de débit sur ses propres endpoints (inscription, OTP, etc.) — protection indirecte sur la catégorie B (il faut un compte pour attaquer), mais configuration réglée côté dashboard Supabase, non visible dans ce dépôt.
- **Stripe** applique ses propres limites de débit API sur `checkout.sessions.create` — protection indirecte pour `/api/stripe/checkout-cadeau`, mais elle protège le compte Stripe, pas le budget de Racontez-moi : en cas d'abus, c'est le compte Stripe qui se fait limiter, avec un risque de blocage collatéral pour les vrais clients.
- **Aucune protection applicative locale trouvée** pour `/api/contact` et `/api/cadeau/certificat/apercu` — les deux routes les plus exposées de la catégorie A : anonymes, sans espace de recherche protecteur (contrairement au code cadeau), à coût de calcul ou d'envoi réel.

### 2.4 Matrice de risque

| Route | Sécurité | Coût | Abus | Impact utilisateur |
|---|---|---|---|---|
| `/api/contact` | Faible (injection HTML non filtrée dans l'email, destinataire fixe = pas de relais ouvert) | Réel — chaque appel = un envoi Brevo, quota/facturation | Flood trivial (pas de captcha, pas d'auth) | Spam de la boîte mail du propriétaire |
| `/api/cadeau/certificat/apercu` | Faible | Réel — compilation Typst+sharp par appel, anonyme | Flood trivial, CPU serverless | Dégradation possible pour les vrais acheteurs |
| `/api/stripe/checkout-cadeau` | Faible | Indirect (sessions Stripe créées sans charge) | Flood possible, risque de throttling Stripe côté compte | Échecs de paiement pour de vrais clients si Stripe limite le compte |
| `/api/seance`, `/api/transcribe` | Faible directe | **Élevé** — tokens Anthropic + Groq facturés à l'usage, par appel authentifié | Un compte compromis ou créé peut boucler des séances en continu → facture qui grimpe | Aucun sur les tiers, direct sur le budget du produit |
| `/api/cadeau/activer` | Faible (réévalué) | Négligeable | Brute-force impraticable (espace 32⁸) + nécessite un compte | Négligeable |

Le risque le plus sérieux économiquement est la **catégorie B** : `/api/seance` et `/api/transcribe` consomment des API tierces facturées à l'usage, et rien n'empêche un compte unique de les boucler en continu.

### 2.5 Confirmé vs hypothèse

**Confirmé dans le code :**
- Aucune bibliothèque ni logique de rate limiting nulle part dans le dépôt
- `/api/contact` et `/api/cadeau/certificat/apercu` sont anonymes et à coût réel par appel
- `/api/cadeau/activer` exige une authentification (contrairement à ce que suggérait une lecture rapide initiale)
- L'espace du code cadeau est de 32⁸ combinaisons

**Hypothèse, hors code versionné :**
- Configuration réelle des rate limits Supabase Auth et Stripe côté dashboard (non visible dans ce dépôt)
- Existence ou non d'une protection au niveau Vercel (Firewall, Attack Challenge Mode) — plan et configuration non présents dans ce dépôt
- Occurrence réelle d'un abus à ce jour — rien dans le code n'indique un incident passé sur ce point, contrairement au décommissionnement HuggingFace qui, lui, est documenté dans le code (cf. état des lieux du 20/08/2026)

### 2.6 Solutions, de la plus simple à la plus robuste

**a) Rate limit en mémoire par IP, sans dépendance externe**
`Map` avec fenêtre glissante dans un module partagé.
✅ Zéro dépendance, déploiement immédiat.
⚠️ Ne survit pas au redémarrage d'une instance serverless, inefficace en multi-instance (chaque instance a son propre compteur) — protège contre un abus non sophistiqué seulement.

**b) Rate limit basé sur Supabase** (table `rate_limits` ou colonne de compteur + `created_at`, vérifiée avant chaque appel coûteux dans `/api/seance` et `/api/transcribe`)
✅ Cohérent avec la stack existante (déjà Postgres partout), persiste entre instances, simple à auditer en SQL.
⚠️ Ajoute une requête DB par appel, à concevoir avec soin pour éviter les races (pattern déjà maîtrisé ailleurs dans le code — cf. `codes_cadeau`, verrou applicatif + contrainte unique).

**c) Upstash Ratelimit (Redis) ou Vercel KV**
✅ Solution standard, distribuée, fenêtre glissante fiable, faible latence.
⚠️ Nouvelle dépendance/service externe à provisionner et surveiller, coût récurrent (généralement faible).

**d) Vercel Firewall / WAF au niveau plateforme** (règles par IP/route)
✅ Protège tout `/api` sans toucher au code applicatif, gère aussi le cas des deux routes de debug de la section 1.
⚠️ Configuration hors dépôt (moins traçable en revue de code), dépend du plan Vercel souscrit.

**e) Captcha (Turnstile/hCaptcha) sur les endpoints anonymes** (`/api/contact`, `/api/cadeau/certificat/apercu`)
✅ Très efficace contre le flood automatisé simple, faible coût d'intégration.
⚠️ Friction UX supplémentaire, n'aide pas sur les routes authentifiées de catégorie B.

### 2.7 Recommandation

Prioriser dans cet ordre :

1. **`/api/seance` et `/api/transcribe`** — c'est là que se trouve le vrai risque financier (tokens Anthropic/Groq facturés à l'usage, derrière un simple compte gratuit). Solution **(b)** : un compteur applicatif simple dans Postgres (par `user_id`, fenêtre glissante ou quota journalier) est cohérent avec le reste du code et suffisant à ce stade — pas besoin d'introduire Redis pour ça.
2. **`/api/contact` et `/api/cadeau/certificat/apercu`**, les deux routes anonymes à coût réel : solution **(e)** captcha, ou à défaut **(a)** rate limit mémoire par IP en attendant mieux — bon marché et couvre le cas d'abus le plus probable (bot/script simple).
3. Ne pas sur-investir sur `/api/cadeau/activer` et `/api/stripe/checkout-cadeau` dans l'immédiat — le premier est protégé par son espace de codes et l'authentification requise, le second par les limites Stripe elles-mêmes (même si imparfait).
4. Si le produit grossit, migrer vers **(c)** Upstash/Vercel KV pour une solution unifiée plutôt que de multiplier les compteurs Postgres ad hoc.

---

## Note méthodologique

Cet audit s'appuie exclusivement sur une lecture directe du code versionné dans le dépôt (`app/api/`, `middleware.ts`, `lib/`, `package.json`, `supabase/migrations/`) et sur l'historique Git (`git log --follow`). Les éléments configurés en dehors du dépôt (dashboard Vercel, dashboard Supabase, dashboard Stripe, dashboard Brevo) ne sont ni confirmables ni exclus par cette analyse — ils sont explicitement signalés comme hypothèses dans chaque section « Confirmé vs hypothèse » ci-dessus.

Aucun fichier n'a été modifié, créé ou supprimé pendant cet audit ; aucune opération Git n'a été effectuée.
