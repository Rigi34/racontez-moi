-- Historique des versions d'un fragment — corrige le vrai trou révélé par
-- l'incident du 23 juillet 2026 (une régénération avait réorganisé un
-- fragment sans qu'aucun filet ne permette de revenir à la version
-- précédente). Avant tout écrasement de fragments.texte (édition manuelle
-- ou régénération), la version qui s'apprête à disparaître est sauvegardée
-- ici.
create table fragments_historique (
  id uuid primary key default gen_random_uuid(),
  fragment_id uuid not null references fragments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  texte text not null,
  created_at timestamptz not null default now()
);

alter table fragments_historique enable row level security;

create policy "own fragments_historique" on fragments_historique
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index fragments_historique_fragment on fragments_historique (fragment_id, created_at desc);
