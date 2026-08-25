-- FAM007 — Compartilhamento granular auditável (JUR-02 / REV-02 RC-06)
-- Rejeita share_entire_case; exige destinatário + finalidade + base + seleção mínima + responsável + registro.

create table if not exists public.fam_case_shares (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.fam_risk_cases(id) on delete cascade,
  conversation_id uuid references public.fam_conversations(id) on delete cascade,
  -- Pelo menos um dos dois (case ou conversation) deve ser preenchido
  check (case_id is not null or conversation_id is not null),
  recipient_type text not null, -- ex: CRAS, conselho_tutelar, saude, autoridade_policial, MP, outro
  recipient_id text, -- id externo opcional (organization/service)
  recipient_name text not null,
  purpose_code text not null,
  legal_basis_id uuid not null references public.fam_legal_bases(id) on delete restrict,
  retention_class public.fam_retention_class not null,
  -- Seleção granular obrigatória
  shared_fields jsonb not null default '[]'::jsonb, -- ex: ["contact_name","answers.AR-01","answers.AR-05"]
  shared_files jsonb not null default '[]'::jsonb, -- ex: ["fam-attachments/uid/.../file.pdf"]
  reason text not null,
  status text not null default 'pending' check (status in ('pending','approved','sent','rejected','cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices
create index if not exists idx_fam_case_shares_case on public.fam_case_shares(case_id, created_at desc);
create index if not exists idx_fam_case_shares_conversation on public.fam_case_shares(conversation_id, created_at desc);
create index if not exists idx_fam_case_shares_recipient on public.fam_case_shares(recipient_type);
create index if not exists idx_fam_case_shares_status on public.fam_case_shares(status);

-- RLS: somente profissionais ativos podem criar/ver; auditável
alter table public.fam_case_shares enable row level security;

drop policy if exists fam_shares_select on public.fam_case_shares;
create policy fam_shares_select on public.fam_case_shares
  for select to authenticated using (
    created_by = auth.uid()
    or approved_by = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor'))
    or exists (select 1 from public.fam_attendants a where a.profile_id = auth.uid() and a.status = 'active')
  );

drop policy if exists fam_shares_insert on public.fam_case_shares;
create policy fam_shares_insert on public.fam_case_shares
  for insert to authenticated
  with check (
    exists (select 1 from public.fam_attendants a where a.profile_id = auth.uid() and a.status = 'active')
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor'))
  );

drop policy if exists fam_shares_update on public.fam_case_shares;
create policy fam_shares_update on public.fam_case_shares
  for update to authenticated
  using (
    created_by = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor'))
  );

-- Auditoria de compartilhamento (trilha separada)
create table if not exists public.fam_share_audit (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.fam_case_shares(id) on delete cascade,
  action text not null check (action in ('created','approved','sent','rejected','cancelled','viewed')),
  actor_id uuid references public.profiles(id) on delete set null,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_fam_share_audit_share on public.fam_share_audit(share_id, created_at desc);

alter table public.fam_share_audit enable row level security;

drop policy if exists fam_share_audit_select on public.fam_share_audit;
create policy fam_share_audit_select on public.fam_share_audit
  for select to authenticated using (
    exists (select 1 from public.fam_case_shares s where s.id = share_id and (
      s.created_by = auth.uid() or s.approved_by = auth.uid()
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor'))
    ))
  );

drop policy if exists fam_share_audit_insert on public.fam_share_audit;
create policy fam_share_audit_insert on public.fam_share_audit
  for insert to authenticated
  with check (actor_id = auth.uid());

-- Triggers: updated_at + block share_entire_case + audit
create or replace function public.fam_case_shares_set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_fam_case_shares_updated_at on public.fam_case_shares;
create trigger trg_fam_case_shares_updated_at
  before update on public.fam_case_shares
  for each row execute function public.fam_case_shares_set_updated_at();

-- Bloqueio: rejeita payload com share_entire_case = true (deve usar seleção granular)
create or replace function public.fam_case_shares_block_entire() returns trigger language plpgsql as $$
declare v_has_entire boolean;
begin
  -- Se shared_fields contiver "*" ou "all" ou shared_files contiver "*", rejeita
  if new.shared_fields ? '*' or new.shared_files ? '*' then
    raise exception 'share_entire_case bloqueado: use seleção granular de campos/arquivos (JUR-02-TEC-04)';
  end if;
  if jsonb_array_length(new.shared_fields) = 0 and jsonb_array_length(new.shared_files) = 0 then
    raise exception 'Selecione ao menos um campo ou arquivo para compartilhar (JUR-02-TEC-05/06)';
  end if;
  return new;
end; $$;

drop trigger if exists trg_fam_case_shares_block_entire on public.fam_case_shares;
create trigger trg_fam_case_shares_block_entire
  before insert or update on public.fam_case_shares
  for each row execute function public.fam_case_shares_block_entire();

-- Auditoria automática ao inserir/atualizar status
create or replace function public.fam_case_shares_audit() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into public.fam_share_audit (share_id, action, actor_id, details)
    values (new.id, 'created', auth.uid(), jsonb_build_object('recipient_type', new.recipient_type, 'purpose_code', new.purpose_code, 'legal_basis_id', new.legal_basis_id));
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into public.fam_share_audit (share_id, action, actor_id, details)
    values (new.id, new.status, auth.uid(), jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return new;
end; $$;

drop trigger if exists trg_fam_case_shares_audit on public.fam_case_shares;
create trigger trg_fam_case_shares_audit
  after insert or update on public.fam_case_shares
  for each row execute function public.fam_case_shares_audit();

comment on table public.fam_case_shares is 'Compartilhamento granular auditável — rejeita share_entire_case, exige destinatário+finalidade+base+seleção mínima+responsável (JUR-02)';
comment on table public.fam_share_audit is 'Trilha de auditoria de compartilhamentos';
comment on column public.fam_case_shares.shared_fields is 'Campos selecionados granularmente, ex: ["contact_name","AR-01"] — nunca ["*"]';
comment on column public.fam_case_shares.shared_files is 'Arquivos selecionados granularmente, ex: ["fam-attachments/uid/file.pdf"] — nunca ["*"]';
