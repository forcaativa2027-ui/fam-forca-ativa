-- RADIO010 — Ciclo 8: Relatórios de audiência avançados
-- Séries temporais e agregações sobre radio_play_events com filtros.

-- Série temporal de plays (diário/semanal/mensal)
create or replace function public.radio_play_series(
  p_church_id uuid,
  p_days int default 30,
  p_bucket text default 'day',     -- day | week | month
  p_program_id uuid default null
) returns table (bucket date, plays bigint, seconds bigint)
language sql
security definer
set search_path = public
as $$
  select
    date_trunc(p_bucket, pe.started_at)::date as bucket,
    count(*)::bigint as plays,
    coalesce(sum(pe.listened_seconds), 0)::bigint as seconds
  from public.radio_play_events pe
  where pe.church_id = p_church_id
    and pe.started_at >= now() - make_interval(days => p_days)
    and (p_program_id is null or pe.program_id = p_program_id)
  group by 1
  order by 1;
$$;

-- Plays por programa
create or replace function public.radio_play_by_program(
  p_church_id uuid,
  p_days int default 30,
  p_program_id uuid default null
) returns table (program text, plays bigint, seconds bigint)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(p.title, '(sem programa)')::text as program,
    count(pe.id)::bigint as plays,
    coalesce(sum(pe.listened_seconds), 0)::bigint as seconds
  from public.radio_play_events pe
  left join public.radio_programs p on p.id = pe.program_id
  where pe.church_id = p_church_id
    and pe.started_at >= now() - make_interval(days => p_days)
    and (p_program_id is null or pe.program_id = p_program_id)
  group by 1
  order by plays desc;
$$;

-- Plays por origem (live/podcast/episode/reprise/recording)
create or replace function public.radio_play_by_source(
  p_church_id uuid,
  p_days int default 30
) returns table (source text, plays bigint, seconds bigint)
language sql
security definer
set search_path = public
as $$
  select
    pe.source::text as source,
    count(*)::bigint as plays,
    coalesce(sum(pe.listened_seconds), 0)::bigint as seconds
  from public.radio_play_events pe
  where pe.church_id = p_church_id
    and pe.started_at >= now() - make_interval(days => p_days)
  group by 1
  order by plays desc;
$$;