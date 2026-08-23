-- ============================================================
-- Relatório Consolidado por Área (demanda nova, item 3). Reúne,
-- pra um mês/semana, todos os Life Groups de uma Área — agrupados
-- por Setor no front-end — com os indicadores da planilha modelo
-- enviada. Colunas que não existem no sistema ainda (Tadel, D.M,
-- Auxiliar Principal resolvido, Super visão, EMP) aparecem como
-- "—" em vez de inventar dado.
-- ============================================================

create or replace function public.relatorio_area_consolidado(p_area_id uuid, p_month int, p_year int)
returns table (
  sector_id uuid, sector_name text,
  lg_id uuid, bairro text, lider_nome text, lider_fone text,
  auxiliar_nome text, dia_semana text, membros int,
  discipuladores int, mda_semanal int, cc int, cel int,
  pct_mda numeric, ge boolean, visitantes int,
  oferta_pix numeric, oferta_especie numeric, total_presencas int, kg_amor numeric,
  relatorio_enviado boolean
)
language sql stable security definer set search_path = public as $$
  select
    c.sector_id, ca.sector_name,
    c.id, c.neighborhood, lm.full_name, lm.phone,
    am.full_name,
    c.meeting_weekday::text,
    (select count(*)::int from public.members m where m.life_group_id = c.id and m.status = 'ativo'),
    coalesce(mr.members_with_disciplers, 0),
    coalesce(mr.attendance_count, 0),
    coalesce(mr.cc_count, 0), coalesce(mr.cel_count, 0),
    case when coalesce(mr.attendance_count,0) = 0 then 0
      else round(coalesce(mr.attendance_count,0)::numeric / nullif((select count(*) from public.members m where m.life_group_id = c.id and m.status='ativo'),0) * 100, 0)
    end,
    coalesce(mr.ge_happened, false),
    coalesce(mr.visitors_count, 0),
    coalesce(mr.oferta_pix, 0), coalesce(mr.oferta_especie, 0),
    coalesce(mr.total_present, mr.attendance_count, 0), coalesce(mr.kg_amor, 0),
    (mr.id is not null)
  from public.life_groups c
  join public.church_ancestry ca on ca.church_id = c.church_id
  left join public.members lm on lm.id = c.leader_id
  left join public.members am on am.id = c.host_assistant_id
  left join lateral (
    select * from public.meeting_reports r
    where r.life_group_id = c.id
      and extract(month from r.meeting_date) = p_month
      and extract(year from r.meeting_date) = p_year
    order by r.meeting_date desc
    limit 1
  ) mr on true
  where ca.district_id = p_area_id and c.is_active
  order by ca.sector_name, c.neighborhood;
$$;
grant execute on function public.relatorio_area_consolidado(uuid, int, int) to authenticated;

-- ============================================================
-- Lista de áreas (distritos) acessíveis pro seletor da tela
-- ============================================================
create or replace function public.list_accessible_areas()
returns table (area_id uuid, area_name text, sector_id uuid, sector_name text)
language sql stable security definer set search_path = public as $$
  select distinct ca.district_id, ca.district_name, ca.sector_id, ca.sector_name
  from public.church_ancestry ca
  where ca.church_id in (select public.accessible_church_ids()) and ca.district_id is not null
  order by ca.district_name;
$$;
grant execute on function public.list_accessible_areas() to authenticated;
