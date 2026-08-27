# Mapeamento confirmado do cadastro jurídico — 2026-08-27

## `public.fam_legal_purpose_catalog`

| Posição | Coluna | Tipo | Nulo |
|---:|---|---|---|
| 1 | id | uuid | não |
| 2 | purpose_code | text | não |
| 3 | data_category | text | não |
| 4 | legal_basis | text | não |
| 5 | recipient_type | text | não |
| 6 | retention_class | text | não |
| 7 | version | text | não |
| 8 | effective_at | timestamptz | sim |
| 9 | approved_by | uuid | sim |
| 10 | approved_at | timestamptz | sim |
| 11 | is_active | boolean | não |
| 12 | notes | text | sim |
| 13 | created_at | timestamptz | não |

## `public.fam_referral_requests`

A consulta retornou 36 linhas no total. As três primeiras colunas confirmadas no painel foram `id uuid NOT NULL`, `case_id uuid NOT NULL` e `requested_by uuid NOT NULL`; os metadados adicionados pela FAM027 devem ser conferidos na parte inferior do resultado ou por uma consulta específica de nomes.

## Registros jurídicos remotos

Existem cinco registros em `JUR-02-v1.0`, todos com `is_active = false`: `ATENDIMENTO_SAUDE`, `AUDITORIA_SEGURANCA`, `ORIENTACAO_INICIAL`, `PROTECAO_CRIANCA_ADOLESCENTE` e `PROTECAO_IMEDIATA`.

## Observação de revisão

A FAM027 usa corretamente as colunas existentes no catálogo. Entretanto, `legal_basis` contém valores institucionais provisórios como `VALIDAR_JURIDICO` e `TUTELA_SAUDE_VALIDAR`; eles não devem ser tratados como aprovação jurídica final nem ativados automaticamente.


## Metadados jurídicos de `fam_referral_requests`

Consulta específica confirmada no Supabase:

| Coluna | Tipo | Nulo |
|---|---|---|
| purpose_code | text | sim |
| legal_basis | text | sim |
| retention_class | text | sim |
| legal_catalog_version | text | sim |

As quatro colunas estão presentes e são `NULL`-permitidas, preservando pedidos legados. O preenchimento deve ocorrer somente quando a finalidade/base tiver sido validada e aprovada; a nulidade não deve ser interpretada como autorização para compartilhar dados.
