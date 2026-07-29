-- Prénom (ou surnom choisi) utilisé pour personnaliser l'interface
-- ("Bonjour Monique") — jamais injecté dans les relances IA elles-mêmes,
-- pour ne pas risquer un usage mécanique qui sonnerait faux (décision du
-- 29/07/2026). Posé une seule fois, juste après "pour qui racontez-vous ?".
alter table profil_narrateur add column if not exists prenom_choisi text;
