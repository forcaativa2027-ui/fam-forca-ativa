-- RADIO002 — Rádio Web: configurações por igreja/comunidade
create table if not exists public.radio_settings (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null unique references public.churches(id) on delete cascade,
  radio_enabled boolean not null default false,
  radio_display_name text,
  radio_short_name text,
  radio_logo_url text,
  radio_icon_url text,
  radio_theme jsonb default '{}'::jsonb,
  radio_stream_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger para updated_at
drop trigger if exists trg_radio_settings_updated on public.radio_settings;
create trigger trg_radio_settings_updated before update on public.radio_settings for each row execute function public.set_updated_at();

-- RLS
alter table public.radio_settings enable row level security;

-- Policy: leitura pública
drop policy if exists radio_settings_public_read on public.radio_settings;
create policy radio_settings_public_read on public.radio_settings for select to anon using (true);