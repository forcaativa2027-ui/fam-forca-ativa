-- FAM022d — auditoria estruturada do Mapa de Risco
-- Executar depois da FAM022b.
-- Não apaga dados e não altera fam_risk_rules.

create table if not exists public.fam_risk_audit_events (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.fam_risk_cases(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  occurred_at timestamptz not null default now(),
  state text,
  from_state text,
  to_state text,
  question_code text,
  rule_code text,
  metadata jsonb not null default '{}'::jsonb,
  state_machine_version text not null default 'FAM-STATE-1.0',
  created_at timestamptz not null default now()
);

create index if not exists idx_fam_risk_audit_events_assessment
  on public.fam_risk_audit_events(assessment_id, occurred_at desc);

create index if not exists idx_fam_risk_audit_events_type
  on public.fam_risk_audit_events(event_type, occurred_at desc);

alter table public.fam_risk_audit_events enable row level security;

drop policy if exists fam_risk_audit_events_owner_read
  on public.fam_risk_audit_events;
create policy fam_risk_audit_events_owner_read
  on public.fam_risk_audit_events
  for select to authenticated
  using (
    exists (
      select 1
      from public.fam_risk_cases c
      where c.id = fam_risk_audit_events.assessment_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists fam_risk_audit_events_owner_insert
  on public.fam_risk_audit_events;
create policy fam_risk_audit_events_owner_insert
  on public.fam_risk_audit_events
  for insert to authenticated
  with check (
    actor_user_id = auth.uid()
    and exists (
      select 1
      from public.fam_risk_cases c
      where c.id = fam_risk_audit_events.assessment_id
        and c.user_id = auth.uid()
    )
  );

select to_regclass('public.fam_risk_audit_events') as audit_table;
