-- Paiement séparé du livre imprimé (décision du 23 juillet 2026) : le
-- forfait création (129€) n'inclut pas le livre — un deuxième paiement
-- Stripe (~50€) est nécessaire avant de pouvoir déclencher une vraie
-- commande Lulu (cf. app/api/commande/livre).
alter table abonnements add column if not exists livre_paye boolean not null default false;
