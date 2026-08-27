-- FAM022 — regras versionadas, máquina de estados e auditoria estruturada
-- Migration aditiva e não destrutiva. Não remove dados nem altera a paleta.

alter table if exists public.fam_risk_cases
  add column if not exists rules_version text;

create table if not exists public.fam_risk_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  version text not null,
  expression jsonb not null,
  signal text not null,
  priority text not null,
  special_flow text,
  orientation_code text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (code, version)
);

create table if not exists public.fam_risk_audit_events (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.fam_risk_cases(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  occurred_at timestamptz not null default now(),
  from_state text,
  to_state text,
  question_code text,
  rule_code text,
  metadata jsonb not null default '{}'::jsonb,
  state_machine_version text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_fam_risk_rules_active on public.fam_risk_rules(active, version);
create index if not exists idx_fam_risk_audit_assessment on public.fam_risk_audit_events(assessment_id, occurred_at desc);

alter table public.fam_risk_rules enable row level security;
alter table public.fam_risk_audit_events enable row level security;

drop policy if exists fam_risk_rules_public_read on public.fam_risk_rules;
create policy fam_risk_rules_public_read on public.fam_risk_rules
  for select to anon, authenticated using (active = true);

drop policy if exists fam_risk_audit_owner_read on public.fam_risk_audit_events;
create policy fam_risk_audit_owner_read on public.fam_risk_audit_events
  for select to authenticated
  using (exists (
    select 1 from public.fam_risk_cases c
    where c.id = assessment_id and c.user_id = auth.uid()
  ));

drop policy if exists fam_risk_audit_owner_insert on public.fam_risk_audit_events;
create policy fam_risk_audit_owner_insert on public.fam_risk_audit_events
  for insert to authenticated
  with check (
    actor_user_id = auth.uid()
    and exists (
      select 1 from public.fam_risk_cases c
      where c.id = assessment_id and c.user_id = auth.uid()
    )
  );

comment on table public.fam_risk_rules is 'Regras declarativas versionadas do Mapa de Risco FAM.';
comment on table public.fam_risk_audit_events is 'Eventos estruturados minimizados do fluxo de avaliação FAM.';

-- Catálogo mínimo inicial alinhado ao motor TypeScript. Inserção condicional para reexecução segura.
insert into public.fam_risk_rules (code, version, expression, signal, priority, special_flow, orientation_code)
select v.code, v.version, v.expression::jsonb, v.signal, v.priority, v.special_flow, v.orientation_code
from (values
  ('RULE-EMERGENCY-001', 'FAM-RULES-1.0', '{"kind":"condition","questionKey":"danger_now","operator":"equals","value":"YES"}', 'danger_now', 'immediate', null, 'ORIENT-EMERGENCY-001'),
  ('RULE-EMERGENCY-002', 'FAM-RULES-1.0', '{"kind":"any","conditions":[{"kind":"condition","questionKey":"injury","operator":"equals","value":"YES"},{"kind":"condition","questionKey":"weapon","operator":"equals","value":"YES"}]}', 'immediate_danger_signal', 'immediate', null, 'ORIENT-EMERGENCY-001'),
  ('RULE-SPECIAL-SEXUAL-001', 'FAM-RULES-1.0', '{"kind":"condition","questionKey":"sexual","operator":"equals","value":"YES"}', 'sexual', 'specialized', 'sexual', 'ORIENT-SPECIALIZED-001'),
  ('RULE-SPECIAL-CHILDREN-001', 'FAM-RULES-1.0', '{"kind":"condition","questionKey":"children","operator":"equals","value":"YES"}', 'children', 'specialized', 'children', 'ORIENT-SPECIALIZED-001'),
  ('RULE-COMBINED-001', 'FAM-RULES-1.0', '{"kind":"all","conditions":[{"kind":"condition","questionKey":"danger_now","operator":"equals","value":"YES"},{"kind":"condition","questionKey":"injury","operator":"equals","value":"YES"}]}', 'danger_with_injury', 'immediate', null, 'ORIENT-EMERGENCY-001')
) as v(code, version, expression, signal, priority, special_flow, orientation_code)
where not exists (
  select 1 from public.fam_risk_rules r where r.code = v.code and r.version = v.version
);
