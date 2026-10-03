# Chantier « La voix choisie » — conservation d'extraits de voix + QR codes dans le livre

**Statut : À FAIRE — après la fin de l'audit de sécurité en cours, puis sur-audit dédié.**
Marqueur posé le 03/10/2026 à la demande de Régis. Ne pas démarrer avant son feu vert explicite : ce chantier change une promesse publique de confidentialité et touche au stockage de données personnelles.

## Pourquoi

- C'est le principal écart de produit relevé par l'étude concurrentielle du 02/10/2026 : Mon Livre de Vie, Remento, Meminto et Tell Mel vendent tous « sa voix à réécouter », avec des QR codes imprimés dans le livre.
- L'émotion est le premier moteur d'achat du cadeau : entendre la voix d'un parent ou d'un grand-parent, des années plus tard, en scannant une page.
- C'est aussi ce qui justifie le mieux un prix de 155 € face à des concurrents à 85-99 €.

## État actuel (vérifié dans le code le 02/10/2026)

- La voix est enregistrée dans le navigateur (`app/components/Seance.tsx`), envoyée à `app/api/transcribe/route.ts` (Groq Whisper), puis **jamais conservée**.
- `app/confidentialite/page.tsx` promet : « L'audio de votre voix n'est jamais conservé ». **Cette promesse doit être modifiée avant toute mise en production.**

## Principe retenu (étude du 02/10/2026)

Rien n'est gardé par défaut. Après la composition d'un passage, le narrateur peut écouter sa réponse et choisir « Garder ma voix pour ce passage » : aucun extrait, quelques-uns, au plus un par passage. Ce qui n'est pas choisi n'est jamais enregistré (l'audio reste en mémoire dans le navigateur le temps du choix).

## Architecture proposée

| Élément | Proposition |
|---|---|
| Stockage | Bucket Supabase privé `voix`, chemin `{user_id}/{fragment_id}/{id}.webm` (opus, ~0,5 Mo/min) |
| Données | Table `extraits_voix` (id, user_id, fragment_id, chemin, duree_s, consenti_le, version_consentement, jeton_qr, actif) — **RLS dès la création** |
| Écoute | Dans l'application, par URL signée de courte durée ; aucune URL de stockage imprimée |
| QR codes | Le livre imprime `racontez-moi.com/v/<jeton>` (jeton aléatoire non devinable) ; le serveur renvoie l'extrait par URL signée ; le narrateur peut désactiver un jeton |
| Livre | QR + légende courte (« Écouter sa voix ») en fin de passage ; QR généré côté serveur (pas de dépendance réseau à la compilation Typst) |
| Suppression | Extrait par extrait, et à la suppression du compte : étendre `lib/nettoyage-storage.ts` au bucket `voix` |
| Export | Inclure les extraits dans `/api/compte/export` |
| Pérennité | Chemin court et stable sur le domaine de Racontez-moi ; fichiers audio remis au narrateur (ZIP) ; engagement écrit en cas d'arrêt du service (remise des fichiers, redirection maintenue N années — à décider) |

## Juridique (à faire relire)

- Consentement explicite, extrait par extrait, horodaté et versionné (art. 6.1.a RGPD ; le contenu peut relever de l'art. 9).
- Minimisation : seuls les extraits choisis.
- Durée : tant que le compte existe ; accès familial par QR uniquement au départ, légataire de mémoire plus tard (art. 85 LIL).
- Nouvelle formulation de confidentialité, par exemple : « Votre voix n'est jamais conservée sans votre accord explicite, extrait par extrait. »
- Analyse d'impact (AIPD) conseillée.

## Effort estimé

3 à 5 jours de développement + relecture juridique + sur-audit de sécurité (nouveau bucket, nouvelle table, route publique `/v/<jeton>`).
