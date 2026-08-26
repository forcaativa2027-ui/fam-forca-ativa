-- FAM010 — Base de conhecimento INFO FAM
-- Estrutura versionada; nenhum conteúdo fictício é publicado por esta migration.

do $$ begin
  create type public.fam_info_article_status as enum ('draft', 'in_review', 'published', 'archived');
exception when duplicate_object then null; end $$;

create table if not exists public.fam_info_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null,
  status public.fam_info_article_status not null default 'draft',
  current_version integer not null default 0,
  published_at timestamptz,
  published_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fam_info_article_versions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.fam_info_articles(id) on delete cascade,
  version integer not null,
  title text not null,
  summary text,
  body text not null,
  language text not null default 'pt-BR',
  editorial_notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(article_id, version)
);

create table if not exists public.fam_info_sources (
  id uuid primary key default gen_random_uuid(),
  article_version_id uuid not null references public.fam_info_article_versions(id) on delete cascade,
  title text not null,
  url text,
  publisher text,
  accessed_at date,
  created_at timestamptz not null default now()
);

create index if not exists idx_fam_info_articles_public on public.fam_info_articles(status, category, updated_at);
create index if not exists idx_fam_info_versions_article on public.fam_info_article_versions(article_id, version desc);
create index if not exists idx_fam_info_sources_version on public.fam_info_sources(article_version_id);

alter table public.fam_info_articles enable row level security;
alter table public.fam_info_article_versions enable row level security;
alter table public.fam_info_sources enable row level security;

drop policy if exists fam_info_public_articles on public.fam_info_articles;
create policy fam_info_public_articles on public.fam_info_articles
for select to anon, authenticated using (status = 'published');

drop policy if exists fam_info_public_versions on public.fam_info_article_versions;
create policy fam_info_public_versions on public.fam_info_article_versions
for select to anon, authenticated using (exists (
  select 1 from public.fam_info_articles a
  where a.id = article_id and a.status = 'published' and a.current_version = version
));

drop policy if exists fam_info_public_sources on public.fam_info_sources;
create policy fam_info_public_sources on public.fam_info_sources
for select to anon, authenticated using (exists (
  select 1 from public.fam_info_article_versions v
  join public.fam_info_articles a on a.id = v.article_id
  where v.id = article_version_id and a.status = 'published' and a.current_version = v.version
));

comment on table public.fam_info_articles is 'Catálogo editorial INFO FAM; somente artigos publicados são públicos.';
comment on table public.fam_info_article_versions is 'Versões imutáveis do conteúdo INFO FAM.';
comment on table public.fam_info_sources is 'Fontes que sustentam cada versão publicada do INFO.';
