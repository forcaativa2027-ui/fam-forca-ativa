-- RADIO005 — Ciclo 2: Podcasts, Analytics de audiência, Multi-convidados
-- S360-RADIO-002 §§15 (podcasts/podcasts), analytics de audiência, multi-convidados

-- ── Podcasts: marca episódios que são podcast ──
alter table public.radio_episodes
  add column if not exists is_podcast boolean not null default false;

-- ── Multi-convidados: roteiriza vários convidados por programa ──
create table if not exists public.radio_program_guests (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.radio_programs(id) on delete cascade,
  guest_name text not null,
  guest_email text,
  guest_role text default 'convidado',           -- convidado | especial | co-apresentador | musica
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.radio_program_guests enable row level security;

create index if not exists radio_program_guests_program_idx on public.radio_program_guests(program_id);

create policy "radio_program_guests_read" on public.radio_program_guests
  for select using (true);

create policy "radio_program_guests_admin_write" on public.radio_program_guests
  for all to authenticated using (is_admin()) with check (is_admin());

-- ── Analytics de audiência: registro de plays ──
create table if not exists public.radio_play_events (
  id uuid primary key default gen_random_uuid(),
  church_id uuid references public.churches(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  episode_id uuid references public.radio_episodes(id) on delete set null,
  recording_id uuid references public.radio_recordings(id) on delete set null,
  program_id uuid references public.radio_programs(id) on delete set null,
  source text not null default 'episode',        -- episode | podcast | live | recording | reprise
  started_at timestamptz not null default now(),
  listened_seconds int not null default 0,
  ip_hash text,
  user_agent text
);

alter table public.radio_play_events enable row level security;

create index if not exists radio_play_events_church_idx on public.radio_play_events(church_id);
create index if not exists radio_play_events_episode_idx on public.radio_play_events(episode_id);
create index if not exists radio_play_events_started_idx on public.radio_play_events(started_at);

-- Leitura: admin. Escrita: anônima/autenticada pode inserir (métricas de audição).
create policy "radio_play_events_admin_read" on public.radio_play_events
  for select to authenticated using (is_admin());

create policy "radio_play_events_insert" on public.radio_play_events
  for insert to anon, authenticated with check (true);

-- ── RPC: registrar play (não precisa RLS no insert, mas mantém consistência) ──
create or replace function public.radio_register_play(
  p_church_id uuid,
  p_profile_id uuid default null,
  p_episode_id uuid default null,
  p_recording_id uuid default null,
  p_program_id uuid default null,
  p_source text default 'episode'
) returns uuid
language sql
security definer
set search_path = public
as $$
  insert into public.radio_play_events (church_id, profile_id, episode_id, recording_id, program_id, source)
  values (p_church_id, p_profile_id, p_episode_id, p_recording_id, p_program_id, p_source)
  returning id;
$$;

-- ── RPC: atualizar tempo escutado ──
create or replace function public.radio_update_listened_seconds(p_event_id uuid, p_seconds int)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.radio_play_events
     set listened_seconds = greatest(listened_seconds, p_seconds)
   where id = p_event_id
   returning true;
$$;

-- ── View: resumo de audiência por episódio ──
create or replace view public.radio_episode_play_stats as
select
  e.id as episode_id,
  e.title,
  e.church_id,
  e.category,
  e.is_podcast,
  count(pe.id) as total_plays,
  coalesce(sum(pe.listened_seconds), 0) as total_listened_seconds,
  count(distinct pe.profile_id) as unique_listeners,
  max(pe.started_at) as last_play_at
from public.radio_episodes e
left join public.radio_play_events pe on pe.episode_id = e.id
group by e.id;