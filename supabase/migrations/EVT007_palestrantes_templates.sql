-- ============================================================
-- CEC FAMILY — EVT007: Palestrantes + templates + reapresentação
-- do pop-up (CEC-EVT-001, seção 17 — pop-up completo, parte 2)
-- Idempotente.
-- ============================================================

-- ---------- 1) Palestrantes/convidados do evento ----------
create table if not exists public.event_speakers (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.registration_events(id) on delete cascade,
  name        text not null,
  photo_url   text,
  topic       text,                 -- tema/assunto que a pessoa vai tratar
  order_index int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_event_speakers_event on public.event_speakers(event_id, order_index);

alter table public.event_speakers enable row level security;

drop policy if exists event_speakers_public_read on public.event_speakers;
create policy event_speakers_public_read on public.event_speakers for select to anon, authenticated
  using (
    exists (
      select 1 from public.registration_events e
      where e.id = event_id and e.status in (
        'agendado', 'inscricoes_abertas', 'inscricoes_encerradas', 'lotado', 'em_andamento', 'finalizado', 'cancelado'
      )
    )
  );

drop policy if exists event_speakers_staff_write on public.event_speakers;
create policy event_speakers_staff_write on public.event_speakers for all to authenticated
  using (
    exists (
      select 1 from public.registration_events e
      where e.id = event_id and (public.is_apostle() or e.church_id is null or e.church_id in (select public.accessible_church_ids()))
    )
  )
  with check (
    exists (
      select 1 from public.registration_events e
      where e.id = event_id and (public.is_apostle() or e.church_id is null or e.church_id in (select public.accessible_church_ids()))
    )
  );

-- ---------- 2) Template visual e regras de reapresentação do pop-up ----------
alter table public.registration_events add column if not exists popup_template text not null default 'classico';
alter table public.registration_events add column if not exists popup_repeat_mode text not null default 'uma_vez_por_sessao';
alter table public.registration_events add column if not exists popup_repeat_interval_hours int;

comment on column public.registration_events.popup_template is
  'Estilo visual do pop-up: classico | moderno | jovem (texto livre, não enum — novos templates não exigem migration)';
comment on column public.registration_events.popup_repeat_mode is
  'sempre | uma_vez_por_sessao | intervalo_horas | uma_vez_so — controla quando o pop-up reaparece pro mesmo usuário';
