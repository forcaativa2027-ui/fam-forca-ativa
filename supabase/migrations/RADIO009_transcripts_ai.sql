-- RADIO009 — Ciclo 7: Transcrições e Resumos automáticos por episódio
-- Transcrição (Whisper), resumo e tags gerados por IA; o texto também pode
-- ser colado manualmente no admin. O disparo é feito por POST /api/radio/transcribe.

alter table public.radio_episodes
  add column if not exists transcript_text text,
  add column if not exists auto_summary text,
  add column if not exists auto_tags text[],
  add column if not exists transcript_status text not null default 'none',  -- none | processing | done | failed
  add column if not exists transcript_error text,
  add column if not exists transcript_updated_at timestamptz;