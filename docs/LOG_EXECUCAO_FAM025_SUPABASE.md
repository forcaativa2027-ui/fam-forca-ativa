
## Resultado confirmado em 27/08/2026

A consulta limpa foi executada com sucesso para `information_schema.columns`. A tabela `public.fam_retention_policies` possui as colunas originais `retention_class`, `description`, `duration_days`, `review_interval_days`, `legal_hold_allowed`, `deletion_strategy`, `created_at`, `updated_at` e as colunas aditivas FAM025 `label`, `default_retention_days`, `requires_legal_hold_review`, `policy_version`, `approved_at`, `approved_by`, `is_active`.

A tabela `fam_file_governance_events` não apareceu nas 15 linhas retornadas, portanto ainda precisa ser verificada separadamente. A consulta de rotina não foi executada nesta rodada, pois o editor foi limpo para remover o parêntese extra. A próxima validação deve consultar separadamente tabelas e funções RPC.

## Validação adicional

A consulta isolada a `information_schema.tables` retornou `0 rows` para `public.fam_file_governance_events`. Portanto, a tabela de eventos da FAM025 ainda não foi criada no banco remoto. A tabela `fam_retention_policies` existe e recebeu as colunas aditivas confirmadas.

## Verificação de objectos

A consulta isolada confirmou `0 rows` para `public.fam_file_governance_events`.

A consulta isolada a `information_schema.routines` confirmou `0 rows` para `public.fam_set_attachment_legal_hold`.

Conclusão: apenas a adaptação de colunas de `fam_retention_policies` foi aplicada. A parte de criação da tabela de auditoria e da RPC da FAM025 ainda precisa ser executada no Supabase.

## Tentativa de criação da tabela/RPC

A tentativa de inserir o bloco completo no SQL Editor sofreu timeout e deixou autocomplete activo no editor. A execução seguinte foi cancelada/limpa; não há confirmação de que `fam_file_governance_events` ou `fam_set_attachment_legal_hold` tenham sido criados. A validação isolada anterior confirmou que ambos ainda não existiam.

## Criação concluída

Em 27/08/2026, o bloco limpo executado via modelo Monaco do SQL Editor retornou `Success. No rows returned` após a criação idempotente da tabela, RLS, policy, grants e RPC `fam_set_attachment_legal_hold`. A confirmação formal será feita por consultas isoladas de existência.

## Resultado confirmado

A RPC `fam_set_attachment_legal_hold` foi criada com sucesso. A tabela `fam_file_governance_events` foi executada isoladamente com a opção `Run and enable RLS`, retornando sucesso. Falta apenas a consulta final isolada de existência/policy para documentar o estado completo.

## Validação final

A consulta remota retornou:

- `TABLE`: `fam_file_governance_events`
- `FUNCTION`: `fam_set_attachment_legal_hold`
- `RLS`: `true`

A consulta não retornou uma policy para a tabela, por isso a policy específica ainda precisa ser consultada/criada separadamente. Testes locais: `famFileGovernance.test.ts` — 7 aprovados; integração RPC — 3 skipped por ausência de credenciais de homologação.

## Auditoria POL-ARQ-01 — inventário remoto

A consulta remota retornou as tabelas `fam_risk_attachments`, `fam_retention_policies` e `fam_file_governance_events`, todas com RLS habilitado. Retornou a função `fam_set_attachment_legal_hold`. As policies visíveis foram somente as de `fam_risk_attachments`; não foi listada policy específica para `fam_file_governance_events`. As funções `fam_can_access_sensitive_content` e `fam_confirm_credential_mfa` não apareceram nessa consulta e precisam ser verificadas/criadas na camada de credenciamento, não presumidas como parte da POL-ARQ-01.
