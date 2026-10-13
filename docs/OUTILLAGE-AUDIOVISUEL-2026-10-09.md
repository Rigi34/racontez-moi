# OUTILLAGE AUDIOVISUEL — complément à la doctrine

> Complément à `DOCTRINE-AUDIOVISUELLE-YOUTUBE-2026-09-26.md` (§8 « Le rôle
> des outils »). Il ne modifie ni la chaîne de production ni la grammaire
> visuelle : il précise **quels outils** la servent, sélectionnés le
> 09/10/2026 à partir d'un inventaire brut tiré de deux transcriptions de
> vidéastes (setup « motion design par le code »).
>
> Principe inchangé : **les outils sont interchangeables, l'identité
> éditoriale ne l'est pas.** Critère de tri : sert-il la doctrine (récit
> qui respire, 6-12 images, mouvements lents, peu de texte, jamais de
> visage frontal, voix au centre) ?

> **⚠ Mise à jour du 11/10/2026 — décision « voix » remplacée.**
> La sélection du 09/10 retenait **ElevenLabs payant** (Starter/Creator)
> pour la narration et **Scribe** pour la transcription. Pour l'atelier de
> production vidéo (`~/projets/racontez-moi-video/`), cette décision est
> **remplacée** par la directive du 11/10/2026 : l'architecture cible doit
> fonctionner **sans abonnement vocal payant ni API payante** — voix
> enregistrée nettoyée localement (FFmpeg), transcription locale
> (whisper.cpp), synthèse vocale locale à évaluer plus tard. ElevenLabs
> reste un **point de comparaison**, pas une dépendance. Référence :
> `~/projets/racontez-moi-video/ETUDE-ATELIER-MONTAGE-2026-10-11.md`.
> Le texte ci-dessous est conservé tel quel pour l'historique ; les lignes
> concernées sont annotées « *(remplacé le 11/10)* ». Les autres projets
> qui auraient besoin d'ElevenLabs ne sont pas concernés.

---

## Le projet tel que défini par Régis (09/10/2026)

- Des **voix sélectionnées, belles**, portant des vidéos YouTube qui
  prolongent les articles du site.
- **Maillage article ↔ vidéo** : l'article peut renvoyer vers la vidéo ;
  la vidéo renvoie surtout vers la suite de l'article.
- Le **style** des vidéos et des visuels sera défini avec Claude (même
  environnement que le site).
- Briques techniques : la voix, la gestion des images, et plus tard la
  connexion à certaines plateformes externes.
- Prochaine étape envisagée : un **skill Claude « motion design
  Racontez-moi »** qui applique cette chaîne et cette charte.

---

## ✅ Retenus — le cœur de l'outillage

| Outil | Rôle chez nous | Coût (relevé 09/10/2026, à revérifier) |
|---|---|---|
| **Claude Code** | Écrire et faire tourner la chaîne de production ; héberger le futur skill. | Déjà en place |
| **Claude (Pro)** | Recherche, rédaction, adaptation orale (doctrine §8). | Déjà en place |
| **ElevenLabs** *(remplacé le 11/10 : voix enregistrée ou synthèse locale)* | Narration : voix choisies dans la bibliothèque de voix. | Starter 6 $/mois (30 000 crédits ≈ 30 min, usage commercial inclus) ; Creator 22 $/mois (121 000 crédits ≈ 2 h, clonage vocal professionnel). Le plan gratuit n'autorise pas l'usage commercial. Repère : ≈ 1 000 crédits par minute. |
| **ElevenLabs Scribe** *(remplacé le 11/10 : whisper.cpp local)* | Transcription mot à mot avec minutage → sous-titres synchronisés au mot. | Dans les crédits ElevenLabs |
| **Remotion** (+ Node.js, Chrome headless) | Vidéos produites par du code React, comme le site : charte (couleurs, polices) reprise à l'identique, vidéo régénérée après une correction. Moteur naturel du skill. | Gratuit jusqu'à 3 personnes, usage commercial inclus |
| **FFmpeg** | Assemblage, conversions de formats, normalisation du volume (même niveau sonore d'une vidéo à l'autre). | Gratuit |
| **Générateur d'images** | « Niveau 3 » de la doctrine, quand les photos du site ne suffisent pas. Options : Higgsfield (déjà connecté à Claude) ou fal.ai (à l'usage, nombreux modèles). | À l'usage — à vérifier au moment du choix |
| **YouTube / YouTube Shorts** | Diffusion. Les Shorts sont extraits de la vidéo, jamais écrits à part (doctrine). | Gratuit |

**Notions reprises de l'inventaire** : sous-titres synchronisés au mot ;
timeline et images clés ; bibliothèque d'éléments réutilisables ;
découpage d'une vidéo longue en shorts ; amélioration du skill à partir
des retours (boucle de feedback).

---

## 🟡 Plus tard / en secours

- **DaVinci Resolve** (gratuit) ou **Premiere** (déjà prévu par la
  doctrine) : montage manuel quand un plan demande l'œil humain ;
  étalonnage des couleurs.
- **API de publication YouTube** : programmation automatique, une fois le
  rythme installé.
- **Instagram / TikTok** : à décider ; le public (60 ans et plus, et leurs
  enfants) est d'abord sur YouTube.
- **Tella** ou simple capture d'écran : seulement pour une démonstration
  du site (« comment se passe une séance »).
- **Musique discrète** : bibliothèque libre de droits (bibliothèque audio
  YouTube, gratuite) ou effets sonores ElevenLabs — pas de musique
  procédurale.

---

## ❌ Écartés

| Outil | Raison |
|---|---|
| Codex, OpenAI, GPT-6 Astra, Codex Sol, GLM, Kimi, Grok, Mistral, Qwen, Gemini, Free LM API, NVIDIA API / Build NVIDIA | Doublons de Claude : plus de comptes, de clés et de styles d'écriture différents ; conditions d'usage incertaines pour les API gratuites. |
| Claude Opus 5 / 5.5 | Pas des outils distincts : des modèles de Claude. |
| Submagic | Sous-titres animés façon TikTok, contraires à « peu de texte, des images qui respirent » (19 à 88 $/mois). |
| Eye Contact, rotoscopie, Apple Vision | Servent les vidéos face caméra ; règle « jamais de visage frontal ». Apple Vision : Mac uniquement. |
| Effets sonores en JavaScript (DSP), musique procédurale | Ingénierie propre à un autre style, sans utilité ici. |
| Suppression des blancs par FFmpeg | Utile pour une voix enregistrée au micro, pas pour une narration ElevenLabs. |
| Spec.js, Timeline.js | Fichiers personnels du vidéaste ; la notion est couverte par Remotion. |
| VS Code, CapCut | Inutiles avec Claude Code et Remotion ; CapCut pose en plus des questions de conditions d'utilisation et de données. |
| Hermes, Zerno | Noms mal transcrits ou non identifiés. |
| Twitter/X, WhatsApp, School, mlv.sh, Google Maps Scraper | Hors sujet ; le scraping est en plus juridiquement risqué. |

---

## Budget de démarrage indicatif

- *(remplacé le 11/10 : cible à 0 € récurrent)* **≈ 6 $/mois** : ElevenLabs Starter (3 à 4 vidéos de 6-8 min par mois).
  Passage à Creator (22 $/mois) si beaucoup de reprises ou besoin d'une
  voix clonée.
- Remotion, FFmpeg, YouTube : gratuits. Claude : déjà en place.
- Images générées : à l'usage, en complément des photos existantes.

Prix en dollars, relevés le 09/10/2026 sur des sources secondaires — à
revérifier sur les pages officielles avant tout abonnement.

---

## Sources (09/10/2026)

- ElevenLabs : https://bigvu.tv/blog/elevenlabs-pricing-2026-plans-credits-commercial-rights-api-costs/ ; https://magichour.ai/blog/elevenlabs-pricing
- Remotion : https://www.remotion.dev/docs/pricing ; https://www.remotion.dev/docs/license/faq
- Submagic : https://costbench.com/software/ai-video-editing-saas/submagic/
