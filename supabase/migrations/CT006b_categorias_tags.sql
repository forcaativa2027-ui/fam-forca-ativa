-- ============================================================
-- CEC FAMILY — CT006b: Categorias e Tags centralizadas (CT-006, §11)
--
-- Decisão de escopo: isso é ADITIVO, não substitui nada que já existe.
-- Ex: news.category continua sendo o "público-alvo" (minha_comunidade/
-- cec_manaus/cec_brasilia/geral) — é um campo de ESCOPO, não de tema,
-- então fica como está. registration_events.category (texto livre)
-- também continua como está — já resolve bem o caso de Eventos.
--
-- O que este arquivo cria é uma camada NOVA de categoria temática +
-- tags, plugável em QUALQUER tipo de conteúdo via uma tabela de
-- vínculo genérica (entity_type + entity_id), sem precisar de coluna
-- nova em cada tabela existente.
-- Idempotente.
-- ============================================================

create table if not exists public.content_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  color       text,               -- cor hex opcional, pra exibir como badge colorido
  order_index int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.content_tags (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  created_at  timestamptz not null default now()
);

-- Vínculo genérico: qualquer tabela de conteúdo pode ter categoria(s)/tag(s)
-- sem precisar de coluna nova nela. entity_type é o nome da tabela
-- (ex: 'news', 'sermons', 'banners', 'registration_events').
create table if not exists public.content_category_links (
  id            uuid primary key default gen_random_uuid(),
  entity_type   text not null,
  entity_id     uuid not null,
  category_id   uuid not null references public.content_categories(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (entity_type, entity_id, category_id)
);
create index if not exists idx_content_category_links_entity on public.content_category_links(entity_type, entity_id);

create table if not exists public.content_tag_links (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id   uuid not null,
  tag_id      uuid not null references public.content_tags(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (entity_type, entity_id, tag_id)
);
create index if not exists idx_content_tag_links_entity on public.content_tag_links(entity_type, entity_id);

-- ---------- RLS ----------
-- Leitura aberta (categorias/tags/vínculos não são dado sensível, e content
-- publicado costuma exibir sua categoria/tags publicamente).
alter table public.content_categories enable row level security;
alter table public.content_tags enable row level security;
alter table public.content_category_links enable row level security;
alter table public.content_tag_links enable row level security;

drop policy if exists content_categories_read on public.content_categories;
create policy content_categories_read on public.content_categories for select to anon, authenticated using (true);
drop policy if exists content_tags_read on public.content_tags;
create policy content_tags_read on public.content_tags for select to anon, authenticated using (true);
drop policy if exists content_category_links_read on public.content_category_links;
create policy content_category_links_read on public.content_category_links for select to anon, authenticated using (true);
drop policy if exists content_tag_links_read on public.content_tag_links;
create policy content_tag_links_read on public.content_tag_links for select to anon, authenticated using (true);

-- Escrita: só quem tem delegação de comunicação (checado no app) — no banco,
-- basta ser autenticado, igual ao padrão já usado em content_library.
drop policy if exists content_categories_write on public.content_categories;
create policy content_categories_write on public.content_categories for all to authenticated using (true) with check (true);
drop policy if exists content_tags_write on public.content_tags;
create policy content_tags_write on public.content_tags for all to authenticated using (true) with check (true);
drop policy if exists content_category_links_write on public.content_category_links;
create policy content_category_links_write on public.content_category_links for all to authenticated using (true) with check (true);
drop policy if exists content_tag_links_write on public.content_tag_links;
create policy content_tag_links_write on public.content_tag_links for all to authenticated using (true) with check (true);

-- ---------- Seed (CT-006 §11 — a lista sugerida no documento) ----------
insert into public.content_categories (name, slug, order_index) values
  ('Notícias', 'noticias', 1), ('Eventos', 'eventos', 2), ('Devocionais', 'devocionais', 3),
  ('Missões', 'missoes', 4), ('Jovens', 'jovens', 5), ('Casais', 'casais', 6),
  ('Infantil', 'infantil', 7), ('Financeiro', 'financeiro', 8)
on conflict (slug) do nothing;

insert into public.content_tags (name) values
  ('Família'), ('Oração'), ('Discipulado'), ('Conferência'), ('Jejum'), ('Missões')
on conflict (name) do nothing;

-- ---------- Helper: buscar categorias+tags de um item de conteúdo de uma vez ----------
create or replace function public.get_content_taxonomy(p_entity_type text, p_entity_id uuid)
returns table (categories jsonb, tags jsonb)
language sql stable security definer set search_path = public as $$
  select
    coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'color', c.color))
      from public.content_category_links l join public.content_categories c on c.id = l.category_id
      where l.entity_type = p_entity_type and l.entity_id = p_entity_id), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name))
      from public.content_tag_links l join public.content_tags t on t.id = l.tag_id
      where l.entity_type = p_entity_type and l.entity_id = p_entity_id), '[]'::jsonb);
$$;
grant execute on function public.get_content_taxonomy(text, uuid) to anon, authenticated;

-- ---------- Definir categorias/tags de um item (substitui a lista inteira) ----------
create or replace function public.set_content_taxonomy(p_entity_type text, p_entity_id uuid, p_category_ids uuid[], p_tag_ids uuid[])
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.content_category_links where entity_type = p_entity_type and entity_id = p_entity_id;
  delete from public.content_tag_links where entity_type = p_entity_type and entity_id = p_entity_id;

  if p_category_ids is not null and array_length(p_category_ids, 1) > 0 then
    insert into public.content_category_links (entity_type, entity_id, category_id)
    select p_entity_type, p_entity_id, unnest(p_category_ids);
  end if;

  if p_tag_ids is not null and array_length(p_tag_ids, 1) > 0 then
    insert into public.content_tag_links (entity_type, entity_id, tag_id)
    select p_entity_type, p_entity_id, unnest(p_tag_ids);
  end if;
end; $$;
grant execute on function public.set_content_taxonomy(text, uuid, uuid[], uuid[]) to authenticated;
