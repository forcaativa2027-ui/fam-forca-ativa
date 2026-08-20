-- ============================================================
-- CEC FAMILY — Live-360: Slice 4/5 — temas por sessão, preview
-- e histórico de comandos. Aditivo — não quebra o que já existe.
-- ============================================================

-- ── Tema visual da sessão (presets aplicados na projeção) ──
do $$ begin
  alter table public.live_sessions add column if not exists theme jsonb;
exception when others then null; end $$;

-- ── Histórico de comandos (admin): lista com operador/token e payload ──
create or replace function public.live_list_command_log(
  p_session_id uuid,
  p_limit int default 50
) returns table (
  id bigint,
  cmd text,
  payload jsonb,
  operator_name text,
  token_id uuid,
  client_id text,
  created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select l.id, l.cmd, l.payload,
         coalesce(p.name, p.email, 'Admin') as operator_name,
         l.token_id, l.client_id, l.created_at
    from public.live_command_log l
    left join public.profiles p on p.id = l.operator
   where l.session_id = p_session_id
   order by l.created_at desc
   limit p_limit;
$$;
grant execute on function public.live_list_command_log(uuid, int) to authenticated;

-- ── Aplica tema na sessão (admin) ──
create or replace function public.live_set_session_theme(p_session_id uuid, p_theme jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito';
  end if;
  update public.live_sessions
     set theme = p_theme
   where id = p_session_id;
end $$;
grant execute on function public.live_set_session_theme(uuid, jsonb) to authenticated;

-- ── Lê o tema da sessão (projeção e controle) ──
create or replace function public.live_get_session_theme(p_session_id uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select s.theme from public.live_sessions s where s.id = p_session_id;
$$;
grant execute on function public.live_get_session_theme(uuid) to authenticated, anon;