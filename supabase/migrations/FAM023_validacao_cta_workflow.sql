-- ============================================================
-- FAM023 — Validação server-side de CTA no workflow editorial FAM
--
-- Operação aditiva e não destrutiva. A validação ocorre dentro da
-- transação da RPC antes de aprovar, agendar ou publicar.
-- ============================================================

create or replace function public.fam_validate_banner_cta(
  p_cta_kind text,
  p_cta_label text,
  p_cta_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text := coalesce(nullif(trim(p_cta_kind), ''), 'internal');
  v_label text := coalesce(trim(p_cta_label), '');
  v_url text := coalesce(trim(p_cta_url), '');
  v_host text;
  v_digits text;
begin
  if v_label = '' and v_url = '' then
    return;
  end if;

  if v_label = '' or v_url = '' then
    raise exception 'O texto e o destino do CTA devem ser informados juntos'
      using errcode = '22023';
  end if;

  if v_url ~* '^(javascript|data|vbscript):'
     or v_url like '//%' then
    raise exception 'Esquema de URL não permitido'
      using errcode = '22023';
  end if;

  case v_kind
    when 'internal', 'formulario' then
      if v_url not like '/%' or v_url like '//%' then
        raise exception 'CTA deve apontar para uma rota interna'
          using errcode = '22023';
      end if;

    when 'ancora' then
      if v_url !~ '^#[A-Za-z][A-Za-z0-9_-]*$' then
        raise exception 'Âncora local inválida'
          using errcode = '22023';
      end if;

    when 'telefone', 'emergencia' then
      if (v_kind = 'telefone' and v_url !~ '^tel:\\+?[0-9 ()-]{8,20}$')
         or (v_kind = 'emergencia' and v_url !~ '^tel:\\+?[0-9 ()-]{3,20}$') then
        raise exception 'Número de telefone inválido'
          using errcode = '22023';
      end if;

      if v_kind = 'emergencia' then
        v_digits := regexp_replace(v_url, '[^0-9]', '', 'g');
        if v_digits not in ('190', '180', '192', '193') then
          raise exception 'Canal de emergência não aprovado pela FAM'
            using errcode = '22023';
        end if;
      end if;

    when 'externo' then
      if v_url !~* '^https://[^/?#]+(?:[/?#]|$)' then
        raise exception 'Link externo deve usar HTTPS'
          using errcode = '22023';
      end if;

      v_host := lower((regexp_match(v_url, '^https://([^/?#]+)'))[1]);
      if position('@' in v_host) > 0
         or v_host not in ('gov.br', 'www.gov.br') then
        raise exception 'Domínio externo não autorizado pela FAM'
          using errcode = '22023';
      end if;

    else
      raise exception 'Tipo de CTA inválido: %', v_kind
        using errcode = '22023';
  end case;
end;
$$;

revoke all on function public.fam_validate_banner_cta(text, text, text) from public;
revoke all on function public.fam_validate_banner_cta(text, text, text) from anon;
revoke all on function public.fam_validate_banner_cta(text, text, text) from authenticated;

grant execute on function public.fam_validate_banner_cta(text, text, text) to authenticated;

create or replace function public.transition_fam_banner_workflow(
  p_banner_id uuid,
  p_action text,
  p_note text default null
)
returns table (banner_id uuid, workflow_status text, editorial_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_banner public.banners%rowtype;
  v_current text;
  v_next text;
  v_role text;
  v_before jsonb;
  v_after jsonb;
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'Sessão autenticada necessária' using errcode = '42501';
  end if;

  select p.role into v_role from public.profiles p where p.id = v_actor;
  if v_role is null then
    raise exception 'Perfil autenticado não encontrado' using errcode = '42501';
  end if;

  select * into v_banner
  from public.banners
  where id = p_banner_id and tenant_key = 'FAM'
  for update;

  if v_banner.id is null then
    raise exception 'Banner FAM não encontrado' using errcode = 'P0002';
  end if;

  select coalesce(w.status, 'rascunho') into v_current
  from (select 1) dummy
  left join public.content_workflow_state w
    on w.entity_type = 'banner' and w.entity_id = p_banner_id;

  v_next := case p_action
    when 'enviar_revisao' then 'em_revisao'
    when 'aprovar' then 'aprovado'
    when 'reprovar' then 'rascunho'
    when 'agendar' then 'agendado'
    when 'publicar' then 'publicado'
    when 'pausar' then 'pausado'
    when 'arquivar' then 'arquivado'
    else null
  end;

  if v_next is null then
    raise exception 'Ação de workflow inválida: %', p_action using errcode = '22023';
  end if;

  if p_action <> 'enviar_revisao' and v_role not in ('apostolo', 'pastor') then
    raise exception 'Sem permissão para alterar o workflow editorial do banner' using errcode = '42501';
  end if;

  if p_action = 'enviar_revisao' and v_current not in ('rascunho', 'arquivado') then
    raise exception 'Banner não está em estado apto para revisão: %', v_current using errcode = '55000';
  end if;
  if p_action = 'aprovar' and v_current <> 'em_revisao' then
    raise exception 'Apenas banners em revisão podem ser aprovados' using errcode = '55000';
  end if;
  if p_action = 'reprovar' and v_current <> 'em_revisao' then
    raise exception 'Apenas banners em revisão podem ser reprovados' using errcode = '55000';
  end if;
  if p_action = 'agendar' and v_current <> 'aprovado' then
    raise exception 'Apenas banners aprovados podem ser agendados' using errcode = '55000';
  end if;
  if p_action = 'publicar' and v_current not in ('aprovado', 'agendado') then
    raise exception 'Apenas banners aprovados ou agendados podem ser publicados' using errcode = '55000';
  end if;
  if p_action = 'pausar' and v_current not in ('publicado', 'agendado') then
    raise exception 'Apenas banners publicados ou agendados podem ser pausados' using errcode = '55000';
  end if;
  if p_action = 'arquivar' and v_current not in ('publicado', 'pausado', 'rascunho') then
    raise exception 'Banner não está em estado apto para arquivamento' using errcode = '55000';
  end if;

  if p_action in ('aprovar', 'agendar', 'publicar') then
    perform public.fam_validate_banner_cta(v_banner.cta_kind, v_banner.cta_label, v_banner.cta_url);
  end if;

  v_before := jsonb_build_object(
    'workflow_status', v_banner.workflow_status,
    'is_active', v_banner.is_active,
    'published_at', v_banner.published_at,
    'paused_at', v_banner.paused_at,
    'archived_at', v_banner.archived_at,
    'editorial_status', v_current
  );

  update public.banners
  set workflow_status = v_next,
      is_active = case when p_action = 'pausar' then false when p_action in ('publicar','aprovar','agendar') then true else is_active end,
      published_at = case when p_action = 'publicar' then coalesce(published_at, now()) else published_at end,
      paused_at = case when p_action = 'pausar' then now() else paused_at end,
      archived_at = case when p_action = 'arquivar' then now() else archived_at end,
      updated_at = now()
  where id = p_banner_id and tenant_key = 'FAM';

  insert into public.content_workflow_state (
    entity_type, entity_id, status, submitted_by, submitted_at,
    reviewed_by, reviewed_at, review_note, updated_at
  )
  values (
    'banner', p_banner_id, case when p_action = 'pausar' then 'arquivado' else v_next end,
    case when p_action = 'enviar_revisao' then v_actor else null end,
    case when p_action = 'enviar_revisao' then now() else null end,
    case when p_action in ('aprovar','reprovar') then v_actor else null end,
    case when p_action in ('aprovar','reprovar') then now() else null end,
    nullif(trim(p_note), ''), now()
  )
  on conflict (entity_type, entity_id) do update set
    status = excluded.status,
    submitted_by = case when p_action = 'enviar_revisao' then excluded.submitted_by else content_workflow_state.submitted_by end,
    submitted_at = case when p_action = 'enviar_revisao' then excluded.submitted_at else content_workflow_state.submitted_at end,
    reviewed_by = case when p_action in ('aprovar','reprovar') then excluded.reviewed_by else content_workflow_state.reviewed_by end,
    reviewed_at = case when p_action in ('aprovar','reprovar') then excluded.reviewed_at else content_workflow_state.reviewed_at end,
    review_note = case when p_action in ('aprovar','reprovar') then excluded.review_note else content_workflow_state.review_note end,
    updated_at = now();

  select to_jsonb(b) - 'created_by' into v_after from public.banners b where b.id = p_banner_id;
  v_after := v_after || jsonb_build_object('editorial_status', case when p_action = 'pausar' then 'arquivado' else v_next end);

  insert into public.fam_banner_audit_events (
    banner_id, action, actor_id, before_data, after_data, reason
  ) values (
    p_banner_id,
    case p_action
      when 'enviar_revisao' then 'enviado_revisao'
      when 'aprovar' then 'aprovado'
      when 'reprovar' then 'reprovado'
      when 'publicar' then 'publicado'
      when 'pausar' then 'pausado'
      when 'arquivar' then 'arquivado'
      else p_action
    end,
    v_actor, v_before, v_after, nullif(trim(p_note), '')
  );

  return query select p_banner_id, v_next, case when p_action = 'pausar' then 'arquivado' else v_next end;
end;
$$;

grant execute on function public.transition_fam_banner_workflow(uuid, text, text) to authenticated;

comment on function public.fam_validate_banner_cta(text, text, text)
is 'Valida CTA FAM no servidor antes de uma transição editorial publicável.';
