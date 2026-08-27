# IMPL-01 — Plano Mestre de Implantação e Codificação da Plataforma FAM

**Código:** IMPL-01  
**Versão:** 1.0  
**Situação:** Documento executivo para início da codificação  
**Natureza:** Engenharia de software e implantação  
**Documentos principais de entrada:** MASTER-01, TEC-01, UX-01, REV-02, documentos JUR, OC, POL-ARQ-01 e INFO-01

---

# 1. Objetivo

O IMPL-01 transforma a documentação consolidada da FAM em um plano executável de desenvolvimento.

A partir deste documento, a pergunta deixa de ser:

> “O que ainda precisamos imaginar?”

e passa a ser:

> “Qual requisito será implementado agora, quais documentos o sustentam e como comprovaremos que foi implementado corretamente?”

A implantação deverá seguir:

**DOCUMENTO → REQUISITO → REGRA → COMPONENTE → CÓDIGO → TESTE → HOMOLOGAÇÃO**

---

# 2. Princípio de implementação

Não reconstruir durante a programação aquilo que já foi decidido documentalmente.

O desenvolvedor poderá definir:

- estruturas internas;
- padrões de código;
- otimizações;
- organização de componentes;
- estratégias técnicas equivalentes.

Não poderá modificar unilateralmente:

- regras de risco;
- textos aprovados;
- regras jurídicas;
- critérios de compartilhamento;
- fluxos especiais;
- princípios de não revitimização;
- política de arquivos;
- finalidade dos dados;
- comportamento da Saída Rápida;
- direitos da usuária.

---

# 3. Baseline

A implantação deverá utilizar exclusivamente documentos considerados vigentes pelo MASTER-01.

Especialmente:

```text
MASTER-01
     │
     ├── Fundamentos
     ├── JUR-01...05
     ├── OC-01...04
     ├── POL-ARQ-01
     ├── DEC-01
     ├── REV-02
     ├── TEC-01
     ├── UX-01
     └── INFO-01
```

REV-01 permanece como referência de auditoria.

Versões substituídas não originam código.

---

# 4. Estratégia

A implantação será dividida em **10 blocos**.

```text
IMPL-01.01 — Fundação
IMPL-01.02 — Identidade, acesso e consentimentos
IMPL-01.03 — Motor do Mapa de Risco
IMPL-01.04 — Experiência do Mapa
IMPL-01.05 — Fluxos especiais
IMPL-01.06 — Evidências e arquivos
IMPL-01.07 — Resultado e encaminhamento
IMPL-01.08 — INFO
IMPL-01.09 — Segurança, privacidade e acessibilidade
IMPL-01.10 — Testes, homologação e produção
```

---

# PARTE I — FUNDAÇÃO

# 5. IMPL-01.01 — Fundação

## Objetivo

Criar a infraestrutura sobre a qual as demais funcionalidades funcionarão.

### Épico FAM-E01 — Estrutura

Implementar:

- arquitetura de aplicação;
- organização modular;
- configuração de ambientes;
- banco;
- migrations;
- APIs;
- serviços;
- observabilidade;
- logs técnicos;
- tratamento de erros.

---

# 6. Separação arquitetural

A aplicação deverá evitar um grande módulo monolítico denominado simplesmente `mapa-risco`.

Sugestão conceitual:

```text
fam/
├── risk-map/
├── risk-engine/
├── protection/
├── referrals/
├── evidence/
├── privacy/
├── audit/
├── knowledge/
├── accessibility/
└── shared/
```

Os nomes finais deverão respeitar a arquitetura existente do projeto.

Não criar estruturas paralelas quando serviços existentes puderem ser reutilizados.

---

# 7. Camadas

Preferencialmente:

```text
UI
 ↓
HOOK / CONTROLLER
 ↓
SERVICE
 ↓
RULE ENGINE
 ↓
API / RPC
 ↓
DATABASE
```

Regras críticas não deverão existir exclusivamente em componentes visuais.

---

# PARTE II — IDENTIDADE E SESSÃO

# 8. IMPL-01.02 — Identidade, acesso e consentimentos

### Épico FAM-E02

Implementar:

- identificação quando necessária;
- sessão;
- autorização;
- perfis;
- consentimentos quando aplicáveis;
- preferências;
- retomada segura;
- encerramento;
- auditoria.

---

# 9. Sessão do Mapa

Criar conceito próprio de:

`risk_assessment_session`

Exemplo lógico:

```text
id
user_id
status
started_at
completed_at
last_activity_at
current_step
risk_result
emergency_flag
special_flow_flags
created_at
updated_at
```

Os campos definitivos deverão seguir TEC-01 e JUR-02.

---

# 10. Estados

Exemplo:

```text
started
in_progress
interrupted
completed
expired
cancelled
```

Não interpretar interrupção automaticamente como conclusão.

---

# PARTE III — MOTOR

# 11. IMPL-01.03 — Motor do Mapa de Risco

### Épico FAM-E03

Este é o núcleo lógico.

O motor deverá ser separado da interface.

---

# 12. Perguntas parametrizadas

Evitar perguntas rígidas dentro de componentes.

Modelo conceitual:

```text
risk_questions
risk_question_options
risk_question_rules
risk_question_versions
```

Uma pergunta poderá possuir:

- código;
- texto;
- explicação;
- ordem;
- grupo;
- versão;
- status;
- condições;
- fonte metodológica.

---

# 13. Respostas

Modelo conceitual:

```text
risk_answers
```

Resposta deverá diferenciar explicitamente:

```text
YES
NO
PREFER_NOT_TO_ANSWER
```

`PREFER_NOT_TO_ANSWER` nunca deverá ser transformado em `NO`.

---

# 14. Motor de regras

Criar serviço responsável por:

```text
Resposta
   ↓
Regra
   ↓
Indicador
   ↓
Contexto
   ↓
Próxima pergunta/ação
```

Fonte documental principal:

- Matriz Metodológica;
- OC-04;
- DEC-01;
- TEC-01.

---

# 15. Versionamento

Uma avaliação deverá preservar a versão das regras utilizada.

Exemplo:

`risk_engine_version`

Isso será importante porque metodologia e legislação podem evoluir.

Uma avaliação realizada no passado não deverá ser reinterpretada silenciosamente usando regras futuras.

---

# 16. Resultado

Não implementar apenas:

```text
score = 17
```

O resultado deverá conseguir preservar:

- fatores identificados;
- regras acionadas;
- contexto;
- situações especiais;
- encaminhamentos relacionados;
- versão metodológica.

---

# PARTE IV — EXPERIÊNCIA

# 17. IMPL-01.04 — Experiência do Mapa

### Épico FAM-E04

Fonte principal:

**UX-01 + REV-02**

Implementar tela por tela.

---

# 18. Fluxo

```text
Entrada
 ↓
Apresentação
 ↓
Início
 ↓
Perguntas
 ↓
Análise
 ↓
Fluxos condicionais
 ↓
Anexos opcionais
 ↓
Resultado
 ↓
Encaminhamento
 ↓
Compartilhamento opcional
 ↓
Encerramento
```

---

# 19. Componentes-base

Antes das telas, criar componentes reutilizáveis.

Exemplos conceituais:

```text
RiskQuestion
RiskAnswerOption
RiskProgress
RiskNotice
RiskAlert
QuickExit
SafeBack
SpecialFlowNotice
RiskResult
ReferralCard
EvidenceUploader
PrivacyNotice
```

---

# 20. Pergunta

`RiskQuestion`

Responsabilidades:

- apresentar texto;
- explicação;
- opções;
- acessibilidade;
- estado;
- navegação.

Não deverá calcular risco.

---

# 21. Resposta

`RiskAnswerOption`

Deverá suportar:

- SIM;
- NÃO;
- PREFIRO NÃO RESPONDER.

Com:

- teclado;
- touch;
- leitor de tela;
- foco;
- estado selecionado.

---

# 22. Saída Rápida

`QuickExit`

Será componente transversal.

Deverá existir conforme UX-01 e TEC-01.

Não deverá prometer apagar histórico do navegador ou outros rastros que tecnicamente não possa remover.

---

# PARTE V — FLUXOS ESPECIAIS

# 23. IMPL-01.05 — Proteção

### Épico FAM-E05

Implementar motores específicos para:

- emergência;
- violência sexual;
- criança/adolescente;
- pessoa idosa;
- pessoa com deficiência;
- demais situações previstas em JUR-01.

---

# 24. Emergência

Quando uma condição de emergência for acionada:

```text
MAPA
 ↓
EMERGENCY FLAG
 ↓
FLUXO PRIORITÁRIO
```

Completar o questionário deixa de ser prioridade.

---

# 25. Regra arquitetural

Não espalhar:

```text
if emergency
```

por dezenas de componentes.

Criar serviço central:

`ProtectionFlowService`

ou equivalente.

---

# 26. Criança/adolescente

Fonte:

- JUR-01;
- JUR-03;
- DEC-01;
- legislação oficial correspondente.

Implementar como fluxo protegido próprio.

---

# 27. Pessoa idosa

Mesmo princípio.

Evitar lógica improvisada no frontend.

---

# 28. Violência sexual

Aplicar integralmente os princípios de:

- finalidade;
- minimização;
- não revitimização;
- linguagem adequada;
- encaminhamento.

---

# PARTE VI — EVIDÊNCIAS

# 29. IMPL-01.06 — Evidências e arquivos

### Épico FAM-E06

Fontes:

- OC-02;
- POL-ARQ-01;
- JUR-02;
- JUR-04;
- TEC-01.

---

# 30. Regra

> Não possuir evidência não impede continuar.

Upload deverá ser opcional quando assim definido.

---

# 31. Serviço

Criar camada própria:

`EvidenceService`

Responsável por:

- validação;
- upload;
- metadados;
- armazenamento;
- autorização;
- recuperação;
- exclusão;
- auditoria;
- retenção.

---

# 32. Segurança

Arquivos sensíveis não deverão possuir URL pública permanente.

Implementar acesso controlado conforme TEC-01/POL-ARQ-01.

---

# PARTE VII — ENCAMINHAMENTO

# 33. IMPL-01.07 — Resultado e encaminhamento

### Épico FAM-E07

Fontes:

- OC-01;
- OC-03;
- OC-04;
- JUR-01;
- TEC-01;
- UX-01.

---

# 34. Cadastro de serviços

Criar estrutura parametrizada.

Conceitualmente:

```text
organizations
services
service_channels
service_locations
service_audiences
service_capabilities
referral_rules
```

Evitar escrever telefones e endereços diretamente no frontend.

---

# 35. Motor de encaminhamento

Entrada:

```text
situação
+ risco
+ contexto
+ território
+ preferência
```

Saída:

```text
opções adequadas
```

Não simplesmente:

```text
lista de órgãos
```

---

# 36. Explicação

Cada encaminhamento deverá poder responder:

- o que é;
- para que serve;
- quando procurar;
- como acessar;
- informações importantes.

Essa mesma estrutura alimentará o INFO.

---

# PARTE VIII — INFO

# 37. IMPL-01.08 — INFO — Conhecimento que Protege

### Épico FAM-E08

Fonte principal:

**INFO-01**

---

# 38. Entidades

Criar, conceitualmente:

```text
knowledge_sources
knowledge_topics
knowledge_contents
knowledge_tracks
knowledge_track_items
knowledge_relations
knowledge_progress
```

---

# 39. Fontes

`knowledge_sources`

Campos conceituais:

```text
id
title
organization
source_type
official_url
publication_date
last_verified_at
status
version
notes
```

---

# 40. Conteúdo

`knowledge_contents`

Deverá possuir:

- título;
- resumo;
- conteúdo;
- nível;
- tema;
- tempo estimado;
- status;
- revisão;
- fonte.

---

# 41. Relação conteúdo ↔ fonte

Nunca publicar conteúdo jurídico sem fonte rastreável.

```text
knowledge_content_sources
```

permitirá N:N.

---

# 42. Relação FAM ↔ fonte

Criar também:

```text
fam_document_sources
```

Permitirá registrar:

> “TEC-01 utiliza esta fonte.”

> “JUR-01 utiliza esta fonte.”

> “INFO-TRILHA-03 utiliza esta fonte.”

---

# 43. Jornada

`knowledge_tracks`

Exemplos:

- Conhecendo meus direitos;
- Entendendo a violência;
- Lei Maria da Penha;
- Sinais de risco;
- Violência sexual;
- Crianças e adolescentes;
- Pessoa idosa;
- Mulher com deficiência;
- Violência digital;
- Privacidade;
- Rede de proteção.

---

# 44. Progressão

Registrar progresso sem bloquear acesso.

```text
not_started
started
completed
saved
```

---

# 45. Busca

Primeira versão:

- título;
- resumo;
- palavras-chave;
- temas.

Posteriormente poderá evoluir para busca semântica.

A evolução não deverá atrasar o MVP.

---

# PARTE IX — SEGURANÇA

# 46. IMPL-01.09 — Segurança, privacidade e acessibilidade

### Épico FAM-E09

Não é fase cosmética.

É transversal.

---

# 47. Segurança

Implementar:

- autorização;
- políticas de acesso;
- proteção de arquivos;
- logs;
- auditoria;
- controle de sessão;
- rate limiting quando aplicável;
- tratamento seguro de erros;
- proteção de informações sensíveis.

---

# 48. Auditoria

Eventos críticos deverão produzir registros auditáveis.

Exemplos:

```text
ASSESSMENT_STARTED
ASSESSMENT_COMPLETED
EVIDENCE_UPLOADED
EVIDENCE_ACCESSED
EVIDENCE_DELETED
RESULT_SHARED
CONSENT_UPDATED
ADMIN_RULE_CHANGED
KNOWLEDGE_SOURCE_UPDATED
```

Sem registrar desnecessariamente conteúdo sensível no log técnico.

---

# 49. Privacidade

Aplicar:

- finalidade;
- necessidade;
- minimização;
- controle de acesso;
- retenção;
- descarte;
- transparência.

Fonte:

JUR-02 + POL-ARQ-01 + TEC-01.

---

# 50. Acessibilidade

Criar requisitos `ACC-FAM`.

Validar:

- teclado;
- leitor de tela;
- contraste;
- foco;
- zoom;
- tamanho de toque;
- linguagem;
- mensagens;
- mobile.

A cor nunca será o único indicador de risco.

---

# PARTE X — TESTES

# 51. IMPL-01.10 — Qualidade

### Épico FAM-E10

Cada requisito deverá possuir teste correspondente.

---

# 52. Camadas

### Unitários

Motor de regras e serviços.

### Integração

Banco, APIs e serviços.

### Componentes

Comportamento de interface.

### E2E

Jornadas completas.

### Acessibilidade

Automatizado + manual.

### Segurança

Testes específicos.

---

# 53. Cenários obrigatórios

Testar pelo menos:

```text
todas NÃO
todas SIM
todas PREFIRO NÃO RESPONDER
mistura de respostas
emergência
violência sexual
criança/adolescente
pessoa idosa
sem anexos
com anexos
falha no upload
perda de conexão
retomada
saída rápida
compartilhamento
cancelamento
sessão expirada
mobile
teclado
leitor de tela
```

---

# 54. Testes de regressão documental

Quando uma regra for alterada:

```text
Documento
 ↓
Requisito
 ↓
Teste afetado
 ↓
Código
 ↓
Regressão
```

---

# PARTE XI — BACKLOG

# 55. Estrutura

Cada tarefa deverá possuir:

```text
ID
Título
Épico
Descrição
Documentos de origem
Requisitos
Dependências
Critérios de aceite
Testes
Status
```

---

# 56. Exemplo

## FAM-DEV-001

**Título:** Criar modelo de sessão do Mapa

**Épico:** FAM-E03

**Fontes:**

- TEC-01;
- UX-01;
- JUR-02.

**Critérios de aceite:**

- sessão pode ser iniciada;
- possui estado;
- versão do motor registrada;
- retomada respeita regra definida;
- dados protegidos;
- testes aprovados.

---

# PARTE XII — ORDEM REAL DE EXECUÇÃO

# 57. Sprint/Fase 0 — Preparação

Antes da primeira funcionalidade:

- criar branch de implantação;
- congelar baseline documental;
- cadastrar IDs de requisitos;
- criar matriz de rastreabilidade;
- revisar arquitetura atual;
- identificar componentes reutilizáveis;
- identificar migrations necessárias.

---

# 58. Sprint/Fase 1 — Fundação

Construir:

- tabelas fundamentais;
- serviços;
- permissões;
- sessão;
- auditoria.

---

# 59. Sprint/Fase 2 — Motor mínimo

Construir:

- perguntas;
- respostas;
- regras;
- condicionais;
- versão;
- resultado interno.

Ainda sem preocupação com interface final.

---

# 60. Sprint/Fase 3 — Primeiro fluxo vertical

Implementar:

```text
ENTRAR
 ↓
RESPONDER
 ↓
PROCESSAR
 ↓
RESULTADO
```

Com um conjunto controlado de perguntas.

Isso valida a arquitetura antes de construir todas as exceções.

---

# 61. Sprint/Fase 4 — Fluxos especiais

Adicionar:

- emergência;
- violência sexual;
- criança/adolescente;
- pessoa idosa;
- demais condições.

---

# 62. Sprint/Fase 5 — Evidências

Adicionar sistema seguro de anexos.

---

# 63. Sprint/Fase 6 — Encaminhamento

Implementar rede e motor contextual.

---

# 64. Sprint/Fase 7 — UX completo

Aplicar integralmente UX-01 e REV-02.

---

# 65. Sprint/Fase 8 — INFO MVP

Implementar:

- INFO;
- fontes;
- temas;
- conteúdos;
- trilhas;
- progresso;
- acesso à fonte oficial.

Não começar com IA.

Primeiro construir uma boa base de conhecimento estruturada.

---

# 66. Sprint/Fase 9 — Hardening

- segurança;
- acessibilidade;
- performance;
- mobile;
- privacidade;
- auditoria;
- testes de abuso.

---

# 67. Sprint/Fase 10 — Homologação

Uma funcionalidade somente estará concluída quando possuir:

**Código aprovado**

+ **Teste aprovado**

+ **UX aprovado**

+ **Acessibilidade aprovada**

+ **Segurança aprovada**

+ **Rastreabilidade documental**

---

# PARTE XIII — DEFINITION OF DONE

# 68. Regra de conclusão

Uma tarefa FAM não estará pronta apenas porque funciona.

Para receber `DONE`, deverá:

- atender ao requisito;
- respeitar documentos vigentes;
- possuir testes;
- não gerar regressão;
- respeitar acessibilidade;
- respeitar segurança;
- possuir tratamento de erro;
- funcionar em mobile quando aplicável;
- possuir rastreabilidade;
- ter revisão técnica.

---

# PARTE XIV — O QUE NÃO FAREMOS AGORA

# 69. Controle de escopo

Para impedir nova expansão prematura, não deverão bloquear o MVP:

- IA educacional avançada;
- recomendação preditiva;
- gamificação complexa;
- assistente conversacional jurídico;
- busca semântica sofisticada;
- geração automática de documentos;
- integrações não essenciais;
- recursos de realidade aumentada;
- personalizações excessivas.

Esses elementos poderão existir futuramente.

Primeiro:

> **fazer o núcleo funcionar corretamente, com segurança e rastreabilidade.**

---

# 70. Primeiro marco de engenharia

O primeiro marco não será:

> “Todas as telas estão bonitas.”

Será:

> **Uma mulher consegue iniciar uma avaliação, responder às perguntas, acionar corretamente as regras, receber um resultado coerente e chegar ao encaminhamento adequado, com segurança, privacidade e rastreabilidade.**

Esse é o primeiro fluxo vertical que deverá funcionar integralmente.

---

# 71. Segundo marco

Depois:

> **Todos os fluxos especiais funcionam corretamente.**

---

# 72. Terceiro marco

Depois:

> **INFO disponibiliza conhecimento progressivo e rastreável às fontes governamentais oficiais.**

---

# 73. Regra para futuras funcionalidades

Toda nova funcionalidade deverá responder antes da codificação:

1. Qual problema resolve?
2. Qual documento a autoriza?
3. Qual requisito atende?
4. Quais dados utiliza?
5. Qual risco introduz?
6. Como aparece para a mulher?
7. Como será testada?
8. Como será auditada?

Se essas respostas não existirem, a funcionalidade ainda não está pronta para programação.

---

# 74. Resultado do IMPL-01

Com o IMPL-01, a documentação deixa de constituir apenas conhecimento acumulado.

Ela passa a controlar diretamente a engenharia:

```text
MASTER-01
    ↓
REQUISITOS
    ↓
BACKLOG
    ↓
IMPLEMENTAÇÃO
    ↓
TESTES
    ↓
HOMOLOGAÇÃO
    ↓
PRODUÇÃO
```

E cada funcionalidade poderá realizar o caminho inverso:

```text
TELA
 ↓
COMPONENTE
 ↓
REQUISITO
 ↓
DOCUMENTO
 ↓
FONTE
```

Essa rastreabilidade será uma característica estrutural da Plataforma FAM.

---

# 75. Diretriz de início

A partir deste documento, a fase de planejamento macro da funcionalidade pode ser considerada encerrada.

O próximo trabalho deverá ocorrer no nível de **execução**:

**FAM-DEV-001 em diante.**

A primeira entrega deverá preparar o baseline técnico e construir o núcleo necessário para o primeiro fluxo vertical do Mapa de Risco.

> **Documentamos para compreender.  
> Estruturamos para decidir.  
> Agora implementamos para funcionar.**