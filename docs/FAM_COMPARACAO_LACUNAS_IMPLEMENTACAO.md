# FAM — Comparação de versões, lacunas e implementação

**Data da análise:** 2026-08-25  
**Repositório analisado:** `forcaativa2027-ui/fam-forca-ativa`  
**Escopo:** comparação dos pacotes enviados e implementação local, incluindo o COR-UX-01, sem aplicação de migration em banco remoto e sem push automático.

## 1. Resultado executivo

O ZIP contém 10 documentos de base e o TAR contém 23 arquivos Markdown, dos quais 10 reproduzem o conjunto do ZIP. A comparação byte a byte dos arquivos comuns não identificou diferenças entre ZIP e TAR. O pacote `final.tar.gz` contém 30 arquivos Markdown: preserva os documentos do TAR e acrescenta documentos de governança, implantação, arquitetura, UX, INFO e fundação técnica.

O repositório já possui um MVP funcional da FAM, com análise de risco, atendimento conversacional, fila de atendentes, anexos privados e migrations `FAM001`/`FAM002`. Contudo, a implementação existente estava abaixo do baseline definido pelo IMPL-01: as perguntas e a classificação estavam embutidas no componente visual, não havia versão do motor persistida, os indicadores acionados não eram preservados, não existia um modelo aditivo de auditoria para avaliações e a trilha de fluxos especiais não era explicitamente registrada.

## 2. Comparação dos pacotes

| Pacote | Arquivos Markdown | Característica | Conclusão |
|---|---:|---|---|
| ZIP `FAM_documentos_markdown_2026-08-24.zip` | 10 | Conjunto inicial, principalmente fundamentos e matrizes operacionais | Subconjunto do TAR |
| TAR `FAM_documentos_markdown_2026-08-24.tar.gz` | 23 | Conjunto consolidado com DEC, JUR, OC-04, POL-ARQ, REV, TEC e UX | Baseline documental técnico-jurídico mais completo |
| `final.tar.gz` | 30 | TAR acrescido de MASTER, IMPL, MAP, INFO/Marco e documentação de implantação | Pacote mais completo e adequado para orientar implementação |

Os arquivos comuns entre ZIP e TAR são idênticos. No TAR há uma duplicata nominal de `OC-04_Matriz_Situacoes_Risco_Respostas_v1.1.md`, com cópia adicional marcada como `(1)`, sem diferença de conteúdo. O pacote final preserva essa duplicata; ela deve ser removida ou movida para histórico antes de uma biblioteca documental oficial.

## 3. Lacunas encontradas no código

| Área | Evidência no repositório | Impacto |
|---|---|---|
| Motor de risco | Cinco perguntas e regra de urgência estavam hardcoded em `FamSupportCenter.tsx` | Baixa rastreabilidade e alto risco de divergência entre UX e regra |
| Estados de resposta | A interface gravava textos em português diretamente (`sim`, `não`, `prefiro não responder`) | Dificulta versionamento, validação e integração com regras |
| Versionamento | `fam_risk_cases` não possuía versão do motor nem status/etapa da avaliação | Avaliações históricas poderiam perder contexto metodológico |
| Resultado | O caso guardava apenas atenção e resumo | Indicadores acionados e fluxos especiais não eram preservados |
| Auditoria | Não havia tabela de eventos FAM específica | Ações críticas não tinham trilha estruturada mínima |
| Fluxos especiais | Sexualidade e crianças eram apenas perguntas, sem sinalizadores persistidos ou serviço de proteção | Cobertura parcial de JUR-01, JUR-03 e DEC-01 |
| Evidências | Upload privado existia, mas sem workflow de malware scan, retenção, legal hold e auditoria completa | FAM002 cobre a base de acesso, não todo o ciclo de vida de POL-ARQ-01 |
| Encaminhamento | Não há catálogo parametrizado de organizações/serviços/referral rules | OC-01 e OC-03 ainda não estão implementados como motor estruturado |
| INFO | Não foram localizadas as entidades e a área de conhecimento previstas no IMPL-01 | O bloco INFO permanece pendente |
| Acessibilidade e saída rápida | O fluxo analisado não apresentava um componente transversal `QuickExit` | Requisito de UX ainda não coberto integralmente |

## 4. Implementação realizada

### 4.1 Motor de risco separado

Foi criado `src/services/famRiskEngine.ts`, contendo perguntas parametrizadas, opções internas estáveis (`YES`, `NO`, `PREFER_NOT_TO_ANSWER`), fontes documentais por pergunta, versão `FAM-RISK-1.0` e a função pura `evaluateFamRisk`.

A interface deixou de calcular a urgência diretamente. Ela agora consome o motor, preservando a separação conceitual entre UI e regra de negócio. A resposta “Prefiro não responder” permanece distinta de “Não”.

### 4.2 Persistência de contexto metodológico

Foi criada `supabase/migrations/FAM003_avaliacao_versionada_auditoria.sql`. A migration é aditiva e acrescenta a `fam_risk_cases` os campos de status, etapa atual, versão do motor, sinalizadores de fluxos especiais e indicadores acionados. Também cria `fam_audit_events` com RLS básica para eventos associados ao próprio usuário, caso ou conversa.

A migration **não foi executada no Supabase remoto**. Ela precisa passar por backup, homologação e revisão de segurança antes de ser aplicada, conforme as próprias instruções do `README_UPLOAD_FAM.md`.

### 4.3 Integração de serviço e hook

`src/services/famRisk.ts` e `src/hooks/useFamSupport.ts` foram atualizados para persistir a versão do motor, a etapa `result`, os indicadores acionados, os fluxos especiais e o status `completed`.

## 5. Validação

A instalação das dependências foi feita com `npm ci`. Em seguida, `npm run typecheck` foi executado com sucesso e `npm run build` também foi concluído com sucesso. O build reconheceu a rota `/analise-risco` e não apresentou erros de compilação.

O `npm ci` reportou 15 vulnerabilidades transitivas — 1 moderada, 12 altas e 2 críticas — e também indicou que a versão atual do Next.js possui aviso de segurança. Isso não foi alterado nesta implementação porque atualizar dependências é uma mudança de escopo própria, com risco de regressão e necessidade de homologação.

## 6. Próximas implementações recomendadas

A próxima frente deve ser a conclusão do fluxo vertical de proteção: `ProtectionFlowService`, Quick Exit, fluxos especiais separados, motor de encaminhamento parametrizado e telas de resultado baseadas em regras. Em seguida, devem ser implementados o catálogo de evidências com retenção e expurgo auditáveis, o catálogo de fontes e conteúdos INFO, e testes automatizados para os casos de emergência, resposta preferencial, violência sexual e criança/adolescente.

Antes de produção, também devem ser revisadas a política de privacidade da rota `/privacidade`, as permissões RLS, a proteção contra MIME spoofing, o workflow de malware scan, os limites de upload, a retenção e a atualização do Next.js para uma versão corrigida.

## 7. Correções incorporadas do COR-UX-01

Foi integrado o documento `COR-UX-01_Correcoes_Perfis_Navegacao_Boas_Vindas_FAM.md` à baseline de implementação. A rota `/analise-risco` agora usa o `BackButton` compartilhado, com o texto “Voltar à página anterior”, `aria-label` equivalente, retorno pelo histórico e fallback para `/painel`.

O onboarding global agora não é renderizado na rota `/analise-risco`, evitando interromper a experiência de triagem. O checkbox foi corrigido para que marcar “Não mostrar novamente” realmente persista a conclusão do onboarding; o mecanismo existente de preferências da conta continua sendo reutilizado e a reabertura manual permanece disponível em “Meu Perfil → Acessibilidade e Personalização”.

O guard de workspace deixou de conceder acesso automático por `profile.role === "apostolo"`; a autorização continua baseada em módulos ativos. A central de atendimento FAM passou a reconhecer o operador pelo registro `fam_attendants` ativo, sem depender desse role herdado. A busca global ainda encontra referências legadas de `apostolo` em outras áreas da plataforma CEC, incluindo tipos e migrations históricas; elas não foram apagadas automaticamente porque exigem uma migração de roles, revisão de permissões e tratamento de dados históricos.

## 8. Incremento adicional — fluxo vertical de proteção

O segundo incremento criou `famAssessmentState.ts`, com os estados `INITIAL`, `INFORMED`, `IN_PROGRESS`, `EMERGENCY`, `PROTECTION_SPECIAL`, `ORIENTATION`, `OPTIONAL_ATTACHMENT`, `RESULT` e `CLOSED`. As transições são controladas por uma tabela explícita e rejeitam saltos arbitrários. O motor agora traduz sinais de urgência e fluxos especiais em estado, código de motivo e código de regra, sem produzir diagnóstico, conclusão jurídica ou afirmação de crime.

A Análise de Risco usa o estado calculado tanto para persistência quanto para a apresentação do resultado. Visitantes sem login recebem a mesma orientação local, enquanto avaliações autenticadas preservam o estado, a regra e o motivo. O atendimento conversacional também recebeu o Quick Exit no cabeçalho, além da análise de risco.

A migration `FAM003_avaliacao_versionada_auditoria.sql` foi ampliada com `assessment_state`, códigos de transição e a tabela `fam_assessment_state_history`, com políticas RLS de leitura e inserção limitadas ao caso do usuário. A conclusão persistida também registra `ASSESSMENT_COMPLETED` em `fam_audit_events`, usando apenas metadados técnicos e seguros. A migration ainda não foi aplicada ao Supabase remoto.

## 9. Incremento adicional — encaminhamento orientativo

Foi criado `famReferrals.ts` com o catálogo versionado `FAM-REFERRAL-1.0`. O catálogo representa CRAS, Polícia Civil, Ministério Público, Saúde e outros órgãos competentes como destinatários institucionais, mas não cria acesso automático ao banco da FAM nem permite o envio de histórico completo.

As opções são calculadas a partir dos sinais do motor de risco e exibem finalidade, prioridade, motivo, escopo mínimo de dados e a ressalva de que recebimento não significa atendimento, investigação ou adoção de providência. Na tela de resultado, a usuária pode selecionar um caminho informativo e conversar com uma atendente; não há disparo automático de encaminhamento.

## 10. Incremento adicional — solicitação explícita de encaminhamento

Foi criada a migration `FAM004_solicitacoes_encaminhamento.sql` e o serviço `famReferralRequests.ts`. A solicitação registra caso, usuária, destinatário, finalidade, prioridade, motivo, escopo mínimo de dados, anexos selecionados, status e horário de confirmação. As políticas RLS limitam leitura e inserção à usuária autenticada do caso.

Na interface, o registro só pode ocorrer depois de selecionar um caminho, marcar a confirmação de entendimento e estar com uma avaliação autenticada. O registro tem status próprio (`requested`, `under_review`, `sent`, `received` ou `cancelled`) e não representa envio, recebimento ou garantia de atendimento. Para visitantes sem login, a interface oferece conversa com atendente ou login, sem registrar solicitação.

## 11. Compatibilidade com o schema remoto

A validação de leitura no Supabase confirmou que `fam_risk_cases`, `fam_assessment_state_history` e `fam_audit_events` estão acessíveis pela API pública com RLS e retornam listas vazias para uma consulta sem sessão, sem expor dados. O schema remoto usa `risk_case_id` no histórico e campos próprios de estado em `fam_risk_cases`; por isso foi criada `FAM003_REMOTE_COMPAT.sql` e o serviço foi alinhado a esses nomes.

A FAM003 original e o reparo baseado em `case_id` não devem mais ser executados nesse projeto. A versão compatível cria ou normaliza as relações na ordem correta e termina com `FAM003_REMOTE_COMPAT_OK`.

## 12. Incremento adicional — painel operacional

Foi criada a migration `FAM005_painel_operacional_encaminhamentos.sql`, com a função `fam_is_active_attendant()` e a RPC `fam_update_referral_status()`. Apenas atendentes com registro operacional ativo podem listar solicitações e alterar seus status. As transições permitidas são `requested → under_review`, `under_review → sent`, `sent → received` e cancelamento a partir de estados não terminais. Cada mudança gera um evento técnico em `fam_audit_events`.

A central `/admin/fam-atendimento` agora exibe as solicitações, escopo mínimo e ressalvas institucionais, oferece as ações de revisão e usa a RPC em vez de updates livres. O painel não exibe histórico completo, não envia dados automaticamente e não trata recebimento como garantia de atendimento.

## 13. Testes automatizados

Foi adicionada a suíte `src/services/famRiskEngine.test.ts`, executada por `npm run test:fam`. Os nove testes cobrem risco imediato, fluxos especiais, informação insuficiente, precedência de emergência, transições inválidas, metadados de transição, listagem ordenada de solicitações, chamada da RPC de status e propagação de erro de autorização. A suíte não usa dados reais nem acessa o Supabase.

## 14. Limites desta entrega

Esta entrega implementa uma fundação técnica, as correções UX prioritárias, o fluxo vertical de proteção, o catálogo orientativo, a solicitação explícita e o painel operacional de encaminhamentos, mas não declara que todos os requisitos do pacote documental ou do COR-UX-01 estão concluídos. A publicação Vercel e a validação de produção continuam condicionadas ao vínculo do projeto e à aplicação/validação das migrations remotas. Nenhuma migration foi aplicada remotamente, nenhum arquivo foi enviado ao GitHub e nenhum dado de produção foi alterado. As alterações permanecem no clone local para revisão e aprovação.
