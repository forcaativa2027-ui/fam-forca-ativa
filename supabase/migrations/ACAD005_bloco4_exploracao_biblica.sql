-- ============================================================
-- CEC Academy — Bloco 4 (Exploração Inteligente do Conhecimento
-- Bíblico). Versão prática da "primeira fase": um sistema único de
-- Pontos de Conhecimento (Lugares, História/Cultura, Linha do
-- Tempo, Arqueologia, Personagens), com relacionamentos entre eles
-- e histórico de navegação — sem depender da Biblioteca completa
-- (Blocos 2-3), que ainda não foi construída.
-- ============================================================

create table if not exists public.knowledge_points (
  id           uuid primary key default gen_random_uuid(),
  category     text not null check (category in ('lugar','historia_cultura','linha_tempo','arqueologia','personagem')),
  title        text not null,
  subtitle     text,                 -- ex: "Rei de Israel", "Cidade da Judeia", "1050-931 a.C."
  description  text,
  image_url    text,
  period_label text,                 -- período/data aproximada em texto livre (ex: "Séc. VIII a.C.")
  latitude     numeric,               -- só relevante pra 'lugar'
  longitude    numeric,
  bible_refs   text,                  -- referências bíblicas relacionadas, texto livre (ex: "1 Samuel 17; Salmos 23")
  order_index  int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
alter table public.knowledge_points enable row level security;
drop policy if exists knowledge_points_read on public.knowledge_points;
create policy knowledge_points_read on public.knowledge_points for select to authenticated using (true);
drop policy if exists knowledge_points_write on public.knowledge_points;
create policy knowledge_points_write on public.knowledge_points for all to authenticated using (is_admin()) with check (is_admin());
grant select, insert, update, delete on public.knowledge_points to authenticated;

-- Relacionamentos entre Pontos de Conhecimento (ex: Davi ↔ Belém ↔ Reino Unido de Israel)
create table if not exists public.knowledge_point_relations (
  id          uuid primary key default gen_random_uuid(),
  from_id     uuid not null references public.knowledge_points(id) on delete cascade,
  to_id       uuid not null references public.knowledge_points(id) on delete cascade,
  created_at  timestamptz not null default now(),
  check (from_id <> to_id),
  unique (from_id, to_id)
);
alter table public.knowledge_point_relations enable row level security;
drop policy if exists kp_relations_read on public.knowledge_point_relations;
create policy kp_relations_read on public.knowledge_point_relations for select to authenticated using (true);
drop policy if exists kp_relations_write on public.knowledge_point_relations;
create policy kp_relations_write on public.knowledge_point_relations for all to authenticated using (is_admin()) with check (is_admin());
grant select, insert, update, delete on public.knowledge_point_relations to authenticated;

-- Vínculo opcional entre uma Lição e Pontos de Conhecimento relacionados
-- (ex: a lição sobre João 3 sugere explorar "Nicodemos" e "Jerusalém")
create table if not exists public.lesson_knowledge_points (
  lesson_id           uuid not null references public.course_lessons(id) on delete cascade,
  knowledge_point_id  uuid not null references public.knowledge_points(id) on delete cascade,
  primary key (lesson_id, knowledge_point_id)
);
alter table public.lesson_knowledge_points enable row level security;
drop policy if exists lesson_kp_read on public.lesson_knowledge_points;
create policy lesson_kp_read on public.lesson_knowledge_points for select to authenticated using (true);
drop policy if exists lesson_kp_write on public.lesson_knowledge_points;
create policy lesson_kp_write on public.lesson_knowledge_points for all to authenticated using (is_admin()) with check (is_admin());
grant select, insert, update, delete on public.lesson_knowledge_points to authenticated;

-- Histórico de navegação — cada vez que o aluno abre um Ponto de Conhecimento
create table if not exists public.knowledge_point_views (
  id                  uuid primary key default gen_random_uuid(),
  profile_id          uuid not null references public.profiles(id) on delete cascade,
  knowledge_point_id  uuid not null references public.knowledge_points(id) on delete cascade,
  viewed_at           timestamptz not null default now()
);
alter table public.knowledge_point_views enable row level security;
drop policy if exists kp_views_own on public.knowledge_point_views;
create policy kp_views_own on public.knowledge_point_views for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
grant select, insert on public.knowledge_point_views to authenticated;

-- ============================================================
-- Um Ponto de Conhecimento com seus relacionados de uma vez
-- (evita N chamadas separadas pra montar a tela de exploração).
-- ============================================================
create or replace function public.get_knowledge_point_detail(p_id uuid)
returns table (
  id uuid, category text, title text, subtitle text, description text, image_url text,
  period_label text, latitude numeric, longitude numeric, bible_refs text,
  related_id uuid, related_category text, related_title text, related_image_url text
)
language sql stable security definer set search_path = public as $$
  select
    kp.id, kp.category, kp.title, kp.subtitle, kp.description, kp.image_url,
    kp.period_label, kp.latitude, kp.longitude, kp.bible_refs,
    r.id, r.category, r.title, r.image_url
  from public.knowledge_points kp
  left join public.knowledge_point_relations rel on rel.from_id = kp.id or rel.to_id = kp.id
  left join public.knowledge_points r on r.id = (case when rel.from_id = kp.id then rel.to_id else rel.from_id end)
  where kp.id = p_id;
$$;
grant execute on function public.get_knowledge_point_detail(uuid) to authenticated;
