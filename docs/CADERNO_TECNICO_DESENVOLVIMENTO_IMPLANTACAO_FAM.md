# Caderno Técnico Descritivo de Desenvolvimento e Implantação — FAM

> **Versão:** 1.0 — baseline derivado do pacote `final.tar.gz` em 26/08/2026  
> **Escopo:** análise dos 30 arquivos Markdown documentais e das 2 entradas de diretório do TAR  
> **Repositório:** `forcaativa2027-ui/fam-forca-ativa`  
> **Princípio:** nenhum requisito será implementado a partir de documento superado, duplicado, rascunho ou interpretação isolada.

## 1. Como este caderno deve ser usado

Este caderno transforma o baseline documental em um plano técnico rastreável. Cada documento possui uma ficha própria com papel, dependências, propostas extraídas, plano de desenvolvimento, segurança, testes, critérios de aceite e situação atual. A classificação documental não equivale a aprovação jurídica ou institucional; itens marcados como pendentes devem permanecer bloqueados para produção até a validação correspondente.

## 2. Inventário e dependências

O arquivo TAR possui 32 entradas: **30 arquivos Markdown e 2 diretórios**. Os diretórios `FAM_documentos_markdown_2026-08-24/` e `passos/` são contêineres e não propostas adicionais.

A ordem de dependência é: governança documental → fundamentos → metodologia → necessidades → decisões → operação → proteção jurídica → arquivos → credenciamento → arquitetura/UX → INFO → implantação.

## 3. Estado técnico consolidado

| Área | Estado no clone | Evidência |
|---|---|---|
| Fundação e schema | Implementada parcialmente | Migrations FAM e serviços já publicados; validação remota ainda deve ser confirmada. |
| Motor e proteção | Implementada | `famRiskEngine.ts`, `famAssessmentState.ts`, `famProtectionFlow.ts`. |
| Encaminhamento | Implementada | Catálogo, confirmação da usuária, confirmação da atendente e snapshot imutável. |
| Evidências | Implementada parcialmente | Quarentena, RLS, retenção, snapshot e adaptador de scanner; scanner real ainda não escolhido. |
| INFO | Implementada estruturalmente | Artigos/versionamento/fontes e editor administrativo; conteúdo aprovado ainda precisa ser publicado. |
| Vercel | Projeto conectado e deployment Ready | Variáveis de ambiente ainda ausentes no projeto no momento da auditoria. |
| Homologação | Pendente | Falta teste ponta a ponta após configurar ambiente, SMTP e migrations remotas. |

## 4.1 FAM-DEV-001 — Fundação Técnica e Modelo de Dados do Mapa de Risco

**Arquivo:** `FAM-DEV-001 — Fundação Técnica e Modelo de Dados do Mapa de Risco.md`  
**Classificação:** Fundação técnica e dados — **vigente; precisa ser harmonizado com nomenclatura remota**  
**Tamanho/estrutura:** 24973 bytes, 1717 linhas, 1 tabela(s) detectada(s).

### Finalidade e proposta

Define modelo técnico do mapa, entidades, persistência, estados e integrações.

### Dependências

TEC-01 + 2B + OC-04 → schema e serviços

### Propostas e regras extraídas

- **L14:** Implementar a fundação técnica necessária para que a Plataforma FAM possa executar, de forma segura, versionada e auditável, o primeiro fluxo vertical do **Mapa de Risco — Ferramenta de Orientação e Identificação de Sinais de Atenção**.
- **L16:** Este pacote deverá permitir:
- **L46:** A implementação deverá consultar conjuntamente:
- **L114:** `REQ-FAM-009` — Auditoria
- **L124:** A implementação deverá distinguir claramente:
- **L144:** Essas entidades não deverão ser fundidas em uma única tabela.
- **L180:** A identidade deverá permanecer separada sempre que possível.
- **L239:** A referência não deverá permitir inferir:
- **L267:** Para cumprir o versionamento integral previsto na TEC-01, a implementação deverá também permitir associar:
- **L286:** - uma regra de encaminhamento muda.
- **L288:** O sistema deverá continuar sabendo:
- **L300:** As perguntas não deverão ficar codificadas diretamente em componentes React ou equivalentes.
- **L358:** Cada pergunta deverá possuir código estável.
- **L370:** O código não deverá mudar simplesmente porque o texto da pergunta foi revisado.
- **L379:** BANCO
- **L455:** O sistema deverá conseguir distinguir:
- **L489:** > **informação desconhecida/não fornecida.**
- **L501:** Essa regra deverá possuir teste unitário obrigatório.
- **L507:** O banco deverá impedir respostas inválidas.
- **L534:** INFORMED
- **L565:** As informações iniciais foram apresentadas.
- **L579:** Alguma regra determinou prioridade de segurança/emergência.
- **L661:** Transições relevantes deverão ser auditáveis.
- **L712:** O motor não deverá produzir conclusões como:
- **L788:** o motor deverá reconhecer:
- **L794:** e priorizar segurança.
- **L826:** O motor deverá suportar:
- **L924:** Esse encadeamento deverá ser recuperável.

### Seções e estrutura

# FAM-DEV-001 — Fundação Técnica e Modelo de Dados do Mapa de Risco · # 1. Objetivo · # 2. Documentos obrigatórios · ### Arquitetura · ### Experiência · ### Metodologia · ### Situações e respostas · ### Decisões consolidadas · ### Conteúdo · ### Proteção · ### Dados · ### Não revitimização · ### Arquivos · ### Governança · # 3. Requisitos deste pacote · # PARTE I — DOMÍNIO · # 4. Separação dos conceitos · # 5. User · ## Regra · # 6. UserIdentity · # 7. Case · # 8. Identificador público · # 9. RiskAssessment · # 10. Por que versionar? · # PARTE II — QUESTIONÁRIO · # 11. Questionário parametrizado · # 12. Estados do questionário · # 13. RiskQuestion · # 14. Código permanente · # 15. Texto fora da regra · # PARTE III — RESPOSTAS · # 16. RiskAnswer · # 17. Regra crítica de domínio · # 18. Quatro estados técnicos diferentes · ### Ainda não respondeu · ### Sim · ### Não · ### Prefiro não responder · # 19. Regra metodológica · # 20. Constraint

### Plano de desenvolvimento

Traduzir em services, APIs, migrations, RLS, autenticação, auditoria, testes e observabilidade, respeitando nomes reais do schema remoto.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Segredos server-side, RLS granular, logs sanitizados, resposta a incidentes e nomenclatura remota compatível.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.2 00_INDICE_DO_PACOTE_DOCUMENTAL_FAM

**Arquivo:** `FAM_documentos_markdown_2026-08-24/00_INDICE_DO_PACOTE_DOCUMENTAL_FAM.md`  
**Classificação:** Governança documental — **vigente; controle documental**  
**Tamanho/estrutura:** 852 bytes, 18 linhas, 0 tabela(s) detectada(s).

### Finalidade e proposta

Define o inventário e a ordem inicial de leitura.

### Dependências

MASTER-01 → fontes vigentes → TEC-01/UX-01 → código → testes

### Propostas e regras extraídas

- **L11:** 5. POL-ARQ-01 — Política de Arquivos, Segurança, Retenção e Exclusão
- **L13:** 7. OC-01 — Matriz de Órgãos e Encaminhamento
- **L15:** 9. OC-03 — Fluxo de Encaminhamento e Informação à Usuária

### Seções e estrutura

# Pacote Documental — Plataforma FAM · ## Arquivos · ## Observação

### Plano de desenvolvimento

Converter em requisitos de aceitação, textos, matriz de rastreabilidade e revisão; não transformar o documento isoladamente em uma regra de runtime.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.3 01_DOCUMENTO_2A_MATRIZ_COMPARATIVA

**Arquivo:** `FAM_documentos_markdown_2026-08-24/01_DOCUMENTO_2A_MATRIZ_COMPARATIVA.md`  
**Classificação:** Fundamentação comparativa — **vigente; não é especificação executável isolada**  
**Tamanho/estrutura:** 1095 bytes, 28 linhas, 1 tabela(s) detectada(s).

### Finalidade e proposta

Organiza modelos e referências que fundamentam a ferramenta.

### Dependências

Marco + Princípios → 2B → decisões metodológicas

### Propostas e regras extraídas

- **L21:** | Segurança | priorizar situações de risco atual |
- **L24:** | Informação | linguagem clara |
- **L28:** | Encaminhamento | mínimo necessário |

### Seções e estrutura

# Documento 2A — Matriz Comparativa · ## Finalidade · ## Referências consideradas · ## Diretriz central · ## Eixos

### Plano de desenvolvimento

Converter em requisitos de aceitação, textos, matriz de rastreabilidade e revisão; não transformar o documento isoladamente em uma regra de runtime.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.4 02_DOCUMENTO_2B_MATRIZ_METODOLOGICA

**Arquivo:** `FAM_documentos_markdown_2026-08-24/02_DOCUMENTO_2B_MATRIZ_METODOLOGICA.md`  
**Classificação:** Núcleo metodológico — **vigente; contrato metodológico**  
**Tamanho/estrutura:** 887 bytes, 26 linhas, 0 tabela(s) detectada(s).

### Finalidade e proposta

Define princípios, necessidades, progressividade e regras de avaliação.

### Dependências

2A + Marco + Princípios → OC-04 → ProtectionFlow/Risk Engine

### Propostas e regras extraídas

- **L5:** C1 Segurança; C2 Não diagnóstico; C3 Não inferência; C4 Autonomia; C5 Necessidade; C6 Progressividade; C7 Encaminhamento responsável; C8 Privacidade.
- **L8:** - N01 Segurança
- **L11:** - N04 Informação
- **L26:** Base comum para equipe institucional, jurídica, desenvolvimento, UX/UI, segurança e profissionais credenciados.

### Seções e estrutura

# Documento 2B — Matriz Metodológica / Núcleo Metodológico · ## Princípios C1–C8 · ## Necessidades · ## Regras · ## Estrutura · ## Uso

### Plano de desenvolvimento

Parametrizar no Risk Engine e ProtectionFlowService, mantendo respostas YES/NO/PREFER_NOT_TO_ANSWER e sem diagnóstico ou pontuação conclusiva.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** ProtectionFlowService, Risk Engine e catálogo parametrizado.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Testes de emergência, risco relevante, informação insuficiente, preferência por não responder e ausência de diagnóstico.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.5 03_PRINCIPIOS_INSTITUCIONAIS

**Arquivo:** `FAM_documentos_markdown_2026-08-24/03_PRINCIPIOS_INSTITUCIONAIS.md`  
**Classificação:** Princípios institucionais — **vigente; regra de aceitação**  
**Tamanho/estrutura:** 563 bytes, 16 linhas, 0 tabela(s) detectada(s).

### Finalidade e proposta

Define limites transversais de segurança, autonomia, minimização e acesso.

### Dependências

Marco → JUR-03/JUR-02 → todos os módulos

### Propostas e regras extraídas

- **L3:** 1. Segurança em primeiro lugar.
- **L11:** 9. Compartilhamento responsável com destinatário competente.
- **L13:** 11. Segurança de arquivos.

### Seções e estrutura

# Princípios Institucionais — FAM

### Plano de desenvolvimento

Converter em requisitos de aceitação, textos, matriz de rastreabilidade e revisão; não transformar o documento isoladamente em uma regra de runtime.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.6 04_MATRIZ_DE_NECESSIDADES

**Arquivo:** `FAM_documentos_markdown_2026-08-24/04_MATRIZ_DE_NECESSIDADES.md`  
**Classificação:** Necessidades e backlog — **vigente; priorização**  
**Tamanho/estrutura:** 575 bytes, 12 linhas, 1 tabela(s) detectada(s).

### Finalidade e proposta

Relaciona necessidades da usuária às capacidades da plataforma.

### Dependências

2B + Marco → IMPL-01 → backlog priorizado

### Propostas e regras extraídas

- **L5:** | N01 | Segurança | identificar necessidade de proteção/resposta imediata |
- **L8:** | N04 | Informação | explicar caminhos e possibilidades |
- **L12:** As necessidades não devem ser convertidas automaticamente em diagnóstico ou classificação criminal.

### Seções e estrutura

# Matriz de Necessidades — FAM

### Plano de desenvolvimento

Usar como backlog e critérios de fase; cada item deve receber ID, código, teste, dependência e estado de aceite.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.7 05_POL-ARQ-01_POLITICA_ARQUIVOS_SEGURANCA_RETENCAO_EXCLUSAO

**Arquivo:** `FAM_documentos_markdown_2026-08-24/05_POL-ARQ-01_POLITICA_ARQUIVOS_SEGURANCA_RETENCAO_EXCLUSAO.md`  
**Classificação:** Política histórica de arquivos — **histórico; não usar como fonte vigente**  
**Tamanho/estrutura:** 999 bytes, 23 linhas, 0 tabela(s) detectada(s).

### Finalidade e proposta

Versão inicial da política de arquivos.

### Dependências

POL-ARQ-01 v1.1 substitui este documento

### Propostas e regras extraídas

- **L12:** - retenção e exclusão vinculadas à finalidade;
- **L20:** A retenção deve depender da finalidade e de eventual obrigação de conservação. Encerrada a finalidade, sem fundamento para conservação, o arquivo deve ser eliminado conforme a política, considerando também backups.

### Seções e estrutura

# POL-ARQ-01 — Política de Arquivos, Segurança, Retenção e Exclusão · ## Princípios · ## Regra · ## Retenção e exclusão · ## Acesso

### Plano de desenvolvimento

Não implementar diretamente. Registrar como histórico/duplicata e usar somente para rastrear a decisão de substituição.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

RLS, bucket privado, quarentena, scan status, legal hold, retenção e exclusão auditada.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.8 06_AC-02_CREDENCIAMENTO_PROFISSIONAL

**Arquivo:** `FAM_documentos_markdown_2026-08-24/06_AC-02_CREDENCIAMENTO_PROFISSIONAL.md`  
**Classificação:** Credenciamento e acesso — **vigente; depende de governança institucional**  
**Tamanho/estrutura:** 1070 bytes, 26 linhas, 0 tabela(s) detectada(s).

### Finalidade e proposta

Define perfis profissionais, escopo e credenciamento.

### Dependências

JUR-05 + TEC-01 → auth/RLS → painéis administrativos

### Propostas e regras extraídas

- **L23:** Registrar criação, aprovação, renovação, suspensão, revogação, alteração de escopo, acesso, visualização, download e encaminhamento.

### Seções e estrutura

# AC-02 — Credenciamento Profissional e Autorização de Acesso · ## Regra fundamental · ## Fluxo · ## Requisitos · ## Restrições · ## Contas · ## Segurança · ## Auditoria · ## Princípio

### Plano de desenvolvimento

Aplicar menor privilégio por função e necessidade, sem acesso automático por cargo; formalizar responsáveis e revisar RLS.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Minimização, consentimento explícito, escopo catalogado, menor privilégio e auditoria do compartilhamento.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.9 07_OC-01_MATRIZ_ORGAOS_ENCAMINHAMENTO

**Arquivo:** `FAM_documentos_markdown_2026-08-24/07_OC-01_MATRIZ_ORGAOS_ENCAMINHAMENTO.md`  
**Classificação:** Órgãos e encaminhamento — **vigente; catálogo parametrizado**  
**Tamanho/estrutura:** 1063 bytes, 23 linhas, 1 tabela(s) detectada(s).

### Finalidade e proposta

Define rede de destinos, competência e encaminhamento.

### Dependências

JUR-02 + OC-03 → catálogo de referral → operações

### Propostas e regras extraídas

- **L10:** | Delegacia/Polícia Civil | segurança pública, registro e investigação conforme competência |
- **L16:** Não existe acesso automático de órgãos ao banco FAM. Não deve existir “enviar histórico completo”.
- **L18:** Cada encaminhamento registra ID, profissional, destinatário, finalidade, dados, arquivos, urgência, data/hora, canal e status.
- **L23:** O compartilhamento não concede ao destinatário acesso ao banco de dados da FAM.

### Seções e estrutura

# OC-01 — Matriz de Órgãos e Encaminhamento · ## Regra institucional · ## Regras · ## Regra consolidada

### Plano de desenvolvimento

Parametrizar catálogo, consentimento, escopo mínimo, transições e auditoria; bloquear criação/ envio sem confirmação exigida.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Minimização, consentimento explícito, escopo catalogado, menor privilégio e auditoria do compartilhamento.

### Testes e critérios de aceite

Testes de consentimento obrigatório, escopo mínimo, anexo não limpo, duplicidade e transições requested/under_review/sent.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.10 08_OC-02_MATRIZ_EVIDENCIAS_ARQUIVOS

**Arquivo:** `FAM_documentos_markdown_2026-08-24/08_OC-02_MATRIZ_EVIDENCIAS_ARQUIVOS.md`  
**Classificação:** Evidências e arquivos — **vigente; depende de POL-ARQ v1.1**  
**Tamanho/estrutura:** 1015 bytes, 29 linhas, 1 tabela(s) detectada(s).

### Finalidade e proposta

Define categorias, necessidade, minimização e compartilhamento de evidências.

### Dependências

POL-ARQ-01 v1.1 + JUR-02 → storage/RLS/scanner

### Propostas e regras extraídas

- **L15:** Limite sugerido por caso: 500 MB. Esses números ainda devem ser validados tecnicamente antes de produção.
- **L26:** Download e compartilhamento são condicionados, registrados e vinculados à finalidade, necessidade, destinatário e autorização.
- **L29:** Enviar arquivo não significa encaminhamento automático.

### Seções e estrutura

# OC-02 — Matriz de Evidências e Arquivos · ## Terminologia · ## Limites iniciais · ## Segurança · ## Integridade · ## Compartilhamento · ## Regra

### Plano de desenvolvimento

Implementar storage privado, quarentena, MIME/tamanho, scanner, retenção, legal hold, URLs somente para clean, expurgo e auditoria.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

RLS, bucket privado, quarentena, scan status, legal hold, retenção e exclusão auditada.

### Testes e critérios de aceite

Testes de MIME/tamanho, quarentena, clean/infected/error, retenção, legal hold, expurgo e URL bloqueada.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.11 09_OC-03_FLUXO_ENCAMINHAMENTO_USUARIA

**Arquivo:** `FAM_documentos_markdown_2026-08-24/09_OC-03_FLUXO_ENCAMINHAMENTO_USUARIA.md`  
**Classificação:** Fluxo de encaminhamento — **vigente; integração com ProtectionFlow**  
**Tamanho/estrutura:** 1387 bytes, 39 linhas, 0 tabela(s) detectada(s).

### Finalidade e proposta

Define jornada da usuária, confirmação e informação sobre compartilhamento.

### Dependências

OC-01 + JUR-02/JUR-03 + ProtectionFlow → referral requests

### Propostas e regras extraídas

- **L5:** Informar antes do encaminhamento o que poderá ser compartilhado, com quem, para qual finalidade e quais arquivos.
- **L14:** Mostrar destinatário, finalidade, informações, arquivos e, quando apropriado, profissional responsável.
- **L20:** Nem todo tratamento depende de consentimento; a comunicação deve corresponder à hipótese jurídica aplicável.
- **L23:** Informar número, data/hora, destinatário, finalidade e status. “Recebimento confirmado” não significa atendimento.
- **L26:** A jornada proposta é:
- **L28:** 2. Como suas informações serão utilizadas?
- **L33:** 7. Possível encaminhamento
- **L36:** 10. Encaminhamento registrado
- **L39:** A FAM deve usar comunicação em camadas, linguagem clara e escolhas explícitas, sem induzir conclusão de crime, diagnóstico, validação de evidência ou garantia de atendimento por terceiro.

### Seções e estrutura

# OC-03 — Fluxo de Encaminhamento e Informação à Usuária · ## Objetivo · ## Informação em camadas · ## Antes do envio · ## Autonomia · ## Importante · ## Após o envio · ## Experiência · ## Princípio

### Plano de desenvolvimento

Parametrizar catálogo, consentimento, escopo mínimo, transições e auditoria; bloquear criação/ envio sem confirmação exigida.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Minimização, consentimento explícito, escopo catalogado, menor privilégio e auditoria do compartilhamento.

### Testes e critérios de aceite

Testes de consentimento obrigatório, escopo mínimo, anexo não limpo, duplicidade e transições requested/under_review/sent.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.12 DEC-01_Resolucao_4_Pontos_Criticos_v1.0

**Arquivo:** `FAM_documentos_markdown_2026-08-24/DEC-01_Resolucao_4_Pontos_Criticos_v1.0.md`  
**Classificação:** Decisões consolidadas — **vigente; fonte de decisões**  
**Tamanho/estrutura:** 16031 bytes, 545 linhas, 5 tabela(s) detectada(s).

### Finalidade e proposta

Registra pontos críticos e decisões que não devem ser reabertos sem justificativa.

### Dependências

REV-01/REV-02 + fundamentos → regras não reabertas

### Propostas e regras extraídas

- **L8:** **Escopo:** crianças/adolescentes; bases jurídicas; retenção; responsáveis institucionais
- **L10:** > **Nota:** este documento organiza decisões de governança e requisitos para a plataforma. A validação jurídica final deve ser realizada pela assessoria jurídica/encarregado da FAM antes da entrada em produção.
- **L20:** > **A FAM orienta, identifica sinais de atenção, protege a informação e conecta a usuária à rede competente. Não investiga, não produz laudo e não confirma crime.**
- **L32:** não deverá gerar investigação adicional dentro da plataforma.
- **L34:** O fluxo deverá priorizar:
- **L36:** 1. segurança imediata;
- **L47:** A plataforma NÃO deverá:
- **L53:** - classificar a informação como crime confirmado;
- **L68:** Para situações de violência envolvendo criança/adolescente, a plataforma deverá disponibilizar orientação para a rede competente.
- **L70:** O fluxo institucional deverá contemplar, conforme o caso:
- **L86:** A assistência social integra a rede, mas o encaminhamento deverá considerar a natureza e urgência da situação.
- **L94:** > Você informou que há uma criança ou adolescente em situação de risco.
- **L118:** Nenhum fluxo deverá ser colocado em produção com uma base jurídica genérica definida apenas pelo desenvolvedor ou pela equipe de atendimento.
- **L120:** Cada operação deverá possuir:
- **L133:** COMPARTILHAMENTO
- **L135:** RETENÇÃO
- **L148:** > **A plataforma não deverá usar “consentimento” como solução automática para todos os tratamentos.**
- **L150:** A base jurídica deve corresponder à operação concreta.
- **L157:** | proteção diante de perigo à vida/integridade | proteção da vida/incolumidade, quando presentes os requisitos legais |
- **L158:** | atendimento/encaminhamento de saúde | tutela da saúde somente dentro dos limites legais |
- **L161:** | compartilhamento com autoridade competente | fundamento correspondente à operação e ao destinatário |
- **L169:** O sistema não deverá permitir que um usuário simplesmente escolha:
- **L175:** As bases disponíveis em produção deverão ser cadastradas pela governança.
- **L192:** Alterações deverão gerar nova versão.
- **L200:** A retenção **não será definida por um único prazo para todo o banco**.
- **L208:** | R3 | registros de atendimento/encaminhamento | conforme necessidade e obrigação aplicável |
- **L209:** | R4 | logs de segurança/auditoria | conforme política de segurança e necessidade de responsabilização |
- **L222:** - logs de segurança;

### Seções e estrutura

# DEC-01 — Resolução dos 4 Pontos Críticos · # 1. Objetivo · # 2. DEC-01 — Crianças e adolescentes · ## 2.1 Decisão institucional · ## 2.2 Regra de não investigação · ## 2.3 Revelação espontânea · ## 2.4 Encaminhamento · ## 2.5 Regra importante · ## 2.6 UX proposta · # 3. DEC-02 — Bases jurídicas · ## 3.1 Decisão institucional · ## 3.2 Dados sensíveis · ## 3.3 Matriz preliminar de enquadramento · ## 3.4 Regra técnica · ## 3.5 Requisito · # 4. DEC-03 — Retenção e exclusão · ## 4.1 Decisão principal · ## 4.2 Revisão da regra de 30 dias · ## 4.3 Legal hold · ## 4.4 Ciclo de vida · ## 4.5 Backups · ## 4.6 Requisito técnico · # 5. DEC-04 — Responsáveis institucionais · ## 5.1 Decisão · ## 5.2 Funções mínimas · ### Direção/Governança · ### Proteção de Dados / Encarregado · ### Jurídico · ### Profissional especializado · ### Atendimento · ### Segurança da Informação · ### Tecnologia · ### Auditoria · ## 5.3 Regra absoluta · # 6. RACI consolidado para os quatro pontos · # 7. O que muda imediatamente na plataforma · ## 7.1 Formulário · ## 7.2 Compartilhamento · ## 7.3 Arquivos · ## 7.4 Acesso

### Plano de desenvolvimento

Detalhar após confronto com TEC-01, UX-01, REV-02 e regras jurídicas aplicáveis.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.13 JUR-01_Fluxos_Especiais_de_Protecao_v1.0

**Arquivo:** `FAM_documentos_markdown_2026-08-24/JUR-01_Fluxos_Especiais_de_Protecao_v1.0.md`  
**Classificação:** Fluxos especiais de proteção — **vigente para desenho; aprovação jurídica pendente**  
**Tamanho/estrutura:** 22640 bytes, 776 linhas, 4 tabela(s) detectada(s).

### Finalidade e proposta

Define tratamento para emergência, violência sexual, crianças/adolescentes e outros contextos.

### Dependências

Marco + 2B + OC-04 → ProtectionFlowService

### Propostas e regras extraídas

- **L10:** > **Nota de validação:** este documento organiza requisitos jurídicos e operacionais para a plataforma. Não substitui parecer jurídico específico, protocolos da rede pública ou análise do caso concreto. Regras de comunicação obrigatória devem ser validadas pela assessoria jurídica da FAM antes da produção.
- **L16:** Estabelecer fluxos especiais para situações em que a usuária, familiar, acompanhante ou terceiro informe fatos envolvendo:
- **L23:** - situações que possam gerar dever legal específico de comunicação ou proteção.
- **L31:** Todos os fluxos devem observar:
- **L37:** 5. acessibilidade;
- **L42:** 10. segurança;
- **L46:** 14. registro e auditoria;
- **L47:** 15. encaminhamento para órgão ou serviço competente.
- **L70:** A FAM não deve conduzir investigação própria para comprovar autoria ou materialidade.
- **L76:** Informações relacionadas a saúde e vida sexual podem constituir dados pessoais sensíveis nos termos da LGPD.
- **L78:** O tratamento deve possuir finalidade determinada e hipótese jurídica adequada.
- **L101:** A ANPD destaca a necessidade de medidas técnicas e de segurança para evitar acessos não autorizados e uso irregular dos dados. citeturn0search37
- **L118:** A plataforma não deverá realizar interrogatório de criança ou adolescente.
- **L135:** A plataforma não deve perguntar:
- **L151:** Depois disso, o fluxo deve priorizar proteção, não investigação.
- **L155:** Informações de criança/adolescente devem ser compartilhadas somente no fluxo de proteção aplicável e com os destinatários competentes.
- **L157:** A Lei nº 13.431/2017 prevê tratamento confidencial das informações e restringe sua utilização/repasse, ressalvadas finalidades legais como assistência à saúde e persecução penal. citeturn0search1
- **L165:** O Estatuto da Pessoa Idosa determina que nenhuma pessoa idosa seja objeto de negligência, discriminação, violência, crueldade ou opressão e estabelece que é dever de todos prevenir ameaça ou violação de direitos. citeturn0search2
- **L173:** A FAM, entretanto, não deve assumir automaticamente a condição de serviço de saúde.
- **L177:** > **A regra aplicável à FAM deve ser diferenciada da regra específica dos serviços de saúde.**
- **L189:** O sistema deve contemplar, sem pretender diagnosticar:
- **L202:** A pessoa idosa deve ser tratada como titular de direitos e não presumida incapaz em razão da idade.
- **L204:** A plataforma não deve presumir que familiar, cuidador ou terceiro possui autoridade para decidir pela pessoa idosa.
- **L224:** - direito de receber informação.
- **L228:** A ferramenta deverá prever, conforme necessidade:
- **L242:** Quando houver necessidade de apoio, a plataforma deverá permitir participação de pessoa de confiança sem transformar automaticamente essa pessoa em titular do acesso aos dados.
- **L254:** A plataforma deverá:
- **L259:** - priorizar segurança;

### Seções e estrutura

# JUR-01 — Fluxos Especiais de Proteção · # 1. Objetivo · # 2. Princípios jurídicos e institucionais · # 3. Papel da FAM · # 4. Regra geral de tratamento de dados · # 5. Regra de acesso · # 6. Fluxo especial A — Criança ou adolescente · ## 6.1 Base normativa principal · ## 6.2 Regra institucional · ## 6.3 Perguntas proibidas ou desaconselhadas · ## 6.4 Pergunta operacional permitida · ## 6.5 Compartilhamento · # 7. Fluxo especial B — Pessoa idosa · ## 7.1 Base normativa principal · ## 7.2 Atenção à distinção institucional · ## 7.3 Pergunta operacional · ## 7.4 Tipos de atenção · ## 7.5 Autonomia · # 8. Fluxo especial C — Pessoa com deficiência · ## 8.1 Base normativa · ## 8.2 Regra institucional · ## 8.3 Requisitos de acessibilidade · ## 8.4 Apoio · # 9. Fluxo especial D — Violência sexual · ## 9.1 Princípios · ## 9.2 Pergunta inicial · ## 9.3 Arquivos · # 10. Fluxo especial E — Emergência · ## 10.1 Definição operacional · ## 10.2 Prioridade · ## 10.3 Regra · ## 10.4 Brasil · # 11. Fluxo especial F — Revelação espontânea · ### Fazer · ### Não fazer · # 12. Fluxo especial G — Situação envolvendo terceiro · # 13. Fluxo especial H — Risco patrimonial · # 14. Fluxo de encaminhamento · # 15. Matriz de destinatários · # 16. Regra de compartilhamento mínimo

### Plano de desenvolvimento

Parametrizar catálogo, consentimento, escopo mínimo, transições e auditoria; bloquear criação/ envio sem confirmação exigida.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** ProtectionFlowService, Risk Engine e catálogo parametrizado.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Testes de emergência, risco relevante, informação insuficiente, preferência por não responder e ausência de diagnóstico.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.14 JUR-02_Matriz_Bases_Juridicas_Finalidades_Compartilhamento_v1.0

**Arquivo:** `FAM_documentos_markdown_2026-08-24/JUR-02_Matriz_Bases_Juridicas_Finalidades_Compartilhamento_v1.0.md`  
**Classificação:** Bases jurídicas e compartilhamento — **vigente para desenho; validação jurídica/DPO pendente**  
**Tamanho/estrutura:** 21356 bytes, 730 linhas, 6 tabela(s) detectada(s).

### Finalidade e proposta

Define finalidade, minimização, base legal, consentimento e escopo.

### Dependências

Princípios + JUR-03 → consentimento, escopo e auditoria

### Propostas e regras extraídas

- **L10:** > **Nota:** este documento organiza a governança de tratamento de dados da plataforma. A definição final das bases legais e dos fluxos de compartilhamento deve ser validada pela assessoria jurídica e pelo responsável pela proteção de dados da FAM antes da entrada em produção.
- **L35:** 6. registro e auditoria.
- **L49:** A base deverá corresponder à operação concreta.
- **L68:** Algumas dessas informações podem constituir dados pessoais sensíveis ou dados pessoais de alta criticidade contextual.
- **L78:** - informações necessárias ao atendimento.
- **L96:** Cada operação deverá possuir finalidade específica.
- **L104:** | encaminhamento | sim, quando aplicável |
- **L106:** | auditoria de segurança | sim, limitada |
- **L116:** A FAM deverá coletar apenas o que seja necessário para a finalidade definida.
- **L124:** | Categoria | Finalidade | Necessidade | Acesso | Compartilhamento | Fundamento a validar | Registro |
- **L126:** | perigo atual | proteção | alta | profissional autorizado | autoridade/serviço competente conforme caso | art. 11, II, e, quando aplicável; legislação específica | obrigatório |
- **L127:** | ferimento/saúde | orientação/proteção | alta | profissional autorizado | saúde, quando aplicável | art. 11, II, e, e/ou hipótese específica de saúde conforme agente e operação | obrigatório |
- **L128:** | violência sexual | proteção/saúde | alta | profissional autorizado | rede competente conforme caso | hipótese específica aplicável | obrigatório |
- **L129:** | arma/acesso a arma | segurança | alta quando relevante | profissional autorizado | autoridade competente conforme caso | hipótese aplicável ao tratamento/compartilhamento | obrigatório |
- **L130:** | criança/adolescente | proteção | mínima necessária | profissional autorizado | rede/autoridade competente | legislação específica + LGPD | obrigatório |
- **L131:** | pessoa idosa | proteção | mínima necessária | profissional autorizado | rede/autoridade competente | legislação específica + LGPD | obrigatório |
- **L132:** | pessoa com deficiência | proteção/acessibilidade | necessária | profissional autorizado | conforme caso | LGPD + legislação específica | obrigatório |
- **L133:** | contato da usuária | atendimento | necessária | equipe autorizada | conforme finalidade | hipótese aplicável | obrigatório |
- **L134:** | documento | finalidade específica | estritamente necessária | profissional autorizado | somente se fundamentado | hipótese aplicável | obrigatório |
- **L135:** | imagem | proteção/documentação | estritamente necessária | profissional autorizado | somente se fundamentado | hipótese aplicável | obrigatório |
- **L136:** | áudio | proteção/documentação | estritamente necessária | profissional autorizado | somente se fundamentado | hipótese aplicável | obrigatório |
- **L137:** | vídeo | proteção/documentação | estritamente necessária | profissional autorizado | somente se fundamentado | hipótese aplicável | obrigatório |
- **L145:** Quando a base jurídica for consentimento, ele deverá ser:
- **L148:** - informado;
- **L153:** A LGPD define consentimento como manifestação livre, informada e inequívoca para finalidade determinada; para dados sensíveis, o art. 11 exige consentimento específico e destacado para finalidades específicas. citeturn0search0
- **L161:** > “Autorizo o tratamento destas informações para a finalidade X.”
- **L172:** - compartilhamento com órgãos;
- **L188:** Quando houver situação de perigo grave e atual, a FAM deverá avaliar:

### Seções e estrutura

# JUR-02 — Matriz de Bases Jurídicas, Finalidades e Compartilhamento · # 1. Objetivo · # 2. Regra central da FAM · # 3. Fundamentos da LGPD aplicáveis · ### Regra institucional · # 4. Dados tratados pela Ferramenta · ## 4.1 Respostas de risco · ## 4.2 Identificação · ## 4.3 Arquivos · # 5. Princípio da finalidade · # 6. Princípio da necessidade · # 7. Matriz principal · # 8. Consentimento · ### Não utilizar · ### Preferir · # 9. Consentimento não é autorização universal · # 10. Proteção da vida e da integridade · ### Aplicação institucional · ### Proibição · # 11. Tutela da saúde · # 12. Crianças e adolescentes · # 13. Pessoa idosa · # 14. Compartilhamento com órgãos públicos · # 15. Matriz de órgãos e finalidade · # 16. Regra do “mínimo necessário” · ### Exemplo · # 17. Compartilhamento integral proibido por padrão · # 18. Regra para diretores e administradores · ### Não permitido por cargo · ### Permitido · # 19. Regra para desenvolvedores · # 20. Regra para associados e voluntários · # 21. Regra para profissionais credenciados · # 22. Matriz “PODE / NÃO PODE” · # 23. Registro de decisão · # 24. Registro de negativa · # 25. Fluxo técnico de compartilhamento · # 26. Requisitos técnicos · ### JUR-02-TEC-01 · ### JUR-02-TEC-02

### Plano de desenvolvimento

Parametrizar catálogo, consentimento, escopo mínimo, transições e auditoria; bloquear criação/ envio sem confirmação exigida.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Minimização, consentimento explícito, escopo catalogado, menor privilégio e auditoria do compartilhamento.

### Testes e critérios de aceite

Testes de consentimento obrigatório, escopo mínimo, anexo não limpo, duplicidade e transições requested/under_review/sent.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.15 JUR-03_Politica_Atendimento_Nao_Revitimizacao_v1.0

**Arquivo:** `FAM_documentos_markdown_2026-08-24/JUR-03_Politica_Atendimento_Nao_Revitimizacao_v1.0.md`  
**Classificação:** Atendimento e não revitimização — **vigente; treinamento operacional pendente**  
**Tamanho/estrutura:** 15612 bytes, 412 linhas, 2 tabela(s) detectada(s).

### Finalidade e proposta

Define linguagem, escuta, não repetição e cuidado na interação.

### Dependências

Marco + Princípios → textos, UX e treinamento

### Propostas e regras extraídas

- **L10:** > **Nota de validação:** este documento deve ser validado pela assessoria jurídica e pelo responsável por proteção de dados da FAM antes da produção. Não substitui protocolos oficiais de saúde, assistência, segurança pública ou justiça.
- **L24:** A LGPD estabelece finalidade, adequação, necessidade, transparência, segurança, prevenção, não discriminação e responsabilização, além de exigir medidas técnicas e administrativas e sistemas estruturados segundo segurança e governança. citeturn0search0
- **L28:** A ANPD mantém materiais orientativos de proteção e segurança, inclusive para agentes de tratamento de pequeno porte. citeturn0search1turn0search3turn0search12
- **L40:** Sempre que compatível com segurança e legislação, a usuária poderá não responder, escolher “Prefiro não responder”, interromper, voltar, não anexar arquivos e receber orientação inicial sem relato detalhado.
- **L44:** > **Você não precisa responder a tudo. Responda somente ao que puder informar com segurança.**
- **L75:** > **Responda somente o que puder com segurança.**
- **L85:** > Se houver perigo imediato, priorize sua segurança e procure o serviço de emergência adequado.
- **L97:** A opção “Prefiro não responder” deve ter tratamento visual equivalente.
- **L107:** > ### Sua segurança vem primeiro
- **L117:** > Responda somente se puder fazer isso com segurança.
- **L151:** > Se precisar de uma forma diferente de comunicação, procure a opção de acessibilidade disponível.
- **L167:** > **Arquivos podem conter informações pessoais, localização, documentos, imagens ou outros dados sensíveis. Envie somente o que for necessário.**
- **L177:** Fazer: acolher, verificar segurança, limitar perguntas, orientar e encaminhar quando aplicável.
- **L183:** > **Obrigada por compartilhar essa informação.**
- **L187:** > Vamos priorizar sua segurança e indicar os próximos caminhos possíveis.
- **L193:** > Com base nas informações fornecidas, pode ser importante procurar um serviço especializado.
- **L198:** > - quais informações poderão ser necessárias;
- **L203:** > ### Sobre suas informações
- **L205:** > Suas informações são tratadas com acesso restrito.
- **L207:** > Em determinadas situações, a legislação pode permitir ou exigir o compartilhamento de informações com serviços ou autoridades competentes.
- **L209:** > Quando for possível e seguro, informaremos o que será compartilhado, com quem e para qual finalidade.
- **L211:** Não prometer sigilo absoluto. A LGPD exige transparência, segurança e prevenção. citeturn0search0
- **L225:** > Veja abaixo as orientações compatíveis com as informações fornecidas.
- **L229:** > ### Atenção: sua segurança pode exigir uma ação imediata
- **L231:** > Se houver perigo acontecendo agora, priorize sua segurança.
- **L251:** > Esta ferramenta organiza sinais de atenção com base nas informações fornecidas.
- **L261:** > A partir das informações fornecidas, apresentamos os caminhos que podem ser mais adequados.
- **L269:** > **Você pode pedir ajuda para preencher este formulário. Isso não significa que outra pessoa terá automaticamente acesso às suas informações.**

### Seções e estrutura

# JUR-03 — Política de Atendimento e Não Revitimização · ## 1. Objetivo · ## 2. Princípio central · ## 3. Bases de referência · ## 4. Regra de ouro · ## 5. Autonomia · ## 6. Linguagem · ## 7. Abertura da ferramenta · ## 8. Aviso de segurança · ## 9. Perguntas — padrão · ## 10. Perigo atual · ## 11. Atendimento médico · ## 12. Arma · ## 13. Violência sexual · ## 14. Criança ou adolescente · ## 15. Pessoa idosa · ## 16. Pessoa com deficiência · ## 17. Anexos · ## 18. Violência sexual e arquivos · ## 19. Revelação espontânea · ## 20. Encaminhamento · ## 21. Compartilhamento · ## 22. Tela de resultado · ## 23. Situação urgente · ## 24. Resultado sem indicação urgente · ## 25. Limitação · ## 26. Encerramento · ## 27. Pessoa idosa — UX · ## 28. Pessoa com deficiência — UX · ## 29. Segurança digital · ## 30. Sessão e dispositivo compartilhado · ## 31. Mensagens de erro · ## 32. Atendimento humano · ## 33. Proibições para equipe · ## 34. Revitimização institucional · ## 35. Revitimização digital · ## 36. Requisitos técnicos · ## 37. Metadados das perguntas · ## 38. Governança de textos · ## 39. Testes obrigatórios

### Plano de desenvolvimento

Implementar telas, estados de loading/erro/vazio, acessibilidade, Quick Exit sem promessa absoluta, copy aprovado e fluxos sem revitimização.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.16 JUR-04_Protocolo_Incidentes_Violacoes_Dados_v1.0

**Arquivo:** `FAM_documentos_markdown_2026-08-24/JUR-04_Protocolo_Incidentes_Violacoes_Dados_v1.0.md`  
**Classificação:** Incidentes e violações — **vigente para segurança; protocolo operacional pendente**  
**Tamanho/estrutura:** 14130 bytes, 499 linhas, 2 tabela(s) detectada(s).

### Finalidade e proposta

Define resposta a incidentes, contenção, registro e responsabilidades.

### Dependências

TEC-01 + POL-ARQ-01 → auditoria, contenção e resposta

### Propostas e regras extraídas

- **L8:** **Classificação:** segurança, privacidade, incidentes e resposta
- **L10:** > **Nota:** documento para validação jurídica, de proteção de dados e segurança da informação antes da produção.
- **L16:** A LGPD determina medidas de segurança desde a concepção até a execução do serviço e prevê comunicação de incidentes que possam acarretar risco ou dano relevante. citeturn0search9
- **L22:** > **Incidente não é assunto para esconder, improvisar ou resolver informalmente. É evento que deve ser identificado, contido, avaliado, registrado e tratado por fluxo institucional.**
- **L31:** - exclusão indevida;
- **L34:** - compartilhamento excessivo;
- **L50:** Qualquer pessoa que suspeite de incidente deve comunicar imediatamente pelo canal interno definido pela FAM.
- **L56:** **Não compartilhar o incidente em grupos informais.**
- **L88:** A decisão de comunicar incidente à ANPD e aos titulares não deve ser tomada individualmente por desenvolvedor, voluntário ou diretor sem competência definida.
- **L90:** Deverá envolver, conforme estrutura da FAM:
- **L98:** A ANPD informa que a comunicação deve ser feita pelo encarregado ou representante legalmente constituído do controlador. citeturn0search4
- **L102:** A ANPD informa que o incidente deve ser comunicado quando, cumulativamente:
- **L112:** > **A equipe não deve aguardar o encerramento completo da investigação para iniciar a avaliação de comunicação.**
- **L114:** Quando informações estiverem incompletas, o regulamento admite comunicação preliminar e complementar nas condições aplicáveis. citeturn0search4
- **L129:** - informações sobre risco ou ameaça;
- **L136:** Evento sem exposição relevante confirmada e contido rapidamente.
- **L145:** Risco significativo à segurança física/moral, exposição ampla, invasão ativa, comprometimento de contas ou situação que possa exigir comunicação imediata.
- **L160:** - bloquear compartilhamento;
- **L164:** A contenção deve evitar destruir evidências necessárias à investigação técnica.
- **L199:** > **INCIDENTE DE SEGURANÇA — NÃO COMPARTILHAR**
- **L205:** > Registre somente as informações necessárias e encaminhe pelo canal institucional.
- **L224:** Quando aplicável, a comunicação deverá usar linguagem simples, direta e individualizada quando possível.
- **L226:** A ANPD informa que o comunicado deve contemplar, entre outros pontos:
- **L229:** - medidas técnicas e de segurança;
- **L233:** - contato para informações. citeturn0search4
- **L237:** > ### Aviso importante sobre suas informações
- **L239:** > Identificamos um incidente de segurança que pode ter afetado informações relacionadas à sua conta.
- **L243:** > **O que pode ter sido afetado:** [informação]

### Seções e estrutura

# JUR-04 — Protocolo de Incidentes e Violações de Dados · ## 1. Objetivo · ## 2. Princípio central · ## 3. O que é incidente · ## 4. Primeira regra · ## 5. Fluxo institucional · ## 6. Regra de autoridade · ## 7. Critério de comunicação · ## 8. Prazo regulatório · ## 9. Dados de alta criticidade · ## 10. Classificação interna · ### Nível 1 — baixo · ### Nível 2 — moderado · ### Nível 3 — alto · ### Nível 4 — crítico · ## 11. Contenção · ## 12. Preservação de evidências · ## 13. Proibição de investigação informal · ## 14. Comunicação interna inicial · ## 15. Avaliação do impacto · ## 16. Comunicação à titular · ## 17. Texto-base para comunicação à usuária · ## 18. Não minimizar · ## 19. Não criar pânico · ## 20. Incidente com profissional interno · ## 21. Incidente causado por fornecedor · ## 22. Incidente com desenvolvedor · ## 23. Incidente envolvendo arquivo · ## 24. Incidente envolvendo credencial · ## 25. Incidente envolvendo dispositivo compartilhado · ## 26. Registro de incidente · ## 27. Trilha de auditoria · ## 28. Comunicação com autoridades · ## 29. Retenção dos registros de incidente · ## 30. Requisitos técnicos · ## 31. Testes · ## 32. Pós-incidente · ## 33. Princípio de aprendizagem · ## 34. Documentos relacionados · ## 35. Próxima etapa

### Plano de desenvolvimento

Detalhar após confronto com TEC-01, UX-01, REV-02 e regras jurídicas aplicáveis.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Segredos server-side, RLS granular, logs sanitizados, resposta a incidentes e nomenclatura remota compatível.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.17 JUR-05_Matriz_Responsabilidades_Institucionais_RACI_v1.0

**Arquivo:** `FAM_documentos_markdown_2026-08-24/JUR-05_Matriz_Responsabilidades_Institucionais_RACI_v1.0.md`  
**Classificação:** Responsabilidades RACI — **vigente; nomes/responsáveis formais pendentes**  
**Tamanho/estrutura:** 17360 bytes, 637 linhas, 10 tabela(s) detectada(s).

### Finalidade e proposta

Define responsabilidades institucionais e técnicas.

### Dependências

Marco + AC-02 → perfis, aprovação e operação

### Propostas e regras extraídas

- **L9:** **Classificação:** governança, proteção de dados, segurança e responsabilidades
- **L11:** > **Nota de validação:** este documento deverá ser aprovado pela direção da FAM e validado juridicamente, especialmente quanto às funções de controlador, operador, encarregado, profissionais habilitados e procedimentos de compartilhamento.
- **L21:** - quem pode decidir sobre encaminhamentos;
- **L22:** - quem pode autorizar compartilhamentos;
- **L29:** O objetivo é impedir que a expressão **“sou da FAM”** seja confundida com autorização para acesso a informações sensíveis.
- **L35:** > **Pertencer à FAM não significa possuir autorização para acessar informações sensíveis.**
- **L37:** O acesso deverá decorrer de:
- **L44:** 6. registro/auditoria quando aplicável.
- **L50:** Cada pessoa deverá ter somente o acesso necessário para executar sua função.
- **L52:** > **Se uma pessoa não precisa ver determinado dado para executar sua atividade, ela não deve ter acesso a esse dado.**
- **L58:** A plataforma deverá evitar concentração indevida de poderes.
- **L63:** - decisão de encaminhamento;
- **L66:** - auditoria;
- **L68:** - gestão de segurança;
- **L71:** Quem administra infraestrutura não deve automaticamente ter acesso ao conteúdo dos casos.
- **L102:** O acesso ao conteúdo deverá ser limitado ao necessário para sua função.
- **L130:** A equipe deverá receber somente os dados necessários para realizar o atendimento ou encaminhamento.
- **L132:** Não deverá visualizar automaticamente:
- **L137:** - informações sem relação com sua função.
- **L153:** Não deve acessar o conteúdo dos casos salvo quando:
- **L164:** O suporte não deverá receber conteúdo sensível por padrão.
- **L195:** Qualquer tratamento por parceiro deverá ser previamente definido em instrumento adequado e dentro da finalidade autorizada.
- **L201:** Conforme a política institucional definida pela FAM, informações sensíveis não deverão ser compartilhadas internamente por mera conveniência.
- **L203:** O compartilhamento externo seguirá:
- **L209:** - segurança;
- **L214:** **A FAM não deverá transformar essa lista em autorização automática. Cada caso exige avaliação.**
- **L226:** - para “ajudar informalmente”;
- **L238:** Requisitos:

### Seções e estrutura

# JUR-05 — Matriz de Responsabilidades Institucionais · ## Governança, acesso a dados sensíveis e matriz RACI · # 1. Objetivo · # 2. Princípio institucional · # 3. Regra de privilégio mínimo · # 4. Separação de funções · # 5. Perfis institucionais · ## 5.1 Direção da FAM · ## 5.2 Responsável pela proteção de dados / Encarregado · ## 5.3 Profissional especializado credenciado · ## 5.4 Equipe de atendimento · ## 5.5 Tecnologia / desenvolvimento · ## 5.6 Suporte técnico · ## 5.7 Voluntários · ## 5.8 Parceiros · # 6. Regra especial sobre compartilhamento · # 7. Acesso proibido · # 8. Acesso emergencial · # 9. Matriz de níveis de acesso · # 10. Matriz de permissões · # 11. Matriz RACI · ### Legenda · # 12. RACI — Governança · # 13. RACI — Atendimento · # 14. RACI — Dados · # 15. RACI — Incidentes · # 16. RACI — Alterações na plataforma · # 17. RACI — Compartilhamento externo · # 18. Matriz de incompatibilidades · # 19. Segregação técnica · # 20. Acesso de administrador · # 21. Contas individuais · # 22. Encerramento de vínculo · # 23. Revisão periódica · # 24. Responsabilidade individual · # 25. Termo de confidencialidade e responsabilidade · # 26. Treinamento · # 27. Regra para diretores e parceiros · # 28. Regra para equipe técnica · # 29. Requisitos técnicos

### Plano de desenvolvimento

Aplicar menor privilégio por função e necessidade, sem acesso automático por cargo; formalizar responsáveis e revisar RLS.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.18 Marco Institucional e Referencial Técnico — Ferramenta de Orientação e Identificação de Sinais de Atenção

**Arquivo:** `FAM_documentos_markdown_2026-08-24/Marco Institucional e Referencial Técnico — Ferramenta de Orientação e Identificação de Sinais de Atenção.md`  
**Classificação:** Marco institucional — **minuta para validação institucional**  
**Tamanho/estrutura:** 21649 bytes, 590 linhas, 0 tabela(s) detectada(s).

### Finalidade e proposta

Define finalidade, limites, natureza orientativa e requisitos de validação.

### Dependências

fontes oficiais → 2A/2B → todos os documentos derivados

### Propostas e regras extraídas

- **L15:** A Força Ativa da Mulher — FAM, enquanto instituição de atuação social voltada à promoção da dignidade, proteção, orientação e fortalecimento de mulheres e pessoas em situação de vulnerabilidade, desenvolve uma plataforma digital destinada a ampliar o acesso à informação, orientação e aos serviços disponibilizados pela instituição.
- **L17:** No âmbito dessa plataforma, a FAM propõe a criação da **Ferramenta de Orientação e Identificação de Sinais de Atenção**, concebida como um recurso digital de caráter informativo e orientativo destinado a auxiliar a usuária diante de situações que possam envolver violência, abuso, assédio, ameaça, agressão ou outras circunstâncias de vulnerabilidade.
- **L23:** A concepção da ferramenta considera referências técnicas e institucionais brasileiras e internacionais relacionadas ao atendimento de mulheres em situação de violência, incluindo materiais produzidos pelo Ministério da Saúde, Ministério das Mulheres, Ministério da Justiça e Segurança Pública e Organização Mundial da Saúde.
- **L51:** A FAM entende que uma plataforma digital pode funcionar como uma porta de entrada para informação e orientação, desde que sua utilização seja acompanhada de limites claros, proteção das informações e integração responsável com os serviços disponíveis.
- **L53:** A ferramenta, portanto, deve ser compreendida como **instrumento de orientação e acesso à informação**, e não como mecanismo autônomo de investigação ou classificação definitiva da situação da usuária.
- **L59:** Desenvolver uma ferramenta digital de orientação capaz de auxiliar mulheres e pessoas em situação de vulnerabilidade na identificação de sinais de atenção relacionados a possíveis situações de violência, abuso, assédio, ameaça ou agressão, oferecendo informações claras e caminhos possíveis de apoio e proteção.
- **L67:** 1. Facilitar o acesso a informações confiáveis.
- **L70:** 4. Reduzir a necessidade de exposição desnecessária de informações pessoais.
- **L75:** 9. Promover autonomia e acesso à informação.
- **L90:** > **Uma ferramenta informativa criada para ajudar você a identificar sinais de atenção e conhecer possíveis caminhos de orientação e apoio.**
- **L100:** - um recurso digital de informação;
- **L103:** - uma porta de acesso a informações sobre proteção e apoio;
- **L107:** Sua finalidade é **organizar informações fornecidas pela própria usuária e apresentar orientações compatíveis com o escopo previamente definido pela instituição**.
- **L130:** A ferramenta não deverá apresentar uma resposta automatizada como se representasse uma conclusão profissional ou jurídica sobre os fatos.
- **L138:** > **A ferramenta identifica sinais de atenção a partir das informações fornecidas pela usuária; não determina a existência de violência, crime ou responsabilidade de terceiros.**
- **L140:** Consequentemente, a ferramenta deverá privilegiar expressões como:
- **L142:** > “Sua resposta indica um sinal de atenção relacionado à segurança.”
- **L148:** Da mesma forma, deverá evitar afirmações como:
- **L156:** A linguagem deverá refletir o caráter informativo e orientativo da ferramenta.
- **L164:** A segurança da usuária deverá ser considerada prioritária.
- **L166:** Quando as informações indicarem possível perigo imediato, o fluxo deverá priorizar orientação de segurança e acesso aos serviços apropriados, em vez de insistir na coleta de informações.
- **L170:** A usuária deve ser tratada como sujeito de direitos e participante ativa das decisões relacionadas à sua situação.
- **L172:** A ferramenta não deverá pressionar a usuária a tomar uma decisão específica quando existirem diferentes caminhos legítimos de apoio.
- **L176:** A comunicação deverá ser respeitosa, clara, acolhedora e livre de julgamento.
- **L180:** A ferramenta deverá evitar perguntas desnecessárias, repetitivas ou excessivamente detalhadas sobre acontecimentos potencialmente traumáticos.
- **L186:** A usuária deverá saber:
- **L188:** - por que determinada informação é solicitada;
- **L190:** - quando uma informação poderá ser armazenada;

### Seções e estrutura

# MARCO INSTITUCIONAL E REFERENCIAL TÉCNICO · ## Ferramenta de Orientação e Identificação de Sinais de Atenção · ## 1. APRESENTAÇÃO · # 2. JUSTIFICATIVA INSTITUCIONAL · # 3. OBJETIVO GERAL · # 4. OBJETIVOS ESPECÍFICOS · # 5. NOME E NATUREZA DA FERRAMENTA · ## Ferramenta de Orientação e Identificação de Sinais de Atenção · # 6. O QUE A FERRAMENTA É · # 7. O QUE A FERRAMENTA NÃO É · # 8. PRINCÍPIO FUNDAMENTAL · # 9. PRINCÍPIOS INSTITUCIONAIS · ## 9.1 Segurança · ## 9.2 Autonomia · ## 9.3 Acolhimento · ## 9.4 Não revitimização · ## 9.5 Transparência · ## 9.6 Minimização · ## 9.7 Acessibilidade · ## 9.8 Proteção das informações · # 10. REFERENCIAL TÉCNICO E INSTITUCIONAL · ### 10.1 Ministério da Saúde · ### 10.2 Ministério das Mulheres · ### 10.3 Rede de atendimento · ### 10.4 Avaliação de risco · ### 10.5 Organização Mundial da Saúde · # 11. MODELO CONCEITUAL DA FERRAMENTA · # 12. SINAIS DE ATENÇÃO · # 13. AUSÊNCIA DE CLASSIFICAÇÃO AUTOMÁTICA DE RISCO · # 14. SEGURANÇA IMEDIATA · # 15. TRATAMENTO DAS INFORMAÇÕES · # 16. ENVIO DE DOCUMENTOS, FOTOS, ÁUDIOS E VÍDEOS · # 17. ENCAMINHAMENTO E REDE DE PROTEÇÃO · # 18. GOVERNANÇA INSTITUCIONAL · ### Direção · ### Responsável técnico · ### Responsável jurídico/DPO · ### Equipe de atendimento · ### Equipe de tecnologia · ### Comunicação

### Plano de desenvolvimento

Converter em requisitos de aceitação, textos, matriz de rastreabilidade e revisão; não transformar o documento isoladamente em uma regra de runtime.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.19 OC-04_Matriz_Situacoes_Risco_Respostas_v1.1 (1)

**Arquivo:** `FAM_documentos_markdown_2026-08-24/OC-04_Matriz_Situacoes_Risco_Respostas_v1.1 (1).md`  
**Classificação:** Situações de risco e respostas — **vigente; duplicata deve ser excluída**  
**Tamanho/estrutura:** 14183 bytes, 551 linhas, 3 tabela(s) detectada(s).

### Finalidade e proposta

Parametriza sinais de atenção, respostas e fluxos especiais.

### Dependências

2B + DEC-01 + REV-02 → Risk Engine/ProtectionFlow

### Propostas e regras extraídas

- **L23:** 5. possibilidades de encaminhamento;
- **L24:** 6. requisitos para tratamento e eventual compartilhamento de dados;
- **L25:** 7. regras de registro e auditoria.
- **L33:** Nenhum resultado deverá ser apresentado como:
- **L49:** O resultado deverá ser apresentado como orientação, e não como conclusão sobre os fatos.
- **L59:** | **Sim** | sinal informado pela usuária |
- **L60:** | **Não** | a usuária não informou a presença daquele sinal |
- **L61:** | **Prefiro não responder** | informação desconhecida |
- **L75:** Determinadas respostas podem revelar dados pessoais sensíveis, especialmente informações relacionadas à saúde e à vida sexual.
- **L77:** O tratamento deverá observar a LGPD, inclusive as regras específicas aplicáveis aos dados pessoais sensíveis.
- **L85:** Para cada campo deverá existir justificativa documentada:
- **L87:** > **Por que precisamos dessa informação?**
- **L89:** A resposta deve estar vinculada a uma finalidade concreta, como:
- **L92:** - segurança;
- **L95:** - encaminhamento;
- **L98:** Informações não necessárias para a finalidade definida não deverão ser coletadas.
- **L104:** A FAM deverá evitar coleta excessiva.
- **L106:** A pergunta deve existir somente quando sua resposta puder modificar legitimamente a orientação, prioridade, proteção, encaminhamento ou segurança.
- **L122:** A plataforma deverá priorizar segurança.
- **L126:** > **Sua segurança vem primeiro.**
- **L128:** > Você informou que existe perigo ou ameaça acontecendo agora.
- **L130:** > Se estiver em perigo imediato, procure um local seguro e acione o serviço de emergência ou segurança pública adequado à situação.
- **L136:** Isso não significa que toda informação do cadastro possa ser compartilhada livremente.
- **L166:** O tratamento de dados sensíveis relacionado à tutela da saúde deverá observar a hipótese jurídica aplicável e os requisitos da LGPD.
- **L168:** A FAM não deve se apresentar como serviço de saúde simplesmente por coletar informação relacionada à saúde.
- **L182:** **FATOR DE ATENÇÃO PARA SEGURANÇA**
- **L190:** > **“Essa informação pode ser importante para sua segurança.”**
- **L206:** → **orientação de segurança prioritária**

### Seções e estrutura

# OC-04 — Matriz de Situações de Risco e Respostas · ## 1. Objeto · ## 2. Limitação jurídica fundamental · ## 3. Natureza das respostas · ### Regra crítica · ## 4. Dados pessoais sensíveis · ## 5. Princípio da finalidade · ## 6. Princípio da necessidade · # 7. AR-01 — Perigo ou ameaça atual · ### Pergunta · ### Se “SIM” · ### Orientação · ### Regra · # 8. AR-02 — Ferimento ou necessidade médica · ### Pergunta · ### Se “SIM” · ### Orientação · ### Regra · # 9. AR-03 — Acesso a arma · ### Pergunta · ### Se “SIM” · ### Orientação · ### Regra · # 10. AR-04 — Violência sexual ou coerção · ### Pergunta · ### Se “SIM” · ### Orientação · ### Regra · # 11. AR-05 — Criança ou adolescente em risco · ### Pergunta · ### Se “SIM” · # 12. Combinação de sinais · ### Exemplo · # 13. Regra de precedência · # 14. Não criação de “score criminal” · ### Permitido · ### Evitar · # 15. Classificação operacional interna · # 16. Arquivos não podem bloquear proteção · # 17. Encaminhamento não é consequência automática

### Plano de desenvolvimento

Não implementar diretamente. Registrar como histórico/duplicata e usar somente para rastrear a decisão de substituição.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** ProtectionFlowService, Risk Engine e catálogo parametrizado.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Testes de emergência, risco relevante, informação insuficiente, preferência por não responder e ausência de diagnóstico.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.20 OC-04_Matriz_Situacoes_Risco_Respostas_v1.1

**Arquivo:** `FAM_documentos_markdown_2026-08-24/OC-04_Matriz_Situacoes_Risco_Respostas_v1.1.md`  
**Classificação:** Situações de risco e respostas — **vigente; duplicata deve ser excluída**  
**Tamanho/estrutura:** 14183 bytes, 551 linhas, 3 tabela(s) detectada(s).

### Finalidade e proposta

Parametriza sinais de atenção, respostas e fluxos especiais.

### Dependências

2B + DEC-01 + REV-02 → Risk Engine/ProtectionFlow

### Propostas e regras extraídas

- **L23:** 5. possibilidades de encaminhamento;
- **L24:** 6. requisitos para tratamento e eventual compartilhamento de dados;
- **L25:** 7. regras de registro e auditoria.
- **L33:** Nenhum resultado deverá ser apresentado como:
- **L49:** O resultado deverá ser apresentado como orientação, e não como conclusão sobre os fatos.
- **L59:** | **Sim** | sinal informado pela usuária |
- **L60:** | **Não** | a usuária não informou a presença daquele sinal |
- **L61:** | **Prefiro não responder** | informação desconhecida |
- **L75:** Determinadas respostas podem revelar dados pessoais sensíveis, especialmente informações relacionadas à saúde e à vida sexual.
- **L77:** O tratamento deverá observar a LGPD, inclusive as regras específicas aplicáveis aos dados pessoais sensíveis.
- **L85:** Para cada campo deverá existir justificativa documentada:
- **L87:** > **Por que precisamos dessa informação?**
- **L89:** A resposta deve estar vinculada a uma finalidade concreta, como:
- **L92:** - segurança;
- **L95:** - encaminhamento;
- **L98:** Informações não necessárias para a finalidade definida não deverão ser coletadas.
- **L104:** A FAM deverá evitar coleta excessiva.
- **L106:** A pergunta deve existir somente quando sua resposta puder modificar legitimamente a orientação, prioridade, proteção, encaminhamento ou segurança.
- **L122:** A plataforma deverá priorizar segurança.
- **L126:** > **Sua segurança vem primeiro.**
- **L128:** > Você informou que existe perigo ou ameaça acontecendo agora.
- **L130:** > Se estiver em perigo imediato, procure um local seguro e acione o serviço de emergência ou segurança pública adequado à situação.
- **L136:** Isso não significa que toda informação do cadastro possa ser compartilhada livremente.
- **L166:** O tratamento de dados sensíveis relacionado à tutela da saúde deverá observar a hipótese jurídica aplicável e os requisitos da LGPD.
- **L168:** A FAM não deve se apresentar como serviço de saúde simplesmente por coletar informação relacionada à saúde.
- **L182:** **FATOR DE ATENÇÃO PARA SEGURANÇA**
- **L190:** > **“Essa informação pode ser importante para sua segurança.”**
- **L206:** → **orientação de segurança prioritária**

### Seções e estrutura

# OC-04 — Matriz de Situações de Risco e Respostas · ## 1. Objeto · ## 2. Limitação jurídica fundamental · ## 3. Natureza das respostas · ### Regra crítica · ## 4. Dados pessoais sensíveis · ## 5. Princípio da finalidade · ## 6. Princípio da necessidade · # 7. AR-01 — Perigo ou ameaça atual · ### Pergunta · ### Se “SIM” · ### Orientação · ### Regra · # 8. AR-02 — Ferimento ou necessidade médica · ### Pergunta · ### Se “SIM” · ### Orientação · ### Regra · # 9. AR-03 — Acesso a arma · ### Pergunta · ### Se “SIM” · ### Orientação · ### Regra · # 10. AR-04 — Violência sexual ou coerção · ### Pergunta · ### Se “SIM” · ### Orientação · ### Regra · # 11. AR-05 — Criança ou adolescente em risco · ### Pergunta · ### Se “SIM” · # 12. Combinação de sinais · ### Exemplo · # 13. Regra de precedência · # 14. Não criação de “score criminal” · ### Permitido · ### Evitar · # 15. Classificação operacional interna · # 16. Arquivos não podem bloquear proteção · # 17. Encaminhamento não é consequência automática

### Plano de desenvolvimento

Não implementar diretamente. Registrar como histórico/duplicata e usar somente para rastrear a decisão de substituição.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** ProtectionFlowService, Risk Engine e catálogo parametrizado.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Testes de emergência, risco relevante, informação insuficiente, preferência por não responder e ausência de diagnóstico.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.21 POL-ARQ-01_Politica_Arquivos_Seguranca_Retencao_Exclusao_v1.1

**Arquivo:** `FAM_documentos_markdown_2026-08-24/POL-ARQ-01_Politica_Arquivos_Seguranca_Retencao_Exclusao_v1.1.md`  
**Classificação:** Política vigente de arquivos — **vigente v1.1**  
**Tamanho/estrutura:** 13886 bytes, 543 linhas, 1 tabela(s) detectada(s).

### Finalidade e proposta

Define formatos, quarentena, retenção, acesso, exclusão e legal hold.

### Dependências

JUR-02/JUR-04 + TEC-01 → FAM009–FAM015

### Propostas e regras extraídas

- **L8:** **Classificação:** proteção de dados, arquivos, segurança, retenção e descarte
- **L10:** > **Nota de validação:** os prazos abaixo constituem política operacional proposta. Antes da produção, devem ser validados juridicamente conforme finalidade, obrigação legal, exercício regular de direitos, defesa institucional e demais bases aplicáveis.
- **L14:** Estabelecer regras para recebimento, armazenamento, acesso, processamento, compartilhamento, retenção, revisão e exclusão de arquivos enviados à Plataforma FAM.
- **L20:** > **A FAM deve guardar somente aquilo que tenha finalidade definida, seja necessário e possua prazo justificável de retenção.**
- **L22:** O armazenamento indefinido não deve ser adotado como padrão.
- **L30:** **B — atendimento e encaminhamento;**
- **L32:** **C — proteção, segurança, exercício regular de direitos, cumprimento de obrigações legais ou atendimento a solicitações de autoridades competentes, quando juridicamente aplicável.**
- **L38:** A plataforma deverá informar:
- **L78:** > Os limites são parâmetros operacionais iniciais e devem ser revisados após testes de infraestrutura, segurança e experiência do usuário.
- **L86:** A plataforma deverá evitar incentivar o envio de grandes volumes de documentos.
- **L103:** O bloqueio deverá ocorrer antes da disponibilização do arquivo ao usuário interno.
- **L107:** Todo arquivo deverá passar, conforme capacidade técnica:
- **L120:** Não utilizar o nome original como identificador interno quando isso revelar informação sensível.
- **L134:** A plataforma deverá considerar que arquivos podem conter:
- **L141:** - informações médicas;
- **L144:** - informações de contato.
- **L150:** Os arquivos deverão ser protegidos:
- **L157:** As chaves criptográficas devem possuir controles próprios e não ficar expostas no código-fonte.
- **L188:** - segurança;
- **L203:** A FAM poderá encaminhar informações a órgãos ou serviços competentes quando houver fundamento jurídico e necessidade, conforme JUR-02 e OC-01.
- **L219:** Downloads deverão:
- **L241:** A retenção deverá considerar a finalidade.
- **L245:** **Retenção operacional proposta: até 30 dias**, salvo necessidade juridicamente justificada.
- **L251:** - manter somente registros mínimos necessários à auditoria, segurança ou obrigação aplicável.
- **L255:** **Retenção proposta: durante o período necessário ao atendimento e à finalidade documentada**, com revisão periódica.
- **L257:** O prazo definitivo deverá ser definido pela política institucional de retenção e pelo enquadramento jurídico de cada processo.
- **L263:** A classificação deve ser registrada.
- **L267:** > **“Pode ser útil algum dia” não é justificativa suficiente para retenção indefinida.**

### Seções e estrutura

# POL-ARQ-01 — Política de Arquivos, Segurança, Retenção e Exclusão · ## 1. Objetivo · ## 2. Princípio central · ## 3. Finalidades · ## 4. Regra de minimização · ## 5. Formatos aceitos · ### Documentos · ### Imagens · ### Áudio · ### Vídeo · ## 6. Quantidade de arquivos · ## 7. Arquivos proibidos · ## 8. Segurança no upload · ## 9. Nome do arquivo · ## 10. Metadados · ## 11. Criptografia · ## 12. Controle de acesso · ## 13. Acesso técnico · ## 14. Compartilhamento externo · ## 15. Órgãos e autoridades · ## 16. Download · ## 17. Compartilhamento por link · ## 18. Retenção · ### Classe A — orientação sem atendimento continuado · ### Classe B — atendimento/encaminhamento · ### Classe C — obrigação legal, defesa de direitos ou determinação de autoridade · ## 19. Regra contra retenção indefinida · ## 20. Exclusão · ## 21. Backups · ## 22. Exclusão segura · ## 23. Solicitação da titular · ## 24. Conta encerrada · ## 25. Arquivos de crianças e adolescentes · ## 26. Imagens íntimas · ## 27. Áudio e vídeo · ## 28. Arquivos de terceiros · ## 29. Detecção de malware · ## 30. Falha no processamento · ## 31. Auditoria · ## 32. Rastreabilidade

### Plano de desenvolvimento

Implementar storage privado, quarentena, MIME/tamanho, scanner, retenção, legal hold, URLs somente para clean, expurgo e auditoria.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

RLS, bucket privado, quarentena, scan status, legal hold, retenção e exclusão auditada.

### Testes e critérios de aceite

Testes de MIME/tamanho, quarentena, clean/infected/error, retenção, legal hold, expurgo e URL bloqueada.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.22 REV-01_Matriz_Executiva_Revisao_Cruzada_v1.0

**Arquivo:** `FAM_documentos_markdown_2026-08-24/REV-01_Matriz_Executiva_Revisao_Cruzada_v1.0.md`  
**Classificação:** Revisão cruzada — **referência de auditoria; não gera código isoladamente**  
**Tamanho/estrutura:** 14525 bytes, 594 linhas, 3 tabela(s) detectada(s).

### Finalidade e proposta

Demonstra confronto entre documentos e conflitos identificados.

### Dependências

todos os documentos → DEC-01/REV-02

### Propostas e regras extraídas

- **L16:** - JUR-02 — Matriz de Bases Jurídicas, Finalidades e Compartilhamento v1.0
- **L20:** - POL-ARQ-01 — Política de Arquivos, Segurança, Retenção e Exclusão v1.1
- **L21:** - OC-01 — Matriz de Órgãos e Encaminhamento
- **L38:** | Compartilhamento externo | Bem estruturado | 🟢 |
- **L44:** | Retenção | Necessita decisão institucional final | 🔴 |
- **L45:** | Exclusão/backups | Necessita especificação técnica | 🟠 |
- **L47:** | Órgãos e encaminhamentos | Necessita fechamento com OC-01 | 🟠 |
- **L82:** **Requisito técnico obrigatório:**
- **L100:** JUR-03 determina que a interface não deve exigir cadastro, histórico ou anexos antes da orientação essencial.
- **L107:** - quais informações são exibidas;
- **L109:** - como funciona a saída rápida;
- **L121:** - segurança;
- **L148:** - quais informações podem ser compartilhadas;
- **L149:** - quais são os fluxos obrigatórios;
- **L150:** - como tratar quem fornece a informação versus titular;
- **L166:** **Ação:** garantir que o formulário e os encaminhamentos não tratem idade como incapacidade.
- **L172:** JUR-01 estabelece acessibilidade e autonomia.
- **L174:** JUR-03 complementa com requisitos de UX.
- **L178:** **Ação:** transformar em requisitos de aceite de acessibilidade.
- **L186:** > dado → finalidade → necessidade → acesso → compartilhamento → destinatário → fundamento → registro → eliminação.
- **L209:** - auditoria.
- **L213:** JUR-05 impede compartilhamento automático por cargo.
- **L231:** **Requisito estrutural:**
- **L244:** auditoria
- **L251:** JUR-05 e POL-ARQ-01 estabelecem que TI não deve possuir acesso ao conteúdo por padrão.
- **L257:** **Ação:** implementar acesso excepcional auditável.
- **L272:** - retenção;
- **L273:** - exclusão;

### Seções e estrutura

# REV-01 — Matriz Executiva de Revisão Cruzada · ## 1. Documentos analisados · # 2. Resultado executivo · # 3. Matriz de coerência · ## 3.1 Finalidade · ## 3.2 “Prefiro não responder” · ## 3.3 Emergência · ## 3.4 Violência sexual · ## 3.5 Crianças e adolescentes · ## 3.6 Pessoa idosa · ## 3.7 Pessoa com deficiência · # 4. Dados e base jurídica · # 5. Compartilhamento · # 6. Acesso interno · # 7. Acesso técnico · # 8. Arquivos · # 9. Retenção · # 10. Exclusão e backups · # 11. Incidentes · # 12. RACI · # 13. UX · # 14. Terminologia · ### Usar · ### Evitar · # 15. Matriz de conflitos/lacunas · # 16. Bloqueadores antes do desenvolvimento · ### BLOQUEADOR 1 · ### BLOQUEADOR 2 · ### BLOQUEADOR 3 · ### BLOQUEADOR 4 · # 17. Decisões já suficientemente maduras · # 18. Matriz executiva de decisão · # 19. Conclusão executiva · # 20. Próximo documento recomendado · ## Status da revisão

### Plano de desenvolvimento

Converter em requisitos de aceitação, textos, matriz de rastreabilidade e revisão; não transformar o documento isoladamente em uma regra de runtime.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.23 REV-02_Matriz_Conflitos_Lacunas_Decisoes_Textos_Interface_v1.0

**Arquivo:** `FAM_documentos_markdown_2026-08-24/REV-02_Matriz_Conflitos_Lacunas_Decisoes_Textos_Interface_v1.0.md`  
**Classificação:** Textos e decisões de interface — **vigente; fonte prioritária de copy**  
**Tamanho/estrutura:** 14951 bytes, 564 linhas, 4 tabela(s) detectada(s).

### Finalidade e proposta

Define textos, mensagens, alertas e decisões de UX consolidadas.

### Dependências

JUR-03 + UX-01 + ProtectionFlow → componentes e testes

### Propostas e regras extraídas

- **L10:** > Este documento transforma as decisões da REV-01 e DEC-01 em alterações concretas nos documentos, requisitos técnicos e textos de interface. Não substitui parecer jurídico.
- **L16:** A plataforma deve funcionar como:
- **L18:** **orientação + identificação de sinais de atenção + proteção + encaminhamento**
- **L30:** | ID | Conflito/lacuna | Decisão | Documento afetado | Requisito técnico | UX | Status |
- **L34:** | RC-03 | Retenção | 5 classes | POL-ARQ/JUR-02/JUR-04 | policy engine | informação de retenção | 🟠 |
- **L37:** | RC-06 | Compartilhamento | Mínimo necessário | JUR-02/OC-01 | seleção granular + log | confirmação clara | 🟠 |
- **L80:** Você informou que há uma criança ou adolescente em situação de risco.
- **L104:** Cada operação deverá estar associada a uma configuração aprovada:
- **L117:** A LGPD estabelece hipóteses distintas para tratamento de dados pessoais e, para dados sensíveis, hipóteses específicas no art. 11. Portanto, o enquadramento deve ser feito por operação e finalidade. citeturn0search0
- **L121:** **Como usamos suas informações**
- **L123:** Pedimos apenas as informações necessárias para oferecer a orientação solicitada, proteger seus dados e, quando aplicável, orientar o acesso a serviços competentes.
- **L125:** Algumas informações podem ser consideradas dados pessoais sensíveis. O tratamento dessas informações segue as regras aplicáveis de proteção de dados.
- **L133:** - “Ao enviar, você concorda com todos os compartilhamentos.”
- **L145:** **R3 — Atendimento/encaminhamento**
- **L146:** **R4 — Segurança/auditoria**
- **L155:** O sistema deve calcular a política por:
- **L173:** **Por quanto tempo essas informações serão mantidas?**
- **L175:** As informações serão mantidas somente pelo período necessário para a finalidade informada ou enquanto houver fundamento legal para sua conservação.
- **L177:** **Saiba mais sobre retenção e exclusão**
- **L181:** **Solicitação de exclusão**
- **L183:** Você pode solicitar informações sobre os dados tratados pela FAM e, quando aplicável, sua exclusão.
- **L185:** Algumas informações podem precisar ser conservadas quando houver obrigação legal ou outra hipótese prevista em lei.
- **L232:** Este conteúdo contém informações protegidas. O acesso é permitido somente a usuários autorizados, dentro de sua função e finalidade.
- **L240:** Se houver perigo acontecendo agora, a interface deve interromper caminhos secundários e priorizar segurança.
- **L246:** Você informou que pode existir perigo ou ameaça acontecendo agora.
- **L256:** **Ver orientação de segurança**
- **L269:** antes da orientação inicial de segurança.
- **L277:** Compartilhamento somente quando houver:

### Seções e estrutura

# REV-02 — Matriz de Conflitos, Lacunas e Decisões · ## + Catálogo de Textos Finais de Interface · # 1. Regra-mestra · # 2. Matriz executiva · # 3. RC-01 — Crianças e adolescentes · ## Decisão · ## Texto de interface · ### Tela · ### Após “Sim” · # 4. RC-02 — Bases jurídicas · ## Decisão · ## Texto de interface — informação geral · ## Não usar · # 5. RC-03 — Retenção · ## Decisão · ## Requisito · ## Texto de interface · ### Antes do envio · ### Exclusão · # 6. RC-04 — Responsabilidades e acesso · ## Decisão · ## Regra técnica · ## Texto interno · # 7. RC-05 — Emergência · ## Decisão · ## Tela · # Sua segurança vem primeiro · ## Regra UX · # 8. RC-06 — Compartilhamento · ## Decisão · ## Tela de confirmação · # Revise antes de compartilhar · ## Proibição · # 9. RC-07 — Arquivos · ## Decisão · ## Texto de erro · ## Arquivo excedendo limite · ## Upload concluído · # 10. RC-08 — Acesso técnico · ## Decisão

### Plano de desenvolvimento

Implementar telas, estados de loading/erro/vazio, acessibilidade, Quick Exit sem promessa absoluta, copy aprovado e fluxos sem revitimização.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Testes de teclado, leitores de tela, loading/erro/vazio, Quick Exit e preservação de textos aprovados.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.24 TEC-01_Especificacao_Tecnica_Arquitetura_Completa_FAM_v1.0

**Arquivo:** `FAM_documentos_markdown_2026-08-24/TEC-01_Especificacao_Tecnica_Arquitetura_Completa_FAM_v1.0.md`  
**Classificação:** Arquitetura técnica — **vigente; autoridade de engenharia**  
**Tamanho/estrutura:** 32162 bytes, 2032 linhas, 1 tabela(s) detectada(s).

### Finalidade e proposta

Define backend, banco, APIs, autenticação, autorização, segurança e auditoria.

### Dependências

fundamentos + regras jurídicas + decisões → código e migrations

### Propostas e regras extraídas

- **L10:** > Este documento traduz as decisões institucionais, jurídicas, metodológicas e de UX já consolidadas em requisitos técnicos. Não substitui validação jurídica nem define, por si só, fornecedor ou tecnologia obrigatória.
- **L20:** - organizar informações necessárias;
- **L21:** - oferecer encaminhamentos;
- **L25:** - registrar auditoria;
- **L27:** - aplicar retenção e exclusão por finalidade.
- **L29:** A arquitetura deve preservar a regra fundamental:
- **L37:** A arquitetura deve considerar, no mínimo:
- **L40:** - orientações da ANPD sobre segurança da informação;
- **L50:** A ANPD recomenda medidas administrativas e técnicas adequadas ao risco e descreve controle de acesso como combinação de autenticação, autorização e auditoria. citeturn0search0turn0search1
- **L52:** A Resolução CD/ANPD nº 2/2022 prevê requisitos mínimos de segurança para agentes de tratamento de pequeno porte, considerando o risco e a realidade da organização. citeturn0search12
- **L54:** Como referência técnica complementar, o OWASP ASVS organiza controles de arquitetura, autenticação, controle de acesso, proteção de dados, logs, arquivos, APIs e configuração. Para uma aplicação que trata dados sensíveis, o nível 2 é uma referência adequada de verificação, sujeito à avaliação de risco. citeturn0search8turn0search13
- **L62:** Proteção de dados deve existir desde a arquitetura, não como recurso posterior.
- **L66:** A configuração padrão deve ser a mais restritiva compatível com a finalidade.
- **L74:** Mesmo usuário autorizado só acessa informações necessárias à tarefa.
- **L78:** Dados devem estar vinculados a uma finalidade.
- **L87:** segurança
- **L88:** auditoria
- **L94:** Operações relevantes devem gerar eventos auditáveis.
- **L98:** O sistema não deve induzir relato excessivo, repetição desnecessária ou confronto.
- **L116:** │ API / BFF             │
- **L135:** │ retenção        │
- **L136:** │ compartilhamento│
- **L142:** │ Banco      │  │ Object     │  │ Audit/Event  │
- **L157:** A aplicação deve ser organizada em módulos independentes.
- **L164:** 4. Encaminhamento
- **L167:** 7. Compartilhamento
- **L170:** 10. Auditoria
- **L172:** 12. Retenção

### Seções e estrutura

# TEC-01 — Especificação Técnica Consolidada · ## Arquitetura Completa da Plataforma FAM · # 1. Objetivo · # 2. Referenciais técnicos e regulatórios · # 3. Princípios arquiteturais · ## 3.1 Privacy by Design · ## 3.2 Security by Default · ## 3.3 Least Privilege · ## 3.4 Need to Know · ## 3.5 Purpose Binding · ## 3.6 Segregação · ## 3.7 Rastreabilidade · ## 3.8 Não revitimização · # 4. Arquitetura lógica · # 5. Separação de domínios · ## Módulos · # 6. Modelo de dados · ## 6.1 User · ## 6.2 UserIdentity · ## 6.3 Case · ## 6.4 RiskAssessment · ## 6.5 RiskAnswer · # 7. Estados da ferramenta · # 8. Máquina de decisão · ## 8.1 Emergência · ## 8.2 Atendimento médico · ## 8.3 Arma · ## 8.4 Violência sexual · ## 8.5 Criança/adolescente · # 9. Motor de políticas · ## Entradas · ## Saída · ## Exemplo · # 10. Controle de acesso · ## Modelo recomendado · ## Regra · # 11. Perfis · ## PublicUser · ## AssociatedUser · ## Attendant

### Plano de desenvolvimento

Traduzir em services, APIs, migrations, RLS, autenticação, auditoria, testes e observabilidade, respeitando nomes reais do schema remoto.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Segredos server-side, RLS granular, logs sanitizados, resposta a incidentes e nomenclatura remota compatível.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.25 UX-01 — Especificação de Experiência da Usuária e Fluxos de Interface

**Arquivo:** `FAM_documentos_markdown_2026-08-24/UX-01 — Especificação de Experiência da Usuária e Fluxos de Interface.md`  
**Classificação:** Experiência e fluxos — **vigente; deve ser conferido com TEC/JUR**  
**Tamanho/estrutura:** 16904 bytes, 698 linhas, 1 tabela(s) detectada(s).

### Finalidade e proposta

Define telas, estados, navegação, acessibilidade, Quick Exit e encerramento.

### Dependências

TEC-01 + REV-02 + regras operacionais/jurídicas → UI

### Propostas e regras extraídas

- **L18:** O documento deve permitir que as equipes de:
- **L24:** - acessibilidade;
- **L25:** - segurança;
- **L29:** compreendam exatamente como a experiência deverá funcionar.
- **L31:** O Mapa de Risco não deve se comportar como um formulário burocrático.
- **L33:** A experiência deverá transmitir:
- **L49:** A interface deverá partir do princípio de que a pessoa que utiliza o Mapa de Risco pode estar:
- **L64:** A interface deverá ajudar sem assumir o controle da decisão da usuária.
- **L70:** Sempre que aplicável, cada tela deverá ser especificada considerando:
- **L74:** Conteúdo visual, título, texto, ícones, avisos e informações apresentadas.
- **L82:** Validações, armazenamento, classificação, encaminhamento ou alteração de fluxo.
- **L86:** Restrições de comportamento necessárias para preservar segurança, privacidade e autonomia.
- **L116:** → **Orientações e encaminhamentos**
- **L118:** → **Compartilhamento opcional**
- **L122:** A **Saída Rápida** deverá permanecer disponível durante as etapas em que sua utilização for considerada segura e tecnicamente possível.
- **L138:** - acesso às informações de privacidade;
- **L139:** - recurso de acessibilidade;
- **L140:** - Saída Rápida.
- **L155:** Nenhuma informação sensível deverá aparecer antes que seja necessária para a utilização da ferramenta.
- **L161:** Antes da primeira pergunta, a usuária deverá compreender:
- **L169:** A linguagem deverá ser simples e acolhedora.
- **L185:** A experiência deverá privilegiar **uma pergunta por tela**.
- **L212:** Não deverá ser apresentada visualmente como erro, omissão ou escolha inferior.
- **L214:** O sistema deverá registrar tecnicamente que a pergunta não foi respondida sem inferir automaticamente uma resposta negativa.
- **L248:** A interface deverá apresentar uma tela específica.
- **L256:** A tela deverá:
- **L264:** O sistema não deverá presumir que a usuária pode telefonar, falar em voz alta ou abandonar imediatamente o local.
- **L270:** Quando houver indicação relacionada à violência sexual, a interface deverá migrar para um tratamento específico previsto nas regras do projeto.

### Seções e estrutura

# UX-01 — Especificação de Experiência da Usuária e Fluxos de Interface · ## 1. Identificação · # 2. Objetivo · # 3. Princípio central da experiência · # 4. Regra estrutural das telas · ### 4.1 O que a usuária vê · ### 4.2 O que a usuária pode fazer · ### 4.3 O que o sistema faz · ### 4.4 O que o sistema não deve fazer · ### 4.5 Próxima transição · # 5. Fluxo geral · # 6. Tela 01 — Entrada no Mapa de Risco · ## Objetivo · ## A usuária vê · ## Ações · ## Regra de UX · # 7. Tela 02 — Apresentação da ferramenta · ## CTA principal · ## CTA secundário · # 8. Tela 03 — Estrutura das perguntas · # 9. Padrão de resposta · # 10. Perguntas condicionais · # 11. Fluxo de emergência · ## Prioridade · # 12. Fluxo de violência sexual · # 13. Fluxo envolvendo criança ou adolescente · # 14. Fluxo envolvendo pessoa idosa · # 15. Anexos · ## Regra fundamental · # 16. Resultado · ## Estrutura · # 17. Encaminhamento · # 18. Compartilhamento · ## Regra · # 19. Encerramento · # 20. Saída Rápida · # 21. Navegação · # 22. Estados da interface · # 23. Mobile First · # 24. Privacidade visual

### Plano de desenvolvimento

Implementar telas, estados de loading/erro/vazio, acessibilidade, Quick Exit sem promessa absoluta, copy aprovado e fluxos sem revitimização.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Testes de teclado, leitores de tela, loading/erro/vazio, Quick Exit e preservação de textos aprovados.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.26 IMPL-01 — Plano Mestre de Implantação e Codificação da Plataforma FAM

**Arquivo:** `IMPL-01 — Plano Mestre de Implantação e Codificação da Plataforma FAM.md`  
**Classificação:** Plano mestre de implantação — **vigente; plano de execução**  
**Tamanho/estrutura:** 18976 bytes, 1331 linhas, 0 tabela(s) detectada(s).

### Finalidade e proposta

Decompõe a codificação em fundação, motor, experiência, proteção, arquivos, acessibilidade, segurança e homologação.

### Dependências

todos os documentos vigentes → fases de codificação

### Propostas e regras extraídas

- **L6:** **Natureza:** Engenharia de software e implantação
- **L7:** **Documentos principais de entrada:** MASTER-01, TEC-01, UX-01, REV-02, documentos JUR, OC, POL-ARQ-01 e INFO-01
- **L21:** > “Qual requisito será implementado agora, quais documentos o sustentam e como comprovaremos que foi implementado corretamente?”
- **L23:** A implantação deverá seguir:
- **L25:** **DOCUMENTO → REQUISITO → REGRA → COMPONENTE → CÓDIGO → TESTE → HOMOLOGAÇÃO**
- **L46:** - critérios de compartilhamento;
- **L51:** - comportamento da Saída Rápida;
- **L58:** A implantação deverá utilizar exclusivamente documentos considerados vigentes pelo MASTER-01.
- **L73:** └── INFO-01
- **L76:** REV-01 permanece como referência de auditoria.
- **L84:** A implantação será dividida em **10 blocos**.
- **L93:** IMPL-01.07 — Resultado e encaminhamento
- **L94:** IMPL-01.08 — INFO
- **L95:** IMPL-01.09 — Segurança, privacidade e acessibilidade
- **L111:** Implementar:
- **L116:** - banco;
- **L118:** - APIs;
- **L128:** A aplicação deverá evitar um grande módulo monolítico denominado simplesmente `mapa-risco`.
- **L146:** Os nomes finais deverão respeitar a arquitetura existente do projeto.
- **L165:** API / RPC
- **L170:** Regras críticas não deverão existir exclusivamente em componentes visuais.
- **L190:** - auditoria.
- **L217:** Os campos definitivos deverão seguir TEC-01 e JUR-02.
- **L246:** O motor deverá ser separado da interface.
- **L285:** Resposta deverá diferenciar explicitamente:
- **L293:** `PREFER_NOT_TO_ANSWER` nunca deverá ser transformado em `NO`.
- **L324:** Uma avaliação deverá preservar a versão das regras utilizada.
- **L332:** Uma avaliação realizada no passado não deverá ser reinterpretada silenciosamente usando regras futuras.

### Seções e estrutura

# IMPL-01 — Plano Mestre de Implantação e Codificação da Plataforma FAM · # 1. Objetivo · # 2. Princípio de implementação · # 3. Baseline · # 4. Estratégia · # PARTE I — FUNDAÇÃO · # 5. IMPL-01.01 — Fundação · ## Objetivo · ### Épico FAM-E01 — Estrutura · # 6. Separação arquitetural · # 7. Camadas · # PARTE II — IDENTIDADE E SESSÃO · # 8. IMPL-01.02 — Identidade, acesso e consentimentos · ### Épico FAM-E02 · # 9. Sessão do Mapa · # 10. Estados · # PARTE III — MOTOR · # 11. IMPL-01.03 — Motor do Mapa de Risco · ### Épico FAM-E03 · # 12. Perguntas parametrizadas · # 13. Respostas · # 14. Motor de regras · # 15. Versionamento · # 16. Resultado · # PARTE IV — EXPERIÊNCIA · # 17. IMPL-01.04 — Experiência do Mapa · ### Épico FAM-E04 · # 18. Fluxo · # 19. Componentes-base · # 20. Pergunta · # 21. Resposta · # 22. Saída Rápida · # PARTE V — FLUXOS ESPECIAIS · # 23. IMPL-01.05 — Proteção · ### Épico FAM-E05 · # 24. Emergência · # 25. Regra arquitetural · # 26. Criança/adolescente · # 27. Pessoa idosa · # 28. Violência sexual

### Plano de desenvolvimento

Usar como backlog e critérios de fase; cada item deve receber ID, código, teste, dependência e estado de aceite.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.27 MASTER-01 — Caderno Mestre de Documentação, Implantação e Jornada de Conhecimento

**Arquivo:** `MASTER-01 — Caderno Mestre de Documentação, Implantação e Jornada de Conhecimento.md`  
**Classificação:** Governança e jornada INFO — **baseline INFO**  
**Tamanho/estrutura:** 19755 bytes, 1023 linhas, 1 tabela(s) detectada(s).

### Finalidade e proposta

Define a relação entre documentação, código e jornada de conhecimento.

### Dependências

MASTER-01 governança + fontes oficiais → INFO

### Propostas e regras extraídas

- **L7:** A partir de sua aprovação, nenhuma equipe deverá precisar perguntar:
- **L9:** > “Qual documento devemos utilizar?”
- **L11:** O MASTER-01 deverá responder:
- **L21:** - quais definem segurança;
- **L22:** - quais definem encaminhamento;
- **L24:** - de onde nasceu cada requisito importante.
- **L51:** - OC-01 — Matriz de Órgãos e Encaminhamento;
- **L53:** - OC-03 — Fluxo de Encaminhamento da Usuária;
- **L59:** - JUR-02 — Matriz de Bases Jurídicas, Finalidades e Compartilhamento;
- **L66:** - POL-ARQ-01 — Política de Arquivos, Segurança, Retenção e Exclusão.
- **L89:** Isso é natural durante a fase documental, mas não deverá ser transferido para a fase de desenvolvimento.
- **L91:** O MASTER deverá estabelecer uma regra:
- **L97:** - auditoria;
- **L102:** Mas não deverão aparecer na biblioteca principal do desenvolvedor.
- **L108:** A documentação deverá ser organizada conceitualmente em três conjuntos.
- **L124:** Esta terceira biblioteca também alimentará o INFO — Direitos e Deveres.
- **L178:** Qualquer nova função deverá ser confrontada com esses princípios.
- **L184:** Liga problemas identificados às necessidades que a plataforma deverá atender.
- **L186:** Deverá ser utilizada em:
- **L199:** Fonte para construção do mecanismo de orientação e encaminhamento.
- **L201:** Deverá alimentar futuramente uma estrutura parametrizável de:
- **L216:** Deverá orientar:
- **L236:** Deverá ser associado ao motor de encaminhamento.
- **L248:** Deverá possuir rastreabilidade direta com o código.
- **L264:** Nenhum fluxo especial deverá ser implementado somente a partir do UX.
- **L277:** Deverá dialogar diretamente com backend, banco de dados, consentimentos e auditoria.
- **L293:** - encaminhamento.
- **L297:** > A plataforma não deverá obrigar uma mulher a reviver repetidamente uma violência para conseguir orientação.

### Seções e estrutura

# MASTER-01 — Caderno Mestre de Documentação, Implantação e Jornada de Conhecimento · ## 1. Missão do Caderno Master · # INFO — DIREITOS E DEVERES · # PARTE I — O PACOTE DOCUMENTAL REAL · ## 2. Documentação identificada no pacote · ### 2.1 Fundamentos · ### 2.2 Operação e encaminhamento · ### 2.3 Proteção jurídica · ### 2.4 Segurança documental e dados · ### 2.5 Governança profissional · ### 2.6 Decisões e consolidação · ### 2.7 Implementação · # 3. Documentos duplicados e versões superadas · # 4. Três bibliotecas · ## BIBLIOTECA A — DOCUMENTAÇÃO VIGENTE · ## BIBLIOTECA B — HISTÓRICO · ## BIBLIOTECA C — FONTES OFICIAIS · # PARTE II — MAPA DE USO DOS DOCUMENTOS · ## 5. Documentos de fundamento · ### Marco Institucional e Referencial Técnico · ### Documento 2A — Matriz Comparativa · ### Documento 2B — Matriz Metodológica · ### Princípios Institucionais · ### Matriz de Necessidades · # 6. Documentos operacionais · ## OC-01 — Órgãos e Encaminhamento · ## OC-02 — Evidências e Arquivos · ## OC-03 — Fluxo de Encaminhamento · ## OC-04 — Situações de Risco e Respostas · # 7. Documentos jurídicos · ## JUR-01 — Fluxos Especiais · ## JUR-02 — Bases Jurídicas e Compartilhamento · ## JUR-03 — Não Revitimização · ## JUR-04 — Incidentes e Violações de Dados · ## JUR-05 — RACI · # 8. POL-ARQ-01 · # 9. DEC-01 · # 10. REV-01 · # 11. REV-02 · # 12. TEC-01

### Plano de desenvolvimento

Converter em requisitos de aceitação, textos, matriz de rastreabilidade e revisão; não transformar o documento isoladamente em uma regra de runtime.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.28 MASTER-01 — Caderno Mestre de Governança Documental e Implantação da Plataforma FAM

**Arquivo:** `MASTER-01 — Caderno Mestre de Governança Documental e Implantação da Plataforma FAM.md`  
**Classificação:** Governança documental — **vigente; baseline controlador**  
**Tamanho/estrutura:** 11329 bytes, 592 linhas, 2 tabela(s) detectada(s).

### Finalidade e proposta

Define hierarquia, versões, rastreabilidade, critérios e ordem de codificação.

### Dependências

MASTER-01 → fontes vigentes → TEC-01/UX-01 → código → testes

### Propostas e regras extraídas

- **L5:** **Situação:** Baseline para implantação
- **L12:** O MASTER-01 estabelece a documentação oficial que deverá orientar a implantação da funcionalidade FAM.
- **L23:** A partir deste documento, a implantação deverá trabalhar sobre um **baseline documental controlado**.
- **L29:** > Nenhum requisito da FAM deverá ser implementado com base em documento substituído, duplicado, rascunho, conversa ou interpretação isolada de um desenvolvedor.
- **L67:** O segundo deverá ser tratado como **cópia duplicada** e não deverá integrar o baseline operacional.
- **L81:** Para implantação, a referência será:
- **L97:** | MN | Matriz de Necessidades | VIGENTE | Requisitos |
- **L100:** | OC-01 | Órgãos e Encaminhamento | VIGENTE | Rede |
- **L102:** | OC-03 | Fluxo de Encaminhamento | VIGENTE | Encaminhamento |
- **L105:** | JUR-02 | Bases Jurídicas e Compartilhamento | VIGENTE | Dados |
- **L107:** | JUR-04 | Incidentes e Violações | VIGENTE | Segurança |
- **L109:** | POL-ARQ-01 v1.1 | Política de Arquivos | VIGENTE | Arquivos e retenção |
- **L111:** | REV-01 | Revisão Cruzada | REFERÊNCIA | Auditoria |
- **L120:** A documentação deverá ser interpretada em camadas.
- **L166:** Utilizar para fundamentação e auditoria metodológica.
- **L176:** Deverá ser consultada antes de alterar:
- **L208:** Governará a experiência de encaminhamento.
- **L220:** Obrigatório para fluxos especiais.
- **L224:** Obrigatório para tratamento e compartilhamento de dados.
- **L232:** Obrigatório para segurança e resposta a incidentes.
- **L242:** DEC-01 deverá funcionar como registro das decisões críticas já solucionadas.
- **L244:** Uma decisão registrada em DEC-01 não deverá ser reaberta durante desenvolvimento simplesmente por preferência técnica ou estética.
- **L250:** REV-01 é documento de auditoria.
- **L252:** Não deverá normalmente produzir código diretamente.
- **L267:** Quando houver texto correspondente em REV-02, o desenvolvedor não deverá criar uma nova redação por conta própria.
- **L279:** - APIs;
- **L280:** - banco;
- **L284:** - segurança;

### Seções e estrutura

# MASTER-01 — Caderno Mestre de Governança Documental e Implantação da Plataforma FAM · # 1. Objetivo · # 2. Regra-mestra · # 3. Pacote analisado · # 4. Exclusões do baseline · ## 4.1 OC-04 duplicado · ## 4.2 POL-ARQ-01 · # 5. Registro Mestre · # 6. Hierarquia documental · # 7. Como utilizar cada grupo · ## 7.1 Marco + Princípios · ## 7.2 2A — Matriz Comparativa · ## 7.3 2B — Matriz Metodológica · ## 7.4 Matriz de Necessidades · # 8. Documentos operacionais · ## OC-01 · ## OC-02 · ## OC-03 · ## OC-04 · # 9. Documentos jurídicos · ## JUR-01 · ## JUR-02 · ## JUR-03 · ## JUR-04 · ## JUR-05 · # 10. DEC-01 · # 11. REV-01 · # 12. REV-02 · # 13. TEC-01 · # 14. UX-01 · # 15. Regra TEC + UX · # 16. Identificação de requisitos · # 17. Matriz de rastreabilidade · # 18. Regra de alteração · # 19. Ordem recomendada de leitura · ### Nível 1 — Conhecer · ### Nível 2 — Compreender · ### Nível 3 — Conhecer as decisões · ### Nível 4 — Conhecer limites · ### Nível 5 — Operação

### Plano de desenvolvimento

Converter em requisitos de aceitação, textos, matriz de rastreabilidade e revisão; não transformar o documento isoladamente em uma regra de runtime.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.29 MAP-001 — Mapeamento Técnico Pré-Implementação FAM + INFO

**Arquivo:** `passos/MAP-001 — Mapeamento Técnico Pré-Implementação FAM + INFO.md`  
**Classificação:** Mapeamento pré-implementação — **vigente; diagnóstico**  
**Tamanho/estrutura:** 18984 bytes, 1273 linhas, 4 tabela(s) detectada(s).

### Finalidade e proposta

Mapeia estado técnico, lacunas e dependências antes do desenvolvimento.

### Dependências

baseline → código/schema → lacunas

### Propostas e regras extraídas

- **L4:** **Situação:** Mapeamento documental concluído / confrontação com código pendente
- **L5:** **Objetivo:** Identificar o que deverá ser reutilizado, adaptado ou criado antes da primeira migration.
- **L11:** A documentação entregue contém a arquitetura funcional e técnica necessária à implantação, porém **não contém o repositório do software**.
- **L16:** A documentação determina que o recurso deverá existir.
- **L22:** Caso exista infraestrutura genérica que possa suportar o requisito FAM.
- **L40:** API / BFF
- **L53:** ├── Encaminhamento
- **L55:** └── Auditoria
- **L62:** ├── retenção
- **L63:** └── compartilhamento
- **L67:** BANCO       OBJECT        AUDIT/EVENT
- **L71:** Essa arquitetura deverá ser confrontada com o projeto existente, e não necessariamente recriada literalmente.
- **L84:** | 4 | Encaminhamento | DEFINIDO | Criar/adaptar |
- **L87:** | 7 | Compartilhamento | DEFINIDO | Criar regras específicas |
- **L90:** | 10 | Auditoria | DEFINIDO | Reutilizar/adaptar |
- **L91:** | 11 | Incidentes | DEFINIDO | Integrar segurança |
- **L92:** | 12 | Retenção | DEFINIDO | Criar políticas |
- **L118:** Se a aplicação já possui autenticação, o Mapa de Risco deverá utilizá-la.
- **L206:** Esses nomes **não precisam virar novos roles do banco automaticamente**.
- **L208:** Primeiro deverão ser comparados aos papéis já existentes.
- **L228:** Existe requisito de acesso excepcional:
- **L244:** Deverá ser procurado no código algum mecanismo de:
- **L282:** Independentemente da nomenclatura final, o domínio precisará representar:
- **L328:** sem confrontar o banco existente.
- **L392:** O domínio deverá preservar explicitamente:
- **L432:** Documentalmente, deverá existir um domínio equivalente a:
- **L467:** INFORMED
- **L494:** Portanto, não devemos assumir:

### Seções e estrutura

# MAP-001 — Mapeamento Técnico Pré-Implementação FAM + INFO · # 1. Resultado geral · # 2. Arquitetura definida pela TEC-01 · # 3. Mapa de módulos · # 4. Identidade e autenticação · ## Precisamos localizar no projeto · ### Regra · # 5. Separação de identidade · ## Decisão de implantação · # 6. Controle de acesso · # RBAC + ABAC · ### RBAC · ### ABAC · # 7. Perfis previstos · ## Atenção · # 8. Break-glass · # 9. Banco — entidades existentes a procurar · # 10. Entidades especificamente FAM · # 11. O que NÃO devemos fazer ainda · # 12. RiskAssessment · ## Classificação · # 13. Questionário · # 14. Respostas · ## Regra crítica · # 15. Motor de risco · ## Classificação · # 16. Máquina de estados · # 17. Frontend · ## Independentemente da stack, precisaremos dos equivalentes funcionais de: · # 18. Componentes reutilizáveis a procurar · # 19. Backend/API · ## Não assumir · # 20. Regra obrigatória para backend · # 21. Arquivos e anexos · # 22. Storage — o que procurar · ## Classificação · # 23. Requisitos obrigatórios dos arquivos · # 24. Auditoria · # 25. Eventos iniciais · # 26. Logs técnicos ≠ auditoria

### Plano de desenvolvimento

Usar como backlog e critérios de fase; cada item deve receber ID, código, teste, dependência e estado de aceite.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 4.30 PASSOS DE IMPLEMENTAÇÃO — FAM + INFO

**Arquivo:** `passos/PASSOS DE IMPLEMENTAÇÃO — FAM + INFO.md`  
**Classificação:** Passos de implantação — **vigente; roteiro operacional**  
**Tamanho/estrutura:** 13694 bytes, 1112 linhas, 1 tabela(s) detectada(s).

### Finalidade e proposta

Define a ordem prática de execução e validação FAM + INFO.

### Dependências

IMPL-01 + mapa técnico → deploy/homologação

### Propostas e regras extraídas

- **L5:** Cada passo deverá terminar com:
- **L30:** - [ ] banco de dados;
- **L35:** - [ ] auditoria;
- **L39:** - [ ] acessibilidade existente;
- **L41:** - [ ] APIs/RPCs existentes;
- **L87:** - INFO-01;
- **L98:** A primeira implantação trabalhará sobre essa versão.
- **L209:** INFORMED
- **L244:** Cada pergunta deverá possuir código permanente.
- **L314:** - registrar auditoria;
- **L321:** Implementar inicialmente apenas regras necessárias para validar arquitetura.
- **L408:** GERAR AUDITORIA
- **L430:** - acessibilidade;
- **L431:** - Saída Rápida.
- **L443:** - informações básicas de segurança.
- **L525:** Implementar o primeiro desvio crítico.
- **L549:** Implementar separadamente:
- **L557:** Cada um deverá possuir testes próprios.
- **L586:** Resultado deverá permitir explicar:
- **L634:** Cada serviço deverá responder:
- **L647:** Somente agora implementar:
- **L658:** - retenção;
- **L659:** - exclusão;
- **L660:** - auditoria.
- **L666:** Implementar apenas depois de:
- **L692:** Implementar:
- **L723:** Cada fonte deverá ter:
- **L789:** Cada tema deverá suportar:

### Seções e estrutura

# PASSOS DE IMPLEMENTAÇÃO — FAM + INFO · ## Regra de execução · # PASSO 001 — Auditoria do projeto atual · ## Objetivo · ## Verificar · ## Resultado esperado · ## Regra · # PASSO 002 — Congelar o Baseline 1.0 · ## Objetivo · ## Resultado · # PASSO 003 — Mapear o banco atual · ## Objetivo · ## Resultado esperado · # PASSO 004 — Criar o núcleo do Caso · ## Teste · # PASSO 005 — Criar RiskAssessment · ## Teste · # PASSO 006 — Implementar a máquina de estados · ## Teste · # PASSO 007 — Criar questionários versionados · # PASSO 008 — Cadastrar o primeiro conjunto de perguntas · # PASSO 009 — Criar RiskAnswer · ## Regra obrigatória · # PASSO 010 — Criar AnswerService · # PASSO 011 — Criar RiskEngine mínimo · ## Importante · # PASSO 012 — Criar histórico de estados · # PASSO 013 — Criar auditoria mínima · # PASSO 014 — Primeiro fluxo técnico completo · ## Este é o primeiro marco técnico. · # PASSO 015 — Criar a tela de entrada · # PASSO 016 — Tela de apresentação · # PASSO 017 — Componente padrão de pergunta · # PASSO 018 — Conectar UI ao motor · # PASSO 019 — Primeiro fluxo vertical real · ## Este é o primeiro MVP utilizável. · # PASSO 020 — Emergência · # PASSO 021 — Fluxos especiais · # PASSO 022 — Completar OC-04 · # PASSO 023 — Resultado completo

### Plano de desenvolvimento

Usar como backlog e critérios de fase; cada item deve receber ID, código, teste, dependência e estado de aceite.

### Dados, APIs e componentes

- **Dados:** entidades, estados e campos derivados da proposta devem ser versionados em migration; nomes remotos devem ser confirmados antes do deploy.
- **APIs/serviços:** serviço de domínio, rota server-side ou componente editorial/operacional conforme a proposta.
- **Interface:** estados de carregamento, erro, vazio, confirmação e acessibilidade devem ser explícitos quando o documento tratar de jornada.

### Segurança e privacidade

Sem coleta ou exposição adicional; aplicar linguagem clara, minimização e rastreabilidade.

### Testes e critérios de aceite

Teste documental, typecheck, build, regressão FAM e critério de rastreabilidade.

O item será aceito quando sua implementação puder ser rastreada ao documento, requisito, código, teste e validação correspondente; conteúdo que exigir aprovação externa ficará marcado como pendente.

## 5. Matriz de inovações implementáveis

| Inovação | Módulo alvo | Situação | Próxima ação |
|---|---|---|---|
| Linguagem de sinais de atenção em vez de diagnóstico | Risk Engine/ProtectionFlow/UI | Implementada | Revisar copy contra REV-02. |
| Proteção por fluxos especiais | ProtectionFlowService | Implementada | Validar juridicamente JUR-01. |
| Seleção e congelamento de anexos limpos | Encaminhamento/Evidence Lifecycle | Implementada | Homologar com scanner real. |
| Snapshot e hash do pacote enviado | Referral RPC/auditoria | Implementada | Aplicar FAM013/FAM014 remotamente. |
| INFO versionado com fontes | INFO | Estrutura implementada | Publicar conteúdo aprovado. |
| Expurgo diário via Vercel Cron | Vercel/API | Código implementado | Configurar `CRON_SECRET` e validar execução. |
| Cadastro exclusivamente FAM-Samambaia-DF | Registration | Implementado | Confirmar migration FAM007 no remoto. |
| Adaptador agnóstico de scanner | Malware Lifecycle | Implementado | Escolher provedor e worker. |
| Rastreabilidade por IDs de requisito | Governança | Parcial | Adicionar IDs REQ/RULE/UX/SEC/PRIV/DATA/TEST às próximas entregas. |

## 6. Plano de implantação por fases

| Fase | Conteúdo | Pré-requisitos | Critério de saída |
|---:|---|---|---|
| 0 | Governança documental | Baseline e versões definidos | Documento, fonte e autoridade identificados. |
| 1 | Fundação | Supabase, Auth, RLS, perfis e auditoria | Testes de autorização e schema remoto aprovados. |
| 2 | Metodologia | Perguntas, estados, sinais e ProtectionFlow | Cenários críticos aprovados sem diagnóstico. |
| 3 | Experiência | Cadastro, análise, resultado, Quick Exit e acessibilidade | Teste de teclado/leitor e textos aprovados. |
| 4 | Proteção | Encaminhamento, confirmação, fluxos especiais e RACI | Nenhum compartilhamento sem confirmação e escopo mínimo. |
| 5 | Arquivos | Quarentena, scanner, retenção, expurgo e snapshot | Arquivo não limpo bloqueado e expurgo auditado. |
| 6 | INFO | Conteúdo, fontes, versões e revisão | Artigo publicado somente após revisão. |
| 7 | Produção | Vercel, SMTP, cron, variáveis e E2E | Deployment funcional e checklist assinado. |

## 7. Pendências de decisão e implantação

1. Configurar as variáveis da Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET` nos ambientes adequados.
2. Confirmar a aplicação remota das migrations FAM007 e FAM009–FAM015.
3. Configurar SMTP próprio para evitar o limite de e-mail do provedor padrão.
4. Escolher o scanner real e validar a política de envio de dados a terceiros ou aprovar ClamAV privado.
5. Obter validação formal da Direção, responsável técnico, jurídico/DPO e operação.
6. Cadastrar conteúdo INFO aprovado e suas fontes.
7. Executar teste ponta a ponta não destrutivo em Preview e depois em Production.
8. Resolver dependências altas remanescentes sem utilizar atualização forçada sem análise de regressão.

## 8. Critério de pronto

A FAM somente deve ser considerada pronta para operação com dados reais quando houver: baseline documental versionado; requisitos rastreáveis; migrations aplicadas e conferidas; variáveis e segredos configurados; RLS validada; SMTP de produção; scanner definido; fluxo de emergência testado; encaminhamento com confirmação e snapshot; retenção e expurgo auditáveis; conteúdo INFO aprovado; acessibilidade validada; teste ponta a ponta executado; e aprovação institucional registrada.

## 9. Artefatos de apoio

- `fam_32_manifest.md` — manifesto de 30 arquivos e 2 diretórios.
- `fam_document_analysis.md` — análise estrutural de todos os documentos.
- `fam_document_dependency_order.md` — ordem de dependências.
- `fam_final_consolidated_gap_report.md` — lacunas consolidadas.
- `fam_master01_findings.md`, `fam_marco_findings.md`, `fam_principios_findings.md`, `fam_2a_findings.md`, `fam_2b_findings.md` — achados já registrados dos documentos processados em detalhe.
