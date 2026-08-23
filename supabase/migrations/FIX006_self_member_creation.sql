-- ============================================================
-- FIX006 — Qualquer usuário pode criar o próprio cadastro de membro
-- ============================================================
-- PROBLEMA: contas sem um registro em `members` (ex: um Pastor cuja
-- conta foi criada direto, sem passar pelo fluxo normal de cadastro)
-- não tinham como completar o próprio cadastro — a tela só mostrava
-- "fale com a secretaria", já que não existe INSERT direto liberado
-- pra membro comum (RLS de members exige escopo territorial).
--
-- REGRA CONFIRMADA: todo usuário deve conseguir completar o PRÓPRIO
-- cadastro sozinho (endereço, documentos, foto). A liderança só entra
-- depois pra: 1) alocar no Life Group quando a pessoa não escolheu um
-- perto de casa, e 2) aprovar/liberar a Carteirinha. Nunca pra criar
-- o registro em si.
--
-- Esta função cria (uma única vez) o registro de membro do PRÓPRIO
-- usuário autenticado, sem depender de escopo territorial — só pode
-- criar o registro DELE MESMO (auth.uid()), nunca de outra pessoa.
-- Idempotente.
-- ============================================================

create or replace function public.create_my_member_record()
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_existing uuid;
  v_full_name text;
  v_email text;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sessão expirada, faça login novamente.';
  end if;

  select id into v_existing from public.members where profile_id = auth.uid();
  if v_existing is not null then
    return v_existing; -- já existe, não duplica
  end if;

  select full_name, email into v_full_name, v_email from public.profiles where id = auth.uid();

  insert into public.members (profile_id, full_name, email, status, journey_stage)
  values (auth.uid(), coalesce(v_full_name, 'Membro'), v_email, 'ativo', 'visitante')
  returning id into v_id;

  begin
    perform public.audit_log('insert', 'members', v_id, jsonb_build_object('acao', 'auto_cadastro_proprio'));
  exception when others then null;
  end;

  return v_id;
end;
$$;
grant execute on function public.create_my_member_record() to authenticated;
