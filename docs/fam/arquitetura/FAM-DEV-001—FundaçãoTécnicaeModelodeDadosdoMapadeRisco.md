# FAM-DEV-001 — Fundação Técnica e Modelo de Dados do Mapa de Risco

**Código:** FAM-DEV-001  
**Versão:** 1.0  
**Fase:** Implementação  
**Épico:** FAM-E01 / FAM-E03  
**Prioridade:** CRÍTICA  
**Status:** Pronto para desenvolvimento

---

# 1. Objetivo

Implementar a fundação técnica necessária para que a Plataforma FAM possa executar, de forma segura, versionada e auditável, o primeiro fluxo vertical do **Mapa de Risco — Ferramenta de Orientação e Identificação de Sinais de Atenção**.

Este pacote deverá permitir:

```text
CRIAR CASO
    ↓
INICIAR AVALIAÇÃO
    ↓
CARREGAR QUESTIONÁRIO
    ↓
REGISTRAR RESPOSTAS
    ↓
PROCESSAR REGRAS
    ↓
IDENTIFICAR SINAIS DE ATENÇÃO
    ↓
DETERMINAR PRÓXIMO ESTADO
    ↓
GERAR RESULTADO
    ↓
ENCERRAR AVALIAÇÃO
```

Ainda não é objetivo deste pacote finalizar toda a interface visual.

O objetivo é construir corretamente o **núcleo que sustentará a interface**.

---

# 2. Documentos obrigatórios

A implementação deverá consultar conjuntamente:

### Arquitetura

**TEC-01**

### Experiência

**UX-01**

### Metodologia

**Documento 2B — Matriz Metodológica**

### Situações e respostas

**OC-04 v1.1**

### Decisões consolidadas

**DEC-01**

### Conteúdo

**REV-02**

### Proteção

**JUR-01**

### Dados

**JUR-02**

### Não revitimização

**JUR-03**

### Arquivos

**POL-ARQ-01 v1.1**

### Governança

**MASTER-01**

---

# 3. Requisitos deste pacote

Criar inicialmente:

`REQ-FAM-001` — Caso

`REQ-FAM-002` — Avaliação

`REQ-FAM-003` — Questionário versionado

`REQ-FAM-004` — Respostas

`REQ-FAM-005` — Terceiro estado de resposta

`REQ-FAM-006` — Máquina de estados

`REQ-FAM-007` — Motor de regras

`REQ-FAM-008` — Versionamento metodológico

`REQ-FAM-009` — Auditoria

`REQ-FAM-010` — Resultado rastreável

---

# PARTE I — DOMÍNIO

# 4. Separação dos conceitos

A implementação deverá distinguir claramente:

```text
USUÁRIA
   │
   ▼
CASO
   │
   ▼
AVALIAÇÃO
   │
   ├── QUESTIONÁRIO
   │
   ├── RESPOSTAS
   │
   ├── REGRAS
   │
   └── RESULTADO
```

Essas entidades não deverão ser fundidas em uma única tabela.

---

# 5. User

A TEC-01 estabelece:

```text
User
├── id
├── status
├── created_at
├── updated_at
└── last_login_at
```

A entidade representa a conta/sujeito da aplicação quando houver identificação.

## Regra

Não acrescentar indiscriminadamente:

- CPF;
- endereço;
- data de nascimento;
- profissão;
- estado civil;
- outros dados pessoais.

Cada dado adicional exige finalidade definida.

---

# 6. UserIdentity

A identidade deverá permanecer separada sempre que possível.

Estrutura-base:

```text
UserIdentity
├── id
├── user_id
├── name
├── contact
├── verification_status
└── created_at
```

Essa separação reduz a exposição desnecessária da identidade quando módulos internos necessitarem trabalhar apenas com o caso.

---

# 7. Case

O `Case` representa o contexto de orientação/atendimento.

Estrutura definida pela TEC-01:

```text
Case
├── id
├── public_reference
├── status
├── created_by
├── created_at
├── updated_at
├── classification
├── retention_class
└── legal_hold
```

---

# 8. Identificador público

Nunca utilizar como referência pública:

- CPF;
- telefone;
- e-mail;
- nome;
- documento pessoal.

Criar identificador não significativo.

Exemplo conceitual:

```text
FAM-8K4P2X
```

O formato definitivo poderá ser definido tecnicamente.

A referência não deverá permitir inferir:

- identidade;
- classificação;
- tipo de violência;
- nível de atenção;
- data de nascimento;
- localização.

---

# 9. RiskAssessment

Representa uma execução do Mapa.

Estrutura mínima estabelecida:

```text
RiskAssessment
├── id
├── case_id
├── version
├── status
├── started_at
├── completed_at
└── methodology_version
```

Para cumprir o versionamento integral previsto na TEC-01, a implementação deverá também permitir associar:

```text
questionnaire_version
text_version
policy_version
```

---

# 10. Por que versionar?

Imagine uma avaliação realizada hoje.

Daqui a dois anos:

- uma pergunta muda;
- uma lei muda;
- uma metodologia é revisada;
- uma regra de encaminhamento muda.

O sistema deverá continuar sabendo:

> **Quais regras estavam vigentes quando aquela avaliação foi realizada?**

Portanto, avaliações históricas não poderão ser silenciosamente reinterpretadas por uma versão metodológica posterior.

---

# PARTE II — QUESTIONÁRIO

# 11. Questionário parametrizado

As perguntas não deverão ficar codificadas diretamente em componentes React ou equivalentes.

Criar domínio próprio para questionários.

Modelo lógico:

```text
RiskQuestionnaire
├── id
├── code
├── version
├── status
├── effective_from
├── effective_until
├── created_at
└── published_at
```

---

# 12. Estados do questionário

Sugestão:

```text
DRAFT
ACTIVE
RETIRED
```

Somente uma versão devidamente publicada poderá ser utilizada em novas avaliações.

---

# 13. RiskQuestion

Modelo:

```text
RiskQuestion
├── id
├── questionnaire_id
├── code
├── order_index
├── group_code
├── question_type
├── text_key
├── help_text_key
├── sensitive
├── required
├── active
└── metadata
```

---

# 14. Código permanente

Cada pergunta deverá possuir código estável.

Exemplo conforme OC-04:

```text
AR-01
AR-02
AR-03
AR-04
...
```

O código não deverá mudar simplesmente porque o texto da pergunta foi revisado.

Isso permite rastreabilidade entre:

```text
OC-04
 ↓
AR-01
 ↓
BANCO
 ↓
REGRA
 ↓
RESULTADO
 ↓
TESTE
```

---

# 15. Texto fora da regra

Preferencialmente, utilizar `text_key`.

Exemplo:

```text
risk.question.AR01.title
```

em vez de espalhar o texto:

> Existe perigo ou ameaça acontecendo agora?

pelo código.

Isso permitirá que REV-02 e o catálogo de textos versionado pela TEC-01 sejam respeitados.

---

# PARTE III — RESPOSTAS

# 16. RiskAnswer

Estrutura-base:

```text
RiskAnswer
├── id
├── assessment_id
├── question_code
├── answer_code
└── answered_at
```

Poderão ser adicionados campos técnicos necessários à integridade e versionamento, desde que não representem coleta pessoal desnecessária.

---

# 17. Regra crítica de domínio

Para perguntas SIM/NÃO:

```text
SIM
NAO
PREFIRO_NAO_RESPONDER
```

São **três valores diferentes**.

Nunca:

```text
true
false
null
```

se `null` puder ser confundido com “Prefiro não responder”.

---

# 18. Quatro estados técnicos diferentes

O sistema deverá conseguir distinguir:

### Ainda não respondeu

```text
NO_ANSWER
```

### Sim

```text
SIM
```

### Não

```text
NAO
```

### Prefiro não responder

```text
PREFIRO_NAO_RESPONDER
```

Essa distinção é fundamental.

---

# 19. Regra metodológica

`PREFIRO_NAO_RESPONDER` significa:

> **informação desconhecida/não fornecida.**

Não significa:

> ausência daquele sinal.

Portanto:

```text
PREFIRO_NAO_RESPONDER != NAO
```

Essa regra deverá possuir teste unitário obrigatório.

---

# 20. Constraint

O banco deverá impedir respostas inválidas.

Conceitualmente:

```text
answer_code IN (
  'SIM',
  'NAO',
  'PREFIRO_NAO_RESPONDER'
)
```

Para outros tipos de pergunta, criar tipos e validações próprios.

Não transformar todo o questionário em texto livre.

---

# PARTE IV — MÁQUINA DE ESTADOS

# 21. Estados oficiais

Utilizar os estados estabelecidos pela TEC-01:

```text
INITIAL
↓
INFORMED
↓
IN_PROGRESS
↓
EMERGENCY
↓
PROTECTION_SPECIAL
↓
ORIENTATION
↓
OPTIONAL_ATTACHMENT
↓
RESULT
↓
CLOSED
```

Nem toda avaliação passará por todos eles.

---

# 22. INITIAL

Avaliação criada.

A usuária ainda não passou pela apresentação necessária.

---

# 23. INFORMED

As informações iniciais foram apresentadas.

A avaliação está preparada para iniciar.

---

# 24. IN_PROGRESS

Questionário em andamento.

---

# 25. EMERGENCY

Alguma regra determinou prioridade de segurança/emergência.

O questionário regular deixa de ser a prioridade imediata.

---

# 26. PROTECTION_SPECIAL

Fluxo especial acionado.

Exemplos definidos pelos documentos:

- violência sexual;
- criança/adolescente;
- pessoa idosa;
- demais hipóteses previstas.

---

# 27. ORIENTATION

O motor está preparado para apresentar orientação correspondente.

---

# 28. OPTIONAL_ATTACHMENT

Etapa de anexos, quando aplicável.

O próprio nome reforça:

**OPTIONAL**

Não possuir anexo não bloqueia a continuidade.

---

# 29. RESULT

Resultado orientativo disponível.

---

# 30. CLOSED

Fluxo encerrado.

Não significa necessariamente:

- caso resolvido;
- violência cessada;
- atendimento concluído;
- denúncia realizada.

Significa somente encerramento daquela jornada/avaliação conforme a regra aplicável.

---

# 31. Transições controladas

Não permitir alteração arbitrária:

```text
assessment.status = qualquer_coisa
```

Criar serviço responsável por transições.

Exemplo conceitual:

```text
AssessmentStateService.transition(
  assessment,
  targetState,
  context
)
```

---

# 32. Registro de transição

Transições relevantes deverão ser auditáveis.

Estrutura:

```text
AssessmentStateHistory
├── id
├── assessment_id
├── from_state
├── to_state
├── reason_code
├── rule_code
└── occurred_at
```

Não registrar narrativa sensível desnecessariamente.

---

# PARTE V — MOTOR DE REGRAS

# 33. Risk Engine

Criar serviço de domínio separado:

```text
RiskEngine
```

ou nomenclatura equivalente existente no projeto.

Responsabilidade:

```text
RESPOSTAS
    ↓
REGRAS VERSIONADAS
    ↓
SINAIS DE ATENÇÃO
    ↓
PRIORIDADES
    ↓
FLUXOS
    ↓
ORIENTAÇÃO
```

---

# 34. O motor NÃO deverá fazer

O motor não deverá produzir conclusões como:

```text
crime_confirmed = true
aggressor_confirmed = true
diagnosis = ...
homicide_prediction = ...
```

A documentação é explícita:

A ferramenta não produz:

- diagnóstico;
- perícia;
- laudo;
- constatação de crime;
- prova;
- decisão jurídica.

---

# 35. Linguagem interna

Utilizar conceitos como:

```text
attention_signal
priority
special_flow
orientation
referral
```

Evitar estruturar o domínio em torno de:

```text
crime_confirmed
guilty_person
victim_diagnosis
```

---

# 36. RiskRule

Modelo lógico:

```text
RiskRule
├── id
├── code
├── methodology_version
├── priority
├── active
├── condition
├── effect
├── source_document
├── source_reference
└── created_at
```

---

# 37. Exemplo AR-01

OC-04 estabelece:

> Existe perigo ou ameaça acontecendo agora?

Se:

```text
AR-01 = SIM
```

o motor deverá reconhecer:

```text
POSSIBLE_URGENCY
```

e priorizar segurança.

---

# 38. Exemplo combinado

OC-04 estabelece combinação relevante:

```text
AR-01 = SIM
+
AR-03 = SIM
```

onde AR-03 representa acesso a arma.

Resultado:

```text
SECURITY_PRIORITY
```

Não:

```text
HOMICIDE_CONFIRMED
```

---

# 39. Regras compostas

O motor deverá suportar:

```text
AND
OR
NOT
EXISTS
```

quando metodologicamente permitido.

Exemplo:

```text
AR-01 == SIM
AND
AR-03 == SIM
```

---

# 40. Não codificar regras em JSX/UI

Proibido depender de lógica como:

```text
if (answer === "yes") {
   showEmergency()
}
```

espalhada por telas.

A UI pergunta.

O motor decide.

A UI apresenta a decisão.

---

# PARTE VI — RESULTADO

# 41. RiskAssessmentResult

Criar estrutura própria.

Modelo lógico:

```text
RiskAssessmentResult
├── id
├── assessment_id
├── methodology_version
├── generated_at
├── result_status
└── summary_code
```

---

# 42. Sinais identificados

Criar relação:

```text
RiskAssessmentSignal
├── id
├── result_id
├── signal_code
├── source_question_code
├── source_rule_code
├── priority
└── created_at
```

Isso permitirá explicar:

> Por que determinada orientação foi apresentada?

---

# 43. Rastreabilidade

Exemplo:

```text
AR-01 = SIM
       ↓
RULE-EMERGENCY-001
       ↓
SIGNAL-POSSIBLE-URGENCY
       ↓
EMERGENCY
       ↓
ORIENTATION-EMERGENCY-001
```

Esse encadeamento deverá ser recuperável.

---

# 44. Resultado não é apenas score

Mesmo que futuramente exista algum cálculo auxiliar, não estruturar o domínio exclusivamente em torno de:

```text
score
```

A informação contextual é necessária.

---

# PARTE VII — VERSIONAMENTO

# 45. Versiones obrigatórias

Cada avaliação deverá preservar:

```text
methodology_version
questionnaire_version
text_version
policy_version
```

---

# 46. Exemplo

```text
methodology_version = "1.1"
questionnaire_version = "1.0"
text_version = "REV-02-1.0"
policy_version = "1.0"
```

O padrão definitivo poderá ser adequado à arquitetura existente.

---

# 47. Publicação

Alterações de metodologia não deverão entrar em produção simplesmente editando registros ativos.

Processo:

```text
DRAFT
 ↓
VALIDAÇÃO
 ↓
PUBLICAÇÃO
 ↓
ACTIVE
```

Versão anterior:

```text
RETIRED
```

sem apagar avaliações históricas.

---

# PARTE VIII — AUDITORIA

# 48. AuditEvent

A TEC-01 exige rastreabilidade.

Criar serviço central de auditoria.

Modelo conceitual:

```text
AuditEvent
├── id
├── event_type
├── actor_id
├── resource_type
├── resource_id
├── occurred_at
├── correlation_id
└── metadata_safe
```

---

# 49. Eventos iniciais

Implementar pelo menos:

```text
CASE_CREATED

ASSESSMENT_CREATED
ASSESSMENT_STARTED
ASSESSMENT_STATE_CHANGED
ASSESSMENT_COMPLETED
ASSESSMENT_CLOSED

ANSWER_RECORDED
ANSWER_UPDATED

RULE_TRIGGERED
SPECIAL_FLOW_TRIGGERED
RESULT_GENERATED
```

---

# 50. Regra de logs

Não registrar indiscriminadamente:

- nome;
- telefone;
- respostas sensíveis;
- descrição de violência;
- conteúdo de anexos;
- dados de saúde;
- informações sexuais.

Exemplo ruim:

```text
User Maria respondeu que...
```

Exemplo adequado:

```text
ANSWER_RECORDED
assessment_id=UUID
question_code=AR-04
```

Mesmo metadados deverão seguir necessidade e finalidade.

---

# PARTE IX — SEGURANÇA DO BANCO

# 51. Separação

Sempre que tecnicamente possível:

```text
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

A separação reduz exposição lateral.

---

# 52. Least Privilege

Uma função que necessita ler:

```text
RiskAssessment
```

não deverá automaticamente poder acessar:

```text
UserIdentity
```

---

# 53. Need to Know

Acesso deverá depender de:

- perfil;
- finalidade;
- contexto;
- vínculo;
- necessidade.

Não apenas:

```text
isAdmin = true
```

---

# 54. Políticas de acesso

Quando o banco utilizado possuir suporte adequado, implementar políticas de acesso no próprio nível de dados além das verificações da API.

Não depender exclusivamente da ocultação visual do frontend.

---

# 55. Exclusão

Não utilizar exclusão física indiscriminada antes da implementação das regras de:

- retenção;
- exclusão;
- legal hold;
- auditoria.

Fonte:

**POL-ARQ-01 + DEC-01 + TEC-01.**

---

# PARTE X — MIGRATIONS

# 56. Primeira sequência

A primeira sequência de migrations deverá contemplar, conceitualmente:

```text
001_create_users
002_create_user_identities
003_create_cases
004_create_risk_questionnaires
005_create_risk_questions
006_create_risk_assessments
007_create_risk_answers
008_create_risk_rules
009_create_assessment_state_history
010_create_assessment_results
011_create_assessment_signals
012_create_audit_events
```

A numeração deverá ser adaptada ao projeto real.

---

# 57. Não executar cegamente

Antes de criar migrations:

1. verificar tabelas existentes;
2. verificar autenticação existente;
3. verificar usuários existentes;
4. verificar sistema de auditoria;
5. verificar sistema de permissões;
6. verificar nomenclatura;
7. verificar migrations anteriores.

**Reutilizar antes de duplicar.**

---

# PARTE XI — SERVIÇOS

# 58. Serviços mínimos

Criar ou adaptar:

```text
CaseService
AssessmentService
QuestionnaireService
AnswerService
RiskEngine
AssessmentStateService
ResultService
AuditService
```

---

# 59. CaseService

Responsável por:

- criar caso;
- recuperar caso autorizado;
- atualizar estado permitido;
- aplicar regras de acesso;
- associar avaliação.

---

# 60. AssessmentService

Responsável por:

- iniciar;
- retomar;
- concluir;
- fechar;
- consultar estado;
- preservar versões.

---

# 61. QuestionnaireService

Responsável por:

- recuperar questionário ativo;
- entregar versão correta;
- resolver próxima pergunta;
- respeitar condicionais.

---

# 62. AnswerService

Responsável por:

- validar resposta;
- registrar;
- atualizar quando permitido;
- chamar motor de regras;
- gerar auditoria.

---

# 63. RiskEngine

Responsável exclusivamente pela interpretação metodológica.

Não deverá:

- renderizar interface;
- enviar e-mail;
- fazer upload;
- autenticar usuário.

---

# 64. ResultService

Responsável por construir resultado orientativo a partir das decisões do motor.

---

# PARTE XII — API

# 65. Endpoints-base

A TEC-01 já prevê:

```text
POST /api/v1/risk-assessments
GET  /api/v1/risk-assessments/{id}
```

Complementar conceitualmente com:

```text
POST /api/v1/risk-assessments/{id}/answers

GET /api/v1/risk-assessments/{id}/next

GET /api/v1/risk-assessments/{id}/result

POST /api/v1/risk-assessments/{id}/close
```

A nomenclatura final deverá respeitar a API existente.

---

# 66. Não expor regras internas

O frontend não precisa receber todo o motor.

Exemplo de resposta:

```text
current_state
next_action
screen_code
content_keys
allowed_actions
```

em vez de enviar todas as regras metodológicas para o navegador.

---

# PARTE XIII — TIPOS

# 67. Tipos centrais

Exemplo conceitual:

```text
RiskAnswerCode =
  SIM
  | NAO
  | PREFIRO_NAO_RESPONDER
```

```text
AssessmentState =
  INITIAL
  | INFORMED
  | IN_PROGRESS
  | EMERGENCY
  | PROTECTION_SPECIAL
  | ORIENTATION
  | OPTIONAL_ATTACHMENT
  | RESULT
  | CLOSED
```

---

# 68. Evitar strings livres

Evitar:

```text
status: string
answer: string
```

quando o domínio possui conjunto fechado de valores.

Utilizar enumeração/tipos equivalentes adequados à stack.

---

# PARTE XIV — PRIMEIRO FLUXO VERTICAL

# 69. Objetivo da primeira entrega executável

Após FAM-DEV-001, deverá ser possível testar:

```text
1. criar caso

2. criar avaliação

3. registrar versões

4. alterar INITIAL → INFORMED

5. iniciar avaliação

6. carregar AR-01

7. responder

8. registrar resposta

9. processar regra

10. determinar próximo estado

11. gerar auditoria
```

---

# 70. Cenário A

Usuária responde:

```text
AR-01 = NAO
```

Resultado esperado:

- resposta registrada;
- ausência desse sinal específico registrada corretamente;
- motor não cria emergência por AR-01;
- fluxo prossegue.

---

# 71. Cenário B

Usuária responde:

```text
AR-01 = PREFIRO_NAO_RESPONDER
```

Resultado:

- terceiro estado preservado;
- não convertido em `NAO`;
- ausência do sinal não pode ser presumida;
- fluxo segue conforme metodologia.

---

# 72. Cenário C

Usuária responde:

```text
AR-01 = SIM
```

Resultado:

```text
POSSIBLE_URGENCY
```

e:

```text
IN_PROGRESS
      ↓
EMERGENCY
```

conforme regras aplicáveis.

---

# 73. Cenário D

Quando posteriormente existir:

```text
AR-01 = SIM
AR-03 = SIM
```

o motor deverá reconhecer a combinação prevista em OC-04 e produzir orientação prioritária de segurança.

Não produzir diagnóstico ou conclusão criminal.

---

# PARTE XV — TESTES

# 74. Unitários obrigatórios

### TEST-FAM-001

`SIM != NAO`

### TEST-FAM-002

`PREFIRO_NAO_RESPONDER != NAO`

### TEST-FAM-003

`PREFIRO_NAO_RESPONDER != ausência de resposta`

### TEST-FAM-004

AR-01 SIM aciona regra correspondente.

### TEST-FAM-005

AR-01 NÃO não aciona emergência isoladamente.

### TEST-FAM-006

Regra composta funciona corretamente.

### TEST-FAM-007

Versão metodológica permanece vinculada à avaliação.

### TEST-FAM-008

Versão antiga não é recalculada silenciosamente.

---

# 75. Integração

Testar:

```text
criar caso
→ criar avaliação
→ obter pergunta
→ responder
→ processar
→ mudar estado
→ gerar resultado
→ auditar
```

---

# 76. Segurança

Testar:

- usuário não autorizado;
- ID de outro caso;
- manipulação de assessment ID;
- alteração arbitrária de status;
- resposta com código inválido;
- tentativa de acessar identidade sem permissão;
- enum inválido;
- repetição indevida de requisição;
- exposição de conteúdo em logs.

---

# 77. Concorrência

Testar duas respostas quase simultâneas para a mesma pergunta.

O sistema não poderá gerar:

- estados conflitantes;
- duas versões ativas da mesma resposta sem controle;
- resultado inconsistente.

---

# PARTE XVI — CRITÉRIOS DE ACEITE

# 78. Banco

Aprovado quando:

- entidades fundamentais existirem;
- relacionamentos estiverem íntegros;
- constraints funcionarem;
- versões forem preservadas;
- identidade estiver adequadamente segregada.

---

# 79. Motor

Aprovado quando:

- regras forem executadas fora da UI;
- AR-01 funcionar;
- terceiro estado funcionar;
- regras forem rastreáveis;
- nenhuma conclusão indevida for gerada.

---

# 80. Segurança

Aprovado quando:

- acesso não depender apenas do frontend;
- dados sensíveis não aparecerem em logs;
- IDs públicos não revelarem identidade;
- permissões forem testadas.

---

# 81. Auditoria

Aprovado quando for possível reconstruir:

```text
avaliação criada
→ pergunta respondida
→ regra acionada
→ estado alterado
→ resultado produzido
```

sem armazenar narrativa sensível desnecessária no log.

---

# 82. Versionamento

Aprovado quando uma avaliação puder responder:

> Qual questionário foi usado?

> Qual metodologia foi usada?

> Qual versão dos textos foi usada?

> Qual política estava vigente?

---

# 83. Definition of Done — FAM-DEV-001

O pacote estará concluído quando:

- [ ] modelo existente tiver sido previamente inspecionado;
- [ ] migrations forem criadas;
- [ ] migrations forem reversíveis quando tecnicamente aplicável;
- [ ] domínio estiver tipado;
- [ ] Case funcionar;
- [ ] RiskAssessment funcionar;
- [ ] questionário versionado funcionar;
- [ ] RiskAnswer funcionar;
- [ ] terceiro estado estiver preservado;
- [ ] máquina de estados funcionar;
- [ ] AR-01 estiver implementado;
- [ ] RiskEngine estiver separado da UI;
- [ ] auditoria estiver funcionando;
- [ ] testes unitários passarem;
- [ ] testes de integração passarem;
- [ ] testes básicos de autorização passarem;
- [ ] nenhuma informação sensível estiver indevidamente em logs;
- [ ] rastreabilidade documental estiver registrada.

---

# PARTE XVII — RASTREABILIDADE

# 84. Matriz inicial

| Requisito | Documento principal | Implementação |
|---|---|---|
| REQ-FAM-001 | TEC-01 | Case |
| REQ-FAM-002 | TEC-01 | RiskAssessment |
| REQ-FAM-003 | TEC-01 / 2B | Questionnaire |
| REQ-FAM-004 | TEC-01 / OC-04 | RiskAnswer |
| REQ-FAM-005 | OC-04 | AnswerCode |
| REQ-FAM-006 | TEC-01 | State Machine |
| REQ-FAM-007 | OC-04 / 2B | RiskEngine |
| REQ-FAM-008 | TEC-01 | Versioning |
| REQ-FAM-009 | TEC-01 / JUR-04 | Audit |
| REQ-FAM-010 | OC-04 / TEC-01 | Result |

---

# 85. Não fazer neste pacote

FAM-DEV-001 não deverá crescer para incluir:

- interface final completa;
- todos os órgãos;
- todos os anexos;
- INFO completo;
- IA;
- chatbot;
- notificações avançadas;
- analytics;
- integrações externas não essenciais.

O objetivo é validar a **espinha dorsal**.

---

# 86. Próximo pacote

Depois que FAM-DEV-001 estiver aprovado:

# FAM-DEV-002 — Motor Completo de Perguntas, Regras e Fluxos de Proteção

Esse pacote deverá converter sistematicamente o **OC-04 v1.1 + JUR-01 + DEC-01** em regras executáveis, incluindo:

- AR-01;
- AR-02;
- AR-03;
- AR-04;
- demais situações da matriz;
- combinações;
- emergência;
- violência sexual;
- criança/adolescente;
- pessoa idosa;
- fluxos especiais;
- resultados e orientações correspondentes.

---

# 87. Marco de conclusão

Ao concluir FAM-DEV-001 não teremos ainda “terminado o Mapa de Risco”.

Teremos algo mais importante para esta etapa:

> **uma fundação capaz de executar o Mapa de Risco sem transformar regras jurídicas e metodológicas em lógica improvisada de interface.**

A partir dela, cada nova pergunta e cada novo fluxo poderão entrar de forma:

**versionada, testável, auditável e rastreável.**