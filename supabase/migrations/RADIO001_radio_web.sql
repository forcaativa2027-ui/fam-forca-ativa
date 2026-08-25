-- RADIO001 — Rádio Web: config por tenant, programas e episódios

do $$ begin
  create type radio_episode_status as enum ('draft','published','archived');
exception when duplicate_object then null; end $$;

-- 1) radio_config — configuração da rádio por igreja/instituição
create table if not exists public.radio_config (
  id uuid primary key default gen_random_uuid(),
  church_id uuid unique references public.churches(id) on delete cascade,
  is_enabled boolean not null default false,
  display_name text not null default 'Rádio Web',
  short_name text,
  logo_url text,
  stream_url text,
  theme_color text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) radio_programs — programas da grade
create table if not exists public.radio_programs (
  id uuid primary key default gen_random_uuid(),
  church_id uuid references public.churches(id) on delete cascade,
  title text not null,
  description text,
  host_name text,
  cover_url text,
  weekday weekday,
  start_time time,
  end_time time,
  is_recurring boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_radio_programs_church on public.radio_programs(church_id);

-- 3) radio_episodes — episódios/conteúdos
create table if not exists public.radio_episodes (
  id uuid primary key default gen_random_uuid(),
  church_id uuid references public.churches(id) on delete set null,
  program_id uuid references public.radio_programs(id) on delete set null,
  title text not null,
  description text,
  cover_url text,
  audio_url text not null,
  duration_seconds integer,
  category text,
  speaker text,
  published_at timestamptz,
  status radio_episode_status not null default 'draft',
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_radio_episodes_church on public.radio_episodes(church_id);
create index if not exists idx_radio_episodes_program on public.radio_episodes(program_id);
create index if not exists idx_radio_episodes_status on public.radio_episodes(status, published_at desc);

-- Triggers updated_at
drop trigger if exists trg_radio_config_updated on public.radio_config;
create trigger trg_radio_config_updated before update on public.radio_config for each row execute function public.set_updated_at();
drop trigger if exists trg_radio_programs_updated on public.radio_programs;
create trigger trg_radio_programs_updated before update on public.radio_programs for each row execute function public.set_updated_at();
drop trigger if exists trg_radio_episodes_updated on public.radio_episodes;
create trigger trg_radio_episodes_updated before update on public.radio_episodes for each row execute function public.set_updated_at();

-- RLS
alter table public.radio_config enable row level security;
alter table public.radio_programs enable row level security;
alter table public.radio_episodes enable row level security;

-- Policies radio_config
drop policy if exists radio_config_public_read on public.radio_config;
create policy radio_config_public_read on public.radio_config for select to anon using (is_enabled);
drop policy if exists radio_config_admin_write on public.radio_config;
create policy radio_config_admin_write on public.radio_config for all to authenticated using (is_admin()) with check (is_admin());

-- Policies radio_programs
drop policy if exists radio_programs_public_read on public.radio_programs;
create policy radio_programs_public_read on public.radio_programs for select to anon using (is_active);
drop policy if exists radio_programs_admin_write on public.radio_programs;
create policy radio_programs_admin_write on public.radio_programs for all to authenticated using (is_admin()) with check (is_admin());

-- Policies radio_episodes
drop policy if exists radio_episodes_public_read on public.radio_episodes;
create policy radio_episodes_public_read on public.radio_episodes for select to anon using (status = 'published' and published_at <= now());
drop policy if exists radio_episodes_admin_write on public.radio_episodes;
create policy radio_episodes_admin_write on public.radio_episodes for all to authenticated using (is_admin()) with check (is_admin());