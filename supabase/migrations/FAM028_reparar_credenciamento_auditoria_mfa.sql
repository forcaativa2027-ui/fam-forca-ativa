-- FAM028 — Reparo idempotente de AC-02 / POL-ARQ-01
-- Cria somente objetos ausentes; não remove nem altera dados legados.

do $$ begin
  create type public.fam_credential_status as enum ('requested','under_review','active','suspended','revoked','expired');
exception when duplicate_object then null;
end $$;

create table if not exists public.fam_professional_credentials (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'FAM' check (tenant_key = 'FAM'),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  professional_role text not null,
  qualification text not null default '',
  purpose text not null,
  scope_type text not null default 'case' check (scope_type in ('case','regional','all_fam')),
  scope_id uuid,
  allowed_purposes text[] not null default array[]::text[],
  status public.fam_credential_status not null default 'requested',
  valid_from timestamptz,
  valid_until timestamptz,
  mfa_required boolean not null default true,
  mfa_verified_at timestamptz,
  requested_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  reviewed_at timestamptz,
  review_notes text,
  revoked_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_from is null or valid_until > valid_from),
  check (status <> 'active' or approved_by is not null),
  check (status <> 'active' or valid_from is not null)
);

create table if not exists public.fam_access_audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'FAM' check (tenant_key = 'FAM'),
  actor_user_id uuid references public.profiles(id) on delete set null,
  subject_profile_id uuid references public.profiles(id) on delete set null,
  credential_id uuid references public.fam_professional_credentials(id) on delete set null,
  case_id uuid,
  purpose text not null,
  action text not null,
  decision text not null check (decision in ('ALLOW','DENY','REQUIRE_APPROVAL','REQUIRE_MFA')),
  reason text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_fam_credentials_profile on public.fam_professional_credentials(profile_id);
create index if not exists idx_fam_credentials_status on public.fam_professional_credentials(status);
create index if not exists idx_fam_access_audit_created on public.fam_access_audit_events(created_at desc);
create index if not exists idx_fam_access_audit_subject on public.fam_access_audit_events(subject_profile_id);

create or replace function public.fam_touch_professional_credential()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_fam_professional_credential_touch on public.fam_professional_credentials;
create trigger trg_fam_professional_credential_touch
before update on public.fam_professional_credentials
for each row execute function public.fam_touch_professional_credential();

create or replace function public.fam_is_credential_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role::text = 'apostolo'
  ) or exists (
    select 1 from public.module_delegations d
    where d.profile_id = auth.uid()
      and d.module::text in ('administrativo','usuarios')
      and d.status::text = 'ativo'
      and (d.expires_at is null or d.expires_at > now())
  );
$$;

create or replace function public.fam_can_access_sensitive_content(
  p_profile_id uuid,
  p_case_id uuid,
  p_purpose text
)
returns boolean language plpgsql security definer set search_path = public as $$
declare c record; allowed boolean;
begin
  if p_profile_id is null or auth.uid() is distinct from p_profile_id then return false; end if;
  if coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then
    insert into public.fam_access_audit_events(actor_user_id, subject_profile_id, case_id, purpose, action, decision, reason)
    values (auth.uid(), p_profile_id, p_case_id, coalesce(p_purpose,''), 'read_sensitive_content', 'REQUIRE_MFA', 'Sessão sem assurance level aal2');
    return false;
  end if;
  select * into c from public.fam_professional_credentials
  where tenant_key = 'FAM' and profile_id = p_profile_id and status = 'active'
    and (valid_from is null or valid_from <= now())
    and (valid_until is null or valid_until > now())
  order by created_at desc limit 1;
  if not found then
    insert into public.fam_access_audit_events(actor_user_id, subject_profile_id, case_id, purpose, action, decision, reason)
    values (auth.uid(), p_profile_id, p_case_id, coalesce(p_purpose,''), 'read_sensitive_content', 'DENY', 'Nenhum credenciamento profissional ativo');
    return false;
  end if;
  if c.mfa_required and c.mfa_verified_at is null then
    insert into public.fam_access_audit_events(actor_user_id, subject_profile_id, credential_id, case_id, purpose, action, decision, reason)
    values (auth.uid(), p_profile_id, c.id, p_case_id, coalesce(p_purpose,''), 'read_sensitive_content', 'REQUIRE_MFA', 'MFA do credenciamento não confirmado');
    return false;
  end if;
  allowed := cardinality(c.allowed_purposes) = 0 or p_purpose = any(c.allowed_purposes);
  if not allowed then
    insert into public.fam_access_audit_events(actor_user_id, subject_profile_id, credential_id, case_id, purpose, action, decision, reason)
    values (auth.uid(), p_profile_id, c.id, p_case_id, coalesce(p_purpose,''), 'read_sensitive_content', 'DENY', 'Finalidade fora do escopo');
    return false;
  end if;
  insert into public.fam_access_audit_events(actor_user_id, subject_profile_id, credential_id, case_id, purpose, action, decision, reason)
  values (auth.uid(), p_profile_id, c.id, p_case_id, coalesce(p_purpose,''), 'read_sensitive_content', 'ALLOW', 'Credenciamento, finalidade e validade compatíveis');
  return true;
end;
$$;

create or replace function public.fam_confirm_credential_mfa()
returns integer language plpgsql security definer set search_path = public as $$
declare updated_count integer;
begin
  if auth.uid() is null or coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then raise exception 'MFA_REQUIRED'; end if;
  update public.fam_professional_credentials
  set mfa_verified_at = now(), updated_at = now()
  where tenant_key = 'FAM' and profile_id = auth.uid() and status = 'active' and mfa_required = true
    and (valid_from is null or valid_from <= now())
    and (valid_until is null or valid_until > now());
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

alter table public.fam_professional_credentials enable row level security;
alter table public.fam_access_audit_events enable row level security;

drop policy if exists fam_credentials_self_read on public.fam_professional_credentials;
create policy fam_credentials_self_read on public.fam_professional_credentials
for select to authenticated using (tenant_key = 'FAM' and (profile_id = auth.uid() or public.fam_is_credential_manager()));

drop policy if exists fam_credentials_manager_write on public.fam_professional_credentials;
create policy fam_credentials_manager_write on public.fam_professional_credentials
for all to authenticated using (tenant_key = 'FAM' and public.fam_is_credential_manager())
with check (tenant_key = 'FAM' and public.fam_is_credential_manager());

drop policy if exists fam_credentials_self_request on public.fam_professional_credentials;
create policy fam_credentials_self_request on public.fam_professional_credentials
for insert to authenticated with check (tenant_key = 'FAM' and profile_id = auth.uid() and status = 'requested');

drop policy if exists fam_access_audit_manager_read on public.fam_access_audit_events;
create policy fam_access_audit_manager_read on public.fam_access_audit_events
for select to authenticated using (tenant_key = 'FAM' and (actor_user_id = auth.uid() or public.fam_is_credential_manager()));

grant select, insert, update on public.fam_professional_credentials to authenticated;
grant select on public.fam_access_audit_events to authenticated;
grant execute on function public.fam_is_credential_manager() to authenticated;
grant execute on function public.fam_can_access_sensitive_content(uuid, uuid, text) to authenticated;
grant execute on function public.fam_confirm_credential_mfa() to authenticated;

select 'FAM028 installed' as migration,
  to_regclass('public.fam_professional_credentials') as credentials_table,
  to_regclass('public.fam_access_audit_events') as audit_table,
  to_regprocedure('public.fam_can_access_sensitive_content(uuid,uuid,text)') as access_rpc,
  to_regprocedure('public.fam_confirm_credential_mfa()') as mfa_rpc;
