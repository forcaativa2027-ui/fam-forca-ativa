-- ============================================================
-- CEC FAMILY — Níveis Flexíveis (parte 2): funções de saúde e
-- view do dashboard, agora considerando que Distrito/Setor/Igreja
-- podem pular níveis (parent_level/parent_id).
-- ============================================================

-- ---------- Setor: agrega os LGs que penduram direto nele (sem mudança) ----------
-- sector_health_score já existente continua correto (lg.sector_id = p_sector_id).

-- ---------- Igreja Local: agrega seus Life Groups diretos (sem mudança) ----------
-- church_health_score já existente continua correto (lg.church_id = p_church_id).

-- ---------- Distrito: agrega só os Setores que o têm como pai DIRETO ----------
create or replace function public.district_health_score(p_district_id uuid)
returns mda_status
language plpgsql stable security definer set search_path = public as $$
declare
  v_statuses mda_status[];
begin
  select array_agg(public.sector_health_score(s.id))
    into v_statuses
    from public.sectors s
   where s.parent_level = 'distrito' and s.parent_id = p_district_id and s.is_active;

  return public.aggregate_mda_status(v_statuses);
end; $$;
grant execute on function public.district_health_score(uuid) to authenticated;

-- ---------- Núcleo: agrega Distritos, Setores e Igrejas que o têm como pai DIRETO ----------
-- (com níveis flexíveis, qualquer um desses 3 pode pular direto pro Núcleo)
create or replace function public.nucleo_health_score(p_nucleo_id uuid)
returns mda_status
language plpgsql stable security definer set search_path = public as $$
declare
  v_statuses mda_status[];
begin
  select array_agg(status) into v_statuses from (
    select public.district_health_score(d.id) as status
      from public.districts d
     where d.parent_level = 'nucleo' and d.parent_id = p_nucleo_id and d.is_active
    union all
    select public.sector_health_score(s.id)
      from public.sectors s
     where s.parent_level = 'nucleo' and s.parent_id = p_nucleo_id and s.is_active
    union all
    select public.church_health_score(c.id)
      from public.churches c
     where c.parent_level = 'nucleo' and c.parent_territorial_id = p_nucleo_id and c.is_active
  ) t;

  return public.aggregate_mda_status(v_statuses);
end; $$;
grant execute on function public.nucleo_health_score(uuid) to authenticated;

-- ---------- Estado: agrega Núcleos (padrão) + Distritos que pularam direto pro Estado ----------
create or replace function public.state_health_score(p_state_id uuid)
returns mda_status
language plpgsql stable security definer set search_path = public as $$
declare
  v_statuses mda_status[];
begin
  select array_agg(status) into v_statuses from (
    select public.nucleo_health_score(n.id) as status
      from public.nucleos n
     where n.state_id = p_state_id and n.is_active
    union all
    select public.district_health_score(d.id)
      from public.districts d
     where d.parent_level = 'estado' and d.parent_id = p_state_id and d.is_active
  ) t;

  return public.aggregate_mda_status(v_statuses);
end; $$;
grant execute on function public.state_health_score(uuid) to authenticated;

-- ---------- View consolidada do Dashboard: usa church_ancestry (já resolve os pulos) ----------
drop view if exists public.mda_health_dashboard;
create view public.mda_health_dashboard as
select
  ca.state_id, st.name as state_name,
  ca.nucleo_id, nu.name as nucleo_name,
  ca.district_id, d.name as district_name,
  ca.sector_id, s.name as sector_name,
  s.area_id as area_id, ar.name as area_name,   -- genealogia (independente do caminho de posse)
  c.id as church_id, c.name as church_name, c.type as church_type,
  lg.id as lg_id, lg.name as lg_name, lg.status_lg::text as lg_status_lg,
  public.lg_health_score(lg.id) as lg_health,
  case when s.id is not null then public.sector_health_score(s.id) else null end as sector_health,
  case when d.id is not null then public.district_health_score(d.id) else null end as district_health,
  case when nu.id is not null then public.nucleo_health_score(nu.id) else null end as nucleo_health,
  case when st.id is not null then public.state_health_score(st.id) else null end as state_health,
  public.church_health_score(c.id) as church_health,
  (select count(*)::int from public.members m where m.life_group_id = lg.id and m.status = 'ativo') as lg_members_count,
  (select max(meeting_date)::date from public.meeting_reports mr where mr.life_group_id = lg.id) as lg_last_report_date
from public.churches c
join public.church_ancestry ca on ca.church_id = c.id
left join public.states st on st.id = ca.state_id
left join public.nucleos nu on nu.id = ca.nucleo_id
left join public.districts d on d.id = ca.district_id
left join public.sectors s on s.id = ca.sector_id
left join public.areas ar on ar.id = s.area_id  -- área é genealogia (Estrutura de Multiplicação), independente do pai territorial
left join public.life_groups lg on lg.church_id = c.id and lg.is_active
where c.is_active;

comment on view public.mda_health_dashboard is 'Níveis flexíveis: state/nucleo/district/sector podem vir null quando aquele nível foi pulado na árvore da igreja.';
