-- FAM041 — Núcleo independente da Escola de Direitos e Deveres
-- Use esta migration quando a base Academy ampla da plataforma ainda não foi instalada.
-- Não executa C13c, não depende de accessible_church_ids() e não toca em meeting_reports.

create extension if not exists pgcrypto;

create table if not exists public.escolas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon_key text,
  order_index int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  church_id uuid,
  escola_id uuid references public.escolas(id) on delete set null,
  course_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.courses add column if not exists escola_id uuid references public.escolas(id) on delete set null;
alter table public.courses add column if not exists course_code text;
create unique index if not exists courses_course_code_uidx on public.courses(course_code) where course_code is not null;

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  description text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null,
  objective text,
  content_main text,
  bible_reference text,
  video_url text,
  audio_url text,
  content_reflexao text,
  content_oracao text,
  content_pratica text,
  content_compartilhar text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  status text not null default 'em_andamento' check (status in ('em_andamento','concluida')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (profile_id, lesson_id)
);

alter table public.escolas enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.course_lessons enable row level security;
alter table public.lesson_progress enable row level security;

drop policy if exists fam_study_escolas_read on public.escolas;
create policy fam_study_escolas_read on public.escolas for select to authenticated using (is_active);
drop policy if exists fam_study_courses_read on public.courses;
create policy fam_study_courses_read on public.courses for select to authenticated using (is_active);
drop policy if exists fam_study_modules_read on public.course_modules;
create policy fam_study_modules_read on public.course_modules for select to authenticated using (exists (select 1 from public.courses c where c.id = course_id and c.is_active));
drop policy if exists fam_study_lessons_read on public.course_lessons;
create policy fam_study_lessons_read on public.course_lessons for select to authenticated using (exists (select 1 from public.course_modules m join public.courses c on c.id = m.course_id where m.id = module_id and c.is_active));
drop policy if exists fam_study_progress_own on public.lesson_progress;
create policy fam_study_progress_own on public.lesson_progress for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

grant select on public.escolas, public.courses, public.course_modules, public.course_lessons to authenticated;
grant select, insert, update, delete on public.lesson_progress to authenticated;
