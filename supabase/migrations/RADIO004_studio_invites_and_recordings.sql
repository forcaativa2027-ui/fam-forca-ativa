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