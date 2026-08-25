-- ============================================================
-- CEC FAMILY — UX-003 Capítulo 4 Parte 5: Pesquisa Global
-- Inteligente. Busca unificada por Pessoas, Igrejas e Life Groups
-- numa única caixa, respeitando a abrangência territorial de quem
-- pesquisa (accessible_church_ids).
--
-- Escopo desta primeira versão: Pessoas, Igrejas, Life Groups —
-- os tipos de registro que já existem de forma estruturada no
-- sistema. Documentos/Cursos/Turmas ainda não existem como módulos
-- próprios, então ficam fora por enquanto.
-- ============================================================

create or replace function public.global_search(p_query text)
returns table (
  result_type text, id uuid, title text, subtitle text, extra text
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_q text := '%' || trim(p_query) || '%';
begin
  if length(trim(p_query)) < 2 then return; end if;

  return query
  -- Pessoas
  (select
    'membro'::text, m.id, m.full_name,
    coalesce(ch.name, 'Sem igreja'),
    coalesce(m.phone, m.email, m.cec_id, '')
  from public.members m
  left join public.churches ch on ch.id = m.church_id
  where (m.church_id is null or m.church_id in (select public.accessible_church_ids()))
    and (
      m.full_name ilike v_q or m.email ilike v_q or m.phone ilike v_q
      or m.cpf ilike v_q or m.cec_id ilike v_q
    )
  limit 15)

  union all

  -- Igrejas
  (select
    'igreja'::text, c.id, c.name,
    coalesce(c.city, ''), coalesce(c.state, '')
  from public.churches c
  where c.id in (select public.accessible_church_ids())
    and c.name ilike v_q
  limit 10)

  union all

  -- Life Groups
  (select
    'life_group'::text, lg.id, lg.name,
    coalesce(ch.name, 'Sem igreja'),
    coalesce(p.full_name, 'Sem líder')
  from public.life_groups lg
  left join public.churches ch on ch.id = lg.church_id
  left join public.profiles p on p.id = lg.leader_id
  where (lg.church_id is null or lg.church_id in (select public.accessible_church_ids()))
    and lg.name ilike v_q
  limit 10);
end; $$;
grant execute on function public.global_search(text) to authenticated;
