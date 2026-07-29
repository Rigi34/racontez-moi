-- Ajout suite à l'audit des 14 ouvrages du 29 juillet 2026 (Lamott, "Writing
-- a Present" ; Ledoux, concept 9) : identifier un destinataire précis dès le
-- départ améliore la motivation à raconter. Posée une seule fois, avant la
-- toute première question d'un nouveau narrateur.
alter table profil_narrateur add column if not exists pour_qui text;
