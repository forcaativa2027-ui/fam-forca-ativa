-- ============================================================
-- CEC FAMILY — Fix: status da carteirinha ficava travado em
-- "Aguardando foto" mesmo depois da foto ser enviada.
--
-- Causa: o gatilho (trigger) que recalcula o status roda ANTES do
-- UPDATE ser gravado (BEFORE UPDATE). A função antiga fazia uma nova
-- consulta "select * from members where id = ..." pra pegar os dados
-- — mas nesse momento o banco ainda devolve a linha ANTIGA (o UPDATE
-- não terminou). Resultado: o gatilho sempre calculava com base no
-- estado anterior, nunca com o dado que estava sendo salvo agora.
--
-- Correção: as funções passam a operar direto sobre a linha (NEW),
-- sem re-consultar a tabela dentro do gatilho.
-- ============================================================

-- ---------- Versão "por linha" (usada dentro do gatilho, sem re-consulta) ----------
create or replace function public.member_completion_percent_from_row(m public.members)
returns int
language plpgsql immutable as $$
declare
  v_total int := 12;
  v_filled int := 0;
begin
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
grant execute on function public.member_completion_percent_from_row(public.members) to authenticated;

-- Função pública (por id) agora só é uma casca fina sobre a versão por linha —
-- continua igual pro resto do sistema (front-end, etc.), sem risco de staleness
-- porque aqui a consulta É o dado atual de verdade (fora de gatilho).
create or replace function public.member_completion_percent(p_member_id uuid)
returns int
language plpgsql stable security definer set search_path = public as $$
declare
  m public.members;
begin
  select * into m from public.members where id = p_member_id;
  if m.id is null then return 0; end if;
  return public.member_completion_percent_from_row(m);
end; $$;
grant execute on function public.member_completion_percent(uuid) to authenticated;

-- ---------- Status da carteirinha: mesma correção, versão "por linha" ----------
create or replace function public.compute_card_status_from_row(m public.members)
returns card_status
language plpgsql immutable as $$
declare
  v_completion int;
begin
  if m.card_status in ('emitida','suspensa','cancelada') then
    return m.card_status;
  end if;

  if m.church_id is null or m.status <> 'ativo' then return 'cadastro_incompleto'; end if;

  v_completion := public.member_completion_percent_from_row(m);
  if v_completion < 100 then
    if m.photo_url is null then return 'aguardando_foto'; end if;
    if m.cpf is null and m.rg is null and m.cnh is null then return 'aguardando_documentos'; end if;
    return 'aguardando_validacao';
  end if;

  if m.card_approved_at is null then return 'aguardando_aprovacao'; end if;

  return 'elegivel';
end; $$;
grant execute on function public.compute_card_status_from_row(public.members) to authenticated;

create or replace function public.compute_card_status(p_member_id uuid)
returns card_status
language plpgsql stable security definer set search_path = public as $$
declare
  m public.members;
begin
  select * into m from public.members where id = p_member_id;
  if m.id is null then return 'cadastro_incompleto'; end if;
  return public.compute_card_status_from_row(m);
end; $$;
grant execute on function public.compute_card_status(uuid) to authenticated;

-- ---------- Gatilho corrigido: usa NEW diretamente, nunca re-consulta ----------
create or replace function public.refresh_card_status()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.card_status := public.compute_card_status_from_row(new);
  return new;
end; $$;

drop trigger if exists trg_refresh_card_status on public.members;
create trigger trg_refresh_card_status before update on public.members
  for each row execute function public.refresh_card_status();

-- ============================================================
-- Recalcula agora, de uma vez, todo mundo que já ficou com status
-- desatualizado por causa desse bug (ex: quem enviou foto mas o
-- status não avançou).
-- ============================================================
update public.members m
set card_status = public.compute_card_status_from_row(m)
where card_status not in ('emitida','suspensa','cancelada');
