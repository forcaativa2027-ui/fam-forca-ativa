-- FAM027 — Ativação controlada do catálogo jurídico
-- Revisar com o responsável jurídico antes da execução.
-- Este script NÃO ativa o catálogo inteiro: por padrão, ativa somente ORIENTACAO_INICIAL.
-- Para ativar outra finalidade, altere explicitamente v_target_purpose_codes.

begin;

do $$
declare
  v_approver uuid := '8ac98955-58c2-4691-ba73-efea96b86e58';
  v_catalog_version text := 'JUR-02-v1.0';
  v_target_purpose_codes text[] := array['ORIENTACAO_INICIAL'];
  v_updated_count integer := 0;
  v_expected_count integer := 0;
  v_approver_email text;
begin
  -- Confirma que o UUID pertence à conta administrativa esperada.
  select email
    into v_approver_email
  from auth.users
  where id = v_approver;

  if v_approver_email is null then
    raise exception 'Aprovador não encontrado para o UUID informado: %', v_approver;
  end if;

  if lower(v_approver_email) <> lower('tecnologiaagilize@gmail.com') then
    raise exception 'O UUID informado pertence a %, não à conta esperada.', v_approver_email;
  end if;

  -- Exige que todos os códigos solicitados existam na versão correta.
  select count(*)
    into v_expected_count
  from public.fam_legal_purpose_catalog
  where version = v_catalog_version
    and purpose_code = any(v_target_purpose_codes);

  if v_expected_count <> cardinality(v_target_purpose_codes) then
    raise exception 'Um ou mais códigos não existem na versão %: %', v_catalog_version, v_target_purpose_codes;
  end if;

  -- Ativa somente os registros autorizados explicitamente no array acima.
  update public.fam_legal_purpose_catalog
  set
    is_active = true,
    approved_by = v_approver,
    approved_at = coalesce(approved_at, now()),
    effective_at = coalesce(effective_at, now()),
    notes = concat(
      coalesce(notes, ''),
      ' Ativação controlada pela conta tecnologiaagilize@gmail.com; revisar institucionalmente antes de uso operacional.'
    )
  where version = v_catalog_version
    and purpose_code = any(v_target_purpose_codes)
    and is_active = false;

  get diagnostics v_updated_count = row_count;

  raise notice 'Registros ativados: %', v_updated_count;
end $$;

-- Conferência obrigatória do resultado.
select
  purpose_code,
  data_category,
  legal_basis,
  recipient_type,
  retention_class,
  version,
  is_active,
  approved_by,
  approved_at,
  effective_at
from public.fam_legal_purpose_catalog
where version = 'JUR-02-v1.0'
order by purpose_code;

commit;

-- Se a conferência estiver correta, o código selecionado deverá aparecer com is_active = true.
-- Os demais registros deverão continuar com is_active = false.
-- Para desfazer a ativação de um código específico, faça uma operação auditada e autorizada:
-- update public.fam_legal_purpose_catalog
-- set is_active = false
-- where purpose_code = 'ORIENTACAO_INICIAL' and version = 'JUR-02-v1.0';
