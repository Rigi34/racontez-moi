-- Permet au prompt de relance de savoir si la question d'ouverture de la
-- séance était la question [N] (point d'ancrage émotionnel de fin de
-- section) — nécessaire pour activer le protocole de report explicite
-- ajouté suite à l'audit des 14 ouvrages du 29 juillet 2026 (Schacter/Siegel :
-- offrir de reporter un sujet à forte charge plutôt que d'insister par défaut).
alter table sessions add column if not exists question_est_nucleaire boolean not null default false;
