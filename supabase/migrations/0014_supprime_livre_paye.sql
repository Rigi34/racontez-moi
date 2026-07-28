-- Décision du 28 juillet 2026 : prix fixe unique 155€, le livre imprimé est
-- inclus dès le paiement du Parcours — le paiement séparé du livre (~50€,
-- décision du 23 juillet 2026) n'existe plus, cette colonne est obsolète.
-- Vérifié avant suppression : un seul abonnement actif en base, livre_paye
-- déjà à false — aucune perte de donnée réelle.
alter table abonnements drop column if exists livre_paye;
