-- FAM006 — Retenção por classe (R1..R5) + Legal Hold (DEC-01 / REV-02 RC-03 / TEC-01 §19-20)
-- Sem prazo universal: cada classe possui política própria; legal_hold suspende exclusão automática.

do $$ begin
  create type public.fam_legal_hold_status as enum ('active','review','released');
exception when duplicate_object then null; end $$;

-- 1. Políticas de retenção por classe
create table if not exists public.fam_retention_policies (
  retention_class public.fam_retention_class primary key,
  description text not null,
  duration_days integer, -- null = enquanto durar finalidade / até revisão
  review_interval_days integer not null default 30,
  legal_hold_allowed boolean not null default true,
  deletion_strategy text not null default 'soft_delete',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed R1..R5 (valores operacionais propostos, a validar juridicamente - DEC-01)
insert into public.fam_retention_policies (retention_class, description, duration_days, review_interval_days, legal_hold_allowed, deletion_strategy) values
  ('R1', 'Respostas da ferramenta sem atendimento continuado', 30, 30, true, 'hard_delete'),
  ('R2', 'Arquivos enviados (anexos)', null, 30, true, 'hard_delete_with_backup_rotation'),
  ('R3', 'Registros de atendimento/encaminhamento', null, 90, true, 'retention_review'),
  ('R4', 'Logs de segurança/auditoria', 1825, 90, true, 'legal_hold_only'),
  ('R5', 'Incidentes/violações', null, 30, true, 'legal_hold_only')
on conflict (retention_class) do update set
  description = excluded.description,
  duration_days = excluded.duration_days,
  review_interval_days = excluded.review_interval_days,
  legal_hold_allowed = excluded.legal_hold_allowed,
  deletion_strategy = excluded.deletion_strategy;

comment on table public.fam_retention_policies is 'Retenção por finalidade — sem prazo universal (DEC-01). Cada classe R1..R5 possui política própria; legal_hold suspende exclusão.';

-- 2. Legal Holds
create table if not exists public.fam_legal_holds (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null, -- ex: fam_risk_case, fam_attachment, fam_conversation, user
  scope_id uuid not null,
  reason text not null,
  created_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  status public.fam_legal_hold_status not null default 'active',
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  released_at timestamptz,
  released_by uuid references public.profiles(id) on delete set null,
  metadata jsonb default '{}'::jsonb
);

create index if not exists idx_fam_legal_holds_scope on public.fam_legal_holds(scope_type, scope_id, status);
create index if not exists idx_fam_legal_holds_status on public.fam_legal_holds(status);

alter table public.fam_legal_holds enable row level security;

drop policy if exists fam_legal_holds_select on public.fam_legal_holds;
create policy fam_legal_holds_select on public.fam_legal_holds
  for select to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor'))
    or created_by = auth.uid()
  );

drop policy if exists fam_legal_holds_insert on public.fam_legal_holds;
create policy fam_legal_holds_insert on public.fam_legal_holds
  for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor')));

drop policy if exists fam_legal_holds_update on public.fam_legal_holds;
create policy fam_legal_holds_update on public.fam_legal_holds
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor')));

comment on table public.fam_legal_holds is 'Preservação controlada — enquanto status=active, rotinas automáticas não devem remover o escopo (DEC-01 legal_hold).';

-- 3. Colunas de retenção/legal_hold nos domínios sensíveis
alter table public.fam_risk_cases
  add column if not exists retention_class public.fam_retention_class not null default 'R1',
  add column if not exists retention_due_at timestamptz,
  add column if not exists legal_hold boolean not null default false;

alter table public.fam_conversations
  add column if not exists retention_class public.fam_retention_class not null default 'R1',
  add column if not exists retention_due_at timestamptz,
  add column if not exists legal_hold boolean not null default false;

alter table public.fam_risk_attachments
  add column if not exists retention_class public.fam_retention_class not null default 'R2',
  add column if not exists retention_due_at timestamptz,
  add column if not exists legal_hold boolean not null default false;

-- 4. Função para calcular retention_due_at a partir da política
create or replace function public.fam_calc_retention_due_at(p_retention_class public.fam_retention_class, p_created_at timestamptz)
returns timestamptz language plpgsql as $$
declare v_days integer;
begin
  select duration_days into v_days from public.fam_retention_policies where retention_class = p_retention_class;
  if v_days is null then return null; end if;
  return p_created_at + (v_days || ' days')::interval;
end; $$;

-- Trigger: ao inserir, preencher retention_due_at
create or replace function public.fam_set_retention_due_at() returns trigger language plpgsql as $$
begin
  if new.retention_due_at is null then
    new.retention_due_at := public.fam_calc_retention_due_at(new.retention_class, coalesce(new.created_at, now()));
  end if;
  return new;
end; $$;

drop trigger if exists trg_fam_risk_cases_retention on public.fam_risk_cases;
create trigger trg_fam_risk_cases_retention
  before insert on public.fam_risk_cases
  for each row execute function public.fam_set_retention_due_at();

drop trigger if exists trg_fam_conversations_retention on public.fam_conversations;
create trigger trg_fam_conversations_retention
  before insert on public.fam_conversations
  for each row execute function public.fam_set_retention_due_at();

drop trigger if exists trg_fam_attachments_retention on public.fam_risk_attachments;
create trigger trg_fam_attachments_retention
  before insert on public.fam_risk_attachments
  for each row execute function public.fam_set_retention_due_at();

-- 5. Função para aplicar/liberar legal_hold em um escopo
create or replace function public.fam_set_legal_hold(p_scope_type text, p_scope_id uuid, p_reason text, p_expires_at timestamptz default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.fam_legal_holds (scope_type, scope_id, reason, created_by, status, expires_at)
  values (p_scope_type, p_scope_id, p_reason, auth.uid(), 'active', p_expires_at)
  returning id into v_id;

  -- Marca flag nas tabelas de domínio
  if p_scope_type = 'fam_risk_case' then
    update public.fam_risk_cases set legal_hold = true where id = p_scope_id;
  elsif p_scope_type = 'fam_conversation' then
    update public.fam_conversations set legal_hold = true where id = p_scope_id;
  elsif p_scope_type = 'fam_attachment' then
    update public.fam_risk_attachments set legal_hold = true where id = p_scope_id;
  end if;

  return v_id;
end; $$;

create or replace function public.fam_release_legal_hold(p_hold_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_scope_type text; v_scope_id uuid;
begin
  select scope_type, scope_id into v_scope_type, v_scope_id from public.fam_legal_holds where id = p_hold_id;
  if not found then raise exception 'legal_hold % not found', p_hold_id; end if;

  update public.fam_legal_holds set status = 'released', released_at = now(), released_by = auth.uid() where id = p_hold_id;

  -- Se não houver mais holds ativos naquele escopo, limpa flag
  if not exists (select 1 from public.fam_legal_holds where scope_type = v_scope_type and scope_id = v_scope_id and status = 'active') then
    if v_scope_type = 'fam_risk_case' then
      update public.fam_risk_cases set legal_hold = false where id = v_scope_id;
    elsif v_scope_type = 'fam_conversation' then
      update public.fam_conversations set legal_hold = false where id = v_scope_id;
    elsif v_scope_type = 'fam_attachment' then
      update public.fam_risk_attachments set legal_hold = false where id = v_scope_id;
    end if;
  end if;
end; $$;

grant execute on function public.fam_set_legal_hold(text, uuid, text, timestamptz) to authenticated;
grant execute on function public.fam_release_legal_hold(uuid) to authenticated;

-- 6. View para revisão de retenção (expirados sem legal_hold)
create or replace view public.fam_retention_review as
  select 'fam_risk_case' as scope_type, id as scope_id, retention_class, retention_due_at, legal_hold, created_at
  from public.fam_risk_cases where retention_due_at is not null and retention_due_at < now() and legal_hold = false
  union all
  select 'fam_attachment' as scope_type, id, retention_class, retention_due_at, legal_hold, created_at
  from public.fam_risk_attachments where retention_due_at is not null and retention_due_at < now() and legal_hold = false
  union all
  select 'fam_conversation' as scope_type, id, retention_class, retention_due_at, legal_hold, created_at
  from public.fam_conversations where retention_due_at is not null and retention_due_at < now() and legal_hold = false;

comment on view public.fam_retention_review is 'Itens com prazo de retenção vencido e sem legal_hold — candidatos a exclusão revisada (R1..R5).';
