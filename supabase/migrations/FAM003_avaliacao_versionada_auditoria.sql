-- FAM003: versionamento da avaliação e trilha mínima de auditoria.
-- Migration aditiva; não remove nem reinterpreta dados legados.

alter table public.fam_risk_cases
  add column if not exists assessment_status text not null default 'completed',
  add column if not exists current_step text,
  add column if not exists risk_engine_version text,
  add column if not exists special_flow_flags jsonb not null default '[]'::jsonb,
  add column if not exists triggered_indicators jsonb not null default '[]'::jsonb,
  add column if not exists assessment_state text not null default 'INITIAL',
  add column if not exists transition_reason_code text,
  add column if not exists transition_rule_code text;

create index if not exists idx_fam_risk_cases_engine_version
  on public.fam_risk_cases(risk_engine_version);
create index if not exists idx_fam_risk_cases_assessment_state
  on public.fam_risk_cases(assessment_state, updated_at);

create table if not exists public.fam_assessment_state_history (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.fam_risk_cases(id) on delete cascade,
  from_state text not null,
  to_state text not null,
  reason_code text not null,
  rule_code text,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_fam_assessment_state_history_case
  on public.fam_assessment_state_history(case_id, occurred_at);

alter table public.fam_assessment_state_history enable row level security;

drop policy if exists fam_assessment_state_history_owner_select on public.fam_assessment_state_history;
create policy fam_assessment_state_history_owner_select on public.fam_assessment_state_history for select to authenticated
  using (exists (select 1 from public.fam_risk_cases c where c.id = case_id and c.user_id = auth.uid()));

drop policy if exists fam_assessment_state_history_owner_insert on public.fam_assessment_state_history;
create policy fam_assessment_state_history_owner_insert on public.fam_assessment_state_history for insert to authenticated
  with check (exists (select 1 from public.fam_risk_cases c where c.id = case_id and c.user_id = auth.uid()));

create table if not exists public.fam_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  case_id uuid references public.fam_risk_cases(id) on delete set null,
  conversation_id uuid references public.fam_conversations(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Compatibilidade com uma execução anterior que tenha criado a tabela sem
-- as colunas de vínculo. O índice e as políticas abaixo dependem delas.
alter table if exists public.fam_audit_events
  add column if not exists actor_user_id uuid references auth.users(id) on delete set null,
  add column if not exists case_id uuid references public.fam_risk_cases(id) on delete set null,
  add column if not exists conversation_id uuid references public.fam_conversations(id) on delete set null,
  add column if not exists event_type text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create index if not exists idx_fam_audit_events_case on public.fam_audit_events(case_id, created_at);
create index if not exists idx_fam_audit_events_type on public.fam_audit_events(event_type, created_at);

alter table public.fam_audit_events enable row level security;

drop policy if exists fam_audit_events_owner_select on public.fam_audit_events;
create policy fam_audit_events_owner_select on public.fam_audit_events for select to authenticated
  using (
    actor_user_id = auth.uid()
    or exists (select 1 from public.fam_risk_cases c where c.id = case_id and c.user_id = auth.uid())
    or exists (select 1 from public.fam_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

drop policy if exists fam_audit_events_owner_insert on public.fam_audit_events;
create policy fam_audit_events_owner_insert on public.fam_audit_events for insert to authenticated
  with check (actor_user_id = auth.uid());

comment on column public.fam_risk_cases.risk_engine_version is 'Versão do conjunto de regras usado na triagem; avaliações antigas não devem ser reinterpretadas silenciosamente.';
comment on column public.fam_risk_cases.assessment_state is 'Estado oficial da jornada de avaliação; transições devem ser controladas pelo serviço de domínio.';
comment on table public.fam_assessment_state_history is 'Histórico mínimo e não narrativo das transições da avaliação FAM.';
comment on column public.fam_risk_cases.special_flow_flags is 'Sinalizadores de fluxos especiais, sem armazenar conteúdo sensível desnecessário.';
comment on table public.fam_audit_events is 'Eventos técnicos auditáveis da FAM; não registrar conteúdo sensível desnecessário em metadata.';
