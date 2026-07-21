-- Statut de validation léger par fragment (décision du 20 juillet 2026,
-- "révision des séances après-coup") : deux boutons simples juste après
-- chaque séance ("ça me ressemble" / "à revoir"), pas de relecture
-- systématique. Édition manuelle et régénération ciblée repassent le
-- statut à brouillon (le contenu a changé, il redevient à confirmer).
alter table fragments add column if not exists statut text not null default 'brouillon'
  check (statut in ('brouillon', 'valide', 'a_revoir'));
