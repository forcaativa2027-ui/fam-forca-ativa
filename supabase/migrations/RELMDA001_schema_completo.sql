-- ============================================================
-- CEC FAMILY — RELMDA-001/002/003: Relatório Integrado de Life
-- Groups e Supervisão de Rede.
--
-- O frontend (RelmdaLiderForm, RelmdaSupervisorAdmin,
-- RelmdaConsolidacaoAdmin, RelmdaDashboardAdmin,
-- RelmdaReportPrintView) já existe e já espera exatamente este
-- contrato de tabelas/RPCs — reconstruído a partir da leitura de
-- src/services/relmdaReports.ts e src/types/domain.ts.
--
-- Nomenclatura confirmada com o cliente:
--   MDA semanal = encontros de discipulado um-a-um (mda_count)
--   EMP = Escola Ministerial Paz (emp_participants/emp_occurrences)
--   CC = Célula de Crescimento = o próprio Life Group (NÃO é campo)
--   Cesta Básica = Kg do Amor (mesmo item; kg_amor é o campo principal)
--   "Dízimos e Ofertas" → renomeado na tela pra "Momento de Generosidade"
-- ============================================================

-- ============================================================
-- 1) Enums
-- ============================================================
do $$ begin
  create type relmda_status as enum (
    'rascunho','enviado','em_analise','correcao_solicitada','corrigido','validado','encerrado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type relmda_health as enum ('muito_saudavel','saudavel','atencao','necessita_apoio');
exception when duplicate_object then null; end $$;

do $$ begin
  create type relmda_flow as enum ('muito_bem','bem','regular','dificil');
exception when duplicate_object then null; end $$;

do $$ begin
  create type relmda_visitor_followup as enum ('sem_contato','contatado','em_acompanhamento','integrado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type relmda_no_meeting_reason as enum (
    'feriado','evento_igreja','enfermidade','ausencia_lideranca','reorganizacao','outro'
  );
exception when duplicate_object then null; end $$;

-- ============================================================
-- 2) Tabela principal — relmda_weekly_reports
-- ============================================================
create table if not exists public.relmda_weekly_reports (
  id                          uuid primary key default gen_random_uuid(),
  life_group_id               uuid not null references public.life_groups(id) on delete cascade,
  week_number                 int not null,
  month                       int not null check (month between 1 and 12),
  year                        int not null check (year between 2020 and 2100),
  reference_date              date,

  happened                    boolean not null default true,
  no_meeting_reason           relmda_no_meeting_reason,
  no_meeting_note             text,
  extraordinary               boolean not null default false,
  week_note                   text,

  -- Discipulado / MDA (um-a-um)
  mda_count                   int not null default 0 check (mda_count >= 0),
  new_discipleships           int not null default 0 check (new_discipleships >= 0),
  interrupted_discipleships   int not null default 0 check (interrupted_discipleships >= 0),

  -- Grupo de Evangelismo
  ge_happened                 boolean not null default false,
  ge_count                    int not null default 0 check (ge_count >= 0),
  evangelism_group_id         uuid references public.evangelism_groups(id) on delete set null,
  ge_people_reached           int not null default 0 check (ge_people_reached >= 0),
  ge_decisions                int not null default 0 check (ge_decisions >= 0),

  -- TADEL
  tadel_count                 int not null default 0 check (tadel_count >= 0),

  -- EMP — Escola Ministerial Paz
  emp_participants            int not null default 0 check (emp_participants >= 0),
  emp_occurrences             int not null default 0 check (emp_occurrences >= 0),

  -- Momento de Generosidade (ofertas)
  offering_pix                numeric(10,2) not null default 0 check (offering_pix >= 0),
  offering_especie            numeric(10,2) not null default 0 check (offering_especie >= 0),
  offering_outros             numeric(10,2) not null default 0 check (offering_outros >= 0),
  offering_outros_desc        text,
  offering_total              numeric(10,2) generated always as (offering_pix + offering_especie + offering_outros) stored,

  -- Quilo do Amor (Cesta Básica = mesmo item)
  kg_amor                     numeric(10,2) not null default 0 check (kg_amor >= 0),
  cestas_completas            int not null default 0 check (cestas_completas >= 0),

  -- Conteúdo do encontro
  topic                       text,
  bible_text                  text,
  flow                        relmda_flow,
  health_assessment           relmda_health,
  health_comment              text,
  summary                     text,

  -- Status e histórico
  status                      relmda_status not null default 'rascunho',
  created_by                  uuid references public.profiles(id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  sent_by                     uuid references public.profiles(id) on delete set null,
  sent_at                     timestamptz,
  validated_by                uuid references public.profiles(id) on delete set null,
  validated_at                timestamptz,

  -- Campos exclusivos do supervisor
  supervisor_note             text,
  needs_correction            boolean not null default false,
  correction_items            text[],
  correction_deadline         timestamptz,
  needs_support                boolean not null default false,
  support_type                 text,

  unique (life_group_id, week_number, month, year)
);
comment on table public.relmda_weekly_reports is 'RELMDA-001: relatório semanal do Life Group — 1 por LG/semana/mês/ano.';

create index if not exists idx_relmda_reports_lg on public.relmda_weekly_reports(life_group_id);
create index if not exists idx_relmda_reports_period on public.relmda_weekly_reports(year, month, week_number);
create index if not exists idx_relmda_reports_status on public.relmda_weekly_reports(status);

create or replace function public.relmda_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists trg_relmda_touch on public.relmda_weekly_reports;
create trigger trg_relmda_touch before update on public.relmda_weekly_reports
  for each row execute function public.relmda_touch_updated_at();

-- ============================================================
-- 3) Tabelas relacionadas
-- ============================================================
create table if not exists public.relmda_attendance (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.relmda_weekly_reports(id) on delete cascade,
  member_id  uuid not null references public.members(id) on delete cascade,
  present    boolean not null default false,
  unique (report_id, member_id)
);

create table if not exists public.relmda_visitors (
  id               uuid primary key default gen_random_uuid(),
  report_id        uuid not null references public.relmda_weekly_reports(id) on delete cascade,
  full_name        text not null,
  phone            text,
  first_visit      boolean not null default true,
  followup_status  relmda_visitor_followup not null default 'sem_contato',
  note             text,
  created_at       timestamptz not null default now()
);

create table if not exists public.relmda_pastoral_needs (
  id                uuid primary key default gen_random_uuid(),
  report_id         uuid not null references public.relmda_weekly_reports(id) on delete cascade,
  need_type         text,
  urgent_prayer     boolean not null default false,
  pastoral_visit    boolean not null default false,
  related_member_id uuid references public.members(id) on delete set null,
  description       text,
  responsible_id    uuid references public.profiles(id) on delete set null,
  deadline          date,
  status            text not null default 'aberto',
  created_at        timestamptz not null default now()
);

create table if not exists public.relmda_status_history (
  id           uuid primary key default gen_random_uuid(),
  report_id    uuid not null references public.relmda_weekly_reports(id) on delete cascade,
  from_status  relmda_status,
  to_status    relmda_status not null,
  changed_by   uuid references public.profiles(id) on delete set null,
  changed_at   timestamptz not null default now(),
  note         text
);

-- ============================================================
-- 4) RLS — escopo pela igreja do Life Group (accessible_church_ids)
-- ============================================================
alter table public.relmda_weekly_reports enable row level security;
alter table public.relmda_attendance enable row level security;
alter table public.relmda_visitors enable row level security;
alter table public.relmda_pastoral_needs enable row level security;
alter table public.relmda_status_history enable row level security;

drop policy if exists relmda_reports_scoped on public.relmda_weekly_reports;
create policy relmda_reports_scoped on public.relmda_weekly_reports for all to authenticated
  using (
    life_group_id in (
      select lg.id from public.life_groups lg where lg.church_id in (select public.accessible_church_ids())
    )
    or life_group_id in (select id from public.life_groups where leader_id = auth.uid() or coleader_id = auth.uid())
  )
  with check (
    life_group_id in (
      select lg.id from public.life_groups lg where lg.church_id in (select public.accessible_church_ids())
    )
    or life_group_id in (select id from public.life_groups where leader_id = auth.uid() or coleader_id = auth.uid())
  );

drop policy if exists relmda_attendance_scoped on public.relmda_attendance;
create policy relmda_attendance_scoped on public.relmda_attendance for all to authenticated
  using (report_id in (select id from public.relmda_weekly_reports))
  with check (report_id in (select id from public.relmda_weekly_reports));

drop policy if exists relmda_visitors_scoped on public.relmda_visitors;
create policy relmda_visitors_scoped on public.relmda_visitors for all to authenticated
  using (report_id in (select id from public.relmda_weekly_reports))
  with check (report_id in (select id from public.relmda_weekly_reports));

drop policy if exists relmda_needs_scoped on public.relmda_pastoral_needs;
create policy relmda_needs_scoped on public.relmda_pastoral_needs for all to authenticated
  using (report_id in (select id from public.relmda_weekly_reports))
  with check (report_id in (select id from public.relmda_weekly_reports));

drop policy if exists relmda_history_scoped on public.relmda_status_history;
create policy relmda_history_scoped on public.relmda_status_history for select to authenticated
  using (report_id in (select id from public.relmda_weekly_reports));
drop policy if exists relmda_history_insert on public.relmda_status_history;
create policy relmda_history_insert on public.relmda_status_history for insert to authenticated
  with check (report_id in (select id from public.relmda_weekly_reports));

grant select, insert, update, delete on public.relmda_weekly_reports, public.relmda_attendance,
  public.relmda_visitors, public.relmda_pastoral_needs to authenticated;
grant select, insert on public.relmda_status_history to authenticated;

-- ============================================================
-- 5) RPC: obter ou criar o rascunho da semana
-- ============================================================
create or replace function public.relmda_get_or_create_draft(
  p_life_group_id uuid, p_week_number int, p_month int, p_year int
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  select id into v_id from public.relmda_weekly_reports
  where life_group_id = p_life_group_id and week_number = p_week_number and month = p_month and year = p_year;

  if v_id is not null then return v_id; end if;

  insert into public.relmda_weekly_reports (life_group_id, week_number, month, year, created_by)
  values (p_life_group_id, p_week_number, p_month, p_year, auth.uid())
  returning id into v_id;

  insert into public.relmda_status_history (report_id, from_status, to_status, changed_by)
  values (v_id, null, 'rascunho', auth.uid());

  return v_id;
end; $$;
grant execute on function public.relmda_get_or_create_draft(uuid, int, int, int) to authenticated;

-- ============================================================
-- 6) RPC: snapshot do Life Group (total de membros / com discipulador)
-- ============================================================
create or replace function public.relmda_lg_snapshot(p_life_group_id uuid)
returns table (total_members int, with_discipler int)
language sql stable security definer set search_path = public as $$
  select
    count(*)::int as total_members,
    count(*) filter (where discipler_id is not null)::int as with_discipler
  from public.members
  where life_group_id = p_life_group_id and status = 'ativo';
$$;
grant execute on function public.relmda_lg_snapshot(uuid) to authenticated;

-- ============================================================
-- 7) RPC: enviar relatório (líder)
-- ============================================================
create or replace function public.relmda_send_report(p_report_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_status relmda_status;
  v_next relmda_status;
begin
  select status into v_status from public.relmda_weekly_reports where id = p_report_id;
  if v_status is null then raise exception 'Relatório não encontrado'; end if;

  if v_status = 'rascunho' then v_next := 'enviado';
  elsif v_status = 'correcao_solicitada' then v_next := 'corrigido';
  else raise exception 'Relatório não pode ser enviado no status atual (%)', v_status;
  end if;

  update public.relmda_weekly_reports
  set status = v_next,
      sent_by = auth.uid(), sent_at = now(),
      needs_correction = case when v_next = 'corrigido' then false else needs_correction end
  where id = p_report_id;

  insert into public.relmda_status_history (report_id, from_status, to_status, changed_by)
  values (p_report_id, v_status, v_next, auth.uid());
end; $$;
grant execute on function public.relmda_send_report(uuid) to authenticated;

-- ============================================================
-- 8) RPC: supervisor — marcar em análise
-- ============================================================
create or replace function public.relmda_mark_in_analysis(p_report_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_status relmda_status;
begin
  select status into v_status from public.relmda_weekly_reports where id = p_report_id;
  if v_status not in ('enviado','corrigido') then
    raise exception 'Só é possível analisar relatórios enviados ou corrigidos (status atual: %)', v_status;
  end if;
  update public.relmda_weekly_reports set status = 'em_analise' where id = p_report_id;
  insert into public.relmda_status_history (report_id, from_status, to_status, changed_by)
  values (p_report_id, v_status, 'em_analise', auth.uid());
end; $$;
grant execute on function public.relmda_mark_in_analysis(uuid) to authenticated;

-- ============================================================
-- 9) RPC: supervisor — solicitar correção
-- ============================================================
create or replace function public.relmda_request_correction(
  p_report_id uuid, p_items text[], p_note text, p_deadline timestamptz
) returns void
language plpgsql security definer set search_path = public as $$
declare v_status relmda_status;
begin
  select status into v_status from public.relmda_weekly_reports where id = p_report_id;
  update public.relmda_weekly_reports set
    status = 'correcao_solicitada',
    needs_correction = true,
    correction_items = p_items,
    correction_deadline = p_deadline,
    supervisor_note = p_note
  where id = p_report_id;
  insert into public.relmda_status_history (report_id, from_status, to_status, changed_by, note)
  values (p_report_id, v_status, 'correcao_solicitada', auth.uid(), p_note);
end; $$;
grant execute on function public.relmda_request_correction(uuid, text[], text, timestamptz) to authenticated;

-- ============================================================
-- 10) RPC: supervisor — validar
-- ============================================================
create or replace function public.relmda_validate_report(p_report_id uuid, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_status relmda_status;
begin
  select status into v_status from public.relmda_weekly_reports where id = p_report_id;
  if v_status <> 'em_analise' then
    raise exception 'Só é possível validar relatórios em análise (status atual: %)', v_status;
  end if;
  update public.relmda_weekly_reports set
    status = 'validado', validated_by = auth.uid(), validated_at = now(),
    supervisor_note = coalesce(p_note, supervisor_note)
  where id = p_report_id;
  insert into public.relmda_status_history (report_id, from_status, to_status, changed_by, note)
  values (p_report_id, v_status, 'validado', auth.uid(), p_note);
end; $$;
grant execute on function public.relmda_validate_report(uuid, text) to authenticated;

-- ============================================================
-- 11) RPC: supervisor — salvar nota/apoio sem mudar status
-- ============================================================
create or replace function public.relmda_save_supervisor_note(
  p_report_id uuid, p_note text, p_needs_support boolean, p_support_type text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.relmda_weekly_reports set
    supervisor_note = p_note, needs_support = p_needs_support, support_type = p_support_type
  where id = p_report_id;
end; $$;
grant execute on function public.relmda_save_supervisor_note(uuid, text, boolean, text) to authenticated;

-- ============================================================
-- 12) RPC: visão do supervisor (Fase 2) — 1 linha por Life Group
-- ============================================================
create or replace function public.relmda_supervisor_overview(p_week_number int, p_month int, p_year int)
returns table (
  life_group_id uuid, life_group_name text, leader_name text,
  church_id uuid, church_name text,
  report_id uuid, status relmda_status, sent_at timestamptz,
  total_members int, mda_count int, visitantes_count int, ge_count int,
  offering_total numeric, kg_amor numeric, tadel_count int, emp_participants int,
  needs_correction boolean, correction_deadline timestamptz, is_inconsistent boolean
)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  select
    lg.id, lg.name,
    p.full_name,
    lg.church_id, ch.name,
    r.id, coalesce(r.status, 'rascunho'::relmda_status), r.sent_at,
    coalesce((select count(*)::int from public.members m where m.life_group_id = lg.id and m.status = 'ativo'), 0),
    coalesce(r.mda_count, 0),
    coalesce((select count(*)::int from public.relmda_visitors v where v.report_id = r.id), 0),
    coalesce(r.ge_count, 0),
    coalesce(r.offering_total, 0),
    coalesce(r.kg_amor, 0),
    coalesce(r.tadel_count, 0),
    coalesce(r.emp_participants, 0),
    coalesce(r.needs_correction, false),
    r.correction_deadline,
    -- Inconsistências (RELMDA-002 §20 — subconjunto bloqueante/relevante)
    coalesce(
      (r.id is not null and r.happened and (
        (select count(*) from public.members m where m.life_group_id = lg.id and m.status='ativo') = 0
        or r.offering_total > 0 and not r.happened
      )),
      false
    )
  from public.life_groups lg
  left join public.churches ch on ch.id = lg.church_id
  left join public.profiles p on p.id = lg.leader_id
  left join public.relmda_weekly_reports r
    on r.life_group_id = lg.id and r.week_number = p_week_number and r.month = p_month and r.year = p_year
  where lg.is_active and lg.church_id in (select public.accessible_church_ids())
  order by lg.name;
end; $$;
grant execute on function public.relmda_supervisor_overview(int, int, int) to authenticated;

-- ============================================================
-- 13) RPC: comparativo mensal (Fase 4) — 1 linha por semana do mês
-- ============================================================
create or replace function public.relmda_monthly_comparison(p_month int, p_year int)
returns table (
  week_number int, life_groups int, total_members int, mda_count int, ge_count int,
  visitantes_count int, offering_total numeric, kg_amor numeric, tadel_count int,
  emp_participants int, enviados int, esperados int
)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  select
    r.week_number,
    count(distinct r.life_group_id)::int,
    coalesce(sum((select count(*)::int from public.members m where m.life_group_id = r.life_group_id and m.status='ativo')), 0)::int,
    coalesce(sum(r.mda_count), 0)::int,
    coalesce(sum(r.ge_count), 0)::int,
    coalesce((select count(*)::int from public.relmda_visitors v join public.relmda_weekly_reports r2 on r2.id = v.report_id
              where r2.month = p_month and r2.year = p_year and r2.week_number = r.week_number), 0),
    coalesce(sum(r.offering_total), 0),
    coalesce(sum(r.kg_amor), 0),
    coalesce(sum(r.tadel_count), 0)::int,
    coalesce(sum(r.emp_participants), 0)::int,
    count(*) filter (where r.status <> 'rascunho')::int,
    (select count(*)::int from public.life_groups lg where lg.is_active and lg.church_id in (select public.accessible_church_ids()))
  from public.relmda_weekly_reports r
  where r.month = p_month and r.year = p_year
    and r.life_group_id in (select id from public.life_groups where church_id in (select public.accessible_church_ids()))
  group by r.week_number
  order by r.week_number;
end; $$;
grant execute on function public.relmda_monthly_comparison(int, int) to authenticated;
