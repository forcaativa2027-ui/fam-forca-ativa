# FAM — Rastreabilidade da Fase 2: Metodologia

**Versão:** 1.0 — 26/08/2026  
**Escopo:** Risk Engine, catálogo metodológico, estados de avaliação e ProtectionFlow  
**Fonte principal:** `docs/CADERNO_TECNICO_DESENVOLVIMENTO_IMPLANTACAO_FAM.md`

> Este artefato registra a cobertura técnica local da Fase 2. A validação remota do catálogo permanece pendente até a execução do script `docs/FAM016_VERIFICACAO_REMOTA.sql` no Supabase.

## Matriz de requisitos

| ID | Requisito metodológico | Implementação | Teste/Evidência | Estado |
|---|---|---|---|---|
| REQ-FAM-MET-001 | Perguntas parametrizadas e fora de componentes React | `src/services/famRiskCatalog.ts`; migration FAM016 | `famRiskCatalog.test.ts`; FAM016 | Implementado |
| REQ-FAM-MET-002 | Código estável por pergunta | `FamRiskQuestion.key`; `fam_risk_questions.code` | `famRiskCatalog.test.ts`; FAM016 | Implementado |
| REQ-FAM-MET-003 | Respostas YES, NO e PREFER_NOT_TO_ANSWER permanecem distintas | `FamRiskAnswerValue`; `evaluateFamRisk` | `famRiskEngine.test.ts` | Implementado |
| REQ-FAM-MET-004 | Perigo atual prioriza emergência | `evaluateFamRisk`; `decideFamProtection` | `famRiskEngine.test.ts`; `famProtectionFlow.test.ts` | Implementado |
| REQ-FAM-MET-005 | Violência sexual e crianças ativam fluxos especializados | `specialFlowFlags`; `decideFamProtection` | `famRiskEngine.test.ts`; `famProtectionFlow.test.ts` | Implementado |
| REQ-FAM-MET-006 | Informação insuficiente não é convertida em segurança | `FamRiskAttention`; orientação do ProtectionFlow | `famRiskEngine.test.ts`; `famProtectionFlow.test.ts` | Implementado |
| REQ-FAM-MET-007 | Ausência de diagnóstico, laudo ou conclusão clínica | disclaimers do ProtectionFlow | `famProtectionFlow.test.ts` | Implementado |
| REQ-FAM-MET-008 | Compartilhamento depende de confirmação explícita | `referralConfirmed`; `referralAllowed` | `famProtectionFlow.test.ts`; testes de encaminhamento | Implementado |
| REQ-FAM-MET-009 | Decisões de estado são auditáveis por códigos | `famAssessmentState.ts` | `famRiskEngine.test.ts` | Implementado |
| REQ-FAM-MET-010 | Catálogo metodológico versionado | FAM016; `FAM_RISK_CATALOG_VERSION` | FAM016; verificação remota | Parcial: remoto pendente |
| REQ-FAM-MET-011 | Persistência e recuperação sem misturar versões | tabelas FAM de avaliação e catálogo | teste remoto e E2E | Pendente de homologação |
| REQ-FAM-MET-012 | RLS pública somente para conteúdo publicado | políticas FAM016 | `FAM016_VERIFICACAO_REMOTA.sql` | Remoto parcialmente verificado |

## Cobertura automatizada atual

A suíte específica executada nesta etapa contém **19 testes aprovados** em quatro arquivos: Risk Engine, catálogo, encaminhamento e validação de URL Supabase. Além disso, o arquivo `famProtectionFlow.test.ts` possui cobertura própria e deve ser incluído no comando padrão da suíte FAM na próxima melhoria de configuração do projeto.

| Verificação | Resultado |
|---|---|
| Testes FAM executados pelo comando atual | 19 aprovados |
| TypeScript | Aprovado |
| Build Next.js | Aprovado |
| Alterações destrutivas no banco | Nenhuma |
| Script de verificação remota | Criado; execução adiada pelo usuário |

## Pendências para aceite da Fase 2

A Fase 2 ainda não deve ser marcada como encerrada. Faltam a execução remota das consultas de conferência, o teste de persistência e recuperação de versões e o registro de aprovação metodológica pelos responsáveis institucionais. Esses itens não bloqueiam a continuidade do desenvolvimento local da Fase 3, mas bloqueiam a declaração de prontidão para dados reais.

## Próximo passo controlado

Após a decisão de retomar os testes remotos, executar `docs/FAM016_VERIFICACAO_REMOTA.sql` e anexar os resultados a este artefato. Em seguida, completar os cenários E2E em Preview, sem dados reais, antes de qualquer validação de produção.
