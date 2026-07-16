-- Aligne la colonne embedding sur le modèle HuggingFace multilingue déjà utilisé
-- par la Bibliothèque CohérenceLab (sentence-transformers/paraphrase-multilingual-mpnet-base-v2,
-- 768 dimensions) plutôt que sur une taille OpenAI/Voyage (1536) jamais alimentée.
alter table fragments alter column embedding type vector(768);

create index if not exists fragments_embedding_hnsw
  on fragments
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Recherche des fragments passés d'un même utilisateur les plus proches d'une
-- nouvelle réponse — RLS non applicable dans une fonction SQL STABLE, donc le
-- filtre user_id est un paramètre obligatoire (jamais appelée sans lui).
create or replace function match_fragments(
  query_embedding vector(768),
  match_user_id uuid,
  match_count int default 5,
  similarity_threshold float default 0.25
)
returns table (
  id uuid,
  texte text,
  created_at timestamptz,
  similarity float
)
language sql stable
as $$
  select
    f.id,
    f.texte,
    f.created_at,
    1 - (f.embedding <=> query_embedding) as similarity
  from fragments f
  where f.user_id = match_user_id
    and f.embedding is not null
    and 1 - (f.embedding <=> query_embedding) > similarity_threshold
  order by f.embedding <=> query_embedding
  limit match_count;
$$;
