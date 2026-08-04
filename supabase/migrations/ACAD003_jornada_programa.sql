-- ============================================================
-- CEC Academy — completa a hierarquia: Escola → Jornada de
-- Formação → Programa → Curso → Módulo → Lição.
--
-- Retrocompatível: cursos já cadastrados continuam funcionando
-- direto vinculados à Escola (escola_id), sem Jornada/Programa —
-- programa_id é opcional. Só quem quiser organizar melhor usa os
-- níveis novos.
-- ============================================================

create table if not exists public.jornadas_formacao (
  id           uuid primary key default gen_random_uuid(),
  escola_id    uuid not null references public.escolas(id) on delete cascade,
  name         text not null,
  description  text,
  order_index  int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
alter table public.jornadas_formacao enable row level security;
drop policy if exists jornadas_read on public.jornadas_formacao;
create policy jornadas_read on public.jornadas_formacao for select to authenticated using (true);
drop policy if exists jornadas_write on public.jornadas_formacao;
create policy jornadas_write on public.jornadas_formacao for all to authenticated using (is_admin()) with check (is_admin());
grant select, insert, update, delete on public.jornadas_formacao to authenticated;

create table if not exists public.programas_formacao (
  id           uuid primary key default gen_random_uuid(),
  jornada_id   uuid not null references public.jornadas_formacao(id) on delete cascade,
  name         text not null,
  description  text,
  order_index  int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
alter table public.programas_formacao enable row level security;
drop policy if exists programas_read on public.programas_formacao;
create policy programas_read on public.programas_formacao for select to authenticated using (true);
drop policy if exists programas_write on public.programas_formacao;
create policy programas_write on public.programas_formacao for all to authenticated using (is_admin()) with check (is_admin());
grant select, insert, update, delete on public.programas_formacao to authenticated;

alter table public.courses add column if not exists programa_id uuid references public.programas_formacao(id);

-- ============================================================
-- Árvore completa de uma Escola (Jornadas → Programas → Cursos),
-- já incluindo os cursos "soltos" (sem jornada/programa) direto na
-- raiz da Escola — pra tela de admin/aluno montar tudo numa
-- chamada só.
-- ============================================================
create or replace function public.get_escola_tree(p_escola_id uuid)
returns table (
  jornada_id uuid, jornada_name text, jornada_order int,
  programa_id uuid, programa_name text, programa_order int,
  course_id uuid, course_name text, course_description text
)
language sql stable security definer set search_path = public as $$
  select j.id, j.name, j.order_index, p.id, p.name, p.order_index, c.id, c.name, c.description
  from public.jornadas_formacao j
  left join public.programas_formacao p on p.jornada_id = j.id and p.is_active
  left join public.courses c on c.programa_id = p.id and c.is_active
  where j.escola_id = p_escola_id and j.is_active
  order by j.order_index, p.order_index, c.name;
$$;
grant execute on function public.get_escola_tree(uuid) to authenticated;
