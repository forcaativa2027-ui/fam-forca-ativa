-- ============================================================
-- CEC FAMILY — Live-360: RPCs (Slice 1).
-- Padrão security definer + set search_path = public, como as
-- funções radio_*/REL001.
-- ============================================================

-- ── Criar sessão (admin) ──
create or replace function public.live_start_session(
  p_church_id uuid,
  p_title text default 'Sessão ao vivo'
) returns table (id uuid, church_id uuid, title text, status public.live_session_status, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito';
  end if;
  return query
    insert into public.live_sessions (church_id, title, status, created_by)
    values (p_church_id, p_title, 'offline', auth.uid())
    returning id, church_id, title, status, created_at;
end $$;
grant execute on function public.live_start_session(uuid, text) to authenticated;

-- ── Aplicar comando de controle (admin OU token válido). Idempotente via client_id. ──
create or replace function public.live_apply_command(
  p_session_id uuid,
  p_cmd text,
  p_kind public.live_item_kind,
  p_ref text default null,
  p_payload jsonb default '{}'::jsonb,
  p_token text default null,
  p_client_id text default null
) returns table (session_id uuid, kind public.live_item_kind, ref text, payload jsonb, seq bigint, updated_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_token_id uuid;
  v_seq bigint;
  v_updated timestamptz;
begin
  if p_token is null then
    if not public.is_admin() then
      raise exception 'Acesso restrito';
    end if;
  else
    select t.id into v_token_id
      from public.live_control_tokens t
     where t.session_id = p_session_id
       and t.token = encode(sha256(p_token::bytea), 'hex')
       and t.expires_at > now()
       and t.revoked_at is null
       and t.role = 'operator';
    if v_token_id is null then
      raise exception 'Token inválido ou expirado';
    end if;
  end if;

  -- Idempotência: mesmo client_id já processado → retorna estado atual.
  if p_client_id is not null and exists (
    select 1 from public.live_command_log
    where session_id = p_session_id and client_id = p_client_id
  ) then
    return query select c.session_id, c.kind, c.ref, c.payload, c.seq, c.updated_at
      from public.live_current_item c where c.session_id = p_session_id;
    return;
  end if;

  insert into public.live_current_item (session_id, kind, ref, payload, seq)
  values (p_session_id, p_kind, p_ref, p_payload, coalesce(
    (select seq from public.live_current_item where session_id = p_session_id), 0) + 1)
  on conflict (session_id) do update
    set kind = excluded.kind,
        ref = excluded.ref,
        payload = excluded.payload,
        seq = public.live_current_item.seq + 1,
        updated_at = now()
  returning seq, updated_at into v_seq, v_updated;

  insert into public.live_command_log (session_id, cmd, payload, operator, token_id, client_id)
  values (p_session_id, p_cmd, p_payload,
          case when v_token_id is null then auth.uid() else null end,
          v_token_id, p_client_id);

  return query select c.session_id, c.kind, c.ref, c.payload, c.seq, c.updated_at
    from public.live_current_item c where c.session_id = p_session_id;
end $$;
grant execute on function public.live_apply_command(uuid, text, public.live_item_kind, text, jsonb, text, text)
  to authenticated, anon;

-- ── Ler o que está no ar (datashow, acesso público restrito) ──
create or replace function public.live_get_current(p_session_id uuid)
returns table (kind public.live_item_kind, ref text, payload jsonb, seq bigint, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.kind, c.ref, c.payload, c.seq, c.updated_at
    from public.live_current_item c
   where c.session_id = p_session_id;
$$;
grant execute on function public.live_get_current(uuid) to authenticated, anon;

-- ── Congela/descongela a tela (Session Freeze) ──
create or replace function public.live_freeze(p_session_id uuid, p_frozen boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito';
  end if;
  update public.live_sessions
     set status = case when p_frozen then 'frozen'::public.live_session_status
                       else 'live'::public.live_session_status end
   where id = p_session_id;
end $$;
grant execute on function public.live_freeze(uuid, boolean) to authenticated;

-- ── Token efêmero: devolve o valor CRU uma única vez (banco guarda só o hash) ──
create or replace function public.live_create_control_token(
  p_session_id uuid,
  p_role public.live_token_role default 'operator',
  p_expires_in interval default interval '2 hours'
) returns table (raw_token text, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_raw text := encode(gen_random_bytes(32), 'hex');
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito';
  end if;
  insert into public.live_control_tokens (session_id, token, role, expires_at, created_by)
  values (p_session_id, encode(sha256(v_raw::bytea), 'hex'), p_role, now() + p_expires_in, auth.uid());
  return query select v_raw, now() + p_expires_in;
end $$;
grant execute on function public.live_create_control_token(uuid, public.live_token_role, interval) to authenticated;

-- ── Valida um token (acesso sem login antes de abrir o controle) ──
create or replace function public.live_validate_token(p_session_id uuid, p_token text)
returns table (valid boolean, role public.live_token_role, session_title text)
language sql stable security definer set search_path = public as $$
  select (t.id is not null) as valid, t.role,
         case when t.id is not null then s.title end as session_title
    from public.live_sessions s
    left join public.live_control_tokens t
      on t.session_id = s.id
     and t.token = encode(sha256(p_token::bytea), 'hex')
     and t.expires_at > now()
     and t.revoked_at is null
   where s.id = p_session_id;
$$;
grant execute on function public.live_validate_token(uuid, text) to authenticated, anon;