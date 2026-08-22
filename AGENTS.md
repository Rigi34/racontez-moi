<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🧠 RÉCIT — Philosophie de travail sur Racontez-moi

> **RÉCIT** = **Relire → Établir l'état → Comprendre le contrat → Interdire l'action prématurée → Travailler → Tester**

Racontez-moi raconte une histoire ; RÉCIT en est le miroir méthodologique. Ce n'est pas une procédure limitée aux changements de code : c'est la façon d'aborder **tout travail sur ce projet** — une fonctionnalité, un correctif, un audit, un document, une décision produit, une réponse à une question. Avant d'agir, on retrouve le fil du récit du projet, pas seulement son code.

## R — Relire

Toujours commencer par :

```text
docs/MANIFESTE-ECOSYSTEME.md
README.md
AGENTS.md
CLAUDE.md
```

Le manifeste est la mémoire évolutive du projet — état actuel, décisions prises, chantiers futurs, points à vérifier. C'est la première source de vérité, avant toute recherche ou hypothèse, quel que soit le type de tâche demandée.

## É — Établir l'état

Avant toute action, code ou non :

```bash
git status
git log --oneline --decorate -10
```

Comprendre la branche, les changements locaux et le dernier travail validé — même pour une tâche qui ne touchera aucun fichier (une analyse, une réponse, une recommandation), pour savoir sur quel état réel on raisonne.

## C — Comprendre le contrat

Identifier avant d'agir :
- l'objectif réellement demandé ;
- le périmètre — ce qui est concerné, ce qui ne l'est pas ;
- les éléments concernés (fichiers, mais aussi décisions produit, contenu, configuration) ;
- les contraintes ;
- les décisions déjà prises, documentées dans le manifeste ou ailleurs.

**Ne pas réinventer une décision déjà documentée.** Si le manifeste ou un autre document tranche déjà la question, s'y référer plutôt que reproposer un choix différent sans le signaler explicitement.

## I — Interdire l'action prématurée

Règle permanente, valable pour toute forme de travail :

> **Ne rien modifier, ne rien exécuter comme opération irréversible ou visible (fichier, Git, commande, envoi, publication) sans accord explicite de l'utilisateur.**

Avant d'agir :
1. expliquer ce qui sera fait ;
2. signaler les risques, inconnues ou hypothèses non vérifiées ;
3. attendre le feu vert — y compris quand la tâche semble évidente.

## T — Travailler

Une fois validé, quelle que soit la nature de la tâche :

```text
inspecter → produire/modifier → vérifier → relire le résultat
```

Ne toucher qu'au périmètre convenu. Pas d'améliorations opportunistes hors sujet, pas d'extension silencieuse d'une tâche de doc à du code ou l'inverse.

## T — Tester

Avant de déclarer terminé, adapter la vérification à la nature du travail :

- **Code** : typecheck, lint ciblé, tests pertinents, relecture du diff, `git status`.
- **Documentation / manifeste** : relecture factuelle croisée avec l'état réel du dépôt (pas seulement avec ce qui était vrai à la dernière lecture).
- **Décision ou recommandation produit** : vérification de cohérence avec les décisions déjà prises et documentées, signalement explicite si elle en modifie une.

Puis indiquer clairement ce qui a été fait, vérifié, et ce qui reste impossible à vérifier localement (config hors dépôt, comportement en production, etc.).

---

**RÉCIT : Relire. Établir. Comprendre. Interdire l'action prématurée. Travailler. Tester.**
