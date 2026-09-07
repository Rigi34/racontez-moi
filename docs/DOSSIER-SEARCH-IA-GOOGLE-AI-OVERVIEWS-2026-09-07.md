# DOSSIER STRATÉGIQUE --- Racontez-moi.com

## Rubrique : Search IA / Google AI Overviews / visibilité des moteurs génératifs

### Fiche de référence technique et stratégique --- V1 --- 7 septembre 2026

------------------------------------------------------------------------

## 0. Objet de cette fiche

Cette fiche constitue le premier document de référence du dossier
stratégique consacré à l'évolution des moteurs de recherche vers des
expériences de recherche génératives et à leurs conséquences pour
Racontez-moi.com.

Elle doit être considérée comme un document vivant : chaque nouvelle
information fiable issue de la veille doit pouvoir être ajoutée sans
repartir de zéro.

### Question centrale

> Comment concevoir et faire évoluer Racontez-moi.com pour qu'il soit à
> la fois excellent pour les utilisateurs, correctement compris/indexé
> par les moteurs de recherche et susceptible d'être cité ou utilisé
> comme source dans les nouvelles expériences de recherche fondées sur
> l'IA ?

------------------------------------------------------------------------

# 1. Point de départ : le changement de paradigme

Pendant longtemps, l'objectif SEO principal était :

> obtenir une bonne position dans les résultats Google et générer un
> clic vers le site.

Avec AI Overviews et AI Mode, une deuxième question devient stratégique
:

> le contenu de Racontez-moi est-il suffisamment clair, fiable,
> accessible et pertinent pour être retrouvé puis utilisé comme source
> dans une réponse générée par Google ?

Il ne faut toutefois pas opposer SEO et recherche IA.

Selon la documentation officielle Google publiée en 2026, les
expériences génératives de Google reposent notamment sur les systèmes de
recherche classiques, l'index Google et des mécanismes de récupération
de contenus pertinents. Google indique explicitement que les
fondamentaux SEO restent pertinents pour les expériences génératives.

IMPORTANT : - ne pas traiter « GEO » ou « AEO » comme une nouvelle
discipline magique séparée du SEO ; - ne pas chercher des hacks supposés
permettre de manipuler les réponses IA ; - continuer à construire un
site techniquement accessible, indexable, utile et fiable ; - considérer
la visibilité IA comme une nouvelle couche de la visibilité Search.

Source officielle Google :
https://developers.google.com/search/docs/fundamentals/ai-optimization-guide

------------------------------------------------------------------------

# 2. Signal déclencheur de cette veille

Le rapport de veille du 7 septembre 2026 signalait une étude sur les AI
Overviews en France.

Selon cette étude, 52,63 % des recherches françaises analysées
déclenchaient une réponse IA. Le rapport signalait également une forte
présence de YouTube et de sources institutionnelles parmi les sources
citées.

ATTENTION : ces chiffres proviennent de l'étude relayée dans le rapport
de veille et ne doivent pas être transformés en règle universelle
applicable à toutes les requêtes.

Le signal stratégique à retenir est surtout celui-ci :

> Google ne se contente plus de proposer des liens : il synthétise de
> plus en plus directement l'information disponible sur le Web.

Cela renforce l'importance de la capacité d'un site à être : - découvert
; - exploré ; - indexé ; - compris ; - jugé pertinent ; - associé
clairement à un sujet ; - et présenté comme source lorsqu'une réponse
générative s'appuie sur lui.

------------------------------------------------------------------------

# 3. Ce que Google dit officiellement en 2026

La documentation Google est essentielle car elle permet de distinguer
les faits des théories SEO.

Google indique notamment que :

### 3.1 Le SEO reste pertinent

Les fonctionnalités génératives de Google s'appuient sur les systèmes de
Search et sur les contenus présents dans l'index.

Conclusion pour Racontez-moi : ne pas abandonner le SEO classique pour
courir derrière une pseudo-optimisation IA.

------------------------------------------------------------------------

### 3.2 Le contenu utile et non générique est prioritaire

Google recommande de créer un contenu utile, original, fiable et destiné
d'abord aux utilisateurs.

Pour Racontez-moi, c'est particulièrement favorable si le site développe
une vraie expertise éditoriale autour : - de la mémoire familiale ; - du
récit de vie ; - de la transmission intergénérationnelle ; - de la
collecte de souvenirs ; - de l'accompagnement à l'écriture des mémoires.

L'objectif n'est pas de fabriquer artificiellement des pages pour
couvrir toutes les formulations possibles d'une requête.

------------------------------------------------------------------------

### 3.3 Il faut que les pages soient accessibles au crawl et indexables

Google précise que les contenus utilisés dans ses expériences
génératives proviennent de contenus accessibles et explorables.

Priorités techniques : - robots.txt cohérent ; - absence de blocage
involontaire du crawl ; - pages importantes indexables ; - sitemap XML
propre ; - liens internes crawlables ; - statut HTTP correct ; - contenu
réellement présent dans le HTML/rendu accessible à Google ; - pas de
noindex accidentel sur les pages stratégiques.

------------------------------------------------------------------------

### 3.4 Il n'existe pas de « format magique » spécial IA

Google indique qu'il n'est pas nécessaire de créer un format spécial de
contenu uniquement pour les IA.

Notamment : - pas besoin de découper artificiellement toutes les pages
en petits morceaux ; - pas besoin de réécrire chaque texte uniquement
pour une IA ; - pas besoin de produire toutes les variantes possibles
d'une requête ; - pas besoin de créer un fichier spécial simplement pour
être compris par Google.

------------------------------------------------------------------------

### 3.5 llms.txt : ne pas en faire une priorité Google

La documentation officielle Google 2026 indique que Google Search
n'utilise pas llms.txt pour ses fonctionnalités de Search.

Conséquence : - ne pas consacrer une priorité au développement d'un
llms.txt pour « plaire à Google » ; - si un fichier est créé pour
d'autres services ou agents, le considérer comme un choix expérimental
séparé ; - ne jamais confondre cela avec une exigence Google.

------------------------------------------------------------------------

### 3.6 Les données structurées restent utiles, mais elles ne sont pas un passe-droit IA

Google précise que les données structurées ne sont pas obligatoires pour
apparaître dans les expériences génératives.

Elles restent cependant utiles dans une stratégie SEO globale pour aider
Google à comprendre certaines entités et permettre certains résultats
enrichis.

Pour Racontez-moi : - utiliser Schema.org / JSON-LD lorsque le type de
contenu s'y prête ; - ne pas multiplier les schémas artificiels ; -
vérifier que les données structurées correspondent réellement au contenu
visible ; - tester leur validité.

------------------------------------------------------------------------

# 4. Architecture technique cible pour Racontez-moi.com

## 4.1 Principe général

Le site doit être conçu comme un ensemble de contenus clairement
identifiables par : 1. l'utilisateur ; 2. Googlebot ; 3. les systèmes
d'indexation ; 4. les systèmes génératifs qui récupèrent des
informations depuis l'index.

L'architecture doit donc être compréhensible sans dépendre uniquement
d'un contexte JavaScript complexe.

------------------------------------------------------------------------

## 4.2 Pages stratégiques

Identifier explicitement les pages qui doivent constituer le « noyau
public » de Racontez-moi.

Exemples de familles de pages : - page d'accueil ; - présentation du
service ; - fonctionnement ; - pages consacrées aux mémoires ; -
transmission familiale ; - témoignages/cas d'usage ; - ressources
éditoriales ; - FAQ réellement utile ; - pages présentant la méthode ; -
pages auteur/expertise si pertinentes ; - pages légales et
confidentialité ; - pages produit/offre.

Pour chaque page stratégique : - URL stable ; - title unique ; - H1
clair ; - contenu réellement utile ; - liens internes pertinents ; -
canonical correcte ; - indexabilité vérifiée.

------------------------------------------------------------------------

# 5. Contenu : le vrai avantage potentiel de Racontez-moi

Racontez-moi possède déjà un avantage interne important : le produit
dispose d'un système RAG alimenté par des ouvrages de référence et des
sources sélectionnées.

Ce RAG n'est pas le sujet principal de cette fiche.

Le point important pour Search est différent :

> le savoir de qualité présent dans le système interne ne devient pas
> automatiquement une autorité publique visible par Google.

Il faut distinguer :

### Base de connaissance interne

Le RAG sert le produit et permet de produire des réponses
contextualisées.

### Couche éditoriale publique

Le site expose publiquement une partie pertinente de cette expertise
sous forme de contenus utiles et vérifiables.

Ces deux couches peuvent être reliées, sans nécessairement exposer la
totalité du RAG.

------------------------------------------------------------------------

# 6. Le principe « profondeur interne / lisibilité externe »

Racontez-moi peut avoir une architecture de connaissance très profonde
en interne tout en présentant des contenus publics simples à comprendre.

Objectif :

> ne pas simplifier la connaissance jusqu'à la rendre pauvre ; la rendre
> accessible sans perdre sa rigueur.

Une bonne page publique doit pouvoir être comprise : - par une personne
qui découvre le sujet ; - par un moteur de recherche ; - par un système
génératif qui cherche une réponse ; - puis renvoyer vers le produit
lorsqu'une aide plus approfondie est pertinente.

------------------------------------------------------------------------

# 7. Format éditorial recommandé

Ne pas créer des pages uniquement parce qu'une « longue traîne » existe.

Créer des contenus répondant à de vrais besoins.

Exemples de questions pertinentes pour Racontez-moi :

-   Comment commencer à écrire ses mémoires ?
-   Comment recueillir les souvenirs de ses parents ?
-   Quelles questions poser à sa mère sur son enfance ?
-   Comment conserver les souvenirs d'une famille ?
-   Comment transmettre l'histoire familiale à ses enfants ?
-   Comment enregistrer le récit de vie d'un proche ?
-   Que faire quand on a beaucoup de souvenirs mais qu'on ne sait pas
    les organiser ?
-   Comment transformer des souvenirs en récit ?
-   Comment écrire les mémoires d'un parent ?
-   Comment raconter son enfance à ses petits-enfants ?

Mais ces pages doivent être créées parce qu'elles répondent à un besoin
réel, pas pour remplir artificiellement un catalogue de mots-clés.

------------------------------------------------------------------------

# 8. Maillage interne

Le maillage doit construire une véritable carte thématique.

Exemple :

PAGE PILIER « Écrire ses mémoires »

→ Comment commencer ? → Préparer un entretien avec ses parents →
Questions sur l'enfance → Questions sur la famille → Organiser ses
souvenirs → Transformer un entretien en récit → Conserver photos et
souvenirs → Transmettre l'histoire familiale

Chaque page doit : - avoir une fonction claire ; - renvoyer vers les
pages parentes ; - renvoyer vers les pages connexes ; - permettre de
poursuivre naturellement la lecture ; - éviter les liens artificiels.

------------------------------------------------------------------------

# 9. Entités et identité éditoriale

Racontez-moi doit être identifiable comme une entité claire.

Le site doit expliciter : - qui est Racontez-moi ; - ce que fait le
service ; - pour qui ; - sur quelle méthode il repose ; - quelles sont
ses sources ; - qui produit/édite les contenus ; - quelles limites
possède l'IA utilisée ; - comment sont traitées les données
personnelles.

Une identité éditoriale claire est importante pour éviter que le site
apparaisse comme une collection anonyme de textes générés.

------------------------------------------------------------------------

# 10. Données structurées : approche recommandée

Audit à réaliser sur les types réellement présents sur le site.

Possibilités selon les pages : - Organization ; - WebSite ; - WebPage
; - Article ; - BreadcrumbList ; - Person, lorsqu'il existe réellement
un auteur identifiable ; - éventuellement d'autres types pertinents
selon les contenus.

Règles : - JSON-LD privilégié ; - données correspondant au contenu
réellement visible ; - pas de markup inventé ; - validation avec les
outils Google ; - ne pas utiliser Schema.org comme une technique de
manipulation.

Référence :
https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data

------------------------------------------------------------------------

# 11. Performance et expérience utilisateur

La recherche IA ne remplace pas les fondamentaux techniques.

À auditer : - Core Web Vitals ; - LCP ; - INP ; - CLS ; - poids des
pages ; - images ; - JavaScript ; - CSS ; - temps de réponse serveur ; -
cache ; - stabilité mobile ; - accessibilité ; - erreurs réseau ; -
pages 404/500 ; - redirections.

Principe : \> le contenu stratégique doit rester accessible même si
certaines couches interactives ou JavaScript échouent.

------------------------------------------------------------------------

# 12. JavaScript et contenu rendu

Point important pour une application moderne.

Vérifier pour chaque page publique : - ce que voit un navigateur ; - ce
que reçoit initialement le serveur ; - ce que Google peut rendre ; - si
le texte stratégique est réellement présent après rendu ; - si les liens
importants sont découvrables ; - si les métadonnées sont correctes.

Si Next.js ou une architecture SSR/SSG est utilisée : - privilégier
SSR/SSG/ISR pour les pages éditoriales lorsque pertinent ; - éviter de
dépendre d'un rendu client inutile pour le contenu critique ; - tester
régulièrement avec URL Inspection et outils de rendu.

------------------------------------------------------------------------

# 13. Robots.txt / sitemap / indexation

Checklist technique prioritaire :

\[ \] robots.txt vérifié \[ \] sitemap.xml présent \[ \] sitemap déclaré
dans Search Console \[ \] pages stratégiques indexables \[ \] aucune
règle noindex accidentelle \[ \] canonical cohérente \[ \] URLs stables
\[ \] redirections propres \[ \] pages orphelines identifiées \[ \]
liens internes crawlables \[ \] erreurs 4xx/5xx surveillées \[ \] URL
Inspection utilisée sur les pages stratégiques

------------------------------------------------------------------------

# 14. Search Console : nouveau point de surveillance majeur

En juin 2026, Google a annoncé des rapports Search Console dédiés à la
visibilité dans les fonctionnalités génératives.

Ces rapports permettent de suivre spécifiquement les impressions issues
de fonctionnalités génératives comme AI Overviews et AI Mode.

C'est donc désormais un élément concret du pilotage de Racontez-moi.

Action : - connecter Racontez-moi.com à Google Search Console ; -
vérifier l'accès aux nouveaux rapports ; - établir une situation de
référence ; - suivre l'évolution dans le temps ; - comparer visibilité
Search classique et visibilité générative.

Source officielle :
https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports

------------------------------------------------------------------------

# 15. Mesure : ne pas regarder uniquement les clics

Avec les réponses génératives, une baisse ou une modification du CTR ne
signifie pas nécessairement que le contenu est devenu moins pertinent.

Suivre au minimum : - impressions ; - clics ; - CTR ; - position ; -
requêtes ; - pages ; - évolution des impressions génératives ; -
évolution des clics génératifs lorsque les données sont disponibles ; -
pages qui gagnent/perdent de la visibilité ; - requêtes
informationnelles vs commerciales.

Objectif : comprendre comment le trafic évolue quand une partie de la
réponse est consommée directement dans Google.

------------------------------------------------------------------------

# 16. Expérimentation recommandée

Créer un petit corpus de pages publiques sur un thème Racontez-moi.

Exemple : 10 à 20 pages autour de « transmettre son histoire familiale
».

Pour chaque page : - intention utilisateur définie ; - contenu original
; - sources indiquées lorsque nécessaire ; - auteur/entité claire ; -
maillage interne ; - données structurées pertinentes ; - indexation
contrôlée.

Puis suivre pendant plusieurs mois : - indexation ; - impressions ; -
positions ; - apparitions génératives lorsque mesurables ; - requêtes
déclenchantes ; - évolution du trafic.

Le but est de construire une connaissance empirique propre à
Racontez-moi plutôt que de dépendre des promesses de consultants
SEO/GEO.

------------------------------------------------------------------------

# 17. Ce qu'il NE FAUT PAS faire

## Ne pas :

-   produire des centaines de pages génériques avec l'IA ;
-   créer une page pour chaque variante artificielle d'une question ;
-   bourrer les textes de mots-clés ;
-   créer des contenus uniquement pour être repris par une IA ;
-   créer des « mentions » artificielles sur le Web ;
-   considérer llms.txt comme une exigence Google ;
-   découper artificiellement tous les contenus en micro-blocs ;
-   croire qu'un schema particulier garantit une citation dans AI
    Overview ;
-   supposer qu'une technique GEO garantit une position ;
-   remplacer l'expertise humaine par du contenu IA générique.

Google indique explicitement que la création massive de pages générées
sans valeur ajoutée peut relever de sa politique de scaled content
abuse.

Référence :
https://developers.google.com/search/docs/fundamentals/using-gen-ai-content

------------------------------------------------------------------------

# 18. Point fondamental : ne pas chercher à « manipuler l'IA »

La bonne stratégie n'est pas :

> « Comment faire pour que Google me cite ? »

mais :

> « Comment construire une ressource tellement utile, claire, fiable et
> identifiable que sa présence dans les réponses génératives devient
> logique ? »

Cela change complètement la philosophie du projet.

------------------------------------------------------------------------

# 19. Ce qui doit être considéré comme FAIT

À ce jour, pour Google :

### Confirmé

-   AI Overviews et AI Mode utilisent les systèmes de Search et des
    contenus de l'index ;
-   le SEO classique reste pertinent ;
-   le contenu utile et original reste central ;
-   les pages doivent être accessibles/crawlables/indexables ;
-   il n'existe pas de balisage spécial obligatoire pour apparaître dans
    les réponses IA ;
-   llms.txt n'est pas utilisé par Google Search ;
-   les données structurées restent utiles pour le Search mais ne sont
    pas une exigence spécifique aux AI Overviews ;
-   Search Console dispose désormais de rapports dédiés aux performances
    génératives.

### À surveiller

-   évolution de la fréquence et du fonctionnement des AI Overviews ;
-   évolution d'AI Mode ;
-   évolution des rapports Search Console ;
-   évolution du comportement des utilisateurs ;
-   évolution du rôle des citations ;
-   évolution des agents capables d'interagir directement avec les sites
    ;
-   éventuelles nouvelles exigences techniques.

------------------------------------------------------------------------

# 20. Question spécifique Racontez-moi : quelle est notre opportunité ?

Racontez-moi possède une caractéristique intéressante :

> le produit travaille déjà sur un domaine où l'IA, la connaissance, la
> narration et la mémoire humaine se rencontrent.

Mais la différenciation ne doit pas être :

> « Nous avons de l'IA. »

Elle doit être :

> « Nous utilisons l'IA pour aider une personne à faire émerger et
> transmettre une histoire qui lui appartient réellement. »

La connaissance de référence peut soutenir le système.

Le vécu humain reste la matière première.

------------------------------------------------------------------------

# 21. Architecture stratégique à garder en tête

Racontez-moi peut être pensé en trois couches :

## Couche 1 --- Connaissance interne

RAG + ouvrages + sources de référence + règles métier.

Objectif : produire des réponses de qualité dans le produit.

## Couche 2 --- Expérience utilisateur

Questions, conversations, collecte de souvenirs, organisation, écriture,
édition.

Objectif : transformer la matière brute du vécu en récit.

## Couche 3 --- Présence publique

Site, ressources, articles, guides, FAQ, pages thématiques, expertise.

Objectif : être découvert, compris et identifié comme une ressource
fiable.

Le présent dossier porte principalement sur la couche 3 et son
articulation avec les deux autres.

------------------------------------------------------------------------

# 22. Principe de confidentialité à conserver

La mémoire personnelle est une donnée émotionnellement sensible.

La veille du 7 septembre 2026 avait retenu un cas où une IA avait
rappelé à une personne un souvenir personnel issu de conversations
antérieures.

Le signal stratégique pour Racontez-moi est :

> la confiance ne doit pas être uniquement une question juridique ou
> technique ; elle doit être une caractéristique de l'expérience.

À documenter dans le produit : - ce qui est mémorisé ; - pourquoi ; -
pendant combien de temps ; - ce qui peut être supprimé ; - ce qui est
utilisé pour générer un récit ; - ce qui reste privé ; - ce qui peut
être exporté ; - ce qui peut être partagé.

------------------------------------------------------------------------

# 23. Feuille de route technique initiale

## PRIORITÉ 1 --- Audit d'indexation

-   Search Console ;
-   robots.txt ;
-   sitemap ;
-   canonical ;
-   noindex ;
-   pages publiques réellement indexables.

## PRIORITÉ 2 --- Audit des pages publiques

-   title ;
-   H1 ;
-   structure ;
-   contenu ;
-   maillage ;
-   auteur ;
-   entités ;
-   données structurées.

## PRIORITÉ 3 --- Audit rendu / JavaScript

-   HTML initial ;
-   rendu Google ;
-   liens ;
-   contenu critique ;
-   performance.

## PRIORITÉ 4 --- Mesure

-   Search Console ;
-   rapports génératifs ;
-   baseline ;
-   suivi mensuel.

## PRIORITÉ 5 --- Corpus éditorial

Construire un petit nombre de contenus réellement excellents autour des
problèmes que Racontez-moi résout.

## PRIORITÉ 6 --- Expérimentation

Tester l'impact réel des améliorations plutôt que d'appliquer des «
hacks GEO ».

------------------------------------------------------------------------

# 24. Grille d'analyse pour chaque nouvelle information de veille

Chaque nouvel article ajouté à ce dossier doit être analysé avec les
mêmes questions :

### 1. Fait

Qu'est-ce qui s'est réellement passé ?

### 2. Source

Quelle est la source primaire ou officielle ?

### 3. Niveau de certitude

-   confirmé ;
-   fortement documenté ;
-   observation ;
-   hypothèse ;
-   spéculation.

### 4. Évolution

Qu'est-ce qui change réellement par rapport à avant ?

### 5. Impact Search

Cela concerne-t-il : - crawl ? - indexation ? - classement ? - affichage
? - AI Overviews ? - AI Mode ? - agents ? - mesure ?

### 6. Impact Racontez-moi

Cela change-t-il quelque chose pour : - architecture ; - contenu ; - UX
; - données ; - confidentialité ; - acquisition ; - produit ?

### 7. Action

Faut-il : - ne rien faire ; - surveiller ; - mesurer ; - expérimenter
; - modifier le code ; - modifier le contenu ; - modifier la stratégie ?

### 8. Priorité

-   P0 : immédiat ;
-   P1 : important ;
-   P2 : à planifier ;
-   P3 : simple veille.

------------------------------------------------------------------------

# 25. Règle de gouvernance pour Claude Code

Claude Code doit traiter ce document comme un référentiel stratégique,
mais ne doit pas modifier automatiquement le site sur la seule base
d'une nouvelle information de veille.

Avant toute modification importante :

1.  identifier la source ;
2.  vérifier si l'information est officielle ;
3.  distinguer fait et interprétation ;
4.  vérifier l'état actuel du code ;
5.  proposer l'impact technique ;
6.  proposer la modification ;
7.  tester ;
8.  mesurer après déploiement.

Ne jamais implémenter une prétendue « astuce AI SEO » sans preuve
suffisante.

------------------------------------------------------------------------

# 26. Sources officielles de référence

Google Search Central --- AI Features and Your Website :
https://developers.google.com/search/docs/appearance/ai-features

Google Search Central --- Optimizing your website for generative AI
features :
https://developers.google.com/search/docs/fundamentals/ai-optimization-guide

Google Search Central --- Search Console / Generative AI performance
reports :
https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports

Google Search Central --- Structured data :
https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data

Google Search Essentials :
https://developers.google.com/search/docs/essentials

Google Search --- Helpful, reliable, people-first content :
https://developers.google.com/search/docs/fundamentals/creating-helpful-content

Google Search --- Generative AI content :
https://developers.google.com/search/docs/fundamentals/using-gen-ai-content

Google Search --- How Search works :
https://developers.google.com/search/docs/fundamentals/how-search-works

------------------------------------------------------------------------

# 27. Conclusion stratégique

Le chantier n'est pas « faire du GEO ».

Le chantier est :

> construire Racontez-moi comme une ressource numérique claire, fiable,
> techniquement accessible et éditorialement distinctive, dans un Web où
> les moteurs répondent de plus en plus directement aux utilisateurs.

La conséquence majeure pour le développement est simple :

**ne pas concevoir le site uniquement comme une application.**

Il doit avoir une façade publique qui soit : - lisible ; - indexable ; -
structurée ; - rapide ; - explicite ; - utile ; - crédible ; - reliée à
une véritable expertise.

Le RAG interne constitue le socle de connaissance du produit.

La présence éditoriale publique constitue le socle de découvrabilité.

L'expérience utilisateur constitue le socle de valeur.

Ces trois couches doivent rester distinctes mais cohérentes.

------------------------------------------------------------------------

## STATUT DU DOSSIER

Version : V1 Date : 7 septembre 2026 Projet : Racontez-moi.com Rubrique
: Search IA / Google AI Overviews / visibilité générative Statut :
document de référence vivant

Prochaine étape recommandée : audit technique réel de Racontez-moi.com à
partir du code actuel, puis comparaison point par point avec cette
fiche.
