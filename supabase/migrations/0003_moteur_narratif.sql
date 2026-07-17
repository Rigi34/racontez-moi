-- Moteur narratif — schéma de base pour la mémoire inter-séances augmentée.
-- 4 briques : bibliothèque de référence (partagée), profil narrateur (par
-- utilisateur), tours de conversation (grain fin, traçable), résumé de
-- session (réinjecté en début de séance suivante — évite l'effet de mémoire
-- fragmentée identifié comme faiblesse chez la concurrence).

-- ─── 1. Bibliothèque de référence (chunks des 14 ouvrages) ─────────────────
-- Table partagée, non liée à un utilisateur — lecture publique, écriture
-- réservée au script d'ingestion (service role, qui contourne RLS de toute
-- façon).
create table livres_reference (
  id uuid primary key default gen_random_uuid(),
  ouvrage text not null,
  auteur text not null,
  chunk_index int not null,
  texte text not null,
  tag_fonction text not null check (
    tag_fonction in ('technique_sensorielle', 'structure_recit', 'type_question', 'signal_hesitation')
  ),
  tag_theme text,
  embedding vector(768),
  created_at timestamptz not null default now()
);

alter table livres_reference enable row level security;

create policy "lecture publique livres_reference" on livres_reference
  for select using (true);

create index if not exists livres_reference_embedding_hnsw
  on livres_reference
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create index if not exists livres_reference_tag_fonction on livres_reference (tag_fonction);

create or replace function match_livres_reference(
  query_embedding vector(768),
  match_tag_fonction text default null,
  match_count int default 5,
  similarity_threshold float default 0.25
)
returns table (
  id uuid,
  ouvrage text,
  texte text,
  tag_fonction text,
  tag_theme text,
  similarity float
)
language sql stable
as $$
  select
    l.id,
    l.ouvrage,
    l.texte,
    l.tag_fonction,
    l.tag_theme,
    1 - (l.embedding <=> query_embedding) as similarity
  from livres_reference l
  where l.embedding is not null
    and (match_tag_fonction is null or l.tag_fonction = match_tag_fonction)
    and 1 - (l.embedding <=> query_embedding) > similarity_threshold
  order by l.embedding <=> query_embedding
  limit match_count;
$$;

-- ─── 2. Profil narrateur (une ligne par utilisateur) ───────────────────────
create table profil_narrateur (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  periodes_couvertes jsonb not null default '[]',
  ancrages_sensoriels_utilises jsonb not null default '[]',
  profondeur_par_periode jsonb not null default '{}',
  sujets_esquives jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

alter table profil_narrateur enable row level security;

create policy "own profil_narrateur" on profil_narrateur
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── 3. Tours de conversation (grain fin, traçabilité RAG) ─────────────────
create table tours_conversation (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tour_index int not null,
  question text not null,
  reponse_brute text not null,
  duree_silence_ms int,
  reformulations jsonb,
  chunks_rag_utilises uuid[],
  created_at timestamptz not null default now()
);

alter table tours_conversation enable row level security;

create policy "own tours_conversation" on tours_conversation
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists tours_conversation_session on tours_conversation (session_id, tour_index);

-- ─── 4. Résumé de fin de séance, réinjecté au début de la suivante ─────────
alter table sessions add column if not exists resume_session text;
