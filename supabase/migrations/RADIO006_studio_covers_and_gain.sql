-- RADIO006 — Ciclo 3: Melhorias no Studio Remoto
-- Capa por gravação (upload de imagem opcional, exibida no card da gravação).

alter table public.radio_recordings
  add column if not exists cover_url text,
  add column if not exists cover_storage_path text;
