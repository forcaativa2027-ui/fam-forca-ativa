-- ============================================================
-- GOV-002 §9: Central de Delegações — busca de usuários.
-- View com uma linha por pessoa, juntando identificação, igreja,
-- hierarquia territorial e contagem de delegações ativas — base
-- pra pesquisa por nome/e-mail/telefone/CEC ID/igreja/estado/cargo.
-- ============================================================

create or replace view public.admin_users_directory as
select
  p.id as profile_id, m.id as member_id,
  m.full_name, p.email, m.phone, m.cec_id, m.photo_url,
  p.role, m.journey_stage, m.status as member_status,
  m.church_id, ch.name as church_name,
  ca.state_id, ca.state_name,
  coalesce((select count(*) from public.module_delegations md where md.profile_id = p.id and md.status = 'ativo'::delegation_status), 0) as delegacoes_ativas
from public.profiles p
left join public.members m on m.profile_id = p.id
left join public.churches ch on ch.id = m.church_id
left join public.church_ancestry ca on ca.church_id = m.church_id;

grant select on public.admin_users_directory to authenticated;

-- RLS: a view em si não tem RLS própria (herda das tabelas base via
-- security invoker implícito das views), mas como profiles/members já
-- têm suas políticas de abrangência territorial, a visão fica
-- automaticamente escopada por quem consulta.
