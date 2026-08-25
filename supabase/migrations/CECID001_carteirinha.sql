-- ============================================================
-- CEC FAMILY — CEC ID (Fase 1: Carteirinha Digital)
-- Identificador único permanente, status de elegibilidade (com
-- aprovação manual da liderança), token de QR Code e categoria
-- institucional (cargo/função atual, com fallback pro perfil).
-- Idempotente.
-- ============================================================

do $$ begin
  create type card_status as enum (
    'cadastro_incompleto','aguardando_foto','aguardando_documentos',
    'aguardando_validacao','aguardando_aprovacao','elegivel','emitida',
    'suspensa','cancelada'
  );
exception when duplicate_object then null; end $$;

alter table public.members add column if not exists cec_id text unique;
alter table public.members add column if not exists card_status card_status not null default 'cadastro_incompleto';
alter table public.members add column if not exists card_approved_by uuid references public.profiles(id) on delete set null;
alter table public.members add column if not exists card_approved_at timestamptz;
alter table public.members add column if not exists card_issued_at timestamptz;
alter table public.members add column if not exists qr_token uuid not null default gen_random_uuid();

create sequence if not exists public.cec_id_seq start 1;

-- ---------- Gera o CEC ID permanente (uma vez, nunca reutilizado/alterado) ----------
create or replace function public.assign_cec_id()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.cec_id is null then
    new.cec_id := 'CEC-BR-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.cec_id_seq')::text, 8, '0');
  end if;
  return new;
end; $$;

drop trigger if exists trg_assign_cec_id on public.members;
create trigger trg_assign_cec_id before insert on public.members
  for each row execute function public.assign_cec_id();

-- Backfill: quem já existe e ainda não tem CEC ID
update public.members
set cec_id = 'CEC-BR-' || to_char(coalesce(joined_at, created_at, now()), 'YYYY') || '-' || lpad(nextval('public.cec_id_seq')::text, 8, '0')
where cec_id is null;

-- ---------- Categoria institucional: cargo/função ativo (Liderança), com fallback pro perfil ----------
create or replace function public.member_category(p_member_id uuid)
returns text
language plpgsql stable security definer set search_path = public as $$
declare
  v_profile_id uuid;
  v_role text;
  v_function leadership_function;
  v_priority int;
begin
  select profile_id, (select role::text from public.profiles where id = m.profile_id)
    into v_profile_id, v_role
  from public.members m where m.id = p_member_id;

  if v_profile_id is not null then
    select la.function_type, case la.function_type
      when 'pastor_principal' then 1 when 'pastor_auxiliar' then 2 when 'pastor_distrito' then 3
      when 'supervisor_distrito' then 4 when 'supervisor_area' then 5 when 'supervisor_setor' then 6
      when 'lider_lg' then 7 when 'lider_auxiliar' then 8 when 'diacono' then 9
      else 10 end
      into v_function, v_priority
    from public.leadership_assignments la
    where la.profile_id = v_profile_id and la.status = 'ativo'
    order by v_priority asc
    limit 1;
  end if;

  if v_function is not null then
    return case v_function
      when 'pastor_principal' then 'Pastor Principal'
      when 'pastor_auxiliar' then 'Pastor Auxiliar'
      when 'pastor_distrito' then 'Pastor de Distrito'
      when 'supervisor_distrito' then 'Supervisor de Distrito'
      when 'supervisor_area' then 'Supervisor de Área'
      when 'supervisor_setor' then 'Supervisor de Setor'
      when 'lider_lg' then 'Líder de Life Group'
      when 'lider_auxiliar' then 'Líder Auxiliar'
      when 'diacono' then 'Diácono'
      else 'Líder de Ministério'
    end;
  end if;

  return case v_role
    when 'apostolo' then 'Apóstolo'
    when 'pastor' then 'Pastor'
    when 'supervisor' then 'Supervisor'
    when 'lider' then 'Líder'
    when 'visitante' then 'Visitante credenciado'
    else 'Membro'
  end;
end; $$;
grant execute on function public.member_category(uuid) to authenticated, anon;

-- ---------- Status de elegibilidade (com etapa de aprovação manual) ----------
create or replace function public.compute_card_status(p_member_id uuid)
returns card_status
language plpgsql stable security definer set search_path = public as $$
declare
  m record;
  v_completion int;
begin
  select * into m from public.members where id = p_member_id;
  if m.id is null then return 'cadastro_incompleto'; end if;

  -- Se já foi emitida ou suspensa/cancelada manualmente, mantém (não recalcula pra trás)
  if m.card_status in ('emitida','suspensa','cancelada') then
    return m.card_status;
  end if;

  if m.church_id is null or m.status <> 'ativo' then return 'cadastro_incompleto'; end if;

  v_completion := public.member_completion_percent(p_member_id);
  if v_completion < 100 then
    if m.photo_url is null then return 'aguardando_foto'; end if;
    if m.cpf is null and m.rg is null and m.cnh is null then return 'aguardando_documentos'; end if;
    return 'aguardando_validacao';
  end if;

  if m.card_approved_at is null then return 'aguardando_aprovacao'; end if;

  return 'elegivel';
end; $$;
grant execute on function public.compute_card_status(uuid) to authenticated;

-- Atualiza o status sempre que o membro for alterado (foto, documentos, etc.)
create or replace function public.refresh_card_status()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.card_status := public.compute_card_status(new.id);
  return new;
end; $$;

drop trigger if exists trg_refresh_card_status on public.members;
create trigger trg_refresh_card_status before update on public.members
  for each row execute function public.refresh_card_status();

-- ---------- Aprovação manual (liderança) ----------
create or replace function public.approve_member_card(p_member_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  m record;
  v_completion int;
begin
  select * into m from public.members where id = p_member_id;
  if m.id is null then raise exception 'Membro não encontrado'; end if;

  if not public.is_apostle() and m.church_id not in (select public.accessible_church_ids()) then
    raise exception 'Sem permissão sobre este membro' using errcode = '42501';
  end if;

  v_completion := public.member_completion_percent(p_member_id);
  if v_completion < 100 then
    raise exception 'Cadastro ainda incompleto (% de 100) — não é possível aprovar.', v_completion;
  end if;

  update public.members set card_approved_by = auth.uid(), card_approved_at = now() where id = p_member_id;

  begin
    perform public.audit_log('update', 'members', p_member_id, jsonb_build_object('acao', 'aprovacao_carteirinha'));
  exception when others then null;
  end;
end; $$;
grant execute on function public.approve_member_card(uuid) to authenticated;

-- ---------- Emissão (primeira vez que a pessoa efetivamente vê/gera a carteirinha) ----------
create or replace function public.issue_member_card(p_member_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.members
  set card_status = 'emitida', card_issued_at = coalesce(card_issued_at, now())
  where id = p_member_id and card_status = 'elegivel';
end; $$;
grant execute on function public.issue_member_card(uuid) to authenticated;

-- ---------- Suspender/Cancelar (liderança) ----------
create or replace function public.set_card_status_manual(p_member_id uuid, p_status card_status)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('suspensa','cancelada','elegivel') then
    raise exception 'Use approve_member_card/issue_member_card para os demais status.';
  end if;
  if not public.is_apostle() and (select church_id from public.members where id = p_member_id) not in (select public.accessible_church_ids()) then
    raise exception 'Sem permissão sobre este membro' using errcode = '42501';
  end if;
  update public.members set card_status = p_status where id = p_member_id;
  begin
    perform public.audit_log('update', 'members', p_member_id, jsonb_build_object('acao', 'card_status_manual', 'status', p_status));
  exception when others then null;
  end;
end; $$;
grant execute on function public.set_card_status_manual(uuid, card_status) to authenticated;

-- ---------- Validação pública do QR Code (leitor, ainda sem sessão necessariamente) ----------
create or replace function public.validate_cec_id(p_token uuid)
returns table (
  valid boolean, cec_id text, full_name text, photo_url text,
  categoria text, church_name text, card_status card_status
)
language plpgsql stable security definer set search_path = public as $$
declare
  m record;
begin
  select * into m from public.members where qr_token = p_token;
  if m.id is null then
    return query select false, null::text, null::text, null::text, null::text, null::text, null::card_status;
    return;
  end if;
  return query
  select
    m.card_status in ('elegivel','emitida'),
    m.cec_id, m.full_name, m.photo_url,
    public.member_category(m.id),
    (select name from public.churches where id = m.church_id),
    m.card_status;
end; $$;
grant execute on function public.validate_cec_id(uuid) to authenticated, anon;

-- ---------- View auxiliar pra listar na aba Membros (evita N+1 de RPC) ----------
create or replace view public.members_card_view as
select m.id as member_id, m.cec_id, m.card_status, m.card_approved_at, m.qr_token,
       public.member_category(m.id) as categoria,
       public.member_completion_percent(m.id) as completion_percent
from public.members m;

grant select on public.members_card_view to authenticated;
