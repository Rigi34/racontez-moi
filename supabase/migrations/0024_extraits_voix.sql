-- « La voix choisie » (chantier VOIX-CHOISIE, docs/CHANTIER-VOIX-CHOISIE.md) :
-- extraits de voix conservés UNIQUEMENT sur choix explicite du narrateur, au
-- plus un par fragment, chacun accessible par un QR code imprimé dans le
-- livre (/v/<jeton>). RLS activé dès la création (règle du projet).

create table extraits_voix (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fragment_id uuid not null references fragments(id) on delete cascade,
  chemin_stockage text not null,
  type_mime text not null,
  taille_octets int not null check (taille_octets > 0),
  -- Jeton imprimé dans le QR code (128 bits aléatoires, base64url).
  jeton text not null unique check (jeton ~ '^[A-Za-z0-9_-]{22}$'),
  -- Le narrateur peut désactiver l'écoute publique sans supprimer l'extrait.
  actif boolean not null default true,
  consenti_le timestamptz not null default now(),
  version_consentement text not null,
  created_at timestamptz not null default now(),
  unique (fragment_id)
);

alter table extraits_voix enable row level security;

create policy "own extraits_voix" on extraits_voix
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index extraits_voix_user on extraits_voix (user_id);

-- Droits explicites (17/10/2026) : depuis le 30/10/2026, Supabase n'accorde
-- plus aucun droit par défaut sur une nouvelle table de `public` pour les
-- projets existants (changelog Supabase n° 45329). Sans ces lignes, la table
-- créée après cette date répondrait « permission denied » (42501), y compris
-- à la route serveur /v/[jeton]. authenticated : lecture et écriture, sous
-- la policy RLS ci-dessus ; service_role : écoute par QR et nettoyage ;
-- anon : aucun droit (les sessions anonymes ont le rôle authenticated).
grant select, insert, update, delete on table extraits_voix to authenticated;
grant all on table extraits_voix to service_role;
revoke all on table extraits_voix from anon;

-- Bucket Storage privé « voix » — aucune lecture publique : l'écoute par QR
-- passe par app/v/[jeton] (service role + URL signée de courte durée).
insert into storage.buckets (id, name, public)
values ('voix', 'voix', false)
on conflict (id) do nothing;

create policy "own voix objects" on storage.objects
  for all using (bucket_id = 'voix' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'voix' and (storage.foldername(name))[1] = auth.uid()::text);
