-- ============================================================
-- CEC FAMILY — Carteira de Membro CEC ID: campo member_since
-- (data oficial de ingresso como membro — diferente de data de
-- criação da conta, cadastro no sistema, conversão ou batismo).
-- Idempotente.
-- ============================================================

alter table public.members add column if not exists member_since date;

-- Backfill: usa joined_at como aproximação razoável pra quem já existe
update public.members set member_since = coalesce(joined_at::date, current_date)
where member_since is null;
