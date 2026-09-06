-- FAM042: Tabela de itens do carrossel institucional da pagina inicial
-- Especificacao: FAM-CAR-01 v1.0

create table if not exists public.content_carousel_items (
  id              uuid primary key default gen_random_uuid(),
  tenant_key      text not null default 'FAM',
  title           text not null,
  description     text,
  content_type    text not null default 'banner'
                    check (content_type in ('banner','video','noticia','informativo','evento','campanha','outro')),
  image_url       text,
  video_url       text,
  cover_url       text,
  button_label    text,
  action_type     text not null default 'nenhum'
                    check (action_type in ('nenhum','interno','externo','noticia','evento','video','servico','fale_fam','direitos')),
  action_url      text,
  display_order   integer not null default 0,
  audience        text not null default 'todos'
                    check (audience in ('todos','nao_autenticados','cadastrados','membros_ativos','membros_inativos')),
  starts_at       timestamptz,
  ends_at         timestamptz,
  is_active       boolean not null default true,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.content_carousel_items is 'Itens do carrossel de conteudo institucional da pagina inicial (FAM-CAR-01)';

-- Indice para busca publica (ativa + ordem)
create index if not exists idx_carousel_items_active_order
  on public.content_carousel_items (tenant_key, is_active, display_order)
  where is_active = true;

-- RLS: leitura publica apenas de itens ativos
alter table public.content_carousel_items enable row level security;

create policy "carousel_public_read" on public.content_carousel_items
  for select using (is_active = true);

create policy "carousel_admin_all" on public.content_carousel_items
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('apostolo', 'pastor')
    )
  );

-- RPC para buscar itens publicos do carrossel
create or replace function public.get_active_carousel_items(p_tenant text default 'FAM')
returns table (
  id              uuid,
  title           text,
  description     text,
  content_type    text,
  image_url       text,
  video_url       text,
  cover_url       text,
  button_label    text,
  action_type     text,
  action_url      text,
  display_order   integer,
  audience        text
)
language sql stable
security definer
as $$
  select
    c.id, c.title, c.description, c.content_type,
    c.image_url, c.video_url, c.cover_url,
    c.button_label, c.action_type, c.action_url,
    c.display_order, c.audience
  from public.content_carousel_items c
  where c.tenant_key = p_tenant
    and c.is_active = true
    and (c.starts_at is null or c.starts_at <= now())
    and (c.ends_at is null or c.ends_at >= now())
  order by c.display_order asc, c.created_at asc;
$$;

-- Audit table
create table if not exists public.carousel_audit_events (
  id          uuid primary key default gen_random_uuid(),
  action      text not null,
  item_id     uuid,
  item_title  text,
  actor_id    uuid references public.profiles(id) on delete set null,
  details     jsonb,
  created_at  timestamptz not null default now()
);

comment on table public.carousel_audit_events is 'Registro de auditoria do carrossel institucional';
