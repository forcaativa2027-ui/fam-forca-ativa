-- FAM006: regiões públicas usadas pelo cadastro FAM.
-- Idempotente. Não cria acesso a dados privados.

alter table if exists public.churches
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists slug text,
  add column if not exists is_active boolean not null default true;

-- Regiões-base previstas na documentação multicomunidade.
insert into public.churches (name, type, parent_id, slug, address, city, state, is_active, short_description)
select 'CEC Manaus - Sede', 'sede', null, 'manaus', null, 'Manaus', 'AM', true, 'Comunidade Evangelica Crista de Manaus'
where not exists (select 1 from public.churches where slug = 'manaus' or name = 'CEC Manaus - Sede');

insert into public.churches (name, type, parent_id, slug, address, city, state, is_active, short_description)
select 'CEC Brasilia', 'sede', null, 'brasilia', null, 'Brasilia', 'DF', true, 'Comunidade Evangelica Crista de Brasilia'
where not exists (select 1 from public.churches where slug = 'brasilia' or name = 'CEC Brasilia');

alter table public.churches enable row level security;

drop policy if exists churches_public_read on public.churches;
create policy churches_public_read on public.churches for select to anon
  using (is_active = true);

create index if not exists idx_churches_public_active on public.churches(is_active, name);

select count(*) as public_registration_regions
from public.churches
where is_active = true;
