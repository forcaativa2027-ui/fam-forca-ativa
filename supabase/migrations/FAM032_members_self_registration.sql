-- ============================================================
-- FAM032 — Estrutura base de membros e auto-cadastro
-- ============================================================
-- Objetivo: restaurar o contrato usado pelo frontend para usuários
-- autenticados que ainda não possuem uma linha em public.members.
--
-- Segurança:
--   * não remove dados, usuários, perfis ou políticas existentes;
--   * a RPC só pode criar o registro vinculado a auth.uid();
--   * o índice parcial impede duplicidade por profile_id;
--   * RLS público permite apenas leitura/edição do próprio registro.
--
-- Observação: operações administrativas continuam usando o service role
-- ou as políticas administrativas já existentes no projeto.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  birth_date date,
  life_group_id uuid references public.life_groups(id) on delete set null,
  church_id uuid references public.churches(id) on delete set null,
  journey_stage text not null default 'visitante',
  status text not null default 'ativo',
  joined_at timestamptz default now(),

  social_name text,
  gender text,
  marital_status text,
  nationality text,
  naturalidade text,
  cpf text,
  rg text,
  rg_orgao_expedidor text,
  cnh text,
  cnh_validade date,
  phone_recado text,
  phone_recado_nome text,
  whatsapp text,
  cep text,
  address text,
  numero text,
  complemento text,
  neighborhood text,
  city text,
  state text,
  country text,
  photo_url text,
  baptism_date date,
  discipler_id uuid references public.members(id) on delete set null,
  consent_accepted_at timestamptz,
  photo_consent_accepted_at timestamptz,

  cec_id text,
  card_status text,
  card_approved_at timestamptz,
  card_issued_at timestamptz,
  qr_token text,
  member_since date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibilidade não destrutiva caso a tabela já exista parcialmente.
alter table public.members add column if not exists profile_id uuid;
alter table public.members add column if not exists full_name text;
alter table public.members add column if not exists email text;
alter table public.members add column if not exists phone text;
alter table public.members add column if not exists birth_date date;
alter table public.members add column if not exists life_group_id uuid;
alter table public.members add column if not exists church_id uuid;
alter table public.members add column if not exists journey_stage text default 'visitante';
alter table public.members add column if not exists status text default 'ativo';
alter table public.members add column if not exists joined_at timestamptz default now();
alter table public.members add column if not exists social_name text;
alter table public.members add column if not exists gender text;
alter table public.members add column if not exists marital_status text;
alter table public.members add column if not exists nationality text;
alter table public.members add column if not exists naturalidade text;
alter table public.members add column if not exists cpf text;
alter table public.members add column if not exists rg text;
alter table public.members add column if not exists rg_orgao_expedidor text;
alter table public.members add column if not exists cnh text;
alter table public.members add column if not exists cnh_validade date;
alter table public.members add column if not exists phone_recado text;
alter table public.members add column if not exists phone_recado_nome text;
alter table public.members add column if not exists whatsapp text;
alter table public.members add column if not exists cep text;
alter table public.members add column if not exists address text;
alter table public.members add column if not exists numero text;
alter table public.members add column if not exists complemento text;
alter table public.members add column if not exists neighborhood text;
alter table public.members add column if not exists city text;
alter table public.members add column if not exists state text;
alter table public.members add column if not exists country text;
alter table public.members add column if not exists photo_url text;
alter table public.members add column if not exists baptism_date date;
alter table public.members add column if not exists discipler_id uuid;
alter table public.members add column if not exists consent_accepted_at timestamptz;
alter table public.members add column if not exists photo_consent_accepted_at timestamptz;
alter table public.members add column if not exists cec_id text;
alter table public.members add column if not exists card_status text;
alter table public.members add column if not exists card_approved_at timestamptz;
alter table public.members add column if not exists card_issued_at timestamptz;
alter table public.members add column if not exists qr_token text;
alter table public.members add column if not exists member_since date;
alter table public.members add column if not exists created_at timestamptz default now();
alter table public.members add column if not exists updated_at timestamptz default now();

create index if not exists members_profile_id_idx on public.members(profile_id);
create index if not exists members_church_id_idx on public.members(church_id);
create index if not exists members_life_group_id_idx on public.members(life_group_id);
create index if not exists members_status_idx on public.members(status);

-- Uma conta autenticada representa no máximo um cadastro de membro.
create unique index if not exists members_one_record_per_profile_uidx
  on public.members(profile_id)
  where profile_id is not null;

alter table public.members enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'members'
      and policyname = 'members_self_read'
  ) then
    create policy members_self_read on public.members
      for select to authenticated
      using (profile_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'members'
      and policyname = 'members_self_update'
  ) then
    create policy members_self_update on public.members
      for update to authenticated
      using (profile_id = auth.uid())
      with check (profile_id = auth.uid());
  end if;
end
$$;

create or replace function public.create_my_member_record()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing uuid;
  v_full_name text;
  v_email text;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sessão expirada, faça login novamente.';
  end if;

  select m.id
    into v_existing
    from public.members m
   where m.profile_id = auth.uid()
   order by m.created_at nulls last, m.id
   limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  select p.full_name, p.email
    into v_full_name, v_email
    from public.profiles p
   where p.id = auth.uid();

  insert into public.members (
    profile_id, full_name, email, status, journey_stage, joined_at
  ) values (
    auth.uid(),
    coalesce(nullif(trim(v_full_name), ''), 'Membro'),
    v_email,
    'ativo',
    'visitante',
    now()
  )
  returning id into v_id;

  begin
    perform public.audit_log(
      'insert',
      'members',
      v_id,
      jsonb_build_object('acao', 'auto_cadastro_proprio')
    );
  exception when undefined_function then
    null;
  end;

  return v_id;
exception
  when unique_violation then
    select m.id into v_id
      from public.members m
     where m.profile_id = auth.uid()
     order by m.created_at nulls last, m.id
     limit 1;
    if v_id is not null then return v_id; end if;
    raise;
end;
$$;

revoke all on function public.create_my_member_record() from public;
grant execute on function public.create_my_member_record() to authenticated;

comment on function public.create_my_member_record() is
  'Cria ou retorna o cadastro de membro do usuário autenticado, sem duplicidade.';
