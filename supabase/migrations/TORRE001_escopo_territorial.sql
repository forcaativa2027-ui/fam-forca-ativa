-- ============================================================
-- CEC FAMILY — Torre de Controle: escopo territorial
--
-- Problema: control_tower_alerts não respeitava abrangência —
-- qualquer usuário logado via TODOS os alertas nacionais, mesmo
-- um supervisor de Setor ou pastor de uma única igreja. Isso fazia
-- a tela parecer "genérica" em vez de mostrar o que é relevante
-- pra cada responsabilidade.
--
-- Correção: envolve a view original (preservada 100%) numa consulta
-- externa que filtra por accessible_church_ids(), igual todo o resto
-- do sistema já faz. Alertas nacionais (meta_atrasada, sem igreja
-- associada) só aparecem pra quem tem escopo Nacional/Apóstolo.
-- Idempotente.
-- ============================================================

create or replace function public.can_see_national_alerts()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role = 'apostolo' or scope_level = 'nacional' or (scope_level is null and church_id is null)
     from public.profiles where id = auth.uid()),
    false
  );
$$;
grant execute on function public.can_see_national_alerts() to authenticated;

drop view if exists public.control_tower_alerts cascade;
create view public.control_tower_alerts as
select * from (

  -- CATEGORIA 1: LGs sem relatório recente (> 14 dias)
  select
    'sem_relatorio'                          as alert_type,
    'critico'                                as severity,
    '📋 Sem Relatório'                       as category,
    lg.id                                    as lg_id,
    lg.name                                  as lg_name,
    lg.church_id,
    c.name                                   as church_name,
    case
      when max(mr.meeting_date) is null then 'Nunca reportou'
      else 'Último relatório há ' || (current_date - max(mr.meeting_date))::text || ' dias'
    end                                      as detail,
    case
      when max(mr.meeting_date) is null then 999
      else (current_date - max(mr.meeting_date))::int
    end                                      as severity_score,
    current_date                             as alert_date
  from public.life_groups lg
  left join public.meeting_reports mr on mr.life_group_id = lg.id
  left join public.churches c on c.id = lg.church_id
  where lg.is_active
  group by lg.id, lg.name, lg.church_id, c.name
  having max(mr.meeting_date) is null
      or max(mr.meeting_date) < current_date - 14

  union all

  -- CATEGORIA 2: LGs com necessidade de oração urgente (últimos 30 dias)
  select
    'oracao_urgente'                         as alert_type,
    'critico'                                as severity,
    '🆘 Oração Urgente'                      as category,
    lg.id                                    as lg_id,
    lg.name                                  as lg_name,
    lg.church_id,
    c.name                                   as church_name,
    count(*)::text || ' relato(s) com pedido urgente'  as detail,
    count(*)::int * 10                       as severity_score,
    max(mr.meeting_date)                     as alert_date
  from public.meeting_reports mr
  join public.life_groups lg on lg.id = mr.life_group_id
  left join public.churches c on c.id = lg.church_id
  where mr.nec_oracao_urgente = true
    and mr.meeting_date >= current_date - 30
    and lg.is_active
  group by lg.id, lg.name, lg.church_id, c.name

  union all

  -- CATEGORIA 3: LGs com necessidade de visita pastoral (últimos 30 dias)
  select
    'visita_pastoral'                        as alert_type,
    'atencao'                                as severity,
    '🏠 Visita Pastoral'                     as category,
    lg.id                                    as lg_id,
    lg.name                                  as lg_name,
    lg.church_id,
    c.name                                   as church_name,
    count(*)::text || ' relato(s) solicitando visita'  as detail,
    count(*)::int * 5                        as severity_score,
    max(mr.meeting_date)                     as alert_date
  from public.meeting_reports mr
  join public.life_groups lg on lg.id = mr.life_group_id
  left join public.churches c on c.id = lg.church_id
  where mr.nec_visita_pastoral = true
    and mr.meeting_date >= current_date - 30
    and lg.is_active
  group by lg.id, lg.name, lg.church_id, c.name

  union all

  -- CATEGORIA 4: LGs críticos no Score Ministerial (score < 30)
  select
    'score_critico'                          as alert_type,
    'critico'                                as severity,
    '🔴 Score Crítico'                       as category,
    s.id                                     as lg_id,
    s.name                                   as lg_name,
    s.church_id,
    c.name                                   as church_name,
    'Score ministerial: ' || s.score_total::text || '/100'  as detail,
    (100 - s.score_total)                    as severity_score,
    current_date                             as alert_date
  from public.lg_score_ministerial s
  left join public.churches c on c.id = s.church_id
  where s.health_band = 'critico'
    and s.score_total < 30

  union all

  -- CATEGORIA 5: LGs sem membros cadastrados
  select
    'sem_membros'                            as alert_type,
    'atencao'                                as severity,
    '👥 Sem Membros'                         as category,
    lg.id                                    as lg_id,
    lg.name                                  as lg_name,
    lg.church_id,
    c.name                                   as church_name,
    'Nenhum membro ativo cadastrado'         as detail,
    50                                       as severity_score,
    current_date                             as alert_date
  from public.life_groups lg
  left join public.churches c on c.id = lg.church_id
  left join (
    select life_group_id, count(*) as total
    from public.members
    where status = 'ativo'
    group by life_group_id
  ) m on m.life_group_id = lg.id
  where lg.is_active
    and coalesce(m.total, 0) = 0

  union all

  -- CATEGORIA 6: Metas em atraso (< 70% do target no último trimestre do ano) — nacional
  select
    'meta_atrasada'                          as alert_type,
    'atencao'                                as severity,
    '🎯 Meta em Atraso'                      as category,
    null::uuid                               as lg_id,
    'Nacional'                               as lg_name,
    null::uuid                               as church_id,
    'Nacional'                               as church_name,
    g.indicator || ': ' || coalesce(gva.pct_atingido::text,'0') || '% atingido (meta: ' || g.target_value::int::text || ')'  as detail,
    (100 - coalesce(gva.pct_atingido, 0))::int  as severity_score,
    current_date                             as alert_date
  from public.ministry_goals g
  left join public.goals_vs_actual gva on gva.id = g.id
  where g.year = extract(year from current_date)::int
    and g.scope = 'nacional'
    and coalesce(gva.pct_atingido, 0) < 70
    and extract(month from current_date) >= 9

) t
-- ESCOPO: só mostra o que está na abrangência do usuário logado.
-- Alertas nacionais (church_id null) só aparecem pra quem tem escopo Nacional/Apóstolo.
where t.church_id in (select public.accessible_church_ids())
   or (t.church_id is null and public.can_see_national_alerts())
order by severity_score desc, alert_type;

comment on view public.control_tower_alerts is
  'Torre de Controle: alertas críticos consolidados, escopados pela abrangência de quem consulta.';

grant select on public.control_tower_alerts to authenticated;

-- Recriada porque o CASCADE do drop acima a derruba junto (ela depende de control_tower_alerts)
create view public.control_tower_summary as
select
  count(*) filter (where severity = 'critico')::int    as total_criticos,
  count(*) filter (where severity = 'atencao')::int    as total_atencao,
  count(*)::int                                         as total_alertas,
  count(*) filter (where alert_type = 'sem_relatorio')::int   as alertas_sem_relatorio,
  count(*) filter (where alert_type = 'oracao_urgente')::int  as alertas_oracao_urgente,
  count(*) filter (where alert_type = 'visita_pastoral')::int as alertas_visita_pastoral,
  count(*) filter (where alert_type = 'score_critico')::int   as alertas_score_critico,
  count(*) filter (where alert_type = 'sem_membros')::int     as alertas_sem_membros,
  count(*) filter (where alert_type = 'meta_atrasada')::int   as alertas_meta_atrasada,
  count(distinct lg_id) filter (where lg_id is not null)::int as lgs_afetados,
  count(distinct church_id) filter (where church_id is not null)::int as igrejas_afetadas
from public.control_tower_alerts;

comment on view public.control_tower_summary is
  'Resumo executivo da Torre de Controle, já escopado pela abrangência de quem consulta.';

grant select on public.control_tower_summary to authenticated;
