-- ============================================================
-- CEC FAMILY — Expande journey_stage (Situação Ministerial) com
-- os cargos de liderança espiritual que faltavam na classificação.
--
-- Importante: essa classificação NÃO concede permissão administrativa
-- sozinha — isso continua vinculado a leadership_assignments (aba
-- Liderança) + scope_level/scope_id, exatamente como já funciona hoje.
-- Idempotente.
-- ============================================================

do $$ begin
  alter type journey_stage add value if not exists 'membro_efetivo';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type journey_stage add value if not exists 'diacono';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type journey_stage add value if not exists 'supervisor_setor';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type journey_stage add value if not exists 'supervisor_area';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type journey_stage add value if not exists 'supervisor_distrito';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type journey_stage add value if not exists 'pastor_auxiliar';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type journey_stage add value if not exists 'pastor_principal';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type journey_stage add value if not exists 'apostolo';
exception when duplicate_object then null; end $$;
