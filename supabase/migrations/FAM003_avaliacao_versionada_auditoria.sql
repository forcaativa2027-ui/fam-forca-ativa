-- FAM003: versionamento da avaliação e trilha mínima de auditoria.
-- Migration aditiva; não remove nem reinterpreta dados legados.

alter table public.fam_risk_cases
  add column if not exists assessment_status text not null default 'completed',
  add column if not exists current_step text,
  add column if not exists risk_engine_version text,
  add column if not exists special_flow_flags jsonb not null default '[]'::jsonb,
  add column if not exists triggered_indicators jsonb not null default '[]'::jsonb;

create index if not exists idx_fam_risk_cases_engine_version
  on public.fam_risk_cases(risk_engine_version);

create table if not exists public.fam_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  case_id uuid references public.fam_risk_cases(id) on delete set null,
  conversation_id uuid references public.fam_conversations(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

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
comment on column public.fam_risk_cases.special_flow_flags is 'Sinalizadores de fluxos especiais, sem armazenar conteúdo sensível desnecessário.';
comment on table public.fam_audit_events is 'Eventos técnicos auditáveis da FAM; não registrar conteúdo sensível desnecessário em metadata.';
