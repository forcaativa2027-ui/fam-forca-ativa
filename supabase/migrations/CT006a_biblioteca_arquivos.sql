-- ============================================================
-- CEC FAMILY — CT006a: Biblioteca de Arquivos (CT-006, seção 10)
-- Decisão de escopo: sem upload real (Supabase Storage) por
-- enquanto — é um repositório de LINKS reutilizáveis (YouTube pra
-- vídeo, URL direta pra imagem/documento). Evita a complexidade de
-- bucket/política de storage nesta fase; pode evoluir depois.
-- Idempotente.
-- ============================================================

create table if not exists public.content_library (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  type        text not null check (type in ('imagem', 'video_youtube', 'documento', 'logo', 'outro')),
  url         text not null,
  tags        text[] not null default '{}',
  church_id   uuid references public.churches(id),  -- null = disponível pra rede toda
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);
create index if not exists idx_content_library_type on public.content_library(type);
create index if not exists idx_content_library_tags on public.content_library using gin(tags);

alter table public.content_library enable row level security;

-- Leitura: qualquer autenticado com escopo sobre a igreja do item (ou item nacional), ou apóstolo.
-- É biblioteca interna (usada só dentro do admin), não pública.
drop policy if exists content_library_staff_read on public.content_library;
create policy content_library_staff_read on public.content_library for select to authenticated
  using (public.is_apostle() or church_id is null or church_id in (select public.accessible_church_ids()));

drop policy if exists content_library_staff_write on public.content_library;
create policy content_library_staff_write on public.content_library for all to authenticated
  using (public.is_apostle() or church_id is null or church_id in (select public.accessible_church_ids()))
  with check (public.is_apostle() or church_id is null or church_id in (select public.accessible_church_ids()));
