-- Personnalisation de base du livre (titre, sous-titre, couleur de
-- couverture) — jusqu'ici entièrement figée en dur (titre "Mes Mémoires",
-- sous-titre "Racontez-moi", couleur #1F4B4C) dans lib/couverture.ts et
-- lib/manuscrit.ts. Décision du 26/08/2026 : photo de couverture écartée
-- (techniquement faisable via NodeCompiler.mapShadow, mais résolution des
-- photos narrateur non garantie pour un agrandissement en couverture, et
-- lisibilité du texte blanc variable selon la photo) — portée retenue :
-- titre, sous-titre, couleur uniquement.
--
-- Même table que pour_qui/prenom_choisi (migrations 0017/0018), déjà
-- couverte par la policy "own profil_narrateur" (for all, cf. migration
-- 0003) — aucun changement RLS nécessaire.
--
-- couleur_couverture est restreinte aux couleurs de marque déjà définies
-- dans app/globals.css (@theme) suffisamment sombres pour rester lisibles
-- en texte blanc (pas de logique de contraste dynamique à construire).
alter table profil_narrateur
  add column if not exists titre_livre text,
  add column if not exists sous_titre_livre text,
  add column if not exists couleur_couverture text
    check (couleur_couverture is null or couleur_couverture in ('petrole', 'petrole_fonce', 'encre', 'grege'));
