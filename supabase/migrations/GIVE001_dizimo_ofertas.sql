-- ============================================================
-- GIVE001 — Dízimo e Ofertas (Fase 3)
-- ============================================================
-- Campos novos e opcionais em churches, pra alimentar a página
-- pública "Dízimo e Ofertas". Não mexe em nada existente.
-- Idempotente.
-- ============================================================

alter table public.churches add column if not exists pix_key text;
alter table public.churches add column if not exists pix_key_type text;
alter table public.churches add column if not exists bank_info text;

comment on column public.churches.pix_key is 'Chave PIX da comunidade, exibida na página pública de Dízimo e Ofertas.';
comment on column public.churches.bank_info is 'Dados bancários pra TED/DOC (texto livre), exibidos na página pública de Dízimo e Ofertas.';
