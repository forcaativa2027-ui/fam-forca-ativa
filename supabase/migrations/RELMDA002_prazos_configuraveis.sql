-- ============================================================
-- CEC FAMILY — RELMDA Fase 5: Prazos configuráveis por comunidade
--
-- Cada Igreja pode ter seu próprio dia/horário limite de envio do
-- relatório semanal, além do prazo padrão de correção. Se a igreja
-- não tiver configuração própria, usa o padrão global (church_id
-- null) — que já vem com um valor sensato pré-cadastrado.
-- ============================================================

create table if not exists public.relmda_deadline_config (
  id                        uuid primary key default gen_random_uuid(),
  church_id                 uuid references public.churches(id) on delete cascade,
  deadline_weekday          int not null default 1 check (deadline_weekday between 0 and 6), -- 0=domingo ... 1=segunda
  deadline_time             time not null default '18:00',
  correction_deadline_days  int not null default 1 check (correction_deadline_days >= 0),
  reminder_before_hours     int not null default 2 check (reminder_before_hours >= 0),
  created_at                timestamptz not null default now(),
  unique (church_id)
);
comment on table public.relmda_deadline_config is 'RELMDA Fase 5 — prazo de envio/correção configurável por igreja (church_id null = padrão global).';

-- Padrão global (igual o exemplo do RELMDA-001 §15: segunda-feira 18h)
insert into public.relmda_deadline_config (church_id, deadline_weekday, deadline_time, correction_deadline_days, reminder_before_hours)
select null, 1, '18:00', 1, 2
where not exists (select 1 from public.relmda_deadline_config where church_id is null);

alter table public.relmda_deadline_config enable row level security;

drop policy if exists relmda_deadline_read on public.relmda_deadline_config;
create policy relmda_deadline_read on public.relmda_deadline_config for select to authenticated using (true);

drop policy if exists relmda_deadline_write on public.relmda_deadline_config;
create policy relmda_deadline_write on public.relmda_deadline_config for all to authenticated
  using (public.is_apostle()) with check (public.is_apostle());

grant select on public.relmda_deadline_config to authenticated;

-- ============================================================
-- RPC: prazo efetivo de uma igreja (usa a config própria, ou o
-- padrão global se ela não tiver uma configuração específica)
-- ============================================================
create or replace function public.relmda_effective_deadline(p_church_id uuid)
returns table (deadline_weekday int, deadline_time time, correction_deadline_days int, reminder_before_hours int)
language sql stable security definer set search_path = public as $$
  select deadline_weekday, deadline_time, correction_deadline_days, reminder_before_hours
  from public.relmda_deadline_config
  where church_id = p_church_id
  union all
  select deadline_weekday, deadline_time, correction_deadline_days, reminder_before_hours
  from public.relmda_deadline_config
  where church_id is null
    and not exists (select 1 from public.relmda_deadline_config where church_id = p_church_id)
  limit 1;
$$;
grant execute on function public.relmda_effective_deadline(uuid) to authenticated;
