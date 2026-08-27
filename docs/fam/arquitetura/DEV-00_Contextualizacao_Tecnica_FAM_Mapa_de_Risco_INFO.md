# DEV-00 --- Caderno de Contextualização Técnica para Implementação

## Mapa de Risco + INFO --- Conhecimento que Protege

**Código:** DEV-00\
**Versão:** 1.0\
**Natureza:** Contextualização técnica de médio/alto nível\
**Público-alvo:** Desenvolvimento, arquitetura, UX/UI, segurança, dados,
QA e gestão técnica\
**Situação:** Documento de entrada para implementação\
**Baseline:** FAM 1.0

------------------------------------------------------------------------

# 1. Por que este documento existe

A Plataforma FAM chegou a uma nova etapa de desenvolvimento.

Antes da codificação das funcionalidades aqui descritas, foi realizado
um extenso trabalho de:

-   levantamento de necessidades;
-   pesquisa de referências oficiais;
-   análise metodológica;
-   definição de princípios;
-   análise jurídica;
-   construção dos fluxos operacionais;
-   definição das situações de risco;
-   tratamento de privacidade e proteção de dados;
-   política de arquivos;
-   segurança;
-   arquitetura técnica;
-   desenho da experiência;
-   revisão cruzada;
-   consolidação dos textos;
-   governança documental.

Esse trabalho resultou em um conjunto documental robusto.

O objetivo agora **não é continuar idealizando indefinidamente**.

O objetivo é transformar as decisões já consolidadas em software
funcional.

Este DEV-00 apresenta aos programadores uma visão integrada do que
deverá ser construído antes que entrem nos documentos especializados.

------------------------------------------------------------------------

# 2. O que vamos implementar

Serão incorporadas à plataforma duas grandes funcionalidades
complementares:

## FUNCIONALIDADE 1 --- Mapa de Risco

Ferramenta digital de orientação e identificação de sinais de atenção,
construída a partir da metodologia, documentação jurídica, referências
oficiais e regras consolidadas no projeto.

## FUNCIONALIDADE 2 --- INFO --- Conhecimento que Protege

Ambiente de informação, educação e aprendizagem que transforma as fontes
governamentais utilizadas na construção da própria plataforma em
jornadas progressivas de conhecimento sobre direitos, proteção,
cidadania, violência, segurança, privacidade, rede de atendimento e
temas relacionados.

As duas funcionalidades se relacionam, mas **não são a mesma coisa**.

------------------------------------------------------------------------

# 3. Visão integrada

``` text
                         PLATAFORMA FAM
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
         MAPA DE RISCO                     INFO
                │                           │
         orientação                   conhecimento
                │                           │
       sinais de atenção               aprendizagem
                │                           │
          proteção                     autonomia
                │                           │
       encaminhamento              fontes oficiais
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
                   MULHER MAIS INFORMADA
                    SOBRE SEUS CAMINHOS
```

Um módulo não deverá ser artificialmente acoplado ao outro.

A integração deverá ocorrer por **relações contextuais e serviços**, e
não pela fusão dos domínios.

------------------------------------------------------------------------

# 4. Filosofia central

O sistema não deverá assumir que toda mulher que chega à plataforma está
vivendo uma emergência.

Ela poderá chegar porque:

-   quer conhecer seus direitos;
-   quer estudar;
-   tem uma dúvida;
-   percebe algo estranho em um relacionamento;
-   quer ajudar outra pessoa;
-   procura determinado serviço;
-   quer compreender uma situação;
-   deseja realizar o Mapa;
-   encontra-se em situação de risco.

Por isso, queremos uma plataforma útil **antes, durante e depois de uma
situação crítica**.

------------------------------------------------------------------------

# PARTE I --- MAPA DE RISCO

# 5. O que é o Mapa

O Mapa deverá permitir que a mulher percorra uma experiência orientada
de perguntas e respostas destinada à identificação de **sinais de
atenção e necessidades de orientação**.

``` text
ENTRADA
   ↓
APRESENTAÇÃO
   ↓
PERGUNTAS
   ↓
RESPOSTAS
   ↓
MOTOR DE REGRAS
   ↓
SINAIS / CONTEXTO
   ↓
FLUXOS ESPECIAIS
   ↓
RESULTADO ORIENTATIVO
   ↓
ENCAMINHAMENTO
   ↓
CONHECIMENTO COMPLEMENTAR
```

# 6. O que ele não é

O sistema não deverá ser construído como mecanismo automático de
conclusão criminal ou jurídica.

Não deverá produzir conceitos internos ou externos como:

``` text
crime_confirmed
aggressor_confirmed
guilty
diagnosis
homicide_prediction
```

A linguagem de domínio deverá trabalhar preferencialmente com:

``` text
attention_signal
priority
special_flow
orientation
referral
```

# 7. Não construir um simples formulário

O Mapa não deverá ser implementado como um formulário que apenas soma
pontos e mostra uma mensagem.

A arquitetura desejada é:

``` text
QUESTIONNAIRE
     │
     ▼
ANSWER SERVICE
     │
     ▼
RISK ENGINE
     │
     ├── regras
     ├── combinações
     ├── prioridades
     └── fluxos
     │
     ▼
STATE MACHINE
     │
     ▼
ORIENTATION / RESULT
```

# 8. Questionário parametrizado

As perguntas deverão possuir identidade própria, como `AR-01`, `AR-02`,
`AR-03`.

O código deverá permanecer estável mesmo que futuramente sua redação
seja revisada. Perguntas não devem ficar espalhadas diretamente nos
componentes.

# 9. Respostas

Uma decisão consolidada e crítica:

``` text
SIM
NÃO
PREFIRO NÃO RESPONDER
SEM RESPOSTA
```

Logo:

``` text
PREFIRO_NAO_RESPONDER != NAO
PREFIRO_NAO_RESPONDER != SEM_RESPOSTA
```

Não utilizar modelagem booleana incapaz de preservar essa diferença.

# 10. Motor de regras

``` text
UI
 ↓
AnswerService
 ↓
RiskEngine
 ↓
Rule
 ↓
Signal
 ↓
State / Action
 ↓
UI
```

A UI pergunta. O motor interpreta. A UI apresenta a consequência.

# 11. Regras compostas

O motor deverá suportar condições simples e compostas quando previstas
metodologicamente, por exemplo:

``` text
AR-01 == SIM
```

ou:

``` text
AR-01 == SIM
AND
AR-03 == SIM
```

# 12. Máquina de estados

Estados conceituais definidos:

``` text
INITIAL
INFORMED
IN_PROGRESS
EMERGENCY
PROTECTION_SPECIAL
ORIENTATION
OPTIONAL_ATTACHMENT
RESULT
CLOSED
```

As transições deverão ser controladas por serviço de domínio.

# 13. Emergência

Emergência representa mudança de prioridade da aplicação:

``` text
QUESTIONÁRIO NORMAL
       │
       ▼
REGRA CRÍTICA ACIONADA
       │
       ▼
EMERGENCY
       │
       ▼
PROTEÇÃO / ORIENTAÇÃO
```

# 14. Fluxos especiais

A arquitetura deverá permitir tratamento próprio para:

-   violência sexual;
-   criança/adolescente;
-   pessoa idosa;
-   pessoa com deficiência;
-   demais situações especiais consolidadas.

# 15. Resultado

O resultado não deverá ser somente um score.

``` text
Assessment
   │
   ├── Answers
   ├── TriggeredRules
   ├── Signals
   ├── SpecialFlows
   ├── Priorities
   └── Orientations
```

# 16. Encaminhamento

Precisamos representar:

``` text
Organization
    │
    └── Service
          │
          ├── Channel
          ├── Location
          ├── Audience
          └── Capability
```

O objetivo é permitir que contexto, situação, necessidade e território
produzam opções adequadas de serviço.

# 17. Evidências e anexos

``` text
UPLOAD
 ↓
VALIDAÇÃO
 ↓
SEGURANÇA
 ↓
STORAGE PRIVADO
 ↓
AUTORIZAÇÃO
 ↓
AUDITORIA
 ↓
RETENÇÃO
```

A ausência de documentos, arquivos ou outras evidências não deverá
impedir a continuidade quando o fluxo não os exigir.

# 18. Compartilhamento

Compartilhamento deverá considerar:

``` text
DESTINATÁRIO
+
FINALIDADE
+
DADOS SELECIONADOS
+
AUTORIZAÇÃO
+
AUDITORIA
```

# 19. Saída Rápida

A Saída Rápida será componente transversal, acessível em desktop/mobile
e por teclado, com comportamento previsível e sem promessas tecnicamente
impossíveis sobre eliminação de rastros externos.

------------------------------------------------------------------------

# PARTE II --- INFO

# 20. Por que estamos criando o INFO

Durante a elaboração do Mapa utilizamos extensa documentação pública e
governamental.

O conhecimento usado para construir a proteção também pode ser
transformado em conhecimento acessível para as próprias mulheres.

Nasce daí:

# INFO --- Conhecimento que Protege

# 21. O INFO não será uma pasta de PDFs

Queremos transformar fontes oficiais em **experiência de conhecimento**,
não simplesmente armazenar documentos.

# 22. Modelo pedagógico

``` text
SITUAÇÃO DA VIDA
       ↓
PERGUNTA
       ↓
EXPLICAÇÃO SIMPLES
       ↓
CONHECIMENTO
       ↓
DIREITO
       ↓
APROFUNDAMENTO
       ↓
FONTE OFICIAL
```

# 23. Entrada do INFO

## Conhecimento que Protege

Quatro portas conceituais:

-   **Quero entender** --- informação rápida e linguagem cotidiana.
-   **Quero aprender** --- jornadas estruturadas.
-   **Quero me aprofundar** --- conteúdo mais detalhado.
-   **Fontes oficiais** --- documentos governamentais originais.

# 24. Arquitetura de dados do INFO

``` text
KnowledgeSource
KnowledgeTopic
KnowledgeContent
KnowledgeTrack
KnowledgeTrackItem
KnowledgeContentSource
KnowledgeProgress
```

Não misturar INFO com `RiskQuestion`.

# 25. KnowledgeSource

Uma fonte deverá possuir metadados como:

``` text
id
title
organization
source_type
official_url
publication_date
last_verified_at
status
version
```

Estados conceituais:

``` text
CURRENT
REVIEW_REQUIRED
UPDATED
ARCHIVED
```

# 26. Governança da fonte

``` text
FONTE ALTERADA
      ↓
CONTEÚDO RELACIONADO
      ↓
REVIEW_REQUIRED
```

O INFO deverá ser uma biblioteca governada.

# 27. Trilhas iniciais

1.  Conhecendo meus direitos
2.  Isso também pode ser violência?
3.  Entendendo a Lei Maria da Penha
4.  Reconhecendo sinais de risco
5.  Conhecendo a rede de proteção
6.  Minha privacidade também é um direito

Posteriormente poderão ser incluídos violência sexual,
criança/adolescente, pessoa idosa, mulher com deficiência, violência
digital, documentos e registros e outros temas.

# 28. Níveis de conteúdo

``` text
ENTENDA EM 2 MINUTOS
        ↓
APRENDA
        ↓
APROFUNDE
        ↓
FONTE OFICIAL
```

# 29. Minha Jornada

Estados mínimos:

``` text
NOT_STARTED
IN_PROGRESS
COMPLETED
SAVED
```

Não é necessária gamificação complexa no MVP.

# 30. Busca

Primeira implementação baseada em:

``` text
title
summary
keywords
topic
```

IA, embeddings e busca semântica ficam para avaliação na Fase 2.

------------------------------------------------------------------------

# PARTE III --- INTEGRAÇÃO

# 31. Mapa → INFO

``` text
MAPA
 ↓
sinal relacionado a determinado tema
 ↓
ORIENTAÇÃO
 ↓
"Entenda melhor este assunto"
 ↓
INFO
 ↓
conteúdo relacionado
```

Conhecimento nunca deverá atrasar uma orientação urgente.

# 32. INFO → Mapa

``` text
INFO
 ↓
Sinais de risco
 ↓
"Conheça o Mapa de Risco"
```

A ação será opcional e não iniciará avaliação silenciosamente.

# 33. Reutilização da rede

O cadastro de `organizations` e `services` deverá ser compartilhado
pelos módulos, evitando bases duplicadas.

# 34. Reutilização de fontes

``` text
Fonte governamental
       │
       ├── fundamenta documento FAM
       └── fundamenta conteúdo INFO
```

------------------------------------------------------------------------

# PARTE IV --- PRINCÍPIOS DE ENGENHARIA

# 35. Reutilizar antes de criar

Antes de criar `users`, `roles`, `permissions`, `files`, `audit`,
`organizations`, `services` ou CMS, verificar o projeto existente.

``` text
EXISTE?
  │
  ├── SIM → REUTILIZAR ou ADAPTAR
  └── NÃO → CRIAR
```

# 36. Não criar uma aplicação dentro da aplicação

Mapa e INFO deverão integrar a arquitetura existente. Evitar novo
sistema de usuários, novo design system, nova autenticação, segundo
mecanismo de auditoria, segundo storage ou segundo cadastro de
instituições quando já houver equivalentes adequados.

# 37. Separação de responsabilidades

``` text
UI
 ↓
HOOK / CONTROLLER
 ↓
SERVICE
 ↓
DOMAIN / RULE ENGINE
 ↓
API / RPC
 ↓
DATABASE
```

# 38. Segurança por backend

O frontend nunca será autoridade definitiva para autorização, risco,
acesso a arquivos, compartilhamento, retenção, legal hold ou
privilégios.

# 39. Segurança de dados

Quando aplicável:

``` text
IDENTIDADE
    ≠
CASO
    ≠
AVALIAÇÃO
    ≠
ARQUIVOS
    ≠
AUDITORIA
```

# 40. Logs

Evitar narrativas sensíveis em logs. Preferir eventos estruturados e
minimizados, por exemplo:

``` text
ANSWER_RECORDED
assessment_id=...
question_code=AR-04
```

# 41. Versionamento

Cada avaliação deverá preservar:

``` text
methodology_version
questionnaire_version
text_version
policy_version
```

# 42. Auditoria

Eventos relevantes deverão gerar trilha própria, como:

``` text
ASSESSMENT_STARTED
ANSWER_RECORDED
RULE_TRIGGERED
SPECIAL_FLOW_TRIGGERED
RESULT_GENERATED
EVIDENCE_ACCESSED
RESULT_SHARED
```

# 43. Acessibilidade

Os componentes-base deverão nascer preparados para teclado, leitor de
tela, foco, contraste, zoom, touch, mobile e linguagem compreensível.

# 44. Mobile first em fluxos críticos

Especial atenção a telas pequenas, uso com uma mão, ações grandes,
navegação simples, Saída Rápida, teclado virtual e conexão instável.

------------------------------------------------------------------------

# PARTE V --- COMO IMPLEMENTAREMOS

# 45. Fase A --- Auditoria do sistema existente

``` text
CÓDIGO ATUAL
    ↓
STACK
    ↓
BANCO
    ↓
AUTH
    ↓
PERMISSÕES
    ↓
STORAGE
    ↓
AUDITORIA
    ↓
COMPONENTES
    ↓
CMS/CONTEÚDO
```

Resultado:

``` text
EXISTE
REUTILIZAR
ADAPTAR
CRIAR
```

# 46. Fase B --- Fundação do Mapa

Criar/adaptar:

``` text
Case
RiskAssessment
RiskQuestionnaire
RiskQuestion
RiskAnswer
RiskRule
AssessmentStateHistory
AuditEvent
```

# 47. Fase C --- Motor mínimo

Começar com conjunto mínimo de perguntas, como `AR-01`, `AR-02` e
`AR-03`, validando:

``` text
pergunta
→ resposta
→ regra
→ estado
→ resultado
```

# 48. Fase D --- Primeiro fluxo vertical

``` text
ENTRAR
 ↓
ENTENDER
 ↓
RESPONDER
 ↓
PROCESSAR
 ↓
RECEBER ORIENTAÇÃO
 ↓
ENCERRAR
```

# 49. Fase E --- Proteções especiais

Implementar emergência, violência sexual, criança/adolescente, pessoa
idosa, pessoa com deficiência e demais fluxos definidos.

# 50. Fase F --- Completar o Mapa

Após validação do motor: todas as perguntas, regras, combinações,
resultados, encaminhamentos, anexos e compartilhamento.

# 51. Fase G --- INFO MVP

``` text
FONTES
 ↓
TEMAS
 ↓
CONTEÚDOS
 ↓
TRILHAS
 ↓
PROGRESSO
 ↓
FONTES OFICIAIS
```

# 52. Fase H --- Integração

``` text
MAPA ↔ INFO
```

e integração de ambos com a rede de serviços.

# 53. Fase I --- Hardening

Antes de produção:

-   segurança;
-   privacidade;
-   mobile;
-   acessibilidade;
-   performance;
-   testes E2E;
-   autorização;
-   auditoria;
-   arquivos;
-   recuperação de erros.

------------------------------------------------------------------------

# PARTE VI --- O QUE NÃO DEVE BLOQUEAR O MVP

# 54. Itens para Fase 2

Não bloquear a primeira versão por:

-   IA avançada;
-   chatbot;
-   recomendação preditiva;
-   busca semântica;
-   gamificação sofisticada;
-   analytics avançado;
-   geração automática de documentos;
-   automações não essenciais;
-   centenas de conteúdos INFO.

# 55. Estratégia de evolução

``` text
DOCUMENTAMOS
      ↓
IMPLEMENTAMOS
      ↓
TESTAMOS
      ↓
USAMOS
      ↓
APRENDEMOS
      ↓
REVISAMOS
      ↓
EVOLUÍMOS
```

# 56. Baseline 1.0

A primeira implementação utilizará um baseline controlado. Mudanças
relevantes encontradas durante desenvolvimento serão registradas para
análise na **Fase 2 --- Revisão e Evolução**.

# 57. Documentos que o programador deverá consultar

-   **MASTER-01** --- documentação vigente.
-   **IMPL-01** --- organização da implantação.
-   **FAM-DEV-001** --- fundação técnica inicial.
-   **TEC-01** --- arquitetura e contratos técnicos.
-   **UX-01** --- comportamento tela por tela.
-   **REV-02** --- textos e decisões consolidadas de interface.
-   **OC-04** --- perguntas, situações e respostas.
-   **OC-01 / OC-03** --- rede e encaminhamento.
-   **OC-02 / POL-ARQ-01** --- arquivos.
-   **JUR-01 a JUR-05** --- regras e limites jurídicos/operacionais.
-   **INFO-01** --- arquitetura pedagógica do Conhecimento que Protege.

# 58. Como ler a documentação

``` text
DEV-00
  ↓
ENTENDER O TODO
  ↓
PEGAR UMA TASK
  ↓
IDENTIFICAR DOCUMENTOS RELACIONADOS
  ↓
IMPLEMENTAR
  ↓
TESTAR
  ↓
RASTREAR
```

# 59. Primeiro objetivo técnico

``` text
Case
 ↓
RiskAssessment
 ↓
Question
 ↓
Answer
 ↓
RiskEngine
 ↓
Rule
 ↓
State
 ↓
Result
```

Com persistência, versionamento, autorização, auditoria e testes.

# 60. Primeiro objetivo do INFO

``` text
KnowledgeSource
 ↓
KnowledgeContent
 ↓
KnowledgeTrack
 ↓
User Progress
 ↓
Official Source
```

Com conteúdo claro e fonte rastreável.

# 61. Visão final para a equipe

Estamos construindo dois caminhos complementares.

O primeiro pergunta:

> **"Existem sinais aos quais devo prestar atenção e quais caminhos
> posso conhecer agora?"**

O segundo pergunta:

> **"Como posso compreender melhor meus direitos, minha proteção e os
> recursos que existem para mim?"**

``` text
              PLATAFORMA
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
    RISK DOMAIN        KNOWLEDGE DOMAIN
         │                   │
         ▼                   ▼
 RiskAssessment       KnowledgeJourney
         │                   │
         ▼                   ▼
   Orientation          Learning
         │                   │
         └─────────┬─────────┘
                   ▼
             REFERRAL / INFO
```

# 62. Diretriz final aos desenvolvedores

Não queremos uma implementação que apenas reproduza telas.

Queremos que o código preserve as decisões que levaram àquelas telas.

> **Regra de negócio não pertence à aparência da interface.**

> **Segurança não pertence somente ao login.**

> **Privacidade não pertence somente ao termo de consentimento.**

> **Acessibilidade não pertence somente às configurações.**

> **Fonte oficial não pertence somente a uma bibliografia.**

> **Auditoria não pertence somente aos logs do servidor.**

A primeira versão deve ser **simples o suficiente para ser implantada,
sólida o suficiente para ser segura e estruturada o suficiente para
evoluir**.

# 63. Ponto de partida

Depois da leitura deste DEV-00, a equipe deverá iniciar por:

``` text
PASSO 001
AUDITORIA DO CÓDIGO ATUAL
```

e produzir:

``` text
EXISTE → REUTILIZAR
EXISTE PARCIALMENTE → ADAPTAR
NÃO EXISTE → CRIAR
```

Somente então deverão começar as migrations e alterações estruturais.

------------------------------------------------------------------------

# Resumo executivo para a equipe

**O que fizemos:** construímos e consolidamos a fundamentação
metodológica, jurídica, operacional, técnica e de UX necessária para a
funcionalidade.

**O que queremos:** implantar o **Mapa de Risco** e o **INFO ---
Conhecimento que Protege** como dois domínios complementares da
plataforma.

**Como queremos:** aproveitando a arquitetura existente, separando
regras da UI, parametrizando perguntas e conhecimento, versionando
decisões, protegendo dados sensíveis, auditando operações críticas e
garantindo mobile e acessibilidade.

**Como começaremos:** auditoria do código atual → fundação → motor
mínimo → primeiro fluxo vertical → proteções especiais → Mapa completo →
INFO MVP → integração → hardening.

**Como evoluiremos:** colocaremos a versão 1.0 em funcionamento e
utilizaremos a experiência real para orientar a revisão documental e
funcional da Fase 2.

------------------------------------------------------------------------

**DEV-00 encerra a contextualização e abre a implementação.**
