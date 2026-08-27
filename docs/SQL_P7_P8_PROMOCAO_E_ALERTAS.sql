-- SQL P7/P8 — promoção editorial e alertas de revisão
-- Não executar este arquivo inteiro sem revisar os valores de entrada.
-- A promoção abaixo altera status de um conteúdo específico; a função de alertas somente consulta.

-- ============================================================
-- PARTE A — promover um conteúdo específico até published
-- ============================================================
-- Substitua apenas v_content_key, v_approval_reference e v_review_date.
-- O UUID abaixo é o perfil administrador FAM já identificado no projeto.

begin;

do $$
declare
  v_content_key text := 'legislacao-lei-maria-da-penha-001';
  v_actor_profile_id uuid := '8ac98955-58c2-4691-ba73-efea96b86e58';
  v_approval_reference text := 'SUBSTITUIR-PELA-REFERENCIA-REAL-DO-PARECER-OU-ATA';
  v_review_date date := date '2027-02-23';
  v_content_id uuid;
  v_status text;
  v_version text;
  v_next_status text;
  v_event_type text;
  v_notes text;
begin
  if v_approval_reference like 'SUBSTITUIR-%'
     or length(btrim(v_approval_reference)) < 3 then
    raise exception 'Informe a referência real do parecer ou ata antes de publicar';
  end if;

  if v_review_date is null or v_review_date <= current_date then
    raise exception 'A próxima data de revisão deve ser futura';
  end if;

  select id, status, version
    into v_content_id, v_status, v_version
  from public.fam_knowledge_contents
  where tenant_key = 'FAM'
    and content_key = v_content_key
  order by updated_at desc
  limit 1
  for update;

  if v_content_id is null then
    raise exception 'Conteúdo FAM não encontrado: %', v_content_key;
  end if;

  -- Avança somente pela sequência editorial permitida.
  while v_status <> 'published' loop
    if v_status = 'draft' then
      v_next_status := 'curation';
      v_event_type := 'updated';
      v_notes := 'Conteúdo encaminhado para curadoria editorial.';
    elsif v_status = 'curation' then
      v_next_status := 'under_review';
      v_event_type := 'submitted';
      v_notes := 'Conteúdo submetido à revisão institucional e jurídica.';
    elsif v_status = 'under_review' then
      v_next_status := 'approved';
      v_event_type := 'approved';
      v_notes := 'Conteúdo aprovado conforme referência institucional informada.';
    elsif v_status = 'approved' then
      v_next_status := 'published';
      v_event_type := 'published';
      v_notes := 'Conteúdo publicado após aprovação e validação dos metadados.';
    else
      raise exception 'Status atual não pode avançar automaticamente: %', v_status;
    end if;

    if v_next_status in ('approved', 'published') then
      update public.fam_knowledge_contents
      set status = v_next_status,
          approved_by = v_actor_profile_id,
          approved_at = coalesce(approved_at, now()),
          approval_reference = v_approval_reference,
          review_date = v_review_date,
          updated_at = now()
      where id = v_content_id
        and tenant_key = 'FAM'
        and status = v_status;
    else
      update public.fam_knowledge_contents
      set status = v_next_status,
          updated_at = now()
      where id = v_content_id
        and tenant_key = 'FAM'
        and status = v_status;
    end if;

    if not found then
      raise exception 'Transição concorrente ou status inesperado: %', v_status;
    end if;

    insert into public.fam_knowledge_audit_events (
      tenant_key, content_id, actor_profile_id, event_type,
      from_status, to_status, version, notes
    ) values (
      'FAM', v_content_id, v_actor_profile_id, v_event_type,
      v_status, v_next_status, v_version, v_notes
    );

    v_status := v_next_status;
  end loop;
end $$;

commit;

-- Conferência da promoção.
select
  content_key, status, version, approved_by,
  approval_reference, approved_at, review_date
from public.fam_knowledge_contents
where tenant_key = 'FAM'
  and content_key = 'legislacao-lei-maria-da-penha-001';

-- Conferência da auditoria gerada.
select
  event_type, from_status, to_status,
  actor_profile_id, version, notes, created_at
from public.fam_knowledge_audit_events
where tenant_key = 'FAM'
  and content_id = (
    select id from public.fam_knowledge_contents
    where tenant_key = 'FAM'
      and content_key = 'legislacao-lei-maria-da-penha-001'
    order by updated_at desc limit 1
  )
order by created_at;

-- ============================================================
-- PARTE B — função de alerta de revisão
-- ============================================================
-- A função não altera status nem envia mensagens. Ela retorna a fila
-- de revisão para o painel administrativo, relatório ou pg_cron.

create or replace function public.fam_knowledge_review_alerts(
  p_days_ahead integer default 30
)
returns table (
  item_kind text,
  item_id uuid,
  item_key text,
  item_title text,
  item_status text,
  review_date date,
  days_until_review integer,
  urgency text
)
language sql
stable
security definer
set search_path = public
as $$
  with items as (
    select
      'content'::text as item_kind,
      c.id as item_id,
      c.content_key as item_key,
      c.title as item_title,
      c.status as item_status,
      c.review_date as review_date
    from public.fam_knowledge_contents c
    where c.tenant_key = 'FAM'
      and c.status in ('draft','curation','under_review','approved','published')

    union all

    select
      'trail'::text as item_kind,
      t.id as item_id,
      t.trail_key as item_key,
      t.title as item_title,
      t.status as item_status,
      t.review_date as review_date
    from public.fam_knowledge_trails t
    where t.tenant_key = 'FAM'
      and t.status in ('draft','under_review','approved','published')
  )
  select
    item_kind,
    item_id,
    item_key,
    item_title,
    item_status,
    review_date,
    (review_date - current_date)::integer as days_until_review,
    case
      when review_date is null then 'sem_data'
      when review_date < current_date then 'vencida'
      when review_date <= current_date + greatest(p_days_ahead, 0) then 'proxima'
      else 'em_dia'
    end as urgency
  from items
  where review_date is null
     or review_date <= current_date + greatest(p_days_ahead, 0)
  order by review_date nulls first, item_kind, item_title;
$$;

revoke execute on function public.fam_knowledge_review_alerts(integer) from public, anon;
grant execute on function public.fam_knowledge_review_alerts(integer) to authenticated;

comment on function public.fam_knowledge_review_alerts(integer) is
  'Retorna conteúdos e trilhas FAM sem data, vencidos ou próximos da revisão. Não altera dados.';

-- Teste manual: vencidos e próximos dos próximos 30 dias.
select * from public.fam_knowledge_review_alerts(30);

-- ============================================================
-- PARTE C — consulta para painel/relatório sem criar tabela
-- ============================================================
select *
from public.fam_knowledge_review_alerts(30)
where urgency in ('vencida', 'proxima', 'sem_data');

-- ============================================================
-- PARTE D — agendamento opcional com pg_cron
-- ============================================================
-- Não executar sem confirmar que a extensão pg_cron está habilitada.
-- Este agendamento apenas registra uma execução de consulta; para enviar
-- e-mail/WhatsApp é necessário integrar um canal externo autorizado.
--
-- select cron.schedule(
--   'fam-knowledge-review-daily',
--   '0 9 * * *',
--   $$select * from public.fam_knowledge_review_alerts(30);$$
-- );
