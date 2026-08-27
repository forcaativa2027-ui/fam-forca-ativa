-- FAM029 — Knowledge Service / Jornada do Conhecimento
-- Escopo inicial: FAM. Não altera nem apaga tabelas legadas da CEC.
-- Conteúdo jurídico deve permanecer inativo até revisão e aprovação institucional.

create table if not exists public.fam_knowledge_contents (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'FAM' check (tenant_key = 'FAM'),
  content_key text not null,
  content_type text not null check (content_type in (
    'guia','explicacao','faq','procedimento','politica','protocolo',
    'referencia','formulario_servico','video','documento'
  )),
  title text not null,
  summary text not null default '',
  body text not null default '',
  language text not null default 'pt-BR',
  audience text[] not null default array['publico']::text[],
  classification text not null default 'publico' check (classification in ('publico','interno','restrito','sensivel')),
  purpose text[] not null default array['informar']::text[],
  stage text[] not null default array['descobrir']::text[],
  status text not null default 'draft' check (status in ('draft','curation','under_review','approved','published','superseded','archived','rejected')),
  version text not null default '1.0',
  owner_profile_id uuid references public.profiles(id) on delete set null,
  author_profile_id uuid references public.profiles(id) on delete set null,
  reviewer_profile_id uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approval_reference text,
  approved_at timestamptz,
  effective_from timestamptz,
  effective_until timestamptz,
  review_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_key, content_key, version),
  check (effective_until is null or effective_from is null or effective_until > effective_from),
  check (status <> 'published' or approved_by is not null),
  check (status <> 'published' or approval_reference is not null),
  check (status <> 'published' or review_date is not null)
);

create table if not exists public.fam_knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'FAM' check (tenant_key = 'FAM'),
  content_id uuid not null references public.fam_knowledge_contents(id) on delete cascade,
  source_type text not null check (source_type in ('lei','decreto','orgao_publico','servico_publico','documento','video','artigo','outro')),
  source_title text not null,
  source_reference text not null,
  source_url text,
  issuing_authority text,
  publication_date date,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.fam_knowledge_terms (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'FAM',
  term_key text not null,
  preferred_label text not null,
  alternative_labels text[] not null default array[]::text[],
  definition text not null default '',
  parent_id uuid references public.fam_knowledge_terms(id) on delete set null,
  status text not null default 'active' check (status in ('active','proposed','retired')),
  created_at timestamptz not null default now(),
  unique (tenant_key, term_key)
);

create table if not exists public.fam_knowledge_content_terms (
  content_id uuid not null references public.fam_knowledge_contents(id) on delete cascade,
  term_id uuid not null references public.fam_knowledge_terms(id) on delete cascade,
  relation_type text not null default 'tag' check (relation_type in ('tag','broader','narrower','related')),
  primary key (content_id, term_id, relation_type)
);

create table if not exists public.fam_knowledge_relations (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'FAM',
  from_content_id uuid not null references public.fam_knowledge_contents(id) on delete cascade,
  to_content_id uuid not null references public.fam_knowledge_contents(id) on delete cascade,
  relation_type text not null check (relation_type in ('explains','related_to','next_step','requires','supports','supersedes')),
  created_at timestamptz not null default now(),
  unique (from_content_id, to_content_id, relation_type),
  check (from_content_id <> to_content_id)
);

create table if not exists public.fam_knowledge_media (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'FAM',
  content_id uuid not null references public.fam_knowledge_contents(id) on delete cascade,
  media_type text not null check (media_type in ('pdf','image','audio','video')),
  url text not null,
  title text not null default '',
  transcript text,
  captions_url text,
  alt_text text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.fam_knowledge_trails (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'FAM',
  trail_key text not null,
  title text not null,
  summary text not null default '',
  audience text[] not null default array['publico']::text[],
  purpose text[] not null default array['informar']::text[],
  difficulty text not null default 'basico' check (difficulty in ('basico','intermediario','avancado')),
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0),
  status text not null default 'draft' check (status in ('draft','under_review','approved','published','superseded','archived')),
  version text not null default '1.0',
  owner_profile_id uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approval_reference text,
  review_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_key, trail_key, version),
  check (status <> 'published' or approved_by is not null),
  check (status <> 'published' or approval_reference is not null),
  check (status <> 'published' or review_date is not null)
);

create table if not exists public.fam_knowledge_trail_steps (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'FAM',
  trail_id uuid not null references public.fam_knowledge_trails(id) on delete cascade,
  position integer not null check (position > 0),
  title text not null,
  objective text not null default '',
  content_id uuid references public.fam_knowledge_contents(id) on delete set null,
  action_label text,
  action_url text,
  is_optional boolean not null default false,
  created_at timestamptz not null default now(),
  unique (trail_id, position)
);

create table if not exists public.fam_knowledge_audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'FAM',
  content_id uuid references public.fam_knowledge_contents(id) on delete set null,
  trail_id uuid references public.fam_knowledge_trails(id) on delete set null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (event_type in ('created','updated','submitted','reviewed','approved','published','superseded','archived','rejected')),
  from_status text,
  to_status text,
  version text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_fam_knowledge_contents_public
  on public.fam_knowledge_contents (tenant_key, status, classification, updated_at desc);
create index if not exists idx_fam_knowledge_sources_content
  on public.fam_knowledge_sources (content_id);
create index if not exists idx_fam_knowledge_terms_labels
  on public.fam_knowledge_terms using gin (alternative_labels);
create index if not exists idx_fam_knowledge_trails_public
  on public.fam_knowledge_trails (tenant_key, status, updated_at desc);
create index if not exists idx_fam_knowledge_audit_created
  on public.fam_knowledge_audit_events (tenant_key, created_at desc);

create or replace function public.fam_is_knowledge_manager()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role::text = 'apostolo'
  );
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'fam_knowledge_contents','fam_knowledge_sources','fam_knowledge_terms',
    'fam_knowledge_content_terms','fam_knowledge_relations','fam_knowledge_media',
    'fam_knowledge_trails','fam_knowledge_trail_steps','fam_knowledge_audit_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

drop policy if exists fam_knowledge_contents_public_read on public.fam_knowledge_contents;
create policy fam_knowledge_contents_public_read
on public.fam_knowledge_contents for select to anon, authenticated
using (
  tenant_key = 'FAM'
  and status = 'published'
  and classification = 'publico'
  and (effective_from is null or effective_from <= now())
  and (effective_until is null or effective_until >= now())
);

drop policy if exists fam_knowledge_contents_manager_all on public.fam_knowledge_contents;
create policy fam_knowledge_contents_manager_all
on public.fam_knowledge_contents for all to authenticated
using (public.fam_is_knowledge_manager())
with check (public.fam_is_knowledge_manager());

drop policy if exists fam_knowledge_sources_public_read on public.fam_knowledge_sources;
create policy fam_knowledge_sources_public_read
on public.fam_knowledge_sources for select to anon, authenticated
using (exists (
  select 1 from public.fam_knowledge_contents c
  where c.id = content_id and c.tenant_key = 'FAM' and c.status = 'published' and c.classification = 'publico'
));

drop policy if exists fam_knowledge_sources_manager_all on public.fam_knowledge_sources;
create policy fam_knowledge_sources_manager_all
on public.fam_knowledge_sources for all to authenticated
using (public.fam_is_knowledge_manager())
with check (public.fam_is_knowledge_manager());

drop policy if exists fam_knowledge_terms_public_read on public.fam_knowledge_terms;
create policy fam_knowledge_terms_public_read
on public.fam_knowledge_terms for select to anon, authenticated
using (tenant_key = 'FAM' and status = 'active');

drop policy if exists fam_knowledge_terms_manager_all on public.fam_knowledge_terms;
create policy fam_knowledge_terms_manager_all
on public.fam_knowledge_terms for all to authenticated
using (public.fam_is_knowledge_manager())
with check (public.fam_is_knowledge_manager());

drop policy if exists fam_knowledge_content_terms_public_read on public.fam_knowledge_content_terms;
create policy fam_knowledge_content_terms_public_read
on public.fam_knowledge_content_terms for select to anon, authenticated
using (exists (
  select 1 from public.fam_knowledge_contents c
  where c.id = content_id and c.tenant_key = 'FAM' and c.status = 'published' and c.classification = 'publico'
));

drop policy if exists fam_knowledge_content_terms_manager_all on public.fam_knowledge_content_terms;
create policy fam_knowledge_content_terms_manager_all
on public.fam_knowledge_content_terms for all to authenticated
using (public.fam_is_knowledge_manager())
with check (public.fam_is_knowledge_manager());

drop policy if exists fam_knowledge_relations_public_read on public.fam_knowledge_relations;
create policy fam_knowledge_relations_public_read
on public.fam_knowledge_relations for select to anon, authenticated
using (tenant_key = 'FAM' and exists (
  select 1 from public.fam_knowledge_contents c
  where c.id = from_content_id and c.status = 'published' and c.classification = 'publico'
));

drop policy if exists fam_knowledge_relations_manager_all on public.fam_knowledge_relations;
create policy fam_knowledge_relations_manager_all
on public.fam_knowledge_relations for all to authenticated
using (public.fam_is_knowledge_manager())
with check (public.fam_is_knowledge_manager());

drop policy if exists fam_knowledge_media_public_read on public.fam_knowledge_media;
create policy fam_knowledge_media_public_read
on public.fam_knowledge_media for select to anon, authenticated
using (tenant_key = 'FAM' and exists (
  select 1 from public.fam_knowledge_contents c
  where c.id = content_id and c.status = 'published' and c.classification = 'publico'
));

drop policy if exists fam_knowledge_media_manager_all on public.fam_knowledge_media;
create policy fam_knowledge_media_manager_all
on public.fam_knowledge_media for all to authenticated
using (public.fam_is_knowledge_manager())
with check (public.fam_is_knowledge_manager());

drop policy if exists fam_knowledge_trails_public_read on public.fam_knowledge_trails;
create policy fam_knowledge_trails_public_read
on public.fam_knowledge_trails for select to anon, authenticated
using (tenant_key = 'FAM' and status = 'published');

drop policy if exists fam_knowledge_trails_manager_all on public.fam_knowledge_trails;
create policy fam_knowledge_trails_manager_all
on public.fam_knowledge_trails for all to authenticated
using (public.fam_is_knowledge_manager())
with check (public.fam_is_knowledge_manager());

drop policy if exists fam_knowledge_trail_steps_public_read on public.fam_knowledge_trail_steps;
create policy fam_knowledge_trail_steps_public_read
on public.fam_knowledge_trail_steps for select to anon, authenticated
using (exists (
  select 1 from public.fam_knowledge_trails t
  where t.id = trail_id and t.tenant_key = 'FAM' and t.status = 'published'
));

drop policy if exists fam_knowledge_trail_steps_manager_all on public.fam_knowledge_trail_steps;
create policy fam_knowledge_trail_steps_manager_all
on public.fam_knowledge_trail_steps for all to authenticated
using (public.fam_is_knowledge_manager())
with check (public.fam_is_knowledge_manager());

drop policy if exists fam_knowledge_audit_manager_read on public.fam_knowledge_audit_events;
create policy fam_knowledge_audit_manager_read
on public.fam_knowledge_audit_events for select to authenticated
using (public.fam_is_knowledge_manager());

grant execute on function public.fam_is_knowledge_manager() to authenticated;
grant select on public.fam_knowledge_contents, public.fam_knowledge_sources,
  public.fam_knowledge_terms, public.fam_knowledge_content_terms,
  public.fam_knowledge_relations, public.fam_knowledge_media,
  public.fam_knowledge_trails, public.fam_knowledge_trail_steps to anon, authenticated;
grant select on public.fam_knowledge_audit_events to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'fam_knowledge_contents','fam_knowledge_sources','fam_knowledge_terms',
    'fam_knowledge_content_terms','fam_knowledge_relations','fam_knowledge_media',
    'fam_knowledge_trails','fam_knowledge_trail_steps','fam_knowledge_audit_events'
  ] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

select
  to_regclass('public.fam_knowledge_contents') as contents_table,
  to_regclass('public.fam_knowledge_sources') as sources_table,
  to_regclass('public.fam_knowledge_terms') as terms_table,
  to_regclass('public.fam_knowledge_trails') as trails_table,
  to_regclass('public.fam_knowledge_audit_events') as audit_table,
  to_regprocedure('public.fam_is_knowledge_manager()') as manager_function;

-- Não inserir conteúdo jurídico automaticamente. O acervo deverá entrar como DRAFT,
-- passar por curadoria, revisão técnica/jurídica e aprovação institucional antes de PUBLISHED.
