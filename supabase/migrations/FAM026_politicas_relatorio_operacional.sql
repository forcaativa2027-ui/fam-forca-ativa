-- FAM026: POL-ARQ-01 — isolamento da auditoria e relatório operacional
-- Não destrutiva: não remove dados nem arquivos.

alter table if exists public.fam_file_governance_events enable row level security;

revoke all on table public.fam_file_governance_events from anon;
revoke insert, update, delete on table public.fam_file_governance_events from authenticated;
grant select on table public.fam_file_governance_events to authenticated;

drop policy if exists fam_file_governance_events_manager_read on public.fam_file_governance_events;

-- Se a função de gestor ainda não estiver disponível, o bloco não cria uma
-- policy permissiva: a tabela permanece fail-closed.
do $$
begin
  if to_regprocedure('public.fam_is_credential_manager()') is not null then
    execute $policy$
      create policy fam_file_governance_events_manager_read
      on public.fam_file_governance_events
      as permissive
      for select
      to authenticated
      using (public.fam_is_credential_manager())
    $policy$;
  end if;
end;
$$;

comment on table public.fam_file_governance_events is
  'Eventos de ciclo de vida de arquivos FAM; leitura restrita a gestor de credenciamento. POL-ARQ-01-v1.1';
