-- ============================================================
-- CEC FAMILY — UX-003 Cap. 3/6: Módulo de Formação (Cursos,
-- Turmas e Matrículas). Não existia nada disso no sistema — só o
-- conceito citado no documento (Encontro com Deus, Pós-Encontro,
-- CTL, Escola de Líderes, TADEL, Cursos, Certificações).
-- ============================================================

do $$ begin
  create type enrollment_status as enum ('matriculado','cursando','concluido','desistente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type class_status as enum ('planejada','em_andamento','concluida','cancelada');
exception when duplicate_object then null; end $$;

-- ---------- Cursos (o "catálogo" — Encontro com Deus, CTL, etc.) ----------
create table if not exists public.courses (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  category     text,              -- ex: 'formacao_basica', 'lideranca', 'ministerial'
  church_id    uuid references public.churches(id) on delete cascade,  -- null = curso padrão/nacional
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.courses enable row level security;
drop policy if exists courses_read on public.courses;
create policy courses_read on public.courses for select to authenticated
  using (church_id is null or church_id in (select public.accessible_church_ids()));
drop policy if exists courses_write on public.courses;
create policy courses_write on public.courses for all to authenticated
  using (is_admin() and (church_id is null or church_id in (select public.accessible_church_ids())))
  with check (is_admin() and (church_id is null or church_id in (select public.accessible_church_ids())));
grant select, insert, update, delete on public.courses to authenticated;

-- ---------- Turmas (uma edição específica de um curso) ----------
create table if not exists public.course_classes (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  church_id    uuid references public.churches(id) on delete cascade,
  name         text not null,               -- ex: "Turma Jan/2026"
  instructor_id uuid references public.profiles(id) on delete set null,
  location     text,
  start_date   date,
  end_date     date,
  max_vagas    int,
  status       class_status not null default 'planejada',
  created_at   timestamptz not null default now()
);

create index if not exists idx_course_classes_course on public.course_classes(course_id);

alter table public.course_classes enable row level security;
drop policy if exists course_classes_read on public.course_classes;
create policy course_classes_read on public.course_classes for select to authenticated
  using (church_id is null or church_id in (select public.accessible_church_ids()));
drop policy if exists course_classes_write on public.course_classes;
create policy course_classes_write on public.course_classes for all to authenticated
  using (is_admin() and (church_id is null or church_id in (select public.accessible_church_ids())))
  with check (is_admin() and (church_id is null or church_id in (select public.accessible_church_ids())));
grant select, insert, update, delete on public.course_classes to authenticated;

-- ---------- Matrículas ----------
create table if not exists public.course_enrollments (
  id              uuid primary key default gen_random_uuid(),
  class_id        uuid not null references public.course_classes(id) on delete cascade,
  member_id       uuid not null references public.members(id) on delete cascade,
  status          enrollment_status not null default 'matriculado',
  enrolled_at     timestamptz not null default now(),
  completed_at    timestamptz,
  certificate_issued boolean not null default false,
  notes           text,
  unique (class_id, member_id)
);

create index if not exists idx_course_enrollments_class on public.course_enrollments(class_id);
create index if not exists idx_course_enrollments_member on public.course_enrollments(member_id);

alter table public.course_enrollments enable row level security;
drop policy if exists course_enrollments_read on public.course_enrollments;
create policy course_enrollments_read on public.course_enrollments for select to authenticated
  using (
    exists (select 1 from public.course_classes cc where cc.id = class_id
            and (cc.church_id is null or cc.church_id in (select public.accessible_church_ids())))
  );
drop policy if exists course_enrollments_write on public.course_enrollments;
create policy course_enrollments_write on public.course_enrollments for all to authenticated
  using (
    is_admin() and exists (select 1 from public.course_classes cc where cc.id = class_id
      and (cc.church_id is null or cc.church_id in (select public.accessible_church_ids())))
  )
  with check (
    is_admin() and exists (select 1 from public.course_classes cc where cc.id = class_id
      and (cc.church_id is null or cc.church_id in (select public.accessible_church_ids())))
  );
grant select, insert, update, delete on public.course_enrollments to authenticated;

-- ---------- View com nomes resolvidos ----------
create or replace view public.course_enrollments_view as
select
  ce.id, ce.class_id, ce.member_id, ce.status, ce.enrolled_at, ce.completed_at, ce.certificate_issued, ce.notes,
  m.full_name as member_name,
  cc.name as class_name, cc.status as class_status, cc.start_date, cc.end_date,
  co.name as course_name, co.category as course_category
from public.course_enrollments ce
join public.members m on m.id = ce.member_id
join public.course_classes cc on cc.id = ce.class_id
join public.courses co on co.id = cc.course_id;

grant select on public.course_enrollments_view to authenticated;

-- ---------- Indicadores agregados pro Dashboard ----------
create or replace function public.dashboard_formacao_scoped(p_church_id uuid default null)
returns table (
  total_cursos int, total_turmas_ativas int,
  total_matriculados int, total_concluintes_90d int
)
language sql stable security definer set search_path = public as $$
  select
    (select count(*)::int from public.courses c where c.is_active
       and (c.church_id is null or (p_church_id is not null and c.church_id = p_church_id)
            or (p_church_id is null and c.church_id in (select public.accessible_church_ids())))),
    (select count(*)::int from public.course_classes cc where cc.status = 'em_andamento'
       and (cc.church_id is null or (p_church_id is not null and cc.church_id = p_church_id)
            or (p_church_id is null and cc.church_id in (select public.accessible_church_ids())))),
    (select count(*)::int from public.course_enrollments ce
       join public.course_classes cc on cc.id = ce.class_id
       where ce.status in ('matriculado','cursando')
         and (cc.church_id is null or (p_church_id is not null and cc.church_id = p_church_id)
              or (p_church_id is null and cc.church_id in (select public.accessible_church_ids())))),
    (select count(*)::int from public.course_enrollments ce
       join public.course_classes cc on cc.id = ce.class_id
       where ce.status = 'concluido' and ce.completed_at > now() - interval '90 days'
         and (cc.church_id is null or (p_church_id is not null and cc.church_id = p_church_id)
              or (p_church_id is null and cc.church_id in (select public.accessible_church_ids()))));
$$;
grant execute on function public.dashboard_formacao_scoped(uuid) to authenticated;
