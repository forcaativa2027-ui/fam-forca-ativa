-- ============================================================
-- CEC FAMILY — UX-003 Cap. 6 §6.59: Mapa de Relacionamentos.
-- Sobe a cadeia de discipulado (quem discipula quem discipula...)
-- a partir de um membro, até o topo (ou 10 níveis, o que vier
-- primeiro — evita loop infinito em caso de dado inconsistente).
-- ============================================================

create or replace function public.discipleship_chain_up(p_member_id uuid)
returns table (level int, member_id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  with recursive chain as (
    select 1 as level, d.discipler_id as member_id
    from public.discipleship d
    where d.disciple_id = p_member_id and d.status = 'ativo'

    union all

    select c.level + 1, d.discipler_id
    from chain c
    join public.discipleship d on d.disciple_id = c.member_id and d.status = 'ativo'
    where c.level < 10
  )
  select c.level, c.member_id, m.full_name
  from chain c
  join public.members m on m.id = c.member_id
  order by c.level desc;
$$;
grant execute on function public.discipleship_chain_up(uuid) to authenticated;
