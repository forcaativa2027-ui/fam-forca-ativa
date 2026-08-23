-- ============================================================
-- CEC Academy — Bloco 7 (Acompanhamento): Tutor, Avaliações e
-- Certificações. Diário de Formação e Jornada já existiam
-- (construídos antes) — aqui completamos o resto do bloco.
-- ============================================================

-- ---------- Tutor (acompanha dúvidas e progresso de um curso específico) ----------
alter table public.courses add column if not exists tutor_id uuid references public.profiles(id);

-- Lista os cursos em que o profile informado é tutor, com contagem de
-- alunos matriculados e quantos já concluíram (via lesson_progress).
create or replace function public.list_my_tutoring_courses(p_profile_id uuid)
returns table (course_id uuid, course_name text, total_alunos int, alunos_concluidos int)
language sql stable security definer set search_path = public as $$
  select
    c.id, c.name,
    count(distinct lp.profile_id)::int as total_alunos,
    count(distinct lp.profile_id) filter (
      where not exists (
        select 1 from public.course_lessons l2
        join public.course_modules m2 on m2.id = l2.module_id
        where m2.course_id = c.id
          and not exists (
            select 1 from public.lesson_progress lp2
            where lp2.lesson_id = l2.id and lp2.profile_id = lp.profile_id and lp2.status = 'concluida'
          )
      )
    )::int as alunos_concluidos
  from public.courses c
  join public.course_modules m on m.course_id = c.id
  join public.course_lessons l on l.module_id = m.id
  join public.lesson_progress lp on lp.lesson_id = l.id
  where c.tutor_id = p_profile_id
  group by c.id, c.name;
$$;
grant execute on function public.list_my_tutoring_courses(uuid) to authenticated;

-- ---------- Avaliações (perguntas de múltipla escolha por lição) ----------
create table if not exists public.lesson_assessments (
  id             uuid primary key default gen_random_uuid(),
  lesson_id      uuid not null references public.course_lessons(id) on delete cascade,
  question       text not null,
  options        jsonb not null,        -- array de strings, ex: ["Opção A","Opção B","Opção C"]
  correct_index  int not null,          -- índice (0-based) da opção correta
  order_index    int not null default 0,
  created_at     timestamptz not null default now()
);
alter table public.lesson_assessments enable row level security;
drop policy if exists lesson_assessments_read on public.lesson_assessments;
create policy lesson_assessments_read on public.lesson_assessments for select to authenticated using (true);
drop policy if exists lesson_assessments_write on public.lesson_assessments;
create policy lesson_assessments_write on public.lesson_assessments for all to authenticated using (is_admin()) with check (is_admin());
grant select, insert, update, delete on public.lesson_assessments to authenticated;

create table if not exists public.assessment_attempts (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  assessment_id   uuid not null references public.lesson_assessments(id) on delete cascade,
  selected_index  int not null,
  is_correct      boolean not null,
  created_at      timestamptz not null default now(),
  unique (profile_id, assessment_id)
);
alter table public.assessment_attempts enable row level security;
drop policy if exists assessment_attempts_own on public.assessment_attempts;
create policy assessment_attempts_own on public.assessment_attempts for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
grant select, insert, update, delete on public.assessment_attempts to authenticated;

-- ---------- Certificações (emitidas automaticamente ao concluir um curso inteiro) ----------
create table if not exists public.course_certificates (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  course_id         uuid not null references public.courses(id) on delete cascade,
  certificate_code  text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  issued_at         timestamptz not null default now(),
  issued_by         uuid references public.profiles(id),
  unique (profile_id, course_id)
);
alter table public.course_certificates enable row level security;
drop policy if exists course_certificates_read on public.course_certificates;
create policy course_certificates_read on public.course_certificates for select to authenticated
  using (profile_id = auth.uid() or is_admin());
drop policy if exists course_certificates_insert on public.course_certificates;
create policy course_certificates_insert on public.course_certificates for insert to authenticated
  with check (profile_id = auth.uid() or is_admin());
grant select, insert on public.course_certificates to authenticated;

-- Verifica se todas as lições de um curso já foram concluídas por um aluno —
-- se sim, emite o certificado automaticamente (idempotente) e devolve o código.
create or replace function public.maybe_issue_certificate(p_course_id uuid, p_profile_id uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_total int; v_done int; v_code text;
begin
  select count(*) into v_total
  from public.course_lessons l
  join public.course_modules m on m.id = l.module_id
  where m.course_id = p_course_id;

  if v_total = 0 then return null; end if;

  select count(*) into v_done
  from public.lesson_progress lp
  join public.course_lessons l on l.id = lp.lesson_id
  join public.course_modules m on m.id = l.module_id
  where m.course_id = p_course_id and lp.profile_id = p_profile_id and lp.status = 'concluida';

  if v_done < v_total then return null; end if;

  insert into public.course_certificates (profile_id, course_id)
  values (p_profile_id, p_course_id)
  on conflict (profile_id, course_id) do nothing;

  select certificate_code into v_code from public.course_certificates
  where profile_id = p_profile_id and course_id = p_course_id;

  return v_code;
end; $$;
grant execute on function public.maybe_issue_certificate(uuid, uuid) to authenticated;
