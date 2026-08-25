-- CEC Academy — Modo TV (Pareamento Celular/TV)
-- Permite que um celular controle a reprodução em uma TV.
-- Usa polling no banco como fallback (produção: Supabase Realtime WebSocket).

-- ─── TV Sessions ───────────────────────────────────────────────
create table if not exists public.tv_sessions (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,         -- Código curto (6 chars)
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  tv_device_id      text,
  current_media_id  uuid,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  constraint tv_code_length check (length(code) = 6)
);

create index if not exists idx_tv_sessions_code on public.tv_sessions(code);
create index if not exists idx_tv_sessions_active on public.tv_sessions(profile_id, is_active);

-- ─── TV Commands (fila de comandos pendentes) ──────────────────
create table if not exists public.tv_commands (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.tv_sessions(id) on delete cascade,
  type          text not null,
  payload       jsonb default '{}',
  is_executed   boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists idx_tv_commands_session on public.tv_commands(session_id, is_executed);
create index if not exists idx_tv_commands_pending on public.tv_commands(session_id) where is_executed = false;

-- RLS
alter table public.tv_sessions enable row level security;

create policy "Membros veem suas sessões TV"
  on public.tv_sessions
  for select
  using (profile_id = auth.uid());

create policy "Membros criam suas sessões TV"
  on public.tv_sessions
  for insert
  with check (profile_id = auth.uid());

create policy "Membros atualizam suas sessões TV"
  on public.tv_sessions
  for update
  using (profile_id = auth.uid());

-- Comandos: a TV lê comandos pendentes para sua sessão
alter table public.tv_commands enable row level security;

create policy "TVs leem comandos de suas sessões"
  on public.tv_commands
  for select
  using (
    session_id in (
      select id from public.tv_sessions where is_active = true
    )
  );

create policy "Celulares criam comandos para suas sessões"
  on public.tv_commands
  for insert
  with check (
    session_id in (
      select id from public.tv_sessions where profile_id = auth.uid()
    )
  );

-- Cleanup: remover comandos executados com mais de 1 hora
create or replace function public.cleanup_old_tv_commands()
returns void
language sql security definer
as $$
  delete from public.tv_commands
  where is_executed = true
    and created_at < now() - interval '1 hour';
$$;

-- Cleanup: desativar sessões expiradas (> 30 min)
create or replace function public.expire_tv_sessions()
returns void
language sql security definer
as $$
  update public.tv_sessions
  set is_active = false
  where is_active = true
    and created_at < now() - interval '30 minutes';
$$;
