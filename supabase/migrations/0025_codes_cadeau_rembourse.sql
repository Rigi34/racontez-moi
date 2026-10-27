-- Ajoute le statut "rembourse" aux codes cadeau (audit de clôture du
-- 27/10/2026, constat B-2) : jusqu'ici un remboursement d'achat-cadeau ne
-- touchait que abonnements filtré par stripe_customer_id, que l'achat-cadeau
-- n'a pas (paiement sans Customer Stripe) — le code restait activable et le
-- Parcours restait ouvert après remboursement. Le webhook passe désormais le
-- code à "rembourse" ; l'activation (filtre statut = 'paye') le refuse donc.
-- À appliquer AVANT le déploiement du code qui l'utilise : sans elle, la
-- mise à jour échoue sur la contrainte et le webhook répond 500 (Stripe
-- retente), sans rien écrire de faux.
alter table codes_cadeau drop constraint if exists codes_cadeau_statut_check;
alter table codes_cadeau add constraint codes_cadeau_statut_check
  check (statut in ('paye', 'active', 'rembourse'));
