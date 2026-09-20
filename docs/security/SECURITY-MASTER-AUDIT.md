# Racontez-moi.com — Mission maître de sécurité  
## Audit initial, documentation permanente et suivi de sécurité  
  
**Document de pilotage destiné à Claude Code**  
  
> Ce document constitue le cahier des charges maître pour l'audit de sécurité de Racontez-moi.com et la mise en place d'une documentation de sécurité durable dans le dépôt.  
>  
> Il doit être conservé dans le projet et servir de référence lors des futurs audits.  
  
---  
  
# 1. OBJECTIF GÉNÉRAL  
  
Réaliser un audit de sécurité approfondi de Racontez-moi.com, en priorité sur :  
  
- les contrôles d'accès ;  
- les vulnérabilités de type IDOR / Broken Access Control ;  
- l'authentification et les sessions ;  
- Supabase ;  
- Row Level Security (RLS) ;  
- Supabase Storage ;  
- les API, routes et Server Actions ;  
- les fonctions à privilèges élevés ;  
- l'isolation des données entre comptes ;  
- les données personnelles et contenus privés ;  
- les chaînes de données liées aux souvenirs/mémoires.  
  
L'objectif n'est pas seulement de trouver des vulnérabilités aujourd'hui.  
  
Il faut également mettre en place un **système de suivi permanent de la sécurité du projet**, permettant à Claude Code de reprendre le travail lors d'un futur audit, de comparer l'état actuel à l'état précédent et de conserver l'historique.  
  
---  
  
# 2. RÈGLE ABSOLUE — PHASE 1 EN LECTURE SEULE  
  
Pour cette première mission :  
  
- NE MODIFIE PAS le code applicatif.  
- NE CORRIGE PAS les vulnérabilités.  
- NE LANCE PAS de migration de base de données.  
- NE CHANGE PAS les policies Supabase.  
- NE CHANGE PAS la configuration de production.  
- NE SUPPRIME aucune donnée.  
- NE RÉINITIALISE aucun compte.  
- NE MODIFIE aucune donnée utilisateur.  
  
Tu peux :  
  
- lire et analyser le code ;  
- inspecter l'architecture ;  
- rechercher les routes et fonctions ;  
- examiner les fichiers de configuration ;  
- examiner les migrations SQL ;  
- analyser les policies RLS ;  
- analyser les schémas et relations ;  
- analyser les appels Supabase ;  
- produire de la documentation.  
  
Si une action réelle de test nécessite une modification, demande d'abord l'autorisation.  
  
**Principe : comprendre et documenter avant de corriger.**  
  
---  
  
# 3. PREMIÈRE ÉTAPE — CARTOGRAPHIE DU PROJET  
  
Commence par examiner réellement le projet présent dans le shell.  
  
Ne pars pas d'hypothèses.  
  
Identifie notamment :  
  
- framework ;  
- langage(s) ;  
- architecture frontend/backend ;  
- système de routing ;  
- API ;  
- Server Actions ;  
- middleware ;  
- authentification ;  
- gestion des sessions ;  
- Supabase ;  
- tables ;  
- relations ;  
- migrations ;  
- fonctions SQL ;  
- RPC ;  
- triggers ;  
- RLS ;  
- Storage ;  
- buckets ;  
- services externes ;  
- gestion des fichiers ;  
- génération de documents ;  
- éventuels systèmes d'administration ;  
- variables d'environnement et leur usage.  
  
Ne révèle jamais les valeurs secrètes des variables d'environnement.  
  
---  
  
# 4. CARTOGRAPHIE DES DONNÉES  
  
Établis une carte des données utilisateur.  
  
Porte une attention particulière aux ressources pouvant être liées à un compte :  
  
- utilisateur ;  
- profil ;  
- compte ;  
- session ;  
- enregistrement audio ;  
- transcription ;  
- question/interview ;  
- mémoire ;  
- chapitre ;  
- document ;  
- photo ;  
- fichier ;  
- livre ;  
- commande ;  
- abonnement ;  
- paiement ;  
- métadonnées ;  
- préférences ;  
- données administratives.  
  
Pour chaque ressource importante, indique :  
  
- où elle est stockée ;  
- son identifiant ;  
- son propriétaire logique ;  
- les relations avec l'utilisateur ;  
- comment elle est lue ;  
- comment elle est créée ;  
- comment elle est modifiée ;  
- comment elle est supprimée ;  
- quelles protections existent.  
  
---  
  
# 5. AUDIT IDOR / BROKEN ACCESS CONTROL  
  
C'est une priorité critique de cette mission.  
  
Cherche systématiquement les endroits où une ressource est récupérée à partir d'un identifiant fourni ou influencé par le client.  
  
Exemples d'identifiants :  
  
- user_id ;  
- profile_id ;  
- document_id ;  
- recording_id ;  
- transcription_id ;  
- memory_id ;  
- chapter_id ;  
- book_id ;  
- file_id ;  
- order_id ;  
- UUID ;  
- slug ;  
- chemin Storage ;  
- paramètres d'URL ;  
- paramètres JSON ;  
- paramètres de formulaire.  
  
Pour chaque route ou fonction concernée, vérifie :  
  
> « Le serveur vérifie-t-il réellement que l'utilisateur courant a le droit d'accéder à cette ressource ? »  
  
Cherche en particulier les schémas dangereux du type :  
  
```text  
GET /api/resource/:id  
```  
  
ou :  
  
```text  
database.get(id)  
```  
  
lorsque le contrôle de propriété/autorisation est absent ou insuffisant.  
  
Attention :  
  
**Un UUID difficile à deviner n'est PAS une protection d'autorisation.**  
  
Un identifiant doit être considéré comme potentiellement connu par un attaquant.  
  
---  
  
# 6. SCÉNARIO D'ATTAQUANT À UTILISER  
  
Pour l'analyse, considère notamment le scénario suivant :  
  
> Un attaquant possède un compte utilisateur parfaitement légitime sur Racontez-moi.com.  
>  
> Il connaît ses propres identifiants et peut observer les requêtes normales effectuées par son navigateur.  
>  
> Il essaie ensuite de modifier :  
> - IDs ;  
> - UUID ;  
> - paramètres URL ;  
> - paramètres JSON ;  
> - chemins de fichiers ;  
> - références de documents ;  
> - références de sessions ;  
> - identifiants de ressources ;  
> - appels API.  
>  
> Son objectif est d'accéder à une ressource appartenant à un autre compte.  
  
Analyse si l'application empêcherait réellement cette situation.  
  
---  
  
# 7. AUDIT SUPABASE / RLS  
  
Analyse les tables Supabase une par une.  
  
Pour chaque table contenant ou pouvant contenir des données utilisateur :  
  
- RLS activée ou non ;  
- policies SELECT ;  
- policies INSERT ;  
- policies UPDATE ;  
- policies DELETE ;  
- conditions utilisées ;  
- rôle concerné ;  
- utilisation de `auth.uid()` ;  
- relations avec le propriétaire ;  
- risques de contournement.  
  
Vérifie notamment les situations où :  
  
- RLS est absente ;  
- RLS est activée mais aucune policy appropriée n'existe ;  
- une policy autorise trop largement ;  
- une policy utilise une relation incorrecte ;  
- une donnée est accessible via une vue ;  
- une fonction SQL contourne les protections ;  
- une RPC possède des privilèges excessifs ;  
- une fonction `SECURITY DEFINER` est mal protégée ;  
- une policy repose sur une donnée contrôlable par l'utilisateur.  
  
Ne considère jamais « RLS activée » comme synonyme de « sécurisé ».  
  
Il faut analyser les policies elles-mêmes.  
  
---  
  
# 8. AUDIT SUPABASE STORAGE  
  
Analyse tous les buckets.  
  
Pour chacun :  
  
- public / privé ;  
- contenu ;  
- type de fichiers ;  
- utilisateur propriétaire ;  
- convention de chemin ;  
- policies ;  
- accès en lecture ;  
- accès en écriture ;  
- accès en suppression.  
  
Cherche particulièrement les risques suivants :  
  
```text  
/storage/object/...  
```  
  
où un utilisateur pourrait modifier le chemin ou le nom du fichier pour obtenir celui d'un autre utilisateur.  
  
Vérifie que la sécurité ne repose pas uniquement sur un chemin contenant un UUID.  
  
---  
  
# 9. AUTHENTIFICATION ET SESSIONS  
  
Analyse :  
  
- création de compte ;  
- connexion ;  
- déconnexion ;  
- récupération de session ;  
- renouvellement ;  
- expiration ;  
- cookies ;  
- tokens ;  
- middleware ;  
- protection des routes ;  
- routes publiques ;  
- routes privées ;  
- redirections ;  
- vérification de l'utilisateur courant.  
  
Cherche les situations dans lesquelles :  
  
- une route privée est accessible sans authentification ;  
- le frontend croit qu'un utilisateur est authentifié sans vérification serveur ;  
- un identifiant utilisateur est accepté depuis le client sans recoupement avec la session ;  
- une session d'un utilisateur pourrait être utilisée pour accéder aux données d'un autre.  
  
---  
  
# 10. FRONTEND — NE JAMAIS FAIRE CONFIANCE AU CLIENT  
  
Identifie les contrôles de sécurité effectués uniquement côté navigateur.  
  
Exemples :  
  
```text  
if (user.id === resource.user_id)  
```  
  
dans le frontend n'est pas une protection suffisante.  
  
La décision d'autorisation doit être imposée côté serveur / base de données selon l'architecture.  
  
Signale tout endroit où le frontend fournit :  
  
- user_id ;  
- owner_id ;  
- role ;  
- resource_id ;  
- permission ;  
  
et où le serveur lui fait confiance sans vérification indépendante.  
  
---  
  
# 11. API / ROUTES / SERVER ACTIONS  
  
Dresse une liste des surfaces d'accès.  
  
Pour chaque endpoint ou Server Action important :  
  
- méthode ;  
- route ;  
- authentification requise ;  
- ressource manipulée ;  
- identifiant utilisé ;  
- contrôle d'autorisation ;  
- protection RLS ;  
- risque potentiel.  
  
Recherche notamment :  
  
- GET ;  
- POST ;  
- PUT ;  
- PATCH ;  
- DELETE ;  
- Server Actions ;  
- webhooks ;  
- RPC ;  
- fonctions serveur.  
  
---  
  
# 12. PRIVILÈGES ÉLEVÉS / SERVICE ROLE  
  
Recherche tous les usages de :  
  
- `service_role` ;  
- clés serveur ;  
- privilèges élevés ;  
- `SECURITY DEFINER` ;  
- fonctions admin ;  
- clients Supabase privilégiés.  
  
Détermine :  
  
- où ils sont utilisés ;  
- pourquoi ;  
- côté serveur ou navigateur ;  
- quelles données ils peuvent atteindre ;  
- quelles validations précèdent leur utilisation.  
  
Une clé ou un client privilégié ne doit jamais être exposé au navigateur.  
  
---  
  
# 13. DONNÉES SENSIBLES  
  
Cherche les risques d'exposition de :  
  
- informations personnelles ;  
- adresses ;  
- coordonnées ;  
- enregistrements ;  
- transcriptions ;  
- mémoires ;  
- photos ;  
- documents ;  
- livres ;  
- données de paiement ;  
- données administratives ;  
- tokens ;  
- secrets ;  
- informations internes.  
  
Vérifie également :  
  
- réponses API ;  
- logs ;  
- erreurs ;  
- fichiers temporaires ;  
- métadonnées ;  
- exports ;  
- URLs publiques ;  
- caches.  
  
Ne recopie jamais un secret réel dans la documentation.  
  
---  
  
# 14. CHAÎNE DE DONNÉES RÉGONTEZ-MOI  
  
Analyse spécifiquement la chaîne fonctionnelle lorsqu'elle existe dans le code :  
  
```text  
Compte utilisateur  
 ↓  
Session  
 ↓  
Enregistrement audio  
 ↓  
Transcription  
 ↓  
Mémoire / contenu  
 ↓  
Chapitres  
 ↓  
Document / livre  
 ↓  
Fichiers / export  
```  
  
Pour chaque transition, vérifie que l'identité du propriétaire est correctement conservée et contrôlée.  
  
Une faiblesse à un seul maillon pourrait permettre de franchir une séparation entre utilisateurs.  
  
---  
  
# 15. LOGS ET ERREURS  
  
Cherche :  
  
- données utilisateur dans les logs ;  
- tokens ;  
- secrets ;  
- URLs privées ;  
- stack traces exposées ;  
- erreurs SQL ;  
- détails internes dans les réponses HTTP ;  
- identifiants internes inutilement exposés.  
  
Classe les problèmes selon leur impact réel.  
  
---  
  
# 16. DOCUMENTATION À CRÉER  
  
À l'issue de la phase d'analyse, crée ou mets à jour :  
  
```text  
docs/security/  
```  
  
avec :  
  
```text  
SECURITY.md  
SECURITY-AUDIT.md  
SECURITY-CHANGELOG.md  
SECURITY-CHECKLIST.md  
```  
  
Si un dossier ou une convention de documentation sécurité existe déjà, adapte-toi à l'architecture existante plutôt que de créer des doublons.  
  
---  
  
# 17. SECURITY.md  
  
Ce document doit décrire l'architecture de sécurité actuelle.  
  
Il doit notamment contenir :  
  
- architecture ;  
- authentification ;  
- autorisation ;  
- Supabase ;  
- RLS ;  
- Storage ;  
- API ;  
- Server Actions ;  
- rôles ;  
- données protégées ;  
- ressources utilisateur ;  
- principes de sécurité ;  
- surfaces sensibles.  
  
Décris ce qui existe réellement.  
  
Ne présente jamais une protection comme existante si elle n'a pas été vérifiée dans le code.  
  
---  
  
# 18. SECURITY-AUDIT.md  
  
Ce document est le registre vivant des vulnérabilités.  
  
Pour chaque problème :  
  
```text  
ID :  
Date :  
Catégorie :  
Gravité :  
Composant :  
Fichier :  
Fonction / route :  
Statut :  
Description :  
Impact :  
Scénario :  
Preuve dans le code :  
Correction recommandée :  
Dernière vérification :  
```  
  
Statuts recommandés :  
  
- À VÉRIFIER  
- CONFIRMÉ  
- CORRIGÉ  
- NON REPRODUCTIBLE  
- ACCEPTÉ / RISQUE ASSUMÉ  
  
Gravités :  
  
- CRITIQUE  
- ÉLEVÉ  
- MOYEN  
- FAIBLE  
- INFORMATION  
  
Ne transforme pas une hypothèse en vulnérabilité confirmée.  
  
---  
  
# 19. SECURITY-CHANGELOG.md  
  
Conserve l'historique chronologique.  
  
Chaque audit doit ajouter une entrée plutôt que supprimer l'historique précédent.  
  
Exemple :  
  
```text  
## 2026-09-12 — Audit initial  
  
- Cartographie de l'architecture  
- Audit IDOR  
- Audit Supabase/RLS  
- Audit Storage  
- Audit authentification  
- Résultats : ...  
```  
  
Lors d'un futur audit :  
  
```text  
## YYYY-MM-DD — Audit de suivi  
  
- Vérification des problèmes précédents  
- Nouvelles surfaces identifiées  
- Vulnérabilités corrigées  
- Nouvelles vulnérabilités  
- Régression éventuelle  
```  
  
---  
  
# 20. SECURITY-CHECKLIST.md  
  
Construis une checklist réutilisable.  
  
Elle devra au minimum contenir :  
  
## Authentification  
- [ ] Routes privées protégées  
- [ ] Session vérifiée côté serveur  
- [ ] Cookies/session correctement gérés  
- [ ] Aucun accès basé uniquement sur le frontend  
  
## Autorisation  
- [ ] Chaque ressource utilisateur possède un contrôle de propriété  
- [ ] Aucun ID client considéré comme preuve d'autorisation  
- [ ] Tests IDOR effectués  
- [ ] Broken Access Control recherché  
  
## Supabase  
- [ ] RLS activée sur les tables concernées  
- [ ] SELECT vérifié  
- [ ] INSERT vérifié  
- [ ] UPDATE vérifié  
- [ ] DELETE vérifié  
- [ ] RPC vérifiées  
- [ ] SECURITY DEFINER vérifiées  
  
## Storage  
- [ ] Buckets vérifiés  
- [ ] Policies vérifiées  
- [ ] Accès inter-utilisateurs impossible  
- [ ] Chemins non considérés comme mécanisme d'autorisation  
  
## API  
- [ ] Routes recensées  
- [ ] Authentification vérifiée  
- [ ] Autorisation vérifiée  
- [ ] Paramètres contrôlés  
- [ ] Erreurs vérifiées  
  
## Secrets  
- [ ] Service role jamais exposée au client  
- [ ] Secrets absents du dépôt  
- [ ] Logs vérifiés  
- [ ] Réponses API vérifiées  
  
---  
  
# 21. VERDICT FINAL OBLIGATOIRE  
  
À la fin du premier audit, ajoute une section clairement visible :  
  
# VERDICT — RÉALISME DU RISQUE IDOR  
  
Réponds explicitement :  
  
```text  
IDOR trouvée : OUI / NON / À CONFIRMER  
  
RLS correctement configurées :  
OUI / NON / PARTIELLEMENT / À CONFIRMER  
  
Risque qu'un utilisateur accède aux données d'un autre :  
OUI / NON / À CONFIRMER  
  
Storage correctement isolé :  
OUI / NON / PARTIELLEMENT / À CONFIRMER  
  
Contrôles d'accès serveur :  
OUI / NON / PARTIELLEMENT / À CONFIRMER  
  
Nombre de problèmes CRITIQUES :  
X  
  
Nombre de problèmes ÉLEVÉS :  
X  
  
Nombre de problèmes MOYENS :  
X  
  
Nombre de problèmes FAIBLES :  
X  
  
Niveau de confiance de l'audit :  
FAIBLE / MOYEN / ÉLEVÉ  
```  
  
Puis explique les trois à cinq points les plus importants.  
  
---  
  
# 22. RÈGLE DE PRUDENCE  
  
Ne jamais déclarer :  
  
> « Le site est sécurisé. »  
  
Un audit de code ne permet pas nécessairement de garantir l'absence totale de vulnérabilité.  
  
Utilise plutôt des formulations telles que :  
  
- « Aucun problème détecté dans le périmètre analysé. »  
- « Protection présente et vérifiée dans le code examiné. »  
- « Point non vérifiable sans test dynamique. »  
- « Risque potentiel nécessitant une validation. »  
  
---  
  
# 23. TESTS DYNAMIQUES  
  
Pour cette première phase, reste principalement en analyse statique.  
  
Si tu identifies un scénario qui nécessite un test dynamique pour être confirmé :  
  
1. décris le test ;  
2. indique ce qu'il permettrait de vérifier ;  
3. n'exécute pas d'action destructive ;  
4. n'utilise pas de données d'un autre utilisateur sans autorisation explicite ;  
5. demande l'accord avant toute opération intrusive.  
  
---  
  
# 24. FUTURS AUDITS  
  
Lorsqu'on te demandera ultérieurement :  
  
> « Fais un audit de sécurité de Racontez-moi.com »  
  
tu dois impérativement :  
  
1. relire `docs/security/SECURITY.md` ;  
2. relire le dernier `SECURITY-AUDIT.md` ;  
3. relire `SECURITY-CHANGELOG.md` ;  
4. relire `SECURITY-CHECKLIST.md` ;  
5. comparer le code actuel avec le dernier état documenté ;  
6. vérifier que les vulnérabilités précédemment corrigées le sont toujours ;  
7. rechercher les nouvelles surfaces apparues depuis ;  
8. identifier les régressions ;  
9. ajouter une nouvelle entrée historique ;  
10. ne jamais effacer l'historique.  
  
---  
  
# 25. ÉVOLUTION DU SITE  
  
À chaque évolution importante du projet, considérer comme déclencheurs potentiels d'un nouvel audit :  
  
- nouveau système d'authentification ;  
- nouveau type de compte ;  
- espace client ;  
- administration ;  
- paiement ;  
- abonnement ;  
- nouveau bucket ;  
- nouveau type de fichier ;  
- nouvelle API ;  
- nouvelle table ;  
- nouvelle RPC ;  
- nouvelle Server Action ;  
- modification des RLS ;  
- intégration IA ;  
- partage de documents ;  
- export ;  
- génération de livres ;  
- changement de gestion des sessions.  
  
---  
  
# 26. PRIORITÉ DE L'AUDIT  
  
Ordre recommandé :  
  
1. **IDOR / Broken Access Control**  
2. **Supabase / RLS**  
3. **Storage**  
4. **Authentification / sessions**  
5. **API / Server Actions**  
6. **Service role / privilèges**  
7. **Données sensibles**  
8. **Frontend**  
9. **Logs / erreurs**  
10. **Autres risques**  
  
---  
  
# 27. LIVRABLE FINAL  
  
À la fin de la mission, donne-moi un résumé clair comprenant :  
  
### Architecture  
Ce que tu as découvert.  
  
### Surfaces analysées  
Ce que tu as réellement inspecté.  
  
### Vulnérabilités  
Liste classée par gravité.  
  
### IDOR  
Résultat spécifique.  
  
### Supabase/RLS  
Résultat spécifique.  
  
### Storage  
Résultat spécifique.  
  
### Authentification  
Résultat spécifique.  
  
### Actions recommandées  
Liste priorisée.  
  
### Documentation  
Liste des fichiers créés ou mis à jour.  
  
### Ce qui n'a PAS pu être vérifié  
Important : indique explicitement les zones nécessitant éventuellement un test dynamique ou une vérification supplémentaire.  
  
---  
  
# 28. RÈGLE FINALE  
  
Ce document est le **cadre permanent de sécurité de Racontez-moi.com**.  
  
Le but n'est pas de produire un rapport ponctuel qui sera oublié.  
  
Le but est de construire progressivement une **mémoire technique de sécurité du projet**, versionnée avec le code, permettant de répondre à tout moment à la question :  
  
> « Où en est réellement la sécurité de Racontez-moi.com et qu'est-ce qui a changé depuis le dernier audit ? »  
  
Commence maintenant par la cartographie et l'analyse en lecture seule.  
  
**Ne corrige rien sans autorisation explicite.**
