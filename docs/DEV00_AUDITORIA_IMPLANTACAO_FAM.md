# DEV-00 — Auditoria de implantação da FAM

**Documento de origem:** `DEV-00_Contextualizacao_Tecnica_FAM_Mapa_de_Risco_INFO.md`  
**Baseline:** FAM 1.0  
**Data da auditoria:** 2026-08-26  
**Escopo:** Mapa de Risco, INFO, integração, segurança, versionamento, auditoria e MVP.

## 1. Síntese executiva

O projecto já possui uma fundação funcional relevante para o Mapa de Risco: catálogo versionado de perguntas, motor inicial, persistência de casos e respostas, encaminhamento, anexos, versionamento metodológico e fluxo de protecção. O que existe ainda é uma implementação MVP parcial, não a totalidade do domínio descrito no DEV-00.

O INFO também possui uma base editorial funcional, com artigos, versões imutáveis e fontes associadas. Porém, o modelo actual ainda não representa temas, trilhas, itens de trilha, progresso da utilizadora ou estados de governança de fontes. Portanto, a próxima evolução deve completar o INFO MVP sem misturá-lo com `RiskQuestion`.

> A decisão de implantação recomendada é completar primeiro as garantias semânticas e operacionais do Mapa de Risco e, em paralelo controlado, evoluir o INFO para fontes → conteúdos → trilhas → progresso.

## 2. Matriz de cobertura

| Requisito do DEV-00 | Evidência actual | Estado | Próxima acção |
|---|---|---|---|
| Perguntas parametrizadas com códigos estáveis | `src/services/famRiskCatalog.ts`, `FAM016_catalogo_metodologico_versionado.sql` | Parcialmente atendido | Confirmar todos os códigos e publicação do catálogo |
| Respostas SIM/NÃO/PREFIRO NÃO RESPONDER/SEM RESPOSTA | `famRiskEngine.ts` usa `YES`, `NO`, `PREFER_NOT_TO_ANSWER` | Lacuna semântica | Persistir explicitamente `NO_ANSWER`/`SEM_RESPOSTA` e não confundir com recusa |
| Motor com regras simples e compostas | `evaluateFamRisk()` deriva indicadores por resposta positiva | Parcialmente atendido | Criar regras declarativas e combinações compostas versionadas |
| Máquina de estados | `famRisk.ts` grava estado e histórico em fluxos existentes | Parcialmente atendido | Formalizar transições, eventos e códigos de motivo num serviço único |
| Emergência e fluxos especiais | `famRiskEngine.ts` cobre perigo, lesão, arma, sexual e children | Atendido no núcleo MVP | Completar fluxos de pessoa idosa, deficiência e demais casos metodológicos |
| Resultado com sinais, prioridades e orientações | `FamRiskEvaluation` possui atenção, flags, indicadores e resumo | Parcialmente atendido | Acrescentar `triggeredRules`, `priorities`, `orientations` e limites explícitos |
| Encaminhamento por organização/serviço/canal/território | FAM004–FAM005 e serviços de referral existentes | Atendido no MVP operacional | Validar matriz de rede e capacidades por território |
| Anexos com validação, quarentena e auditoria | FAM002, FAM009, FAM011, FAM015 e `famAttachments.ts` | Parcialmente atendido | Configurar scanner definitivo, secrets e expurgo operacional |
| Compartilhamento autorizado e auditado | Snapshot/encaminhamento e auditoria FAM existentes | Parcialmente atendido | Validar destinatário, finalidade, dados seleccionados e revogação |
| Saída Rápida transversal | Componentes e números de emergência já implementados | Parcialmente atendido | Fazer revisão mobile, teclado, foco e copy sem prometer apagar rastros externos |
| INFO com fontes e versões | `FAM010_info_base_conhecimento.sql`, `src/services/famInfo.ts` | Atendido como catálogo editorial mínimo | Evoluir para fontes, temas, conteúdos, trilhas e progresso |
| Governança CURRENT/REVIEW_REQUIRED/UPDATED/ARCHIVED | Fonte actual não possui esses estados | Lacuna | Criar ciclo de revisão de fontes e invalidar conteúdos relacionados |
| Trilhas e progresso | Não há `KnowledgeTrack`, `KnowledgeTrackItem` ou `KnowledgeProgress` | Lacuna | Implementar INFO MVP sem gamificação complexa |
| Integração Mapa ↔ INFO | Serviços existem separadamente | Lacuna de integração | Associar sinal/orientação a conteúdo INFO sem atrasar emergência |
| Reutilização de organizações e serviços | Rede FAM e referrals já existem em domínio separado | Parcialmente atendido | Consolidar contratos para INFO, Mapa e encaminhamento |
| Segurança no backend | RLS, RPCs, rotas server-side e auditoria existentes | Parcialmente atendido | Revisar autorização, logs minimizados, storage privado e retenção |
| Acessibilidade e mobile first | Componentes MVP existentes | A validar | Executar revisão manual de teclado, leitor de ecrã, foco, zoom e mobile |

## 3. Lacunas críticas do Mapa de Risco

### 3.1 Semântica das respostas

O DEV-00 exige distinguir três situações diferentes: resposta negativa, recusa em responder e ausência de resposta. O motor actual define `YES`, `NO` e `PREFER_NOT_TO_ANSWER`, mas não possui um valor explícito para ausência de resposta. Essa distinção deve ser resolvida antes de ampliar o catálogo, pois altera a interpretação de `insufficient_information`.

### 3.2 Regras compostas e rastreabilidade

O motor actual identifica indicadores positivos e deriva atenção por listas fixas. Isso é suficiente para o primeiro fluxo vertical, mas ainda não representa uma regra declarativa do tipo `AR-01 == YES AND AR-03 == YES`, nem produz uma lista estruturada de regras accionadas. A próxima camada deve versionar regras e registrar somente códigos minimizados, sem narrativas sensíveis.

### 3.3 Máquina de estados

Há persistência de estado e histórico em partes do fluxo, mas o DEV-00 pede transições controladas por serviço de domínio, cobrindo `INITIAL`, `INFORMED`, `IN_PROGRESS`, `EMERGENCY`, `PROTECTION_SPECIAL`, `ORIENTATION`, `OPTIONAL_ATTACHMENT`, `RESULT` e `CLOSED`. Recomenda-se um serviço de transição único, com validação de estado anterior, código de motivo e evento de auditoria.

## 4. Lacunas críticas do INFO

A FAM010 implementa um catálogo editorial mínimo: artigo, versão imutável e fonte. Isso atende publicação versionada básica, mas não o modelo pedagógico completo do DEV-00.

| Entidade necessária | Estado actual | Prioridade |
|---|---|---:|
| `KnowledgeSource` com versão e verificação | Fonte simples vinculada à versão do artigo | P0 |
| `KnowledgeTopic` | Ausente como entidade própria | P0 |
| `KnowledgeContent` | Representado parcialmente por artigo/versão | P0 |
| `KnowledgeTrack` | Ausente | P1 |
| `KnowledgeTrackItem` | Ausente | P1 |
| `KnowledgeProgress` | Ausente | P1 |
| `CURRENT`/`REVIEW_REQUIRED`/`UPDATED`/`ARCHIVED` | Ausente | P0 |
| Busca por título, resumo, palavras-chave e tema | Parcial; artigos possuem título/resumo, sem contrato completo | P1 |

A implantação deve começar com as seis trilhas conceptuais definidas no DEV-00: direitos, identificação de violência, Lei Maria da Penha, sinais de risco, rede de protecção e privacidade. Conteúdo não deve ser inventado; deve ser inserido apenas após validação editorial e fonte oficial.

## 5. Ordem de implantação recomendada

| Ordem | Entrega | Critério de aceite |
|---:|---|---|
| 1 | FAM-RISK-SEMANTICS | `SEM_RESPOSTA` não é confundido com `NÃO` ou `PREFIRO NÃO RESPONDER` |
| 2 | FAM-RISK-RULES | Regras simples/compostas versionadas e códigos auditáveis |
| 3 | FAM-RISK-STATE | Todas as transições passam por serviço de domínio e histórico |
| 4 | FAM-INFO-SOURCE-GOV | Fontes possuem ciclo de revisão e conteúdos relacionados são sinalizados |
| 5 | FAM-INFO-MVP | Temas, conteúdos, trilhas e progresso básico implementados |
| 6 | FAM-MAP-INFO-LINK | Orientações do Mapa oferecem conteúdo relacionado opcional |
| 7 | FAM-HARDENING | RLS, autorização, retenção, scanner, acessibilidade, mobile e E2E validados |

## 6. O que não deve bloquear o MVP

Não bloquear a primeira versão por IA, embeddings, busca semântica, chatbot, gamificação sofisticada, analytics avançado, geração automática de documentos ou centenas de artigos. O DEV-00 define essas capacidades como evolução de Fase 2.

## 7. Rastreabilidade e preservação

A implementação deve continuar reutilizando os serviços FAM existentes, sem criar um segundo sistema de autenticação, storage, auditoria ou cadastro de organizações. O frontend deve permanecer consumidor de serviços; autorização definitiva, acesso a ficheiros, retenção e compartilhamento devem ser reforçados no backend.

Nenhuma etapa deste mapa autoriza a remoção de dados CEC, rotas técnicas, conteúdo histórico ou tokens de cor. A paleta FAM permanece congelada.

## Referências

1. `DEV-00_Contextualizacao_Tecnica_FAM_Mapa_de_Risco_INFO.md`, secções 5–19, Mapa de Risco.
2. `DEV-00_Contextualizacao_Tecnica_FAM_Mapa_de_Risco_INFO.md`, secções 20–34, INFO e integração.
3. `DEV-00_Contextualizacao_Tecnica_FAM_Mapa_de_Risco_INFO.md`, secções 35–53, princípios de engenharia e fases.
4. `DEV-00_Contextualizacao_Tecnica_FAM_Mapa_de_Risco_INFO.md`, secções 54–63, MVP, baseline e critérios de evolução.
5. `src/services/famRiskEngine.ts`, implementação actual do motor MVP.
6. `supabase/migrations/FAM010_info_base_conhecimento.sql`, modelo actual do INFO.
