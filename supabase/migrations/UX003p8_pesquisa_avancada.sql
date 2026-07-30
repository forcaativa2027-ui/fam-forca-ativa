-- ============================================================
-- UX-003 Cap. 4 Parte 8 — Pesquisa Corporativa Avançada.
-- Estende a view admin_users_directory (criada pra Central de
-- Delegações, GOV009) com mais campos de hierarquia e data de
-- ingresso, pra dar suporte a filtros mais ricos além do Ctrl+K.
-- ============================================================

drop view if exists public.admin_users_directory cascade;

create or replace view public.admin_users_directory as
select
  p.id as profile_id, m.id as member_id,
  m.full_name, p.email, m.phone, m.cec_id, m.photo_url,
  p.role, m.journey_stage, m.status as member_status, m.joined_at,
  m.church_id, ch.name as church_name,
  m.life_group_id, lg.name as life_group_name,
  ca.state_id, ca.state_name,
  ca.district_id, ca.district_name,
  ca.sector_id, ca.sector_name,
  coalesce((select count(*) from public.module_delegations md where md.profile_id = p.id and md.status = 'ativo'::delegation_status), 0) as delegacoes_ativas
from public.profiles p
left join public.members m on m.profile_id = p.id
left join public.churches ch on ch.id = m.church_id
left join public.life_groups lg on lg.id = m.life_group_id
left join public.church_ancestry ca on ca.church_id = m.church_id;

grant select on public.admin_users_directory to authenticated;
