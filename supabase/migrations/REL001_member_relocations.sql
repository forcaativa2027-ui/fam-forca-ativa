-- ============================================================
-- CEC FAMILY — Realocação/Transferência de Membros (script de
-- melhoria, Seção 5). Preserva histórico completo — nunca
-- sobrescreve, só grava uma nova linha por movimentação.
-- Idempotente.
-- ============================================================

do $$ begin
  create type relocation_reason as enum (
    'correcao_cadastro','mudanca_endereco','transferencia_ministerial','mudanca_igreja',
    'multiplicacao_lg','reorganizacao_territorial','designacao_pastoral','solicitacao_membro','outro'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.member_relocations (
  id                  uuid primary key default gen_random_uuid(),
  member_id           uuid not null references public.members(id) on delete cascade,

  from_church_id      uuid references public.churches(id) on delete set null,
  from_life_group_id  uuid references public.life_groups(id) on delete set null,
  from_sector_id      uuid references public.sectors(id) on delete set null,
  from_district_id    uuid references public.districts(id) on delete set null,
  from_nucleo_id      uuid references public.nucleos(id) on delete set null,
  from_state_id       uuid references public.states(id) on delete set null,

  to_church_id        uuid references public.churches(id) on delete set null,
  to_life_group_id    uuid references public.life_groups(id) on delete set null,
  to_sector_id        uuid references public.sectors(id) on delete set null,
  to_district_id      uuid references public.districts(id) on delete set null,
  to_nucleo_id        uuid references public.nucleos(id) on delete set null,
  to_state_id         uuid references public.states(id) on delete set null,

  reason              relocation_reason not null,
  notes                text,
  previous_function    text,
  new_function         text,

  performed_by        uuid references public.profiles(id) on delete set null,
  approved_by          uuid references public.profiles(id) on delete set null,
  created_at           timestamptz not null default now()
);
comment on table public.member_relocations is 'Histórico de realocação/transferência de membros (script de melhoria, Seção 5) — cada movimentação é uma linha nova, nunca sobrescreve.';

create index if not exists idx_relocations_member on public.member_relocations(member_id);
create index if not exists idx_relocations_created on public.member_relocations(created_at desc);

alter table public.member_relocations enable row level security;

drop policy if exists relocations_read on public.member_relocations;
create policy relocations_read on public.member_relocations for select to authenticated
  using (
    public.is_apostle()
    or from_church_id in (select public.accessible_church_ids())
    or to_church_id in (select public.accessible_church_ids())
  );

-- Sem policy de insert/update direto — tudo passa pela RPC relocate_member (security definer)
drop policy if exists relocations_no_direct_write on public.member_relocations;
create policy relocations_no_direct_write on public.member_relocations for all to authenticated
  using (false) with check (false);

-- ============================================================
-- RPC: realoca o membro, valida abrangência dos dois lados, grava histórico
-- ============================================================
create or replace function public.relocate_member(
  p_member_id uuid,
  p_to_church_id uuid,
  p_to_life_group_id uuid default null,
  p_reason relocation_reason default 'outro',
  p_notes text default null,
  p_previous_function text default null,
  p_new_function text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_member record;
  v_from_sector uuid; v_from_district uuid; v_from_nucleo uuid; v_from_state uuid;
  v_to_sector uuid; v_to_district uuid; v_to_nucleo uuid; v_to_state uuid;
  v_new_id uuid;
begin
  select * into v_member from public.members where id = p_member_id;
  if v_member.id is null then raise exception 'Membro não encontrado'; end if;

  if not public.is_apostle() then
    if v_member.church_id is not null and v_member.church_id not in (select public.accessible_church_ids()) then
      raise exception 'Sem permissão sobre a igreja de origem deste membro' using errcode = '42501';
    end if;
    if p_to_church_id not in (select public.accessible_church_ids()) then
      raise exception 'Sem permissão sobre a igreja de destino' using errcode = '42501';
    end if;
  end if;

  -- Resolve a cadeia territorial de origem (a partir da igreja atual do membro)
  select se.id, se.district_id, di.nucleo_id, nu.state_id
    into v_from_sector, v_from_district, v_from_nucleo, v_from_state
  from public.churches ch
  left join public.sectors se on se.id = ch.sector_id
  left join public.districts di on di.id = se.district_id
  left join public.nucleos nu on nu.id = di.nucleo_id
  where ch.id = v_member.church_id;

  -- Resolve a cadeia territorial de destino
  select se.id, se.district_id, di.nucleo_id, nu.state_id
    into v_to_sector, v_to_district, v_to_nucleo, v_to_state
  from public.churches ch
  left join public.sectors se on se.id = ch.sector_id
  left join public.districts di on di.id = se.district_id
  left join public.nucleos nu on nu.id = di.nucleo_id
  where ch.id = p_to_church_id;

  insert into public.member_relocations (
    member_id,
    from_church_id, from_life_group_id, from_sector_id, from_district_id, from_nucleo_id, from_state_id,
    to_church_id, to_life_group_id, to_sector_id, to_district_id, to_nucleo_id, to_state_id,
    reason, notes, previous_function, new_function, performed_by
  ) values (
    p_member_id,
    v_member.church_id, v_member.life_group_id, v_from_sector, v_from_district, v_from_nucleo, v_from_state,
    p_to_church_id, p_to_life_group_id, v_to_sector, v_to_district, v_to_nucleo, v_to_state,
    p_reason, p_notes, p_previous_function, p_new_function, auth.uid()
  ) returning id into v_new_id;

  update public.members set church_id = p_to_church_id, life_group_id = p_to_life_group_id
  where id = p_member_id;

  begin
    perform public.audit_log('update', 'members', p_member_id, jsonb_build_object(
      'realocacao_id', v_new_id, 'motivo', p_reason,
      'de_igreja', v_member.church_id, 'para_igreja', p_to_church_id
    ));
  exception when others then null;
  end;

  return v_new_id;
end; $$;
grant execute on function public.relocate_member(uuid, uuid, uuid, relocation_reason, text, text, text) to authenticated;

-- ============================================================
-- View de leitura com nomes resolvidos (histórico legível no front)
-- ============================================================
create or replace view public.member_relocations_view as
select
  mr.id, mr.member_id, m.full_name as member_name,
  mr.from_church_id, fc.name as from_church_name,
  mr.from_life_group_id, flg.name as from_life_group_name,
  mr.to_church_id, tc.name as to_church_name,
  mr.to_life_group_id, tlg.name as to_life_group_name,
  mr.reason, mr.notes, mr.previous_function, mr.new_function,
  mr.performed_by, pb.full_name as performed_by_name,
  mr.approved_by, ab.full_name as approved_by_name,
  mr.created_at
from public.member_relocations mr
join public.members m on m.id = mr.member_id
left join public.churches fc on fc.id = mr.from_church_id
left join public.life_groups flg on flg.id = mr.from_life_group_id
left join public.churches tc on tc.id = mr.to_church_id
left join public.life_groups tlg on tlg.id = mr.to_life_group_id
left join public.profiles pb on pb.id = mr.performed_by
left join public.profiles ab on ab.id = mr.approved_by
order by mr.created_at desc;

grant select on public.member_relocations_view to authenticated;
