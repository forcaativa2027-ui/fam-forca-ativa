-- FAM030 — RLS e isolamento do tenant FAM para a Jornada do Conhecimento
-- Execução: Supabase SQL Editor
-- Natureza: não destrutiva para dados; substitui apenas as policies nomeadas abaixo.
-- Pré-requisito: migration FAM029 já aplicada.

begin;

create or replace function public.fam_is_knowledge_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role::text, '')) = 'apostolo'
  );
$$;

revoke execute on function public.fam_is_knowledge_manager() from public, anon;
grant execute on function public.fam_is_knowledge_manager() to authenticated;

-- RLS habilitado em todas as tabelas JK.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'fam_knowledge_contents',
    'fam_knowledge_sources',
    'fam_knowledge_terms',
    'fam_knowledge_content_terms',
    'fam_knowledge_relations',
    'fam_knowledge_media',
    'fam_knowledge_trails',
    'fam_knowledge_trail_steps',
    'fam_knowledge_audit_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

-- Conteúdos: leitura pública somente de conteúdo FAM publicado, público e vigente.
drop policy if exists fam_knowledge_contents_public_read on public.fam_knowledge_contents;
create policy fam_knowledge_contents_public_read
on public.fam_knowledge_contents
for select
 to anon, authenticated
using (
  tenant_key = 'FAM'
  and status = 'published'
  and classification = 'publico'
  and (effective_from is null or effective_from <= now())
  and (effective_until is null or effective_until >= now())
);

drop policy if exists fam_knowledge_contents_manager_all on public.fam_knowledge_contents;
create policy fam_knowledge_contents_manager_all
on public.fam_knowledge_contents
for all
 to authenticated
using (public.fam_is_knowledge_manager() and tenant_key = 'FAM')
with check (public.fam_is_knowledge_manager() and tenant_key = 'FAM');

-- Fontes: só acompanham conteúdo público publicado do tenant FAM.
drop policy if exists fam_knowledge_sources_public_read on public.fam_knowledge_sources;
create policy fam_knowledge_sources_public_read
on public.fam_knowledge_sources
for select
 to anon, authenticated
using (
  tenant_key = 'FAM'
  and exists (
    select 1
    from public.fam_knowledge_contents c
    where c.id = content_id
      and c.tenant_key = 'FAM'
      and c.status = 'published'
      and c.classification = 'publico'
      and (c.effective_from is null or c.effective_from <= now())
      and (c.effective_until is null or c.effective_until >= now())
  )
);

drop policy if exists fam_knowledge_sources_manager_all on public.fam_knowledge_sources;
create policy fam_knowledge_sources_manager_all
on public.fam_knowledge_sources
for all
 to authenticated
using (public.fam_is_knowledge_manager() and tenant_key = 'FAM')
with check (public.fam_is_knowledge_manager() and tenant_key = 'FAM');

-- Termos: leitura pública somente de termos FAM ativos.
drop policy if exists fam_knowledge_terms_public_read on public.fam_knowledge_terms;
create policy fam_knowledge_terms_public_read
on public.fam_knowledge_terms
for select
 to anon, authenticated
using (tenant_key = 'FAM' and status = 'active');

drop policy if exists fam_knowledge_terms_manager_all on public.fam_knowledge_terms;
create policy fam_knowledge_terms_manager_all
on public.fam_knowledge_terms
for all
 to authenticated
using (public.fam_is_knowledge_manager() and tenant_key = 'FAM')
with check (public.fam_is_knowledge_manager() and tenant_key = 'FAM');

-- Associações: não possuem tenant_key; a leitura é autorizada pelo conteúdo FAM publicado.
drop policy if exists fam_knowledge_content_terms_public_read on public.fam_knowledge_content_terms;
create policy fam_knowledge_content_terms_public_read
on public.fam_knowledge_content_terms
for select
 to anon, authenticated
using (exists (
  select 1
  from public.fam_knowledge_contents c
  join public.fam_knowledge_terms t on t.id = term_id
  where c.id = content_id
    and c.tenant_key = 'FAM'
    and c.status = 'published'
    and c.classification = 'publico'
    and t.tenant_key = 'FAM'
    and t.status = 'active'
));

drop policy if exists fam_knowledge_content_terms_manager_all on public.fam_knowledge_content_terms;
create policy fam_knowledge_content_terms_manager_all
on public.fam_knowledge_content_terms
for all
 to authenticated
using (public.fam_is_knowledge_manager() and exists (
  select 1 from public.fam_knowledge_contents c
  where c.id = content_id and c.tenant_key = 'FAM'
))
with check (public.fam_is_knowledge_manager() and exists (
  select 1 from public.fam_knowledge_contents c
  where c.id = content_id and c.tenant_key = 'FAM'
) and exists (
  select 1 from public.fam_knowledge_terms t
  where t.id = term_id and t.tenant_key = 'FAM'
));

-- Relações: ambos os lados devem pertencer ao tenant FAM.
drop policy if exists fam_knowledge_relations_public_read on public.fam_knowledge_relations;
create policy fam_knowledge_relations_public_read
on public.fam_knowledge_relations
for select
 to anon, authenticated
using (
  tenant_key = 'FAM'
  and exists (select 1 from public.fam_knowledge_contents c where c.id = from_content_id and c.tenant_key = 'FAM' and c.status = 'published' and c.classification = 'publico')
  and exists (select 1 from public.fam_knowledge_contents c where c.id = to_content_id and c.tenant_key = 'FAM' and c.status = 'published' and c.classification = 'publico')
);

drop policy if exists fam_knowledge_relations_manager_all on public.fam_knowledge_relations;
create policy fam_knowledge_relations_manager_all
on public.fam_knowledge_relations
for all
 to authenticated
using (public.fam_is_knowledge_manager() and tenant_key = 'FAM')
with check (
  public.fam_is_knowledge_manager()
  and tenant_key = 'FAM'
  and exists (select 1 from public.fam_knowledge_contents c where c.id = from_content_id and c.tenant_key = 'FAM')
  and exists (select 1 from public.fam_knowledge_contents c where c.id = to_content_id and c.tenant_key = 'FAM')
);

-- Mídia: somente mídia ligada a conteúdo FAM publicado e público.
drop policy if exists fam_knowledge_media_public_read on public.fam_knowledge_media;
create policy fam_knowledge_media_public_read
on public.fam_knowledge_media
for select
 to anon, authenticated
using (
  tenant_key = 'FAM'
  and exists (select 1 from public.fam_knowledge_contents c where c.id = content_id and c.tenant_key = 'FAM' and c.status = 'published' and c.classification = 'publico')
);

drop policy if exists fam_knowledge_media_manager_all on public.fam_knowledge_media;
create policy fam_knowledge_media_manager_all
on public.fam_knowledge_media
for all
 to authenticated
using (public.fam_is_knowledge_manager() and tenant_key = 'FAM')
with check (public.fam_is_knowledge_manager() and tenant_key = 'FAM');

-- Trilhas: leitura pública somente de trilhas FAM publicadas.
drop policy if exists fam_knowledge_trails_public_read on public.fam_knowledge_trails;
create policy fam_knowledge_trails_public_read
on public.fam_knowledge_trails
for select
 to anon, authenticated
using (tenant_key = 'FAM' and status = 'published');

drop policy if exists fam_knowledge_trails_manager_all on public.fam_knowledge_trails;
create policy fam_knowledge_trails_manager_all
on public.fam_knowledge_trails
for all
 to authenticated
using (public.fam_is_knowledge_manager() and tenant_key = 'FAM')
with check (public.fam_is_knowledge_manager() and tenant_key = 'FAM');

-- Etapas: a trilha e o conteúdo associado devem ser FAM; conteúdo vinculado deve estar publicado.
drop policy if exists fam_knowledge_trail_steps_public_read on public.fam_knowledge_trail_steps;
create policy fam_knowledge_trail_steps_public_read
on public.fam_knowledge_trail_steps
for select
 to anon, authenticated
using (
  tenant_key = 'FAM'
  and exists (select 1 from public.fam_knowledge_trails t where t.id = trail_id and t.tenant_key = 'FAM' and t.status = 'published')
  and (content_id is null or exists (select 1 from public.fam_knowledge_contents c where c.id = content_id and c.tenant_key = 'FAM' and c.status = 'published' and c.classification = 'publico'))
);

drop policy if exists fam_knowledge_trail_steps_manager_all on public.fam_knowledge_trail_steps;
create policy fam_knowledge_trail_steps_manager_all
on public.fam_knowledge_trail_steps
for all
 to authenticated
using (public.fam_is_knowledge_manager() and tenant_key = 'FAM' and exists (select 1 from public.fam_knowledge_trails t where t.id = trail_id and t.tenant_key = 'FAM'))
with check (public.fam_is_knowledge_manager() and tenant_key = 'FAM' and exists (select 1 from public.fam_knowledge_trails t where t.id = trail_id and t.tenant_key = 'FAM') and (content_id is null or exists (select 1 from public.fam_knowledge_contents c where c.id = content_id and c.tenant_key = 'FAM')));

-- Auditoria: somente gestor JK pode ler e inserir eventos.
drop policy if exists fam_knowledge_audit_manager_read on public.fam_knowledge_audit_events;
create policy fam_knowledge_audit_manager_read
on public.fam_knowledge_audit_events
for select
 to authenticated
using (public.fam_is_knowledge_manager() and tenant_key = 'FAM');

drop policy if exists fam_knowledge_audit_manager_insert on public.fam_knowledge_audit_events;
create policy fam_knowledge_audit_manager_insert
on public.fam_knowledge_audit_events
for insert
 to authenticated
with check (public.fam_is_knowledge_manager() and tenant_key = 'FAM');

-- Privilégios mínimos para a camada REST; RLS continua sendo a barreira de autorização.
grant select on public.fam_knowledge_contents, public.fam_knowledge_sources,
  public.fam_knowledge_terms, public.fam_knowledge_content_terms,
  public.fam_knowledge_relations, public.fam_knowledge_media,
  public.fam_knowledge_trails, public.fam_knowledge_trail_steps
  to anon, authenticated;

grant select on public.fam_knowledge_audit_events to authenticated;
grant insert, update, delete on public.fam_knowledge_contents, public.fam_knowledge_sources,
  public.fam_knowledge_terms, public.fam_knowledge_content_terms,
  public.fam_knowledge_relations, public.fam_knowledge_media,
  public.fam_knowledge_trails, public.fam_knowledge_trail_steps,
  public.fam_knowledge_audit_events
  to authenticated;

commit;

-- ============================================================
-- AUDITORIA PÓS-EXECUÇÃO — executar separadamente se preferir.
-- ============================================================

-- 1) Existência e RLS.
with jk(table_name) as (
  values
    ('fam_knowledge_contents'), ('fam_knowledge_sources'),
    ('fam_knowledge_terms'), ('fam_knowledge_content_terms'),
    ('fam_knowledge_relations'), ('fam_knowledge_media'),
    ('fam_knowledge_trails'), ('fam_knowledge_trail_steps'),
    ('fam_knowledge_audit_events')
)
select
  jk.table_name,
  to_regclass('public.' || jk.table_name) is not null as table_exists,
  coalesce(pc.relrowsecurity, false) as rls_enabled,
  coalesce(pc.relforcerowsecurity, false) as rls_forced
from jk
left join pg_class pc on pc.oid = to_regclass('public.' || jk.table_name)
order by jk.table_name;

-- 2) Policies JK instaladas.
select schemaname, tablename, policyname, roles, cmd, permissive, qual, with_check
from pg_policies
where schemaname = 'public' and tablename like 'fam_knowledge_%'
order by tablename, policyname;

-- 3) Registros fora do tenant FAM nas tabelas que possuem tenant_key.
select 'fam_knowledge_contents' as table_name, count(*) as outside_fam
from public.fam_knowledge_contents where tenant_key is distinct from 'FAM'
union all select 'fam_knowledge_sources', count(*) from public.fam_knowledge_sources where tenant_key is distinct from 'FAM'
union all select 'fam_knowledge_terms', count(*) from public.fam_knowledge_terms where tenant_key is distinct from 'FAM'
union all select 'fam_knowledge_relations', count(*) from public.fam_knowledge_relations where tenant_key is distinct from 'FAM'
union all select 'fam_knowledge_media', count(*) from public.fam_knowledge_media where tenant_key is distinct from 'FAM'
union all select 'fam_knowledge_trails', count(*) from public.fam_knowledge_trails where tenant_key is distinct from 'FAM'
union all select 'fam_knowledge_trail_steps', count(*) from public.fam_knowledge_trail_steps where tenant_key is distinct from 'FAM'
union all select 'fam_knowledge_audit_events', count(*) from public.fam_knowledge_audit_events where tenant_key is distinct from 'FAM';

-- 4) Relações sem os dois conteúdos pertencentes a FAM.
select r.id, r.tenant_key, r.from_content_id, r.to_content_id
from public.fam_knowledge_relations r
left join public.fam_knowledge_contents c1 on c1.id = r.from_content_id
left join public.fam_knowledge_contents c2 on c2.id = r.to_content_id
where r.tenant_key is distinct from 'FAM'
   or c1.tenant_key is distinct from 'FAM'
   or c2.tenant_key is distinct from 'FAM';

-- 5) Etapas com trilha ou conteúdo associado fora de FAM.
select s.id, s.trail_id, s.content_id, t.tenant_key as trail_tenant, c.tenant_key as content_tenant
from public.fam_knowledge_trail_steps s
left join public.fam_knowledge_trails t on t.id = s.trail_id
left join public.fam_knowledge_contents c on c.id = s.content_id
where s.tenant_key is distinct from 'FAM'
   or t.tenant_key is distinct from 'FAM'
   or (s.content_id is not null and c.tenant_key is distinct from 'FAM');

-- 6) Conteúdos publicados sem metadados de aprovação.
select id, content_key, status, approved_by, approval_reference, review_date
from public.fam_knowledge_contents
where tenant_key = 'FAM'
  and status = 'published'
  and (approved_by is null or approval_reference is null or review_date is null);

-- 7) Trilhas publicadas sem metadados de aprovação.
select id, trail_key, status, approved_by, approval_reference, review_date
from public.fam_knowledge_trails
where tenant_key = 'FAM'
  and status = 'published'
  and (approved_by is null or approval_reference is null or review_date is null);
