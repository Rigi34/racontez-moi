-- Suivi des abonnements Stripe "Le Parcours" (29€/mois x 12, plafonné).
-- Écrit uniquement par le webhook Stripe (service role, contourne RLS) ;
-- lu par l'utilisateur pour savoir s'il a accès aux séances.
create table abonnements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text,
  status text not null default 'incomplete',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table abonnements enable row level security;

create policy "Lecture de son propre abonnement"
  on abonnements for select
  using (auth.uid() = user_id);
