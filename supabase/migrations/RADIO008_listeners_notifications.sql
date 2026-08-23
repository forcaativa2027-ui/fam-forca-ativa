-- RADIO008 — Ciclo 5: Ouvintes e Notificações
-- Cadastro público de ouvintes (nome/e-mail) + aviso quando um programa entra no ar.
-- O envio efetivo é feito por uma rota cron (Vercel Cron) em /api/cron/radio-notify,
-- que consulta as funções aqui criadas. O canal de e-mail é Resend (RESEND_API_KEY);
-- sem chave, a notificação é apenas registrada (radio_notification_log) sem envio.

-- ── Ouvintes ──
create table if not exists public.radio_listeners (
  id uuid primary key default gen_random_uuid(),
  church_id uuid references public.churches(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  token uuid not null default gen_random_uuid(),   -- token público para desinscrever
  status text not null default 'ativo',            -- ativo | pausado | cancelado
  source text not null default 'form',             -- form | admin
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (church_id, email)
);

alter table public.radio_listeners enable row level security;

create index if not exists radio_listeners_email_idx on public.radio_listeners(lower(email));
create index if not exists radio_listeners_token_idx on public.radio_listeners(token);

-- Leitura: admin vê tudo; ouvintes acessam apenas o próprio registro via RPC security definer.
create policy "radio_listeners_admin_read" on public.radio_listeners
  for select to authenticated using (is_admin());

-- ── Programas favoritos do ouvinte (opcional) ──
create table if not exists public.radio_listener_programs (
  listener_id uuid not null references public.radio_listeners(id) on delete cascade,
  program_id uuid not null references public.radio_programs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (listener_id, program_id)
);

alter table public.radio_listener_programs enable row level security;

create index if not exists radio_listener_programs_program_idx on public.radio_listener_programs(program_id);

create policy "radio_listener_programs_admin_read" on public.radio_listener_programs
  for select to authenticated using (is_admin());

-- ── Estado de notificação (evita duplicar aviso do mesmo programa por igreja) ──
create table if not exists public.radio_notification_state (
  church_id uuid primary key references public.churches(id) on delete cascade,
  program_id uuid not null,
  notified_at timestamptz not null default now()
);

alter table public.radio_notification_state enable row level security;

create policy "radio_notification_state_admin_all" on public.radio_notification_state
  for all to authenticated using (is_admin()) with check (is_admin());

-- ── Log de notificações enviadas ──
create table if not exists public.radio_notification_log (
  id uuid primary key default gen_random_uuid(),
  listener_id uuid references public.radio_listeners(id) on delete set null,
  program_id uuid references public.radio_programs(id) on delete set null,
  church_id uuid references public.churches(id) on delete cascade,
  channel text not null default 'email',           -- email | log
  status text not null default 'logged',           -- logged | sent | failed
  error text,
  sent_at timestamptz not null default now()
);

alter table public.radio_notification_log enable row level security;

create index if not exists radio_notification_log_listener_idx on public.radio_notification_log(listener_id);
create index if not exists radio_notification_log_program_idx on public.radio_notification_log(program_id);
create index if not exists radio_notification_log_sent_idx on public.radio_notification_log(sent_at);

create policy "radio_notification_log_admin_read" on public.radio_notification_log
  for select to authenticated using (is_admin());

-- ── RPC: registrar ouvinte (acesso público, anônimo) ──
create or replace function public.radio_register_listener(
  p_church_id uuid,
  p_name text,
  p_email text,
  p_program_ids uuid[] default null
) returns table (id uuid, token uuid, status text, email text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_token uuid;
  v_email text := lower(trim(p_email));
  v_name text := trim(p_name);
begin
  if p_name is null or length(v_name) = 0 then
    raise exception 'Nome é obrigatório';
  end if;
  if p_email is null or position('@' in v_email) = 0 then
    raise exception 'E-mail inválido';
  end if;

  if p_church_id is null then
    -- church_id nulo (página pública sem igreja): unique parcial por e-mail
    select l.id, l.token into v_id, v_token
    from public.radio_listeners l
    where l.church_id is null and lower(l.email) = v_email;

    if v_id is null then
      insert into public.radio_listeners (church_id, name, email, status, source)
      values (null, v_name, v_email, 'ativo', 'form')
      returning id, token into v_id, v_token;
    else
      update public.radio_listeners
         set name = v_name, status = 'ativo', updated_at = now()
       where id = v_id;
    end if;
  else
    -- Upsert por igreja+e-mail (não quebra se o ouvinte se inscrever de novo)
    insert into public.radio_listeners (church_id, name, email, status, source)
    values (p_church_id, v_name, v_email, 'ativo', 'form')
    on conflict (church_id, email)
    do update set name = excluded.name, status = 'ativo', updated_at = now()
    returning id, token into v_id, v_token;
  end if;

  -- Substitui a seleção de programas favoritos (evita acúmulo de repetidos)
  if p_program_ids is not null then
    delete from public.radio_listener_programs where listener_id = v_id;
    insert into public.radio_listener_programs (listener_id, program_id)
    select v_id, unnest(p_program_ids)
    on conflict do nothing;
  end if;

  return query select v_id, v_token, 'ativo'::text, v_email;
end;
$$;

-- Garante unicidade também para inscrições sem igreja (church_id nulo)
create unique index if not exists radio_listeners_email_null_church_idx
  on public.radio_listeners(lower(email)) where church_id is null;

-- ── RPC: desinscrever via token público ──
create or replace function public.radio_unsubscribe_listener(p_token uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.radio_listeners
     set status = 'cancelado', updated_at = now()
   where token = p_token
     and status <> 'cancelado'
  returning true;
$$;

-- ── RPC: dados do ouvinte por token (página de desinscrição) ──
create or replace function public.radio_listener_by_token(p_token uuid)
returns table (
  id uuid,
  name text,
  email text,
  status text,
  created_at timestamptz,
  program_ids uuid[]
)
language sql
security definer
set search_path = public
as $$
  select
    l.id,
    l.name,
    l.email,
    l.status,
    l.created_at,
    coalesce(array_agg(lp.program_id) filter (where lp.program_id is not null), array[]::uuid[]) as program_ids
  from public.radio_listeners l
  left join public.radio_listener_programs lp on lp.listener_id = l.id
  where l.token = p_token
  group by l.id;
$$;

-- ── RPC: ouvintes aptos a notificar por igreja (usada pelo cron) ──
-- Retorna apenas ouvintes ativos. program_ids vazio = recebe aviso de todos os programas.
create or replace function public.radio_notifiable_listeners(p_church_id uuid)
returns table (
  id uuid,
  name text,
  email text,
  token uuid,
  program_ids uuid[]
)
language sql
security definer
set search_path = public
as $$
  select
    l.id,
    l.name,
    l.email,
    l.token,
    coalesce(array_agg(lp.program_id) filter (where lp.program_id is not null), array[]::uuid[]) as program_ids
  from public.radio_listeners l
  left join public.radio_listener_programs lp on lp.listener_id = l.id
  where l.church_id = p_church_id
    and l.status = 'ativo'
  group by l.id;
$$;

-- ── RPC: todos os ouvintes de uma igreja (painel admin) ──
create or replace function public.radio_list_all_listeners(p_church_id uuid)
returns table (
  id uuid,
  name text,
  email text,
  status text,
  source text,
  created_at timestamptz,
  program_ids uuid[]
)
language sql
security definer
set search_path = public
as $$
  select
    l.id,
    l.name,
    l.email,
    l.status,
    l.source,
    l.created_at,
    coalesce(array_agg(lp.program_id) filter (where lp.program_id is not null), array[]::uuid[]) as program_ids
  from public.radio_listeners l
  left join public.radio_listener_programs lp on lp.listener_id = l.id
  where (p_church_id is null or l.church_id = p_church_id)
  group by l.id
  order by l.created_at desc;
$$;