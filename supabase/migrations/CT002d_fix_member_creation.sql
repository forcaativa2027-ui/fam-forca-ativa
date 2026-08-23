-- ============================================================
-- CEC FAMILY — Fix: convite sem Life Group específico não criava
-- o registro de "membro" (só atualizava o profile), por isso a
-- pessoa não aparecia na aba Membros do Dashboard. Agora todo
-- cadastro por convite sempre vira um membro (com ou sem LG).
-- ============================================================

create or replace function public.consume_invite_link(
  p_token text, p_ip text default null, p_user_agent text default null,
  p_phone text default null, p_user_id uuid default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_link record;
  v_uid uuid;
begin
  v_uid := coalesce(auth.uid(), p_user_id);
  if v_uid is null then
    raise exception 'Não foi possível identificar o usuário para vincular o convite';
  end if;

  select * into v_link from public.invite_links il where il.token = p_token for update;
  if v_link.id is null then raise exception 'Convite inválido'; end if;
  if v_link.revoked_at is not null then raise exception 'Convite revogado'; end if;
  if v_link.expires_at is not null and v_link.expires_at < now() then raise exception 'Convite expirado'; end if;
  if v_link.max_uses is not null and v_link.uses_count >= v_link.max_uses then raise exception 'Convite esgotado'; end if;

  update public.profiles set
    role = v_link.target_role,
    church_id = coalesce(v_link.church_id, church_id),
    phone = coalesce(p_phone, phone),
    scope_level = coalesce(v_link.scope_level, scope_level),
    scope_id = case when v_link.scope_level is not null then v_link.scope_id else scope_id end
  where id = v_uid;

  if not found then
    raise exception 'Perfil do usuário ainda não existe — tente novamente em alguns segundos';
  end if;

  -- FIX: sempre cria o registro de membro quando o convite tem uma igreja
  -- vinculada — Life Group é opcional (fica null se o convite não especificou um).
  if v_link.church_id is not null then
    insert into public.members (profile_id, full_name, life_group_id, church_id, journey_stage, status, joined_at)
    select v_uid, p.full_name, v_link.life_group_id, v_link.church_id, 'novo_convertido', 'ativo', now()
    from public.profiles p where p.id = v_uid
    on conflict do nothing;
  end if;

  if v_link.discipler_id is not null then
    insert into public.discipleship (discipler_id, disciple_id, status, started_on)
    values (v_link.discipler_id, v_uid, 'ativo', current_date)
    on conflict do nothing;
  end if;

  if v_link.ministry_id is not null then
    insert into public.ministry_members (ministry_id, profile_id, role)
    values (v_link.ministry_id, v_uid, 'membro')
    on conflict do nothing;
  end if;

  update public.invite_links set uses_count = uses_count + 1 where id = v_link.id;

  insert into public.invite_link_uses (invite_link_id, used_by, ip, user_agent)
  values (v_link.id, v_uid, p_ip, p_user_agent);

  begin
    perform public.audit_log('insert', 'invite_link_use', v_link.id, jsonb_build_object('target_role', v_link.target_role));
  exception when others then null;
  end;
end; $$;
grant execute on function public.consume_invite_link(text, text, text, text, uuid) to authenticated, anon;

-- ============================================================
-- Backfill: corrige quem já se cadastrou por convite antes desse fix
-- e ficou sem registro de membro (ex: a pessoa da CEC Águas Claras).
-- Cria o membro pra todo profile que tem church_id mas nenhuma linha
-- correspondente em members ainda.
-- ============================================================
insert into public.members (profile_id, full_name, church_id, journey_stage, status, joined_at)
select p.id, p.full_name, p.church_id, 'novo_convertido', 'ativo', now()
from public.profiles p
where p.church_id is not null
  and p.role <> 'apostolo'
  and not exists (select 1 from public.members m where m.profile_id = p.id)
on conflict do nothing;
