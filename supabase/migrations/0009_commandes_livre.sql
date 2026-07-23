-- Suivi des commandes d'impression Lulu — brique 5-6 du pipeline complet du
-- livre. Empêche une double commande (contrainte unique sur user_id tant
-- qu'une commande est active) et trace le print job Lulu pour référence.
create table commandes_livre (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lulu_print_job_id text,
  statut text not null default 'en_cours' check (statut in ('en_cours', 'confirmee', 'echouee')),
  nombre_pages int,
  created_at timestamptz not null default now()
);

alter table commandes_livre enable row level security;

create policy "own commandes_livre" on commandes_livre
  for select using (auth.uid() = user_id);

-- Une seule commande "en_cours" ou "confirmee" par narrateur à la fois —
-- une commande "echouee" peut être retentée sans violer la contrainte.
create unique index commandes_livre_une_par_user
  on commandes_livre (user_id)
  where statut in ('en_cours', 'confirmee');
