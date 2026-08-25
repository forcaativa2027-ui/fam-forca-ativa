-- ============================================================
-- CEC FAMILY — EVT006: vídeo de divulgação no pop-up de evento
-- (CEC-EVT-001, seção 17 — recurso "vídeo" do pop-up completo)
-- Idempotente.
-- ============================================================

alter table public.registration_events add column if not exists popup_video_url text;
comment on column public.registration_events.popup_video_url is
  'Vídeo curto opcional (mp4 direto) tocado com autoplay mudo no pop-up de login. Se vazio, usa banner_url como imagem estática.';
