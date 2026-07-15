create extension if not exists vector;

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  transcript jsonb not null default '[]',
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table fragments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  texte text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

alter table sessions enable row level security;
alter table fragments enable row level security;

create policy "own sessions" on sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own fragments" on fragments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
