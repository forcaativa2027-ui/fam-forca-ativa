-- ============================================================
-- CEC FAMILY — Dados pessoais completos do membro (script de
-- melhoria: Cadastro/Realocação/Carteirinha, Seções 5 e 9).
-- Base pro editor completo do admin E pro card de complementação
-- que o próprio membro preenche.
-- ============================================================

alter table public.members add column if not exists social_name text;
alter table public.members add column if not exists gender text;
alter table public.members add column if not exists marital_status text;
alter table public.members add column if not exists nationality text default 'Brasileira';
alter table public.members add column if not exists naturalidade text;

-- Documentos
alter table public.members add column if not exists cpf text;
alter table public.members add column if not exists rg text;
alter table public.members add column if not exists rg_orgao_expedidor text;
alter table public.members add column if not exists cnh text;
alter table public.members add column if not exists cnh_validade date;

-- Contato adicional
alter table public.members add column if not exists phone_recado text;
alter table public.members add column if not exists phone_recado_nome text;
alter table public.members add column if not exists whatsapp text;

-- Endereço completo
alter table public.members add column if not exists cep text;
alter table public.members add column if not exists address text;
alter table public.members add column if not exists numero text;
alter table public.members add column if not exists complemento text;
alter table public.members add column if not exists neighborhood text;
alter table public.members add column if not exists city text;
alter table public.members add column if not exists state text;
alter table public.members add column if not exists country text default 'Brasil';

-- Foto e dados eclesiásticos complementares
alter table public.members add column if not exists photo_url text;
alter table public.members add column if not exists baptism_date date;
alter table public.members add column if not exists discipler_id uuid references public.profiles(id) on delete set null;

-- LGPD
alter table public.members add column if not exists consent_accepted_at timestamptz;
alter table public.members add column if not exists photo_consent_accepted_at timestamptz;

-- CPF único quando preenchido (evita duplicidade indevida, mas permite null durante transição)
create unique index if not exists uq_members_cpf on public.members(cpf) where cpf is not null;

-- ============================================================
-- Função: calcula % de completude do cadastro (pro card de
-- complementação e pra elegibilidade futura da carteirinha)
-- ============================================================
create or replace function public.member_completion_percent(p_member_id uuid)
returns int
language plpgsql stable security definer set search_path = public as $$
declare
  v_total int := 12;
  v_filled int := 0;
  m record;
begin
  select * into m from public.members where id = p_member_id;
  if m.id is null then return 0; end if;

  if m.birth_date is not null then v_filled := v_filled + 1; end if;
  if m.cpf is not null then v_filled := v_filled + 1; end if;
  if m.rg is not null or m.cnh is not null then v_filled := v_filled + 1; end if;
  if m.phone is not null then v_filled := v_filled + 1; end if;
  if m.phone_recado is not null then v_filled := v_filled + 1; end if;
  if m.cep is not null then v_filled := v_filled + 1; end if;
  if m.address is not null then v_filled := v_filled + 1; end if;
  if m.numero is not null then v_filled := v_filled + 1; end if;
  if m.neighborhood is not null then v_filled := v_filled + 1; end if;
  if m.city is not null then v_filled := v_filled + 1; end if;
  if m.photo_url is not null then v_filled := v_filled + 1; end if;
  if m.gender is not null then v_filled := v_filled + 1; end if;

  return round((v_filled::numeric / v_total) * 100)::int;
end; $$;
grant execute on function public.member_completion_percent(uuid) to authenticated;
