-- FAM001 — Atendimento protegido e Análise de Risco orientativa
-- Ajustado: removido FK para churches (tabela não existe ainda)

do $$ begin
  create type public.fam_conversation_status as enum ('waiting', 'in_progress', 'paused_safe_contact', 'referred', 'resolved', 'closed', 'escalated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fam_attendant_status as enum ('pending_training', 'active', 'paused', 'suspended', 'revoked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fam_risk_attention as enum ('immediate', 'relevant', 'specialized', 'insufficient_information');
exception when duplicate_object then null; end $$;

create table if not exists public.fam_attendants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_label text not null,
  status public.fam_attendant_status not null default 'pending_training',
  training_accepted_at timestamptz,
  supervisor_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id)
);

create table if not exists public.fam_conversations (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  user_id uuid references auth.users(id) on delete set null,
  community_id uuid,  -- FK removida temporariamente
  status public.fam_conversation_status not null default 'waiting',
  contact_name text,
  safe_contact_note text,
  assigned_attendant_id uuid references public.fam_attendants(id) on delete set null,
  emergency_acknowledged boolean not null default false,
  consented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fam_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.fam_conversations(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_attendant_id uuid references public.fam_attendants(id) on delete set null,
  body text not null,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check ((sender_user_id is not null) <> (sender_attendant_id is not null))
);

create table if not exists public.fam_risk_cases (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  user_id uuid references auth.users(id) on delete set null,
  community_id uuid,
  contact_name text,
  consented_at timestamptz not null default now(),
  attention public.fam_risk_attention,
  preliminary_summary text,
  limitations_acknowledged_at timestamptz,
  referred_conversation_id uuid references public.fam_conversations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fam_risk_answers (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.fam_risk_cases(id) on delete cascade,
  question_key text not null,
  answer text not null,
  created_at timestamptz not null default now(),
  unique(case_id, question_key)
);

create table if not exists public.fam_risk_attachments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.fam_risk_cases(id) on delete cascade,
  storage_path text not null,
  original_name text,
  media_type text not null,
  byte_size bigint not null,
  malware_scan_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_fam_conversations_status on public.fam_conversations(status, created_at);
create index if not exists idx_fam_messages_conversation on public.fam_messages(conversation_id, created_at);
create index if not exists idx_fam_risk_cases_attention on public.fam_risk_cases(attention, created_at);
create index if not exists idx_fam_risk_answers_case on public.fam_risk_answers(case_id);

alter table public.fam_attendants enable row level security;
alter table public.fam_conversations enable row level security;
alter table public.fam_messages enable row level security;
alter table public.fam_risk_cases enable row level security;
alter table public.fam_risk_answers enable row level security;
alter table public.fam_risk_attachments enable row level security;

drop policy if exists fam_conversations_owner_select on public.fam_conversations;
create policy fam_conversations_owner_select on public.fam_conversations for select to authenticated
  using (user_id = auth.uid());
drop policy if exists fam_conversations_owner_insert on public.fam_conversations;
create policy fam_conversations_owner_insert on public.fam_conversations for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists fam_messages_owner_select on public.fam_messages;
create policy fam_messages_owner_select on public.fam_messages for select to authenticated
  using (exists (select 1 from public.fam_conversations c where c.id = conversation_id and c.user_id = auth.uid()));
drop policy if exists fam_messages_owner_insert on public.fam_messages;
create policy fam_messages_owner_insert on public.fam_messages for insert to authenticated
  with check (sender_user_id = auth.uid() and exists (select 1 from public.fam_conversations c where c.id = conversation_id and c.user_id = auth.uid()));
drop policy if exists fam_risk_cases_owner_select on public.fam_risk_cases;
create policy fam_risk_cases_owner_select on public.fam_risk_cases for select to authenticated
  using (user_id = auth.uid());
drop policy if exists fam_risk_cases_owner_insert on public.fam_risk_cases;
create policy fam_risk_cases_owner_insert on public.fam_risk_cases for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists fam_risk_answers_owner_all on public.fam_risk_answers;
create policy fam_risk_answers_owner_all on public.fam_risk_answers for all to authenticated
  using (exists (select 1 from public.fam_risk_cases c where c.id = case_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.fam_risk_cases c where c.id = case_id and c.user_id = auth.uid()));
drop policy if exists fam_risk_attachments_owner_select on public.fam_risk_attachments;
create policy fam_risk_attachments_owner_select on public.fam_risk_attachments for select to authenticated
  using (exists (select 1 from public.fam_risk_cases c where c.id = case_id and c.user_id = auth.uid()));

comment on table public.fam_risk_cases is 'Triagem orientativa; não é conclusão jurídica, diagnóstico ou prova pericial.';
comment on table public.fam_messages is 'Mensagens de atendimento FAM; conteúdo extremamente sensível.';
