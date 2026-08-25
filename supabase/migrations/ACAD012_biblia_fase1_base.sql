-- ============================================================
-- CEC Academy — Bíblia Integrada, Fase 1 (Rodada 1: Base).
-- Ajusta destaques/anotações pra suportar intervalos de
-- versículos (ex: João 3:16-18), e adiciona Salvos e Histórico
-- Recente — as duas peças de persistência que faltavam,
-- conforme o modelo de dados do ACA-BIB-03/06.
--
-- Reaproveita 100% do que já existia (bible_highlights,
-- bible_annotations, bible_reading_progress) — nenhuma tabela
-- nova de conteúdo bíblico, só extensão de dados pessoais.
-- ============================================================

-- ---------- Destaques: verse → verse_start + verse_end ----------
alter table public.bible_highlights rename column verse to verse_start;
alter table public.bible_highlights add column if not exists verse_end int;
update public.bible_highlights set verse_end = verse_start where verse_end is null;
alter table public.bible_highlights alter column verse_end set not null;
alter table public.bible_highlights add constraint bible_highlights_range_check check (verse_end >= verse_start);

-- troca a unicidade antiga (por versículo único) pela nova (por intervalo)
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.bible_highlights'::regclass and contype = 'u'
  loop
    execute format('alter table public.bible_highlights drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.bible_highlights add constraint bible_highlights_unique
  unique (profile_id, version, book_abbrev, chapter, verse_start, verse_end);

-- ---------- Anotações: verse → verse_start + verse_end ----------
alter table public.bible_annotations rename column verse to verse_start;
alter table public.bible_annotations add column if not exists verse_end int;
update public.bible_annotations set verse_end = verse_start where verse_end is null;
alter table public.bible_annotations alter column verse_end set not null;
alter table public.bible_annotations add constraint bible_annotations_range_check check (verse_end >= verse_start);
alter table public.bible_annotations add constraint bible_annotations_content_check check (length(trim(note_text)) > 0);

-- ============================================================
-- Versículos Salvos (Bookmarks) — não existia ainda.
-- ============================================================
create table if not exists public.bible_bookmarks (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  version     text not null default 'acf',
  book_abbrev text not null,
  chapter     int not null check (chapter > 0),
  verse_start int not null check (verse_start > 0),
  verse_end   int not null,
  created_at  timestamptz not null default now(),
  check (verse_end >= verse_start),
  unique (profile_id, version, book_abbrev, chapter, verse_start, verse_end)
);
alter table public.bible_bookmarks enable row level security;
drop policy if exists bbk_own on public.bible_bookmarks;
create policy bbk_own on public.bible_bookmarks for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
grant select, insert, delete on public.bible_bookmarks to authenticated;

-- ============================================================
-- Histórico Recente — últimos capítulos abertos (distinto da
-- "posição de leitura", que guarda só o ÚLTIMO ponto; aqui
-- guardamos uma lista curta dos mais recentes).
-- ============================================================
create table if not exists public.bible_recent_reads (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  version     text not null default 'acf',
  book_abbrev text not null,
  chapter     int not null,
  opened_at   timestamptz not null default now(),
  unique (profile_id, version, book_abbrev, chapter)
);
alter table public.bible_recent_reads enable row level security;
drop policy if exists brr_own on public.bible_recent_reads;
create policy brr_own on public.bible_recent_reads for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
grant select, insert, update, delete on public.bible_recent_reads to authenticated;

-- ---------- Modo de leitura (Leitura/Estudo/Devocional) na posição já existente ----------
alter table public.bible_reading_progress add column if not exists reading_mode text not null default 'reading'
  check (reading_mode in ('reading','study','devotional'));

-- ============================================================
-- Registra abertura de um capítulo — atualiza posição atual E
-- histórico recente (mantém só os 10 mais recentes por usuário),
-- numa chamada só.
-- ============================================================
create or replace function public.register_bible_chapter_open(
  p_profile_id uuid, p_version text, p_book_abbrev text, p_chapter int
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.bible_reading_progress (profile_id, version, book_abbrev, chapter, updated_at)
  values (p_profile_id, p_version, p_book_abbrev, p_chapter, now())
  on conflict (profile_id) do update set
    version = excluded.version, book_abbrev = excluded.book_abbrev,
    chapter = excluded.chapter, updated_at = now();

  insert into public.bible_recent_reads (profile_id, version, book_abbrev, chapter, opened_at)
  values (p_profile_id, p_version, p_book_abbrev, p_chapter, now())
  on conflict (profile_id, version, book_abbrev, chapter) do update set opened_at = now();

  -- mantém só os 10 mais recentes, apaga o resto
  delete from public.bible_recent_reads
  where profile_id = p_profile_id
    and id not in (
      select id from public.bible_recent_reads
      where profile_id = p_profile_id
      order by opened_at desc
      limit 10
    );
end $$;
grant execute on function public.register_bible_chapter_open(uuid, text, text, int) to authenticated;
