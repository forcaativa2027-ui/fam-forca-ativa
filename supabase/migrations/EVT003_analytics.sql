-- ============================================================
-- CEC FAMILY — EVT003: Indicadores do evento (CEC-EVT-001, seção 19)
-- Funil: Visualizações → Cliques → Inscrições confirmadas
-- "Inscrições concluídas" não precisa de log próprio — já é a contagem
-- real de public.event_registrations (fonte da verdade).
-- Idempotente.
-- ============================================================

do $$ begin
  create type event_analytics_kind as enum ('view', 'click_inscrever');
exception when duplicate_object then null; end $$;

create table if not exists public.event_analytics (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.registration_events(id) on delete cascade,
  kind        event_analytics_kind not null,
  origin      text,                          -- 'agenda' | 'alertas' | 'popup' | 'pagina_publica' | 'link_direto' | 'whatsapp' | 'facebook' | 'qrcode' | outro texto livre
  session_id  text,                           -- id anônimo gerado no navegador (localStorage), pra estimar "visitantes únicos"
  created_at  timestamptz not null default now()
);

create index if not exists idx_event_analytics_event on public.event_analytics(event_id, kind);

alter table public.event_analytics enable row level security;

-- Qualquer um (logado ou não) pode registrar uma visualização/clique — é write-only pro público.
drop policy if exists event_analytics_public_insert on public.event_analytics;
create policy event_analytics_public_insert on public.event_analytics for insert to anon, authenticated
  with check (true);

-- Só quem tem escopo sobre a igreja do evento (ou apóstolo) pode ler os dados brutos.
drop policy if exists event_analytics_staff_read on public.event_analytics;
create policy event_analytics_staff_read on public.event_analytics for select to authenticated
  using (
    exists (
      select 1 from public.registration_events e
      where e.id = event_id and (
        public.is_apostle()
        or e.church_id is null
        or e.church_id in (select public.accessible_church_ids())
      )
    )
  );

-- ---------- Registrar uma visualização ou clique ----------
create or replace function public.log_event_analytics(
  p_event_id uuid, p_kind event_analytics_kind, p_origin text default null, p_session_id text default null
) returns void
language sql security definer set search_path = public as $$
  insert into public.event_analytics (event_id, kind, origin, session_id)
  values (p_event_id, p_kind, p_origin, p_session_id);
$$;
grant execute on function public.log_event_analytics(uuid, event_analytics_kind, text, text) to anon, authenticated;

-- ---------- Funil consolidado por evento ----------
create or replace function public.get_event_funnel(p_event_id uuid)
returns table (
  views int, unique_sessions int, clicks int,
  inscricoes_confirmadas int, inscricoes_lista_espera int, inscricoes_canceladas int,
  conversao_pct numeric
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_views int; v_sessions int; v_clicks int;
  v_confirmadas int; v_espera int; v_canceladas int;
  v_church_id uuid;
begin
  select church_id into v_church_id from public.registration_events where id = p_event_id;
  if v_church_id is not null and v_church_id not in (select public.accessible_church_ids()) and not public.is_apostle() then
    raise exception 'Sem permissão para ver os indicadores deste evento' using errcode = '42501';
  end if;

  select count(*) filter (where kind = 'view'),
         count(distinct session_id) filter (where kind = 'view' and session_id is not null),
         count(*) filter (where kind = 'click_inscrever')
    into v_views, v_sessions, v_clicks
  from public.event_analytics where event_id = p_event_id;

  select count(*) filter (where status = 'confirmada'),
         count(*) filter (where status = 'lista_espera'),
         count(*) filter (where status = 'cancelada')
    into v_confirmadas, v_espera, v_canceladas
  from public.event_registrations where event_id = p_event_id;

  return query select
    coalesce(v_views, 0), coalesce(v_sessions, 0), coalesce(v_clicks, 0),
    coalesce(v_confirmadas, 0), coalesce(v_espera, 0), coalesce(v_canceladas, 0),
    case when coalesce(v_views, 0) = 0 then 0
         else round((coalesce(v_confirmadas, 0) + coalesce(v_espera, 0))::numeric / v_views * 100, 1)
    end;
end; $$;
grant execute on function public.get_event_funnel(uuid) to authenticated;

-- ---------- Origem dos acessos (pra tabela "de onde vieram os inscritos") ----------
create or replace function public.get_event_analytics_by_origin(p_event_id uuid)
returns table (origin text, views int, clicks int)
language sql stable security definer set search_path = public as $$
  select coalesce(ea.origin, 'desconhecida'),
         count(*) filter (where ea.kind = 'view')::int,
         count(*) filter (where ea.kind = 'click_inscrever')::int
  from public.event_analytics ea
  join public.registration_events e on e.id = ea.event_id
  where ea.event_id = p_event_id
    and (public.is_apostle() or e.church_id is null or e.church_id in (select public.accessible_church_ids()))
  group by coalesce(ea.origin, 'desconhecida')
  order by count(*) desc;
$$;
grant execute on function public.get_event_analytics_by_origin(uuid) to authenticated;
