-- ============================================================
-- GIVE002 — QR Code do PIX por igreja
-- ============================================================
-- Campo novo e opcional em churches, pra exibir o QR Code real
-- (gerado pelo banco de cada igreja) na página pública de Dízimo
-- e Ofertas. Igrejas que compartilham a mesma conta/PIX (ex: duas
-- sedes da mesma Comunidade) simplesmente recebem a MESMA URL —
-- não precisa de nenhuma lógica de herança, o campo já é livre
-- por igreja.
-- Idempotente.
-- ============================================================

alter table public.churches add column if not exists qr_code_url text;

comment on column public.churches.qr_code_url is
  'URL da imagem do QR Code do PIX (gerado pelo banco), exibida na página pública de Dízimo e Ofertas. Igrejas que dividem a mesma conta usam a mesma URL.';
