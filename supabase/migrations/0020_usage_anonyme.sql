-- Quota quotidien par IP sur les routes anonymes à coût réel (Brevo pour
-- /api/contact, compilation Typst + sharp pour
-- /api/cadeau/certificat/apercu) — risque confirmé par l'audit du
-- 21/08/2026 (A5) : ces deux routes sont anonymes, sans throttle, flood
-- trivial. Sur le modèle de usage_api (A4, migration 0019), mais sans
-- user_id : la clé de comptage est l'IP (x-forwarded-for côté client),
-- puisqu'il n'y a pas d'authentification sur ces routes.
create table usage_anonyme (
  ip text not null,
  route text not null,
  jour date not null default current_date,
  compteur int not null default 0,
  primary key (ip, route, jour)
);

alter table usage_anonyme enable row level security;

-- Table volontairement sans policy RLS : le seul point d'accès est
-- incrementer_et_verifier_usage_anonyme (security definer), jamais le
-- client directement.

-- Incrémente le compteur du jour pour (ip, route) et vérifie le seuil en
-- une seule opération atomique (même garantie que incrementer_et_verifier_usage
-- côté A4 : INSERT ... ON CONFLICT sérialise les écritures concurrentes sur
-- la même ligne via un verrou de ligne Postgres). Pas de vérification
-- auth.uid() ici (impossible sur une route anonyme, contrairement à A4) —
-- la RPC elle-même reste le seul point d'écriture, appelée uniquement
-- depuis le code serveur des routes concernées.
create or replace function public.incrementer_et_verifier_usage_anonyme(
  p_ip text,
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
  insert into usage_anonyme (ip, route, jour, compteur)
  values (p_ip, p_route, current_date, 1)
  on conflict (ip, route, jour)
  do update set compteur = usage_anonyme.compteur + 1
  returning usage_anonyme.compteur into v_compteur;

  return query select v_compteur <= p_limite, v_compteur;
end;
$$;

revoke all on function public.incrementer_et_verifier_usage_anonyme(text, text, int) from public;
grant execute on function public.incrementer_et_verifier_usage_anonyme(text, text, int) to anon, authenticated;
