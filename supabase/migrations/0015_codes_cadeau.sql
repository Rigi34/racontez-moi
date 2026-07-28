-- Parcours cadeau (décision du 28 juillet 2026) : un achat-cadeau ne crée
-- pas directement un abonnement (l'acheteur n'est pas forcément le
-- narrateur) — il génère un code d'activation que le destinataire saisit
-- lui-même sur /activer, une fois qu'il a son propre compte.
create table codes_cadeau (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  stripe_session_id text not null unique,
  destinataire_prenom text not null,
  offrant_nom text not null,
  message text,
  statut text not null default 'paye' check (statut in ('paye', 'active')),
  user_id_active uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

alter table codes_cadeau enable row level security;

-- Le code lui-même fait office de clé d'accès (comme une carte cadeau
-- physique) — pas de lecture publique par simple connaissance de l'id.
-- Seul le destinataire, une fois le code activé sur son compte, peut voir
-- sa ligne. Toutes les écritures (génération au webhook, activation)
-- passent par le service role, jamais par une policy RLS.
create policy "own code cadeau actif" on codes_cadeau
  for select using (auth.uid() = user_id_active);
