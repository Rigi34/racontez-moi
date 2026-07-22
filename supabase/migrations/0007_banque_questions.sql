-- Banque de 205 questions, 17 sections (A à Q) — chapitre 6 de l'étude
-- HÉRITAGE 2026, intégrée directement comme base de données de questions
-- (décision du 22 juillet 2026, remplace la génération 100% dynamique de
-- la question d'ouverture par une sélection adaptative dans cette banque).
-- Table partagée, non liée à un utilisateur — lecture publique, écriture
-- réservée au script d'ingestion (service role, contourne RLS).
create table banque_questions (
  id uuid primary key default gen_random_uuid(),
  numero int not null unique,
  section text not null check (section in ('A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q')),
  titre_section text not null,
  texte text not null,
  est_nucleaire boolean not null default false
);

alter table banque_questions enable row level security;

create policy "lecture publique banque_questions" on banque_questions
  for select using (true);

-- Sections déjà couvertes par un narrateur (ex: ["A","B","D"]) — pilote la
-- sélection adaptative de la prochaine question d'ouverture, à la place
-- d'une administration linéaire des 205 questions à tout le monde.
alter table profil_narrateur add column if not exists sections_couvertes jsonb not null default '[]';

-- Traçabilité : quelle section de la banque a fourni la question
-- d'ouverture de cette séance (null pour la toute première séance, qui
-- reste la question fixe historique).
alter table sessions add column if not exists section_ouverture text;
