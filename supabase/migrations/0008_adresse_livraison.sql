-- Adresse de livraison pour la commande Lulu réelle (une par narrateur,
-- réutilisée/modifiable) — brique 4/6 du pipeline complet du livre.
create table adresses_livraison (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  nom text not null,
  adresse text not null,
  ville text not null,
  code_postal text not null,
  pays text not null default 'FR',
  telephone text not null,
  updated_at timestamptz not null default now()
);

alter table adresses_livraison enable row level security;

create policy "own adresse_livraison" on adresses_livraison
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
