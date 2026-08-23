-- FAM003 — Campos editoriais para notícias institucionais
-- Preparada para homologação. Não aplicar em produção sem backup e aceite.
-- Os campos são opcionais para preservar notícias já existentes.

alter table if exists public.news
  add column if not exists subtitle text,
  add column if not exists source text,
  add column if not exists video_url text;

comment on column public.news.subtitle is 'Linha de apoio da notícia institucional';
comment on column public.news.source is 'Fonte editorial ou institucional informada pelo administrador';
comment on column public.news.video_url is 'URL opcional de vídeo no YouTube';

-- Categorias legadas continuam armazenadas para compatibilidade. A interface FAM
-- apresenta somente FAM Nacional, FAM Brasília e Institucional.
