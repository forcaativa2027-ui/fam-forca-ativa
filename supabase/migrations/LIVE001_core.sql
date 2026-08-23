-- ============================================================
-- CEC FAMILY — Live-360: núcleo (sessões, item no ar, log).
-- Slice 1. Tabelas e RLS no padrão dos módulos radio_*.
-- ============================================================

do $$ begin
  create type live_session_status as enum ('offline','preview','live','frozen');
exception when duplicate_object then null; end $$;

do $$ begin
  create type live_item_kind as enum ('bible','lyric','media','blank','logo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type live_token_role as enum ('operator','viewer');
exception when duplicate_object then null; end $$;

-- ── Sessão de live (uma igreja pode ter uma ou mais sessões) ──
create table if not exists public.live_sessions (
  id          uuid primary key default gen_random_uuid(),
  church_id   uuid references public.churches(id) on delete cascade,
  title       text not null default 'Sessão ao vivo',
  status      live_session_status not null default 'offline',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_live_sessions_church on public.live_sessions(church_id, updated_at desc);
drop trigger if exists trg_live_sessions_updated on public.live_sessions;
create trigger trg_live_sessions_updated before update on public.live_sessions
  for each row execute function public.set_updated_at();

-- ── Token de acesso ao controle (sem login). Guarda o HASH (sha256 hex) do valor cru. ──
create table if not exists public.live_control_tokens (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.live_sessions(id) on delete cascade,
  token       text not null unique,
  role        live_token_role not null default 'operator',
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_live_control_tokens_session on public.live_control_tokens(session_id);
create index if not exists idx_live_control_tokens_expiry on public.live_control_tokens(expires_at);

-- ── Item atualmente "no ar" (command pattern: CurrentItem) ──
create table if not exists public.live_current_item (
  session_id  uuid primary key references public.live_sessions(id) on delete cascade,
  kind        live_item_kind not null default 'blank',
  ref         text,
  payload     jsonb,
  seq         bigint not null default 0,
  updated_at  timestamptz not null default now()
);

-- ── Histórico de comandos (auditoria + idempotência) ──
create table if not exists public.live_command_log (
  id          bigint generated always as identity primary key,
  session_id  uuid not null references public.live_sessions(id) on delete cascade,
  cmd         text not null,
  payload     jsonb,
  operator    uuid references public.profiles(id) on delete set null,
  token_id    uuid references public.live_control_tokens(id) on delete set null,
  client_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_live_command_log_session on public.live_command_log(session_id, created_at desc);
create unique index if not exists ux_live_command_log_idempotency
  on public.live_command_log(session_id, client_id) where client_id is not null;

-- ── RLS ──
alter table public.live_sessions       enable row level security;
alter table public.live_control_tokens enable row level security;
alter table public.live_current_item   enable row level security;
alter table public.live_command_log    enable row level security;

-- Sessões: somente admin gerencia; leitura de projeção vai via RPC.
drop policy if exists live_sessions_admin_all on public.live_sessions;
create policy live_sessions_admin_all on public.live_sessions
  for all to authenticated using (is_admin()) with check (is_admin());

-- Item no ar: leitura pública (o datashow precisa). Escrita via RPC security definer.
drop policy if exists live_current_item_public_read on public.live_current_item;
create policy live_current_item_public_read on public.live_current_item
  for select to authenticated, anon using (true);

-- Tokens: somente admin.
drop policy if exists live_control_tokens_admin_all on public.live_control_tokens;
create policy live_control_tokens_admin_all on public.live_control_tokens
  for all to authenticated using (is_admin()) with check (is_admin());

-- Log: auditoria apenas admin.
drop policy if exists live_command_log_admin_read on public.live_command_log;
create policy live_command_log_admin_read on public.live_command_log
  for select to authenticated using (is_admin());