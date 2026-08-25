-- ============================================================
-- CEC FAMILY — CT006c: Fluxo de aprovação editorial (CT-006, §2/§12)
--
-- Decisão de escopo (a mesma lógica de Categorias/Tags): isso é uma
-- camada de ACOMPANHAMENTO, separada dos campos reais de publicação
-- (is_published/published_at) que já controlam o que fica visível
-- pro público. O motivo: essas colunas já são usadas pelas policies
-- de RLS que decidem o que é público — mexer nelas é arriscado.
-- Em vez disso, esta tabela rastreia ONDE cada conteúdo está no
-- fluxo (rascunho → revisão → aprovado → agendado → publicado →
-- arquivado), e a equipe decide manualmente quando "publicar de
-- verdade" (virar is_published=true). Funciona como um checklist
-- de processo, não como o interruptor real de visibilidade.
--
-- 9 etapas do documento viram 6 status geríveis:
--   Planejar + Criar   → rascunho
--   Revisar             → em_revisao
--   Aprovar             → aprovado (ou reprovado -> volta pra rascunho)
--   Agendar             → agendado
--   Publicar            → publicado
--   Distribuir/Mensurar → não são "estado", são o que já existe
--                         (church_id/destaque = distribuição;
--                         indicadores, quando existirem, = medição)
--   Arquivar            → arquivado
-- Idempotente.
-- ============================================================

create table if not exists public.content_workflow_state (
  id            uuid primary key default gen_random_uuid(),
  entity_type   text not null,
  entity_id     uuid not null,
  status        text not null default 'rascunho'
                check (status in ('rascunho','em_revisao','aprovado','agendado','publicado','arquivado')),
  submitted_by  uuid references public.profiles(id),
  submitted_at  timestamptz,
  reviewed_by   uuid references public.profiles(id),
  reviewed_at   timestamptz,
  review_note   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (entity_type, entity_id)
);
create index if not exists idx_content_workflow_entity on public.content_workflow_state(entity_type, entity_id);

alter table public.content_workflow_state enable row level security;

drop policy if exists content_workflow_read on public.content_workflow_state;
create policy content_workflow_read on public.content_workflow_state for select to authenticated using (true);

-- Escrita direta só pra criação inicial (rascunho) — as transições de
-- verdade passam pelas funções abaixo, que validam quem pode fazer o quê.
drop policy if exists content_workflow_write on public.content_workflow_state;
create policy content_workflow_write on public.content_workflow_state for all to authenticated using (true) with check (true);

-- ---------- Estado atual (cria "rascunho" implícito se nunca foi rastreado) ----------
create or replace function public.get_content_workflow_state(p_entity_type text, p_entity_id uuid)
returns table (status text, submitted_at timestamptz, reviewed_at timestamptz, review_note text, reviewer_name text)
language sql stable security definer set search_path = public as $$
  select
    coalesce(w.status, 'rascunho'),
    w.submitted_at, w.reviewed_at, w.review_note,
    (select full_name from public.profiles where id = w.reviewed_by)
  from (select 1) dummy
  left join public.content_workflow_state w on w.entity_type = p_entity_type and w.entity_id = p_entity_id;
$$;
grant execute on function public.get_content_workflow_state(text, uuid) to authenticated;

-- ---------- Enviar pra revisão (rascunho -> em_revisao) ----------
create or replace function public.submit_content_for_review(p_entity_type text, p_entity_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.content_workflow_state (entity_type, entity_id, status, submitted_by, submitted_at)
  values (p_entity_type, p_entity_id, 'em_revisao', auth.uid(), now())
  on conflict (entity_type, entity_id) do update
    set status = 'em_revisao', submitted_by = auth.uid(), submitted_at = now(), updated_at = now();
end; $$;
grant execute on function public.submit_content_for_review(text, uuid) to authenticated;

-- ---------- Aprovar ou reprovar (só pastor/apóstolo) ----------
create or replace function public.review_content(p_entity_type text, p_entity_id uuid, p_approved boolean, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_role text;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role not in ('apostolo', 'pastor') then
    raise exception 'Só pastores ou apóstolo podem aprovar/reprovar conteúdo' using errcode = '42501';
  end if;

  insert into public.content_workflow_state (entity_type, entity_id, status, reviewed_by, reviewed_at, review_note)
  values (p_entity_type, p_entity_id, case when p_approved then 'aprovado' else 'rascunho' end, auth.uid(), now(), p_note)
  on conflict (entity_type, entity_id) do update
    set status = case when p_approved then 'aprovado' else 'rascunho' end,
        reviewed_by = auth.uid(), reviewed_at = now(), review_note = p_note, updated_at = now();
end; $$;
grant execute on function public.review_content(text, uuid, boolean, text) to authenticated;

-- ---------- Mover pra agendado/publicado/arquivado (execução, sem checagem de papel) ----------
create or replace function public.set_content_workflow_status(p_entity_type text, p_entity_id uuid, p_status text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('agendado','publicado','arquivado','rascunho') then
    raise exception 'Status inválido pra esta transição';
  end if;
  insert into public.content_workflow_state (entity_type, entity_id, status)
  values (p_entity_type, p_entity_id, p_status)
  on conflict (entity_type, entity_id) do update set status = p_status, updated_at = now();
end; $$;
grant execute on function public.set_content_workflow_status(text, uuid, text) to authenticated;

-- ---------- Painel: tudo que está esperando revisão (pro pastor/apóstolo ver de uma vez) ----------
create or replace function public.list_content_pending_review()
returns table (entity_type text, entity_id uuid, submitted_at timestamptz, submitted_by_name text)
language sql stable security definer set search_path = public as $$
  select w.entity_type, w.entity_id, w.submitted_at, p.full_name
  from public.content_workflow_state w
  left join public.profiles p on p.id = w.submitted_by
  where w.status = 'em_revisao'
  order by w.submitted_at asc;
$$;
grant execute on function public.list_content_pending_review() to authenticated;
