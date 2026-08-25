-- FAM008 — INFO: Conhecimento que Protege — fundação (IMPL-01.08 / INFO-01 / PASSO 031)
-- Tabelas: knowledge_sources, knowledge_topics, knowledge_contents, knowledge_tracks, knowledge_track_items, knowledge_content_sources, knowledge_progress
-- Base para trilhas, níveis (entenda 2min → aprenda → aprofunde → fonte oficial) e busca inicial.

do $$ begin
  create type public.knowledge_source_status as enum ('current','review_required','updated','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.knowledge_content_level as enum ('entenda_2min','aprenda','aprofunde','fonte_oficial','geral');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.knowledge_content_status as enum ('draft','review','published','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.knowledge_progress_status as enum ('not_started','started','completed','saved');
exception when duplicate_object then null; end $$;

-- 1. Fontes oficiais
create table if not exists public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text not null,
  source_type text not null, -- lei, guia, cartilha, protocolo, manual, politica, estudo
  official_url text,
  publication_date date,
  last_verified_at date not null default current_date,
  status public.knowledge_source_status not null default 'current',
  version text not null default '1.0',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_knowledge_sources_status on public.knowledge_sources(status);
create index if not exists idx_knowledge_sources_org on public.knowledge_sources(organization);

-- 2. Tópicos
create table if not exists public.knowledge_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_knowledge_topics_slug on public.knowledge_topics(slug);

-- 3. Conteúdos
create table if not exists public.knowledge_contents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  content text not null,
  level public.knowledge_content_level not null default 'geral',
  topic_id uuid references public.knowledge_topics(id) on delete set null,
  estimated_minutes integer,
  keywords text[] default '{}',
  status public.knowledge_content_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_knowledge_contents_topic on public.knowledge_contents(topic_id);
create index if not exists idx_knowledge_contents_level on public.knowledge_contents(level);
create index if not exists idx_knowledge_contents_status on public.knowledge_contents(status);
create index if not exists idx_knowledge_contents_slug on public.knowledge_contents(slug);

-- 4. Trilhas
create table if not exists public.knowledge_tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  cover_url text,
  estimated_total_minutes integer,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 5. Itens da trilha (ordem)
create table if not exists public.knowledge_track_items (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.knowledge_tracks(id) on delete cascade,
  content_id uuid not null references public.knowledge_contents(id) on delete cascade,
  position integer not null default 0,
  is_required boolean not null default true,
  unique(track_id, content_id),
  unique(track_id, position)
);
create index if not exists idx_knowledge_track_items_track on public.knowledge_track_items(track_id, position);

-- 6. Relação conteúdo <-> fonte (N:N)
create table if not exists public.knowledge_content_sources (
  content_id uuid not null references public.knowledge_contents(id) on delete cascade,
  source_id uuid not null references public.knowledge_sources(id) on delete cascade,
  is_primary boolean not null default false,
  primary key (content_id, source_id)
);
create index if not exists idx_knowledge_content_sources_source on public.knowledge_content_sources(source_id);

-- 7. Relação FAM doc <-> fonte (rastreabilidade dupla: FONTE → DOC FAM e FONTE → INFO)
create table if not exists public.fam_document_sources (
  document_code text not null, -- ex: TEC-01, JUR-01, INFO-03-TRILHA
  source_id uuid not null references public.knowledge_sources(id) on delete cascade,
  notes text,
  primary key (document_code, source_id)
);

-- 8. Progresso do usuário na trilha/conteúdo
create table if not exists public.knowledge_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid references public.knowledge_tracks(id) on delete cascade,
  content_id uuid references public.knowledge_contents(id) on delete cascade,
  status public.knowledge_progress_status not null default 'not_started',
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  last_position integer,
  completed_at timestamptz,
  saved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (track_id is not null or content_id is not null),
  unique(user_id, track_id, content_id)
);
create index if not exists idx_knowledge_progress_user on public.knowledge_progress(user_id, status);
create index if not exists idx_knowledge_progress_track on public.knowledge_progress(track_id);
create index if not exists idx_knowledge_progress_content on public.knowledge_progress(content_id);

-- RLS: INFO é público para leitura; escrita só governance
alter table public.knowledge_sources enable row level security;
alter table public.knowledge_topics enable row level security;
alter table public.knowledge_contents enable row level security;
alter table public.knowledge_tracks enable row level security;
alter table public.knowledge_track_items enable row level security;
alter table public.knowledge_content_sources enable row level security;
alter table public.fam_document_sources enable row level security;
alter table public.knowledge_progress enable row level security;

-- Leitura pública (anon + authenticated) para conteúdos publicados
drop policy if exists ks_select_public on public.knowledge_sources;
create policy ks_select_public on public.knowledge_sources for select to anon, authenticated using (true);

drop policy if exists kt_select_public on public.knowledge_topics;
create policy kt_select_public on public.knowledge_topics for select to anon, authenticated using (true);

drop policy if exists kc_select_public on public.knowledge_contents;
create policy kc_select_public on public.knowledge_contents for select to anon, authenticated using (status = 'published' or auth.uid() is not null);

drop policy if exists ktr_select_public on public.knowledge_tracks;
create policy ktr_select_public on public.knowledge_tracks for select to anon, authenticated using (true);

drop policy if exists kti_select_public on public.knowledge_track_items;
create policy kti_select_public on public.knowledge_track_items for select to anon, authenticated using (true);

drop policy if exists kcs_select_public on public.knowledge_content_sources;
create policy kcs_select_public on public.knowledge_content_sources for select to anon, authenticated using (true);

drop policy if exists fam_ds_select_public on public.fam_document_sources;
create policy fam_ds_select_public on public.fam_document_sources for select to anon, authenticated using (true);

-- Progresso: usuário vê só o próprio
drop policy if exists kp_select_own on public.knowledge_progress;
create policy kp_select_own on public.knowledge_progress for select to authenticated using (user_id = auth.uid());
drop policy if exists kp_insert_own on public.knowledge_progress;
create policy kp_insert_own on public.knowledge_progress for insert to authenticated with check (user_id = auth.uid());
drop policy if exists kp_update_own on public.knowledge_progress;
create policy kp_update_own on public.knowledge_progress for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Escrita governance: apenas apostolo/pastor (simplificado)
drop policy if exists ks_insert_governance on public.knowledge_sources;
create policy ks_insert_governance on public.knowledge_sources for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor')));
drop policy if exists ks_update_governance on public.knowledge_sources;
create policy ks_update_governance on public.knowledge_sources for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor')));
drop policy if exists kt_ins_governance on public.knowledge_topics;
create policy kt_ins_governance on public.knowledge_topics for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor')));
drop policy if exists kt_upd_governance on public.knowledge_topics;
create policy kt_upd_governance on public.knowledge_topics for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor')));
drop policy if exists kc_ins_governance on public.knowledge_contents;
create policy kc_ins_governance on public.knowledge_contents for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor')));
drop policy if exists kc_upd_governance on public.knowledge_contents;
create policy kc_upd_governance on public.knowledge_contents for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor')));
drop policy if exists ktr_ins_governance on public.knowledge_tracks;
create policy ktr_ins_governance on public.knowledge_tracks for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor')));
drop policy if exists ktr_upd_governance on public.knowledge_tracks;
create policy ktr_upd_governance on public.knowledge_tracks for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('apostolo','pastor')));

-- updated_at triggers
create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists trg_ks_updated on public.knowledge_sources;
create trigger trg_ks_updated before update on public.knowledge_sources for each row execute function public.set_updated_at();
drop trigger if exists trg_kc_updated on public.knowledge_contents;
create trigger trg_kc_updated before update on public.knowledge_contents for each row execute function public.set_updated_at();
drop trigger if exists trg_kp_updated on public.knowledge_progress;
create trigger trg_kp_updated before update on public.knowledge_progress for each row execute function public.set_updated_at();

-- Seeds mínimos (fontes oficiais citadas no Marco)
insert into public.knowledge_sources (title, organization, source_type, official_url, publication_date, status, version) values
  ('Lei nº 11.340/2006 — Lei Maria da Penha', 'Presidência da República', 'lei', 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm', '2006-08-07', 'current', '1.0'),
  ('Lei nº 13.709/2018 — LGPD', 'Presidência da República', 'lei', 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm', '2018-08-14', 'current', '1.0'),
  ('Lei nº 13.431/2017 — Garantia de direitos da criança/adolescente vítima/testemunha', 'Presidência da República', 'lei', 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13431.htm', '2017-04-04', 'current', '1.0'),
  ('Estatuto da Pessoa Idosa — Lei nº 10.741/2003', 'Presidência da República', 'lei', 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.741.htm', '2003-10-01', 'current', '1.0'),
  ('Lei Brasileira de Inclusão — Lei nº 13.146/2015', 'Presidência da República', 'lei', 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm', '2015-07-06', 'current', '1.0'),
  ('Guia Prático de Cuidado à Mulher em Situação de Violência (2025)', 'Ministério da Saúde', 'guia', 'https://www.gov.br/saude/pt-br', '2025-01-01', 'current', '1.0'),
  ('Guia Interinstitucional FONAR', 'CNJ / CNMP — FONAR', 'guia', 'https://www.cnj.jus.br', '2020-01-01', 'current', '1.0')
on conflict do nothing;

insert into public.knowledge_topics (slug, title, description, sort_order) values
  ('direitos', 'Conhecendo meus direitos', 'Dignidade, liberdade, igualdade, autonomia, privacidade e acesso a serviços.', 1),
  ('violencia-tipos', 'Isso também pode ser violência?', 'Física, psicológica, sexual, patrimonial, moral, vicária, digital.', 2),
  ('maria-da-penha', 'Entendendo a Lei Maria da Penha', 'Para que existe, quem protege, tipos de violência, medidas protetivas e rede.', 3),
  ('sinais-risco', 'Reconhecendo sinais de risco', 'Ameaça, perseguição, controle, escalada, armas, dependência.', 4),
  ('rede-protecao', 'Conhecendo a rede de proteção', 'O que faz cada instituição e quando procurar.', 5),
  ('violencia-sexual', 'Violência sexual', 'Entender, reconhecer direitos, atendimento, fontes oficiais.', 6),
  ('criancas-adolescentes', 'Crianças e adolescentes', 'Proteção integral, Conselho Tutelar, escuta especializada.', 7),
  ('pessoa-idosa', 'Pessoa idosa', 'Violência, negligência, abuso patrimonial, canais.', 8),
  ('mulher-deficiencia', 'Mulher com deficiência', 'Igualdade, acessibilidade, autonomia, barreiras.', 9),
  ('violencia-digital', 'Violência digital', 'Perseguição digital, invasão, exposição, preservação de registros.', 10),
  ('privacidade', 'Minha privacidade também é um direito', 'LGPD, ANPD, dados sensíveis, retenção, segurança.', 11)
on conflict (slug) do nothing;

-- Trilha inicial 1: Conhecendo meus direitos (MVP)
insert into public.knowledge_tracks (slug, title, description, sort_order) values
  ('conhecendo-meus-direitos', 'Conhecendo meus direitos', 'Jornada introdutória sobre direitos, dignidade e acesso a serviços.', 1)
on conflict (slug) do nothing;

-- Conteúdos MVP (3 níveis + fonte)
insert into public.knowledge_contents (slug, title, summary, content, level, topic_id, estimated_minutes, status, published_at) values
  ('direitos-entenda-2min', 'Entenda em 2 minutos: o que são direitos?', 'Seus direitos são garantias previstas em lei para sua dignidade, liberdade e proteção.', 'Conteúdo pedagógico curto: direitos são garantias legais. Todos têm direito à vida, liberdade, igualdade, privacidade e acesso a serviços. A FAM explica de forma simples, com exemplos cotidianos. Para aprofundar, consulte a fonte oficial.', 'entenda_2min', (select id from public.knowledge_topics where slug='direitos'), 2, 'published', now()),
  ('direitos-aprenda', 'Aprenda: dignidade, liberdade e igualdade', 'Aprofunde os conceitos de dignidade da pessoa humana, liberdade e igualdade.', 'Conteúdo nível Aprenda: explanação sobre dignidade, liberdade, igualdade, autonomia, com exemplos de situações de desrespeito e onde buscar orientação.', 'aprenda', (select id from public.knowledge_topics where slug='direitos'), 8, 'published', now()),
  ('direitos-aprofunde', 'Aprofunde: acesso à informação e aos serviços', 'Direito à informação e ao acesso a serviços públicos.', 'Conteúdo nível Aprofunde: detalhamento sobre acesso à informação (Lei de Acesso à Informação), serviços públicos, rede de proteção e canais oficiais.', 'aprofunde', (select id from public.knowledge_topics where slug='direitos'), 12, 'published', now())
on conflict (slug) do nothing;

-- Vincular conteúdos à trilha 1
insert into public.knowledge_track_items (track_id, content_id, position)
  select t.id, c.id, row_number() over (order by c.level)
  from public.knowledge_tracks t, public.knowledge_contents c
  where t.slug = 'conhecendo-meus-direitos' and c.slug in ('direitos-entenda-2min','direitos-aprenda','direitos-aprofunde')
on conflict (track_id, content_id) do nothing;

-- Vincular fontes oficiais aos conteúdos (rastreabilidade dupla)
insert into public.knowledge_content_sources (content_id, source_id, is_primary)
  select c.id, s.id, true from public.knowledge_contents c, public.knowledge_sources s
  where c.slug = 'direitos-entenda-2min' and s.title like '%Maria da Penha%'
on conflict do nothing;

insert into public.knowledge_content_sources (content_id, source_id, is_primary)
  select c.id, s.id, false from public.knowledge_contents c, public.knowledge_sources s
  where c.slug = 'direitos-aprenda' and s.title like '%LGPD%'
on conflict do nothing;

insert into public.fam_document_sources (document_code, source_id)
  select 'TEC-01', s.id from public.knowledge_sources s where s.title like '%Maria da Penha%'
on conflict do nothing;

comment on table public.knowledge_sources is 'Fontes oficiais governamentais com verificação periódica (current/review_required/updated/archived)';
comment on table public.knowledge_topics is 'Tópicos da jornada Conhecimento que Protege';
comment on table public.knowledge_contents is 'Conteúdos pedagógicos em 4 níveis: entenda_2min → aprenda → aprofunde → fonte_oficial';
comment on table public.knowledge_tracks is 'Trilhas de aprendizagem progressivas';
comment on table public.knowledge_progress is 'Progresso não bloqueante: not_started/started/completed/saved';
