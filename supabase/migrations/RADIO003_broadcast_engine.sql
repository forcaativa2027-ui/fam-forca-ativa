-- RADIO003 — Broadcast Engine: modo de programação, fallback, playlists e grade

-- 1) Enum de modo de programação
do $$ begin
  create type radio_program_mode as enum ('automatico','gravado','ao_vivo','hibrido');
exception when duplicate_object then null; end $$;

-- 2) radio_programs: adicionar modo, fallback e vigência de programação especial
alter table public.radio_programs
  add column if not exists mode radio_program_mode not null default 'automatico',
  add column if not exists fallback_url text,
  add column if not exists playlist_id uuid,
  add column if not exists is_special boolean not null default false,
  add column if not exists special_start_date date,
  add column if not exists special_end_date date;

-- 3) radio_playlists — biblioteca de playlists
create table if not exists public.radio_playlists (
  id uuid primary key default gen_random_uuid(),
  church_id uuid references public.churches(id) on delete cascade,
  name text not null,
  description text,
  mode text not null default 'ordered' check (mode in ('ordered','shuffle','thematic')),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_radio_playlists_church on public.radio_playlists(church_id);

-- 4) radio_playlist_items — músicas/conteúdos da playlist
create table if not exists public.radio_playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid references public.radio_playlists(id) on delete cascade,
  episode_id uuid references public.radio_episodes(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_radio_playlist_items_playlist on public.radio_playlist_items(playlist_id);

-- FK radio_programs.playlist_id
alter table public.radio_programs
  drop constraint if exists radio_programs_playlist_id_fkey;
alter table public.radio_programs
  add constraint radio_programs_playlist_id_fkey foreign key (playlist_id) references public.radio_playlists(id) on delete set null;

-- Triggers updated_at
drop trigger if exists trg_radio_playlists_updated on public.radio_playlists;
create trigger trg_radio_playlists_updated before update on public.radio_playlists for each row execute function public.set_updated_at();

-- RLS
alter table public.radio_playlists enable row level security;
alter table public.radio_playlist_items enable row level security;

-- Policies radio_playlists
drop policy if exists radio_playlists_public_read on public.radio_playlists;
create policy radio_playlists_public_read on public.radio_playlists for select to anon using (is_active);
drop policy if exists radio_playlists_admin_write on public.radio_playlists;
create policy radio_playlists_admin_write on public.radio_playlists for all to authenticated using (is_admin()) with check (is_admin());

-- Policies radio_playlist_items
drop policy if exists radio_playlist_items_public_read on public.radio_playlist_items;
create policy radio_playlist_items_public_read on public.radio_playlist_items for select to anon using (true);
drop policy if exists radio_playlist_items_admin_write on public.radio_playlist_items;
create policy radio_playlist_items_admin_write on public.radio_playlist_items for all to authenticated using (is_admin()) with check (is_admin());

-- 5) Função broadcast: retorna o programa vigente na grade (especial tem prioridade)
create or replace function public.radio_whats_on_air(p_church_id uuid)
returns table (
  program_id uuid,
  title text,
  description text,
  host_name text,
  mode public.radio_program_mode,
  start_time time,
  end_time time,
  weekday public.weekday,
  fallback_url text,
  is_special boolean,
  stream_url text
)
language sql stable as $$
  select
    p.id as program_id,
    p.title,
    p.description,
    p.host_name,
    p.mode,
    p.start_time,
    p.end_time,
    p.weekday,
    p.fallback_url,
    p.is_special,
    rc.stream_url
  from public.radio_programs p
  left join public.radio_config rc on rc.church_id = p.church_id
  where p.church_id = p_church_id
    and p.is_active = true
    and (
      -- programação especial em vigência
      (p.is_special and p.special_start_date is not null and p.special_end_date is not null
        and current_date between p.special_start_date and p.special_end_date)
      or
      -- recorrência semanal
      (not p.is_special and p.is_recurring and p.weekday is not null
        and p.weekday = (array['domingo','segunda','terca','quarta','quinta','sexta','sabado'])[extract(dow from now())::int + 1]::public.weekday)
    )
    and p.start_time is not null
  order by p.start_time
$$;