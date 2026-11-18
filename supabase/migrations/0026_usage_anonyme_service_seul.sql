-- Contre-audit Grok du 18/11/2026, constat n° 1 (vérifié en PROD le jour
-- même : droit d'exécution accordé à anon) : la RPC de quota anonyme était
-- appelable directement depuis un navigateur avec la clé publique, en
-- passant n'importe quelle IP et n'importe quel nom de route. Un tiers
-- pouvait épuiser le quota d'une adresse (essai gratuit, contact, écoute
-- du QR) ou gonfler la table avec des routes inventées.
--
-- Correctif : la RPC n'est plus exécutable que par le service role (le code
-- serveur, cf. lib/rate-limit.ts), et elle refuse tout nom de route qui
-- n'est pas l'une des routes prévues (LIMITES_QUOTIDIENNES_ANONYME).

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
  if p_route not in (
    'contact', 'certificat_apercu', 'ecoute_voix', 'seance_anonyme',
    'transcribe_anonyme', 'certificat_code', 'activation_code'
  ) then
    raise exception 'Route de quota inconnue : %', p_route;
  end if;

  insert into usage_anonyme (ip, route, jour, compteur)
  values (p_ip, p_route, current_date, 1)
  on conflict (ip, route, jour)
  do update set compteur = usage_anonyme.compteur + 1
  returning usage_anonyme.compteur into v_compteur;
  return query select v_compteur <= p_limite, v_compteur;
end;
$$;

revoke all on function public.incrementer_et_verifier_usage_anonyme(text, text, int) from public, anon, authenticated;
grant execute on function public.incrementer_et_verifier_usage_anonyme(text, text, int) to service_role;
