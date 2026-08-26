-- Trou trouvé lors de l'audit RLS A9 (26/08/2026) : la policy de
-- 0009_commandes_livre.sql ne couvrait que SELECT. Or
-- app/api/commande/livre/route.ts écrit dans cette table (insert du "en_cours",
-- update vers "confirmee"/"echouee") via le client authentifié standard
-- (createClient(), soumis au RLS — pas le service role) et non un webhook.
-- Sans policy insert/update, ces écritures échouent silencieusement en
-- production et bloquent toute commande réelle de livre imprimé.
--
-- Remplace par une policy "for all", cohérente avec le pattern déjà utilisé
-- sur sessions/fragments/profil_narrateur/tours_conversation/
-- adresses_livraison/fragments_historique/photos : le narrateur ne peut lire
-- et écrire que ses propres lignes.
drop policy "own commandes_livre" on commandes_livre;

create policy "own commandes_livre" on commandes_livre
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
