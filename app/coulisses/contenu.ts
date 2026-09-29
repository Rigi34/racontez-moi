// Contenu de la page interne /coulisses — page pédagogique personnelle
// (29/09/2026), qui explique l'architecture technique à un débutant.
// Séparé de la mise en page pour pouvoir corriger un texte sans toucher
// au rendu. Faits repris du manifeste (docs/MANIFESTE-ECOSYSTEME.md), de
// .env.example et de docs/security/SECURITY.md §11ter — aucune clé, aucun
// identifiant de projet, aucune URL interne : la page doit pouvoir être
// vue sans risque même si l'URL Preview circule.

export type Famille = "acces" | "donnees" | "ia" | "livre" | "veille";

export const FAMILLES: Record<Famille, { nom: string; couleur: string; fond: string }> = {
  acces: { nom: "Faire tourner le site", couleur: "#1F4B4C", fond: "#E4ECEA" },
  donnees: { nom: "Garder les données", couleur: "#3F6B4F", fond: "#E6EDE3" },
  ia: { nom: "Intelligence artificielle", couleur: "#B8823D", fond: "#F5EBDC" },
  livre: { nom: "Payer et fabriquer le livre", couleur: "#8A4B2F", fond: "#F3E4DA" },
  veille: { nom: "Surveiller et prévenir", couleur: "#5B5570", fond: "#E9E6EE" },
};

export type Fiche = {
  id: string;
  nom: string;
  sousTitre: string;
  famille: Famille;
  resume: string;
  sert: string;
  entre: string;
  sort: string;
  donnees: string;
  environnement: string;
};

export const FICHES: Fiche[] = [
  {
    id: "navigateur",
    nom: "Le navigateur",
    sousTitre: "Chrome, Safari, Firefox…",
    famille: "acces",
    resume: "La fenêtre par laquelle le visiteur voit le site.",
    sert: "Afficher les pages, capter la voix au micro, envoyer ce que le narrateur tape ou dit.",
    entre: "Les pages envoyées par le site (HTML, CSS, JavaScript).",
    sort: "Les clics, l'enregistrement audio, le texte saisi, les photos choisies.",
    donnees: "Presque rien : un cookie qui dit « cette personne est connectée ».",
    environnement: "Le même navigateur sert aux deux : c'est l'adresse visitée qui décide si l'on est en TEST ou en Production.",
  },
  {
    id: "vercel",
    nom: "Vercel",
    sousTitre: "L'hébergeur",
    famille: "acces",
    resume: "La maison où le site habite et tourne jour et nuit.",
    sert: "Récupérer le code sur GitHub, le construire, le mettre en ligne et l'exécuter à chaque visite.",
    entre: "Le code (depuis GitHub) et les variables d'environnement (les clés secrètes).",
    sort: "Le site en ligne, et des journaux (logs) de ce qui s'est passé.",
    donnees: "Les logs et les clés secrètes. Pas les histoires des narrateurs : elles sont dans Supabase.",
    environnement: "Deux sortes de déploiements : « Preview » pour vérifier, « Production » pour le vrai site. Chacun peut recevoir ses propres clés.",
  },
  {
    id: "nextjs",
    nom: "Next.js",
    sousTitre: "Le chef d'orchestre",
    famille: "acces",
    resume: "Le programme de Racontez-moi lui-même : les pages et la logique.",
    sert: "Fabriquer les pages et répondre aux demandes (les « routes API » du dossier app/api) en appelant les bons services.",
    entre: "Les demandes du navigateur : « démarre une séance », « transcris cet audio », « commande le livre »…",
    sort: "Des pages, des réponses, et des appels vers Supabase, Claude, Groq, Stripe, Lulu…",
    donnees: "Il ne garde rien lui-même : il orchestre, et range tout dans Supabase.",
    environnement: "Le code Next.js est le même en TEST et en Production. Seules les clés qu'on lui donne changent.",
  },
  {
    id: "github",
    nom: "GitHub",
    sousTitre: "La bibliothèque du code",
    famille: "acces",
    resume: "L'endroit où le code est rangé, avec tout son historique.",
    sert: "Conserver chaque version du code (chaque commit), avec des branches séparées comme main et test.",
    entre: "Les modifications envoyées depuis l'ordinateur (git push).",
    sort: "Le code, que Vercel vient chercher pour construire le site. Il lance aussi des vérifications automatiques (lint, typecheck, tests).",
    donnees: "Le code source et son historique. Jamais de clé secrète ni de donnée d'utilisateur.",
    environnement: "Un seul dépôt pour les deux. Ce sont les branches qui distinguent le travail en cours (test) du travail validé (main).",
  },
  {
    id: "supabase",
    nom: "Supabase",
    sousTitre: "La mémoire du site",
    famille: "donnees",
    resume: "La base de données et une partie du « back-end », en un seul service.",
    sert: "Garder tout ce qui doit survivre à une visite : comptes, séances, fragments, photos, commandes.",
    entre: "Ce que Next.js lui demande d'enregistrer ou de retrouver.",
    sort: "Les données demandées — et seulement celles que la personne a le droit de voir.",
    donnees: "Chez Supabase, réparties en trois briques : Auth, Database et Storage (voir les fiches suivantes).",
    environnement: "Deux projets Supabase bien séparés : un projet TEST et le projet de Production. Ils ne partagent aucune donnée.",
  },
  {
    id: "auth",
    nom: "Supabase Auth",
    sousTitre: "Le portier",
    famille: "donnees",
    resume: "Sait qui est qui.",
    sert: "Créer les comptes, vérifier les connexions (email + mot de passe, ou Google), garder la session ouverte.",
    entre: "Un email et un mot de passe, ou une connexion Google.",
    sort: "Un « jeton » qui prouve l'identité, rangé dans un cookie du navigateur.",
    donnees: "La liste des comptes, dans Supabase.",
    environnement: "Un compte créé en TEST n'existe pas en Production, et inversement.",
  },
  {
    id: "database",
    nom: "Database (PostgreSQL)",
    sousTitre: "Les tiroirs rangés",
    famille: "donnees",
    resume: "Des tableaux bien rangés, un par type d'information.",
    sert: "Stocker séances, fragments, profil du narrateur, questions, commandes, codes cadeau, paiements reçus…",
    entre: "Des lignes à ajouter ou modifier.",
    sort: "Des lignes retrouvées. Une règle (RLS) garantit que chacun ne voit que ses propres lignes.",
    donnees: "Dans PostgreSQL chez Supabase. L'extension pgvector y range aussi les embeddings (voir Hugging Face).",
    environnement: "La structure (les tableaux) est la même partout grâce aux migrations. Le contenu, lui, est différent.",
  },
  {
    id: "storage",
    nom: "Supabase Storage",
    sousTitre: "Le placard à fichiers",
    famille: "donnees",
    resume: "Garde les fichiers, là où la base garde des lignes.",
    sert: "Conserver les photos ajoutées par le narrateur et les PDF du livre prêts à imprimer.",
    entre: "Des fichiers (images, PDF).",
    sort: "Les mêmes fichiers, sur demande, pour l'aperçu ou pour Lulu.",
    donnees: "Deux « buckets » (dossiers) chez Supabase : photos et manuscrits. La base note où chaque fichier est rangé.",
    environnement: "Chaque projet Supabase a son propre Storage : une photo déposée en TEST n'arrive jamais en Production.",
  },
  {
    id: "claude",
    nom: "Claude (Anthropic)",
    sousTitre: "L'écrivain",
    famille: "ia",
    resume: "Comprend le récit et l'écrit.",
    sert: "Poser les relances pendant la séance, puis composer le fragment littéraire à la première personne.",
    entre: "La transcription du narrateur, la question posée, et un peu de contexte (profil, souvenirs proches).",
    sort: "Des relances et des fragments rédigés.",
    donnees: "Le texte est envoyé à Anthropic pour être traité. Le résultat, lui, est rangé dans Supabase.",
    environnement: "Pas de « mode test » : un appel fait en TEST consomme de vrais crédits. D'où les quotas par jour.",
  },
  {
    id: "huggingface",
    nom: "Hugging Face",
    sousTitre: "Le traducteur en nombres",
    famille: "ia",
    resume: "Transforme une phrase en une liste de nombres qui résume son sens.",
    sert: "Fabriquer des « embeddings » : on peut alors retrouver les textes qui parlent de la même chose (recherche sémantique).",
    entre: "Un texte (un fragment, un passage d'un livre de référence).",
    sort: "Une liste de 768 nombres qui représente le sens du texte.",
    donnees: "Ces nombres sont rangés dans la base Supabase (pgvector), à côté du texte d'origine.",
    environnement: "Même service des deux côtés. S'il tombe en panne, la séance continue : le contexte est juste un peu moins riche.",
  },
  {
    id: "groq",
    nom: "Groq",
    sousTitre: "L'oreille",
    famille: "ia",
    resume: "Transforme la voix en texte.",
    sert: "Transcrire ce que le narrateur dit au micro (modèle Whisper).",
    entre: "L'enregistrement audio d'une réponse.",
    sort: "Le texte de cette réponse.",
    donnees: "L'audio est envoyé pour être transcrit. C'est le texte qui est conservé dans Supabase, pas l'audio.",
    environnement: "Comme Claude : pas de mode test, chaque transcription est réelle et comptée.",
  },
  {
    id: "typst",
    nom: "Typst",
    sousTitre: "L'imprimeur de pages",
    famille: "livre",
    resume: "Met les fragments en page pour en faire un vrai livre.",
    sert: "Composer le PDF intérieur et la couverture au format exigé par Lulu. L'EPUB (livre numérique) est produit à côté.",
    entre: "Les fragments, les photos, le titre, le sous-titre et la couleur de couverture.",
    sort: "Des PDF. Un tampon « APERÇU » y figure tant que la commande n'est pas passée.",
    donnees: "Typst n'est pas un service extérieur : c'est un outil dans le code. Les PDF finaux sont rangés dans Storage (manuscrits).",
    environnement: "Identique partout : même mise en page en TEST et en Production. Ce qu'on prévisualise est ce qui sera imprimé.",
  },
  {
    id: "stripe",
    nom: "Stripe",
    sousTitre: "La caisse",
    famille: "livre",
    resume: "Encaisse les paiements.",
    sert: "Faire payer le parcours (155 €) ou un cadeau, puis prévenir le site que le paiement a réussi.",
    entre: "La demande de paiement préparée par le site ; la carte saisie par le client, directement chez Stripe.",
    sort: "Un message automatique (webhook) qui dit au site : « c'est payé ».",
    donnees: "Les paiements et les cartes restent chez Stripe. Le site note seulement « payé » dans Supabase.",
    environnement: "Mode test (fausses cartes, comme 4242 4242 4242 4242, aucun argent réel) contre mode live (vrais paiements).",
  },
  {
    id: "lulu",
    nom: "Lulu",
    sousTitre: "L'atelier d'impression",
    famille: "livre",
    resume: "Imprime et expédie le livre relié.",
    sert: "Recevoir les PDF, imprimer le livre à l'exemplaire et l'envoyer à l'adresse donnée.",
    entre: "Le PDF intérieur, le PDF de couverture et l'adresse de livraison.",
    sort: "Un numéro de commande, puis un livre dans une boîte aux lettres.",
    donnees: "La commande d'impression est chez Lulu. Le site en garde une trace dans Supabase.",
    environnement: "Mode « sandbox » par défaut : rien n'est imprimé. L'impression réelle n'a lieu que si la Production l'active explicitement.",
  },
  {
    id: "brevo",
    nom: "Brevo",
    sousTitre: "Le facteur",
    famille: "veille",
    resume: "Envoie des emails.",
    sert: "Transmettre les messages du formulaire de contact.",
    entre: "Le nom, l'email et le message saisis par le visiteur.",
    sort: "Un email dans la boîte de réception de Racontez-moi.",
    donnees: "Les emails envoyés sont visibles chez Brevo.",
    environnement: "Pas de mode test distinct : un message envoyé en TEST part vraiment.",
  },
  {
    id: "sentry",
    nom: "Sentry",
    sousTitre: "Le détecteur de fumée",
    famille: "veille",
    resume: "Prévient quand quelque chose plante.",
    sert: "Repérer les erreurs (sur le serveur comme dans le navigateur) et les regrouper pour qu'on les voie.",
    entre: "Les erreurs qui se produisent, avec l'endroit du code concerné.",
    sort: "Une liste d'incidents lisible, avec le détail technique.",
    donnees: "Chez Sentry, dans son tableau de bord.",
    environnement: "Les erreurs de chaque environnement peuvent y remonter. Pour la Production, il faut que sa clé (DSN) soit renseignée dans Vercel.",
  },
];

// Frise « le chemin d'une histoire » — `outils` renvoie aux fiches ci-dessus.
export const CHEMIN: { titre: string; detail: string; outils: string[] }[] = [
  { titre: "Le visiteur arrive", detail: "Il tape l'adresse du site, Vercel lui envoie la page.", outils: ["navigateur", "vercel"] },
  { titre: "Il ouvre sa session", detail: "Il se connecte ou crée son compte.", outils: ["auth"] },
  { titre: "Il raconte son histoire", detail: "Une question s'affiche, il répond au micro.", outils: ["navigateur", "nextjs"] },
  { titre: "L'audio est transcrit", detail: "La voix devient du texte.", outils: ["groq"] },
  { titre: "Le texte est travaillé par l'IA", detail: "Deux relances, puis la composition du fragment.", outils: ["claude", "huggingface"] },
  { titre: "Le fragment est enregistré", detail: "Il rejoint la base, au nom du narrateur.", outils: ["database"] },
  { titre: "Les fragments s'accumulent", detail: "Séance après séance, le livre grossit.", outils: ["database"] },
  { titre: "Les photos s'ajoutent", detail: "Le narrateur illustre ses souvenirs.", outils: ["storage", "database"] },
  { titre: "Le manuscrit prend forme", detail: "Titre, sous-titre, couleur, aperçu à tout moment.", outils: ["nextjs", "database"] },
  { titre: "Le PDF et l'EPUB sont générés", detail: "Mise en page au format d'impression.", outils: ["typst", "storage"] },
  { titre: "Le livre est commandé", detail: "Paiement confirmé, adresse de livraison saisie.", outils: ["stripe"] },
  { titre: "Lulu imprime le livre", detail: "Le livre relié part chez le narrateur.", outils: ["lulu"] },
];

export const PANNES: { symptome: string; ouRegarder: string[]; conseil: string }[] = [
  {
    symptome: "Le site ne s'affiche pas",
    ouRegarder: ["vercel"],
    conseil: "Regarder le dernier déploiement dans Vercel : a-t-il échoué ? Les logs disent souvent pourquoi.",
  },
  {
    symptome: "Une séance ne démarre pas",
    ouRegarder: ["supabase", "vercel", "sentry"],
    conseil: "Vérifier que la personne est bien connectée, puis les logs Vercel et Supabase. Se demander aussi : suis-je bien dans le bon environnement ?",
  },
  {
    symptome: "L'IA ne répond pas",
    ouRegarder: ["claude", "groq", "vercel"],
    conseil: "Vérifier la clé API du service concerné, son crédit restant, et les logs. Le quota quotidien a peut-être été atteint.",
  },
  {
    symptome: "Un paiement ne débloque pas le parcours",
    ouRegarder: ["stripe", "supabase"],
    conseil: "Dans Stripe : le paiement est-il réussi ? Le webhook a-t-il été livré ? Puis dans Supabase : l'accès a-t-il été enregistré ?",
  },
  {
    symptome: "Une photo n'apparaît pas",
    ouRegarder: ["storage", "database", "typst"],
    conseil: "Le fichier est-il dans Storage ? La base sait-elle où il est ? Est-il bien repris lors de la génération du livre ?",
  },
  {
    symptome: "Le livre PDF est incorrect",
    ouRegarder: ["typst"],
    conseil: "C'est la mise en page Typst qu'il faut regarder (lib/typst.ts). Comparer avec l'aperçu, qui utilise exactement la même fabrication.",
  },
  {
    symptome: "Le livre n'est pas parti à l'impression",
    ouRegarder: ["lulu", "storage"],
    conseil: "La commande existe-t-elle chez Lulu ? Est-on en sandbox ou en production ? Les PDF sont-ils bien dans Storage ?",
  },
  {
    symptome: "Un message de contact n'arrive pas",
    ouRegarder: ["brevo"],
    conseil: "Regarder dans Brevo si l'email est parti, et le quota de 5 messages par jour et par visiteur.",
  },
];

export const A_RETENIR: string[] = [
  "GitHub conserve le code, Vercel le fait tourner.",
  "Supabase garde les données : Auth pour les comptes, Database pour les lignes, Storage pour les fichiers.",
  "Groq transforme la voix en texte.",
  "Claude travaille le texte et écrit les fragments.",
  "Hugging Face traduit les textes en nombres pour retrouver les souvenirs proches.",
  "Typst met le livre en page, Lulu l'imprime.",
  "Stripe encaisse, puis prévient le site par webhook.",
  "Sentry signale les erreurs, Brevo envoie les emails de contact.",
  "TEST et Production ont le même code, mais pas les mêmes données ni les mêmes clés.",
  "En Production, chaque geste touche de vrais utilisateurs : on y va doucement.",
];
