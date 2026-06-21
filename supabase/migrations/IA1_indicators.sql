-- ============================================================
-- CEC FAMILY — IA-1: Indicadores Objetivos (sem LLM)
-- Functions Postgres puras que calculam saude ministerial.
-- - get_lg_indicators(lg_id, ref_date)
-- - get_lg_indicators_all(community_id?)  -- lista todos LGs
-- - get_aggregate_indicators(level, scope_id) -- agregacao bottom-up
-- Idempotente.
-- ============================================================

-- ============================================================
-- 1) INDICADORES DE UM LIFE GROUP
-- ============================================================
create or replace function public.get_lg_indicators(
  p_lg_id uuid,
  p_ref_date date default current_date
)
returns table(
  life_group_id           uuid,
  -- frequencia
  attendance_avg_last_4   numeric,
  attendance_avg_last_12  numeric,
  -- crescimento
  members_now             int,
  members_30d_ago         int,
  members_90d_ago         int,
  growth_30d_pct          numeric,
  growth_90d_pct          numeric,
  -- novos convertidos
  new_converts_90d        int,
  -- discipulado
  discipleship_rate_pct   numeric,
  -- consistencia de relatos: % de semanas com relatorio nos ultimos 12
  report_consistency_pct  numeric,
  -- visitantes
  visitors_avg_last_4     numeric,
  -- producao do GE (decisoes, visitas)
  decisions_90d           int,
  visits_made_90d         int,
  -- multiplicacao
  multiplication_target   int,
  multiplication_pct      numeric,
  -- meta-dados
  last_report_date        date,
  reports_last_90d        int
)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with
  -- relatórios recentes do LG
  reports as (
    select id, meeting_date, attendance_count, visitors_count,
           total_present, decisions_count, visits_made
    from public.meeting_reports
    where life_group_id = p_lg_id
      and meeting_date <= p_ref_date
    order by meeting_date desc
  ),
  reports_last_4  as (select * from reports limit 4),
  reports_last_12 as (select * from reports limit 12),
  -- ativos hoje
  active_now as (
    select count(*)::int as n from public.members
    where life_group_id = p_lg_id and status = 'ativo'
  ),
  -- ativos há 30 e 90 dias (estimativa por joined_at)
  active_30 as (
    select count(*)::int as n from public.members
    where life_group_id = p_lg_id and status = 'ativo'
      and (joined_at is null or joined_at <= p_ref_date - interval '30 days')
  ),
  active_90 as (
    select count(*)::int as n from public.members
    where life_group_id = p_lg_id and status = 'ativo'
      and (joined_at is null or joined_at <= p_ref_date - interval '90 days')
  ),
  -- novos convertidos nos últimos 90 dias
  converts as (
    select count(*)::int as n from public.members
    where life_group_id = p_lg_id
      and journey_stage = 'novo_convertido'
      and created_at >= (p_ref_date - interval '90 days')
  ),
  -- discipulado ativo (membros como disciple em discipleships ativos)
  disc as (
    select
      (select count(*)::int from public.discipleships d
        join public.members m on m.id = d.disciple_id
       where m.life_group_id = p_lg_id and d.status = 'ativo') as n_in_discipleship,
      (select count(*)::int from public.members
        where life_group_id = p_lg_id and status = 'ativo') as n_active
  ),
  -- meta de multiplicacao
  lg_target as (
    select coalesce(multiplication_target, 12) as t
    from public.life_groups where id = p_lg_id
  ),
  -- agregados
  agg as (
    select
      (select avg(total_present)::numeric(10,1) from reports_last_4)  as att4,
      (select avg(total_present)::numeric(10,1) from reports_last_12) as att12,
      (select avg(visitors_count)::numeric(10,1) from reports_last_4) as vis4,
      (select sum(decisions_count)::int from reports where meeting_date >= (p_ref_date - interval '90 days')) as dec90,
      (select sum(visits_made)::int    from reports where meeting_date >= (p_ref_date - interval '90 days')) as vmd90,
      (select count(*)::int            from reports where meeting_date >= (p_ref_date - interval '90 days')) as r90,
      (select max(meeting_date)        from reports) as last_rep
  )
  select
    p_lg_id,
    coalesce(agg.att4, 0),
    coalesce(agg.att12, 0),
    active_now.n,
    active_30.n,
    active_90.n,
    case when active_30.n > 0
      then ((active_now.n - active_30.n)::numeric / active_30.n * 100)::numeric(10,1)
      else 0::numeric(10,1) end,
    case when active_90.n > 0
      then ((active_now.n - active_90.n)::numeric / active_90.n * 100)::numeric(10,1)
      else 0::numeric(10,1) end,
    converts.n,
    case when disc.n_active > 0
      then (disc.n_in_discipleship::numeric / disc.n_active * 100)::numeric(10,1)
      else 0::numeric(10,1) end,
    -- consistencia: relatos de 12 semanas (ideal: 12)
    case when 12 > 0
      then (least((select count(*) from reports_last_12), 12)::numeric / 12 * 100)::numeric(10,1)
      else 0::numeric(10,1) end,
    coalesce(agg.vis4, 0),
    coalesce(agg.dec90, 0),
    coalesce(agg.vmd90, 0),
    lg_target.t,
    case when lg_target.t > 0
      then least(100, (active_now.n::numeric / lg_target.t * 100))::numeric(10,1)
      else 0::numeric(10,1) end,
    agg.last_rep,
    coalesce(agg.r90, 0)
  from agg, active_now, active_30, active_90, converts, disc, lg_target;
end; $$;

grant execute on function public.get_lg_indicators(uuid, date) to authenticated;

-- ============================================================
-- 2) LISTAR INDICADORES DE TODOS OS LGs (filtrado por comunidade)
-- ============================================================
create or replace function public.get_all_lg_indicators(p_community_id uuid default null)
returns table(
  life_group_id           uuid,
  life_group_name         text,
  church_id               uuid,
  attendance_avg_last_4   numeric,
  attendance_avg_last_12  numeric,
  members_now             int,
  members_30d_ago         int,
  members_90d_ago         int,
  growth_30d_pct          numeric,
  growth_90d_pct          numeric,
  new_converts_90d        int,
  discipleship_rate_pct   numeric,
  report_consistency_pct  numeric,
  visitors_avg_last_4     numeric,
  decisions_90d           int,
  visits_made_90d         int,
  multiplication_target   int,
  multiplication_pct      numeric,
  last_report_date        date,
  reports_last_90d        int
)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  select
    lg.id, lg.name, lg.church_id,
    ind.attendance_avg_last_4, ind.attendance_avg_last_12,
    ind.members_now, ind.members_30d_ago, ind.members_90d_ago,
    ind.growth_30d_pct, ind.growth_90d_pct,
    ind.new_converts_90d, ind.discipleship_rate_pct,
    ind.report_consistency_pct, ind.visitors_avg_last_4,
    ind.decisions_90d, ind.visits_made_90d,
    ind.multiplication_target, ind.multiplication_pct,
    ind.last_report_date, ind.reports_last_90d
  from public.life_groups lg
  cross join lateral public.get_lg_indicators(lg.id) ind
  where lg.is_active
    and (p_community_id is null or lg.church_id = p_community_id);
end; $$;

grant execute on function public.get_all_lg_indicators(uuid) to authenticated;

-- ============================================================
-- 3) INDICADORES AGREGADOS POR ESCOPO HIERARQUICO
-- Agregação dos LGs filhos de um setor/área/distrito/igreja.
-- ============================================================
create or replace function public.get_aggregate_indicators(
  p_level text,             -- 'sector','area','district','church'
  p_scope_id uuid
)
returns table(
  level                  text,
  scope_id               uuid,
  total_lgs              int,
  total_members          int,
  total_new_converts_90d int,
  attendance_avg         numeric,
  growth_30d_pct         numeric,
  discipleship_rate_pct  numeric,
  decisions_90d          int,
  visits_made_90d        int,
  multiplication_pct_avg numeric,
  report_consistency_pct numeric
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_lg_ids uuid[];
begin
  -- coleta os IDs dos LGs sob o escopo
  if p_level = 'sector' then
    select array_agg(id) into v_lg_ids
    from public.life_groups
    where sector_id = p_scope_id and is_active;
  elsif p_level = 'area' then
    select array_agg(lg.id) into v_lg_ids
    from public.life_groups lg
    join public.sectors s on s.id = lg.sector_id
    where s.area_id = p_scope_id and lg.is_active;
  elsif p_level = 'district' then
    select array_agg(lg.id) into v_lg_ids
    from public.life_groups lg
    join public.sectors s on s.id = lg.sector_id
    join public.areas a   on a.id = s.area_id
    where a.district_id = p_scope_id and lg.is_active;
  elsif p_level = 'church' then
    select array_agg(id) into v_lg_ids
    from public.life_groups
    where church_id = p_scope_id and is_active;
  else
    raise exception 'invalid level: %', p_level;
  end if;

  if v_lg_ids is null or array_length(v_lg_ids, 1) is null then
    return query select p_level, p_scope_id, 0, 0, 0, 0::numeric, 0::numeric, 0::numeric, 0, 0, 0::numeric, 0::numeric;
    return;
  end if;

  return query
  with lg_inds as (
    select ind.* from unnest(v_lg_ids) as lg(id)
    cross join lateral public.get_lg_indicators(lg.id) ind
  )
  select
    p_level,
    p_scope_id,
    array_length(v_lg_ids, 1) as total_lgs,
    coalesce(sum(members_now), 0)::int,
    coalesce(sum(new_converts_90d), 0)::int,
    coalesce(avg(attendance_avg_last_4), 0)::numeric(10,1),
    coalesce(avg(growth_30d_pct), 0)::numeric(10,1),
    coalesce(avg(discipleship_rate_pct), 0)::numeric(10,1),
    coalesce(sum(decisions_90d), 0)::int,
    coalesce(sum(visits_made_90d), 0)::int,
    coalesce(avg(multiplication_pct), 0)::numeric(10,1),
    coalesce(avg(report_consistency_pct), 0)::numeric(10,1)
  from lg_inds;
end; $$;

grant execute on function public.get_aggregate_indicators(text, uuid) to authenticated;
