-- ================================================
-- Arquivo: supabase/migrations/RADIO004_studio_invites_and_recordings.sql
-- ================================================
-- RADIO004 — Convites do apresentador (Studio) + Gravações e Reprise
-- S360-RADIO-002 §§7-9 (convites), §§12-13 (gravação/reprise)

-- ── Convites temporários do apresentador ──
create table if not exists public.radio_studio_invites (
  id uuid primary key default gen_random_uuid(),
  church_id uuid references public.churches(id) on delete cascade,
  program_id uuid references public.radio_programs(id) on delete cascade,
  token text not null unique,
  presenter_name text,
  presenter_email text,
  role text not null default 'apresentador',
  status text not null default 'ativo',           -- ativo | revogado | expirado | usado
  waitroom_at timestamptz,
  techcheck_at timestamptz,
  starts_at timestamptz not null,                 -- início da janela autorizada
  ends_at timestamptz not null,                   -- fim da transmissão autorizada
  access_ends_at timestamptz,                     -- encerramento operacional
  used_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoke_reason text
);

-- ── Gravações automáticas (Studio + reprocessamento) ──
create table if not exists public.radio_recordings (
  id uuid primary key default gen_random_uuid(),
  church_id uuid references public.churches(id) on delete cascade,
  program_id uuid references public.radio_programs(id) on delete cascade,
  episode_id uuid references public.radio_episodes(id) on delete set null,
  title text not null,
  presenter_name text,
  category text default 'especial',
  storage_path text not null,
  audio_url text,
  duration_seconds integer,
  status text not null default 'gravando',        -- gravando | processando | revisao | publicada | reprovada | erro
  recorded_at timestamptz default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  is_reprise boolean not null default false,      -- reutilizada como reprise na grade
  created_at timestamptz not null default now()
);

alter table public.radio_recordings enable row level security;
alter table public.radio_studio_invites enable row level security;

create index if not exists radio_studio_invites_token_idx on public.radio_studio_invites(token);
create index if not exists radio_studio_invites_program_idx on public.radio_studio_invites(program_id);
create index if not exists radio_recordings_program_idx on public.radio_recordings(program_id);
create index if not exists radio_recordings_church_idx on public.radio_recordings(church_id);

-- ── RLS ──
-- Convites: leitura só admin (validação pública via RPC radio_validate_invite, security definer); escrita admin.
create policy "radio_studio_invites_admin_read" on public.radio_studio_invites
  for select to authenticated using (is_admin());

create policy "radio_studio_invites_admin_write" on public.radio_studio_invites
  for all to authenticated using (is_admin()) with check (is_admin());

-- Gravações: leitura pública (reprises/podcasts publicados); escrita admin.
create policy "radio_recordings_select_public" on public.radio_recordings
  for select using (status = 'publicada' or is_admin());

create policy "radio_recordings_admin_write" on public.radio_recordings
  for all to authenticated using (is_admin()) with check (is_admin());

-- ── RPC: validação de convite no servidor ──
create or replace function public.radio_validate_invite(p_token text)
returns table (
  valid boolean,
  reason text,
  invite_id uuid,
  program_id uuid,
  program_title text,
  presenter_name text,
  role text,
  church_id uuid,
  waitroom_at timestamptz,
  techcheck_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  access_ends_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    true as valid,
    'ok'::text as reason,
    i.id,
    i.program_id,
    coalesce(p.title, 'Programa') as program_title,
    i.presenter_name,
    i.role,
    i.church_id,
    i.waitroom_at,
    i.techcheck_at,
    i.starts_at,
    i.ends_at,
    i.access_ends_at
  from public.radio_studio_invites i
  left join public.radio_programs p on p.id = i.program_id
  where i.token = p_token
    and i.status = 'ativo'
    and i.ends_at > now();

  if not found then
    return query select
      false, 'Convite inválido, revogado ou expirado.', null::uuid, null::uuid,
      null::text, null::text, null::text, null::uuid, null::timestamptz,
      null::timestamptz, null::timestamptz, null::timestamptz, null::timestamptz;
  end if;
end;
$$;

-- ── RPC: registro de uso do convite ──
create or replace function public.radio_use_invite(p_token text)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.radio_studio_invites
     set status = 'usado', used_at = now()
   where token = p_token and status = 'ativo' and ends_at > now()
   returning true;
$$;

-- ── RPC: nova gravação a partir do Studio ──
create or replace function public.radio_start_recording(
  p_church_id uuid,
  p_program_id uuid,
  p_presenter_name text default null,
  p_title text default null
) returns uuid
language sql
security definer
set search_path = public
as $$
  insert into public.radio_recordings (church_id, program_id, presenter_name, title)
  values (
    p_church_id,
    p_program_id,
    p_presenter_name,
    coalesce(p_title, 'Gravação de estúdio')
  )
  returning id;
$$;

-- ================================================
-- Arquivo: supabase/migrations/RADIO005_cycle2_podcasts_analytics_guests.sql
-- ================================================
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

-- ================================================
-- Arquivo: supabase/migrations/RADIO006_studio_covers_and_gain.sql
-- ================================================
-- RADIO006 — Ciclo 3: Melhorias no Studio Remoto
-- Capa por gravação (upload de imagem opcional, exibida no card da gravação).

alter table public.radio_recordings
  add column if not exists cover_url text,
  add column if not exists cover_storage_path text;


-- ================================================
-- Arquivo: supabase/migrations/RADIO007_radio_audio_bucket.sql
-- ================================================
-- RADIO007 — Bucket público radio-audio (áudios e capas do Studio Remoto)
-- Substitui a criação manual do bucket no painel do Storage.

insert into storage.buckets (id, name, public, file_size_limit)
values ('radio-audio', 'radio-audio', true, 104857600)
on conflict (id) do update set public = true;

drop policy if exists "radio_audio_public_read" on storage.objects;
create policy "radio_audio_public_read" on storage.objects
  for select using (bucket_id = 'radio-audio');

drop policy if exists "radio_audio_authenticated_insert" on storage.objects;
create policy "radio_audio_authenticated_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'radio-audio');

drop policy if exists "radio_audio_authenticated_update" on storage.objects;
create policy "radio_audio_authenticated_update" on storage.objects
  for update to authenticated using (bucket_id = 'radio-audio') with check (bucket_id = 'radio-audio');

drop policy if exists "radio_audio_authenticated_delete" on storage.objects;
create policy "radio_audio_authenticated_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'radio-audio');

