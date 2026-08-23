-- ============================================================
-- CEC FAMILY — Ajuste: Classificação (Situação Ministerial) passa a
-- incluir Apóstolo(a), Pastor(a) Principal/Auxiliar e os demais
-- cargos de liderança espiritual, sem conceder permissão
-- administrativa automaticamente (isso continua vinculado só a
-- Liderança/escopo, como já era).
-- Idempotente.
-- ============================================================

do $$ begin
  alter type journey_stage add value if not exists 'membro_efetivo';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type journey_stage add value if not exists 'lider_lg';
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
