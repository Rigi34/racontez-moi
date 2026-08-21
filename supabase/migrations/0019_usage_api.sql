-- Quota quotidien par narrateur sur les routes qui déclenchent un appel API
-- facturé (Anthropic via /api/seance, Groq Whisper via /api/transcribe) —
-- risque financier confirmé par l'audit du 21/08/2026 (aucun plafond
-- jusqu'ici). Table volontairement sans policy RLS : le seul point d'accès
-- est incrementer_et_verifier_usage (security definer), jamais le client
-- authentifié directement.
create table usage_api (
  user_id uuid not null references auth.users(id) on delete cascade,
  route text not null,
  jour date not null default current_date,
  compteur int not null default 0,
  primary key (user_id, route, jour)
);

alter table usage_api enable row level security;

-- Incrémente le compteur du jour pour (user_id, route) et vérifie le seuil
-- en une seule opération atomique. L'atomicité vient de INSERT ... ON
-- CONFLICT DO UPDATE : Postgres sérialise les écritures concurrentes sur la
-- même ligne via un verrou de ligne, aucune mise à jour n'est perdue — à la
-- différence d'un pattern lire-puis-écrire côté application. security
-- definer contourne RLS volontairement (comme le service role du webhook
-- Stripe) ; la vérification p_user_id = auth.uid() en première ligne
-- remplace ici une policy RLS, dont le comportement exact avec RETURNING
-- n'est pas vérifiable dans l'environnement de développement actuel.
create or replace function public.incrementer_et_verifier_usage(
  p_user_id uuid,
  p_route text,
  p_limite int
)
returns table (autorise boolean, compteur int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_compteur int;
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'utilisateur non autorisé';
  end if;

  insert into usage_api (user_id, route, jour, compteur)
  values (p_user_id, p_route, current_date, 1)
  on conflict (user_id, route, jour)
  do update set compteur = usage_api.compteur + 1
  returning usage_api.compteur into v_compteur;

  return query select v_compteur <= p_limite, v_compteur;
end;
$$;

revoke all on function public.incrementer_et_verifier_usage(uuid, text, int) from public;
grant execute on function public.incrementer_et_verifier_usage(uuid, text, int) to authenticated;
