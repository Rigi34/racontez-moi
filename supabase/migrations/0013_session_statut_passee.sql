-- Ajoute le statut "passee" pour les questions d'ouverture abandonnées sans
-- réponse ("Passer cette question", décision du 26 juillet 2026, suite au
-- retour de Claude Pro sur la FAQ prospect : "jamais forcer"). Distinct de
-- "completed" pour ne jamais compter dans la progression
-- (lib/progression.ts ne garde que "completed"), tout en restant visible de
-- prochaineQuestionBanque pour ne pas reproposer immédiatement la même
-- question dans une section.
alter table sessions drop constraint if exists sessions_status_check;
alter table sessions add constraint sessions_status_check
  check (status in ('in_progress', 'completed', 'passee'));
