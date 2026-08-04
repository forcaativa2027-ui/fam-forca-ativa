-- ============================================================
-- CEC Academy — Bloco 1 (Fundamentos), base mínima da primeira
-- fase: Escola → Curso → Módulo → Lição, com progresso e
-- continuidade de onde o aluno parou.
--
-- Deixamos de fora por enquanto (fases seguintes, conforme o
-- próprio plano oficial da Academy): Jornada de Formação e
-- Programa (camadas entre Escola e Curso), Conhecimento
-- Integrado/Biblioteca (Blocos 2-3), Avaliações e Certificações
-- formais, IA. "category" em courses continua funcionando (não
-- quebra nada já construído) — escola_id é o caminho novo.
-- ============================================================

-- ---------- Escolas (agora tabela de verdade, não mais só uma tag) ----------
create table if not exists public.escolas (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,   -- ex: 'escola_biblica' — usado pra migrar os cursos já cadastrados
  description  text,
  icon_key     text,                    -- nome do ícone lucide-react, ex: 'BookOpen'
  order_index  int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.escolas enable row level security;
drop policy if exists escolas_read on public.escolas;
create policy escolas_read on public.escolas for select to authenticated using (true);
drop policy if exists escolas_write on public.escolas;
create policy escolas_write on public.escolas for all to authenticated using (is_admin()) with check (is_admin());
grant select, insert, update, delete on public.escolas to authenticated;

-- Semeia as 7 escolas já usadas no sistema (mesmos slugs que o app já usava como category)
insert into public.escolas (name, slug, icon_key, order_index) values
  ('Formação Inicial',    'formacao_inicial',    'Sparkles',  1),
  ('Escola Bíblica',      'escola_biblica',      'BookOpen',  2),
  ('Escola Teológica',    'escola_teologica',    'Landmark',  3),
  ('Escola Ministerial',  'escola_ministerial',  'Briefcase', 4),
  ('Escola da Família',   'escola_familia',      'Heart',     5),
  ('Escola de Missões',   'escola_missoes',      'Globe2',    6)
on conflict (slug) do nothing;

-- Liga courses.category (texto livre) na escola de verdade
alter table public.courses add column if not exists escola_id uuid references public.escolas(id);
update public.courses c set escola_id = e.id
  from public.escolas e
  where c.escola_id is null and (
    c.category = e.slug
    or (c.category in ('formacao_basica') and e.slug = 'formacao_inicial')
    or (c.category in ('lideranca','ministerial') and e.slug = 'escola_ministerial')
  );

-- ---------- Módulos (dividem um curso em grandes unidades) ----------
create table if not exists public.course_modules (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  name         text not null,
  description  text,
  order_index  int not null default 0,
  created_at   timestamptz not null default now()
);
alter table public.course_modules enable row level security;
drop policy if exists course_modules_read on public.course_modules;
create policy course_modules_read on public.course_modules for select to authenticated using (true);
drop policy if exists course_modules_write on public.course_modules;
create policy course_modules_write on public.course_modules for all to authenticated using (is_admin()) with check (is_admin());
grant select, insert, update, delete on public.course_modules to authenticated;

-- ---------- Lições (unidade principal de aprendizagem) ----------
create table if not exists public.course_lessons (
  id                    uuid primary key default gen_random_uuid(),
  module_id             uuid not null references public.course_modules(id) on delete cascade,
  title                 text not null,
  objective             text,          -- objetivo da lição
  content_main          text,          -- conteúdo principal / texto-base
  bible_reference        text,          -- texto bíblico ou material-base
  video_url             text,
  audio_url             text,
  content_reflexao      text,          -- perguntas abertas
  content_oracao        text,          -- momento de oração
  content_pratica       text,          -- missão prática
  content_compartilhar  text,          -- discussão com discipulador/grupo
  order_index           int not null default 0,
  created_at            timestamptz not null default now()
);
alter table public.course_lessons enable row level security;
drop policy if exists course_lessons_read on public.course_lessons;
create policy course_lessons_read on public.course_lessons for select to authenticated using (true);
drop policy if exists course_lessons_write on public.course_lessons;
create policy course_lessons_write on public.course_lessons for all to authenticated using (is_admin()) with check (is_admin());
grant select, insert, update, delete on public.course_lessons to authenticated;

-- ---------- Progresso do aluno (continuidade de onde parou) ----------
create table if not exists public.lesson_progress (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  lesson_id     uuid not null references public.course_lessons(id) on delete cascade,
  status        text not null default 'em_andamento' check (status in ('em_andamento','concluida')),
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  unique (profile_id, lesson_id)
);
alter table public.lesson_progress enable row level security;
drop policy if exists lesson_progress_own on public.lesson_progress;
create policy lesson_progress_own on public.lesson_progress for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
grant select, insert, update, delete on public.lesson_progress to authenticated;

-- ============================================================
-- Listagem com progresso — pra tela do aluno saber o que já foi
-- feito e continuar de onde parou, sem N chamadas separadas.
-- ============================================================
create or replace function public.list_course_content(p_course_id uuid, p_profile_id uuid default null)
returns table (
  module_id uuid, module_name text, module_order int,
  lesson_id uuid, lesson_title text, lesson_order int,
  status text, completed_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    m.id, m.name, m.order_index,
    l.id, l.title, l.order_index,
    coalesce(lp.status, 'nao_iniciada'),
    lp.completed_at
  from public.course_modules m
  join public.course_lessons l on l.module_id = m.id
  left join public.lesson_progress lp on lp.lesson_id = l.id and lp.profile_id = p_profile_id
  where m.course_id = p_course_id
  order by m.order_index, l.order_index;
$$;
grant execute on function public.list_course_content(uuid, uuid) to authenticated;
