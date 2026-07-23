-- Photos rattachées à un fragment (décision "incluses par défaut",
-- chapitre 5.3 de l'étude HÉRITAGE 2026 — déclencheur de rappel documenté,
-- pas un simple ornement). Chaque photo est tagguée dès l'envoi via le
-- fragment_id, pas de tri manuel a posteriori nécessaire pour
-- l'assemblage.
create table photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fragment_id uuid not null references fragments(id) on delete cascade,
  chemin_stockage text not null,
  largeur_px int not null,
  hauteur_px int not null,
  created_at timestamptz not null default now()
);

alter table photos enable row level security;

create policy "own photos" on photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index photos_fragment on photos (fragment_id);

-- Bucket Storage privé "photos" (créé séparément via psql direct sur
-- storage.buckets, comme "manuscrits") — RLS par dossier user_id.
create policy "own photos objects" on storage.objects
  for all using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
