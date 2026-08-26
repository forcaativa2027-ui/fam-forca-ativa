-- FAM003_REPAIR: reparar objetos parcialmente criados pela FAM003.
-- Execute este arquivo sozinho no SQL Editor, antes da FAM003/FAM004.

alter table if exists public.fam_audit_events
  add column if not exists actor_user_id uuid references auth.users(id) on delete set null,
  add column if not exists case_id uuid references public.fam_risk_cases(id) on delete set null,
  add column if not exists conversation_id uuid references public.fam_conversations(id) on delete set null,
  add column if not exists event_type text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.fam_assessment_state_history (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.fam_risk_cases(id) on delete cascade,
  from_state text not null,
  to_state text not null,
  reason_code text not null,
  rule_code text,
  occurred_at timestamptz not null default now()
);

alter table if exists public.fam_assessment_state_history
  add column if not exists case_id uuid references public.fam_risk_cases(id) on delete cascade,
  add column if not exists from_state text,
  add column if not exists to_state text,
  add column if not exists reason_code text,
  add column if not exists rule_code text,
  add column if not exists occurred_at timestamptz not null default now();

create index if not exists idx_fam_audit_events_case on public.fam_audit_events(case_id, created_at);
create index if not exists idx_fam_assessment_state_history_case
  on public.fam_assessment_state_history(case_id, occurred_at);

alter table public.fam_assessment_state_history enable row level security;
alter table public.fam_audit_events enable row level security;

drop policy if exists fam_assessment_state_history_owner_select on public.fam_assessment_state_history;
create policy fam_assessment_state_history_owner_select on public.fam_assessment_state_history for select to authenticated
  using (exists (
    select 1 from public.fam_risk_cases c
    where c.id = public.fam_assessment_state_history.case_id
      and c.user_id = auth.uid()
  ));

drop policy if exists fam_assessment_state_history_owner_insert on public.fam_assessment_state_history;
create policy fam_assessment_state_history_owner_insert on public.fam_assessment_state_history for insert to authenticated
  with check (exists (
    select 1 from public.fam_risk_cases c
    where c.id = public.fam_assessment_state_history.case_id
      and c.user_id = auth.uid()
  ));

select 'FAM003_REPAIR_OK' as status;
