# TEC-01 — Especificação Técnica Consolidada
## Arquitetura Completa da Plataforma FAM

**Instituição:** Força Ativa da Mulher — FAM  
**Plataforma:** Plataforma FAM  
**Versão:** 1.0  
**Data:** 25/08/2026  
**Status:** arquitetura de referência para validação institucional, jurídica e técnica

> Este documento traduz as decisões institucionais, jurídicas, metodológicas e de UX já consolidadas em requisitos técnicos. Não substitui validação jurídica nem define, por si só, fornecedor ou tecnologia obrigatória.

---

# 1. Objetivo

Definir a arquitetura de referência para uma plataforma destinada a:

- orientar usuárias;
- identificar sinais de atenção;
- organizar informações necessárias;
- oferecer encaminhamentos;
- permitir atendimento autorizado;
- proteger dados pessoais e sensíveis;
- controlar arquivos;
- registrar auditoria;
- responder a incidentes;
- aplicar retenção e exclusão por finalidade.

A arquitetura deve preservar a regra fundamental:

> **A plataforma não investiga, não diagnostica, não produz laudo e não confirma crime.**

---

# 2. Referenciais técnicos e regulatórios

A arquitetura deve considerar, no mínimo:

- LGPD — Lei nº 13.709/2018;
- orientações da ANPD sobre segurança da informação;
- orientações da ANPD sobre agentes de tratamento e encarregado;
- princípios institucionais da FAM;
- JUR-01 a JUR-05;
- POL-ARQ-01;
- OC-01 e OC-04;
- REV-01;
- DEC-01;
- REV-02.

A ANPD recomenda medidas administrativas e técnicas adequadas ao risco e descreve controle de acesso como combinação de autenticação, autorização e auditoria. citeturn0search0turn0search1

A Resolução CD/ANPD nº 2/2022 prevê requisitos mínimos de segurança para agentes de tratamento de pequeno porte, considerando o risco e a realidade da organização. citeturn0search12

Como referência técnica complementar, o OWASP ASVS organiza controles de arquitetura, autenticação, controle de acesso, proteção de dados, logs, arquivos, APIs e configuração. Para uma aplicação que trata dados sensíveis, o nível 2 é uma referência adequada de verificação, sujeito à avaliação de risco. citeturn0search8turn0search13

---

# 3. Princípios arquiteturais

## 3.1 Privacy by Design

Proteção de dados deve existir desde a arquitetura, não como recurso posterior.

## 3.2 Security by Default

A configuração padrão deve ser a mais restritiva compatível com a finalidade.

## 3.3 Least Privilege

Usuários recebem somente as permissões necessárias.

## 3.4 Need to Know

Mesmo usuário autorizado só acessa informações necessárias à tarefa.

## 3.5 Purpose Binding

Dados devem estar vinculados a uma finalidade.

## 3.6 Segregação

Separar:

```text
conteúdo
administração
segurança
auditoria
desenvolvimento
```

## 3.7 Rastreabilidade

Operações relevantes devem gerar eventos auditáveis.

## 3.8 Não revitimização

O sistema não deve induzir relato excessivo, repetição desnecessária ou confronto.

---

# 4. Arquitetura lógica

```text
                    ┌──────────────────────┐
                    │      USUÁRIA         │
                    └──────────┬───────────┘
                               │ HTTPS
                               ▼
                    ┌──────────────────────┐
                    │ WEB / MOBILE / PWA   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ API / BFF             │
                    │ autenticação          │
                    │ rate limit            │
                    │ validação              │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼─────────────────┐
              ▼                ▼                 ▼
       ┌────────────┐   ┌────────────┐   ┌──────────────┐
       │ Módulo     │   │ Módulo     │   │ Módulo       │
       │ Orientação │   │ Atendimento│   │ Arquivos     │
       └─────┬──────┘   └─────┬──────┘   └──────┬───────┘
             │                │                 │
             └────────────────┼─────────────────┘
                              ▼
                     ┌─────────────────┐
                     │ Policy Engine   │
                     │ finalidade      │
                     │ acesso          │
                     │ retenção        │
                     │ compartilhamento│
                     └────────┬────────┘
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
       ┌────────────┐  ┌────────────┐  ┌──────────────┐
       │ Banco      │  │ Object     │  │ Audit/Event  │
       │ transacional│ │ Storage    │  │ Store        │
       └────────────┘  └────────────┘  └──────────────┘
              │               │                │
              └───────────────┼────────────────┘
                              ▼
                    ┌────────────────────┐
                    │ Backup / Recovery  │
                    └────────────────────┘
```

---

# 5. Separação de domínios

A aplicação deve ser organizada em módulos independentes.

## Módulos

1. Identidade e autenticação
2. Orientação
3. Sinais de atenção
4. Encaminhamento
5. Atendimento
6. Arquivos
7. Compartilhamento
8. Consentimentos/avisos quando aplicáveis
9. Privacidade
10. Auditoria
11. Incidentes
12. Retenção
13. Administração
14. Catálogo de textos
15. Governança jurídica

---

# 6. Modelo de dados

## 6.1 User

```text
id
status
created_at
updated_at
last_login_at
```

Não armazenar dados pessoais adicionais sem finalidade definida.

---

## 6.2 UserIdentity

```text
id
user_id
name
contact
verification_status
created_at
```

Separar identidade de dados do caso sempre que possível.

---

## 6.3 Case

```text
id
public_reference
status
created_by
created_at
updated_at
classification
retention_class
legal_hold
```

Nunca usar o CPF, telefone ou nome como identificador do caso.

---

## 6.4 RiskAssessment

```text
id
case_id
version
status
started_at
completed_at
methodology_version
```

---

## 6.5 RiskAnswer

```text
id
assessment_id
question_code
answer_code
answered_at
```

Para perguntas sensíveis:

```text
SIM
NAO
PREFIRO_NAO_RESPONDER
```

Não utilizar:

```text
boolean
```

---

# 7. Estados da ferramenta

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

Nem todos os fluxos passarão por todos os estados.

---

# 8. Máquina de decisão

## 8.1 Emergência

Se:

```text
AR-01 = SIM
```

então:

```text
EMERGENCY = TRUE
```

Prioridade:

```text
segurança
>
orientação
>
demais perguntas
```

---

## 8.2 Atendimento médico

Se:

```text
AR-02 = SIM
```

apresentar orientação de saúde adequada, sem diagnóstico.

---

## 8.3 Arma

Se:

```text
AR-03 = SIM
```

não solicitar detalhes sobre arma.

Priorizar segurança e evitar confronto.

---

## 8.4 Violência sexual

Se:

```text
AR-04 = SIM
```

ativar fluxo especializado.

Não exigir relato detalhado.

---

## 8.5 Criança/adolescente

Se:

```text
AR-05 = SIM
```

ativar:

```text
PROTECTION_SPECIAL = TRUE
```

Não realizar investigação.

---

# 9. Motor de políticas

O Policy Engine é componente central.

## Entradas

```text
user
role
case
purpose
data_category
action
recipient
retention_class
legal_hold
```

## Saída

```text
ALLOW
DENY
REQUIRE_APPROVAL
REQUIRE_JUSTIFICATION
```

## Exemplo

```text
if role == "admin"
and action == "read_case_content"
then DENY
```

Outro:

```text
if role == "professional"
and assigned_case == true
and purpose_valid == true
and permission_valid == true
then ALLOW
```

---

# 10. Controle de acesso

## Modelo recomendado

Combinação de:

**RBAC + ABAC**

RBAC define função.

ABAC acrescenta:

- caso;
- finalidade;
- credenciamento;
- contexto;
- classificação;
- estado;
- necessidade.

## Regra

```text
cargo ≠ acesso total
```

---

# 11. Perfis

## PublicUser

Pode:

- acessar conteúdo público;
- usar orientação inicial;
- responder questionário;
- receber orientação.

Não pode:

- acessar casos internos;
- acessar conteúdo de outras pessoas.

## AssociatedUser

Possui as mesmas permissões públicas, acrescidas somente das funções formalmente autorizadas.

## Attendant

Acesso limitado a casos atribuídos.

## Professional

Acesso limitado a casos e informações necessários à atuação profissional.

## Legal

Acesso necessário para análise jurídica autorizada.

## Privacy

Acesso de governança conforme atribuição.

## Security

Acesso a eventos e controles de segurança.

Não recebe acesso automático ao conteúdo.

## TechnicalAdmin

Administração técnica.

Não possui acesso automático ao conteúdo dos casos.

## Auditor

Acesso a registros necessários à auditoria.

---

# 12. Acesso excepcional

Fluxo:

```text
SOLICITAR
↓
JUSTIFICAR
↓
AUTORIZAR
↓
CONCEDER
↓
REGISTRAR
↓
EXPIRAR
```

Toda exceção deve possuir:

```text
request_id
requester
reason
approver
scope
start_at
expires_at
audit_event
```

---

# 13. Autenticação

Requisitos:

- senha forte;
- hash seguro;
- MFA para perfis internos sensíveis;
- sessão com expiração;
- rotação/revogação;
- proteção contra brute force;
- rate limiting;
- recuperação segura.

Para perfis administrativos e profissionais, MFA deve ser requisito de produção.

---

# 14. Sessão

Implementar:

- cookies seguros quando aplicável;
- `HttpOnly`;
- `Secure`;
- `SameSite`;
- expiração;
- revogação;
- proteção CSRF;
- rotação de sessão após autenticação.

---

# 15. Banco de dados

## Requisitos

- criptografia em repouso;
- credenciais fora do código;
- princípio do menor privilégio;
- conexões TLS;
- backups criptografados;
- segregação por ambiente;
- migrations controladas.

## Dados sensíveis

Sempre que possível:

```text
separar identificadores
de
conteúdo sensível
```

---

# 16. Criptografia

## Em trânsito

TLS moderno.

## Em repouso

Criptografia de banco e storage.

## Chaves

Nunca armazenar chaves no código-fonte.

Utilizar:

- secret manager;
- KMS;
- rotação;
- segregação de acesso.

---

# 17. Arquivos

## Fluxo

```text
UPLOAD
↓
AUTHORIZATION
↓
TYPE VALIDATION
↓
SIZE VALIDATION
↓
MALWARE SCAN
↓
QUARANTINE
↓
ENCRYPTED STORAGE
↓
ACCESS POLICY
↓
AUDIT
```

## Nunca confiar apenas em extensão

Validar:

- MIME;
- assinatura/magic bytes quando aplicável;
- extensão;
- tamanho;
- conteúdo;
- malware.

## Download

Arquivos protegidos não devem ser publicados em diretórios públicos.

Links devem ser:

- privados;
- autenticados quando necessário;
- temporários;
- revogáveis.

A referência OWASP ASVS recomenda arquitetura segura para arquivos enviados pelo usuário e controles específicos para armazenamento/serviço de arquivos. citeturn0search14turn0search16

---

# 18. Armazenamento de arquivos

Separar:

```text
PUBLIC_ASSETS
PRIVATE_CASE_FILES
SYSTEM_BACKUPS
```

Nunca armazenar arquivo sensível em bucket público.

Estrutura lógica:

```text
/private/
  case/{case_id}/
    original/
    processed/
    metadata/
```

O `case_id` não deve revelar identidade.

---

# 19. Retenção

Classes:

```text
R1 respostas
R2 arquivos
R3 atendimento
R4 auditoria
R5 incidentes
```

Cada classe terá:

```text
retention_policy
review_interval
legal_hold_allowed
deletion_strategy
```

Não codificar prazo diretamente na aplicação.

---

# 20. Legal Hold

Campos:

```text
legal_hold_id
scope
reason
created_by
approved_by
created_at
expires_at
status
```

Estados:

```text
ACTIVE
REVIEW
RELEASED
```

Enquanto ativo:

```text
automatic_delete = false
```

somente para o escopo coberto.

---

# 21. Exclusão

A exclusão deve considerar:

```text
registro principal
arquivos
miniaturas
versões
índices
cache
links
réplicas
backups
```

A arquitetura deve diferenciar:

**soft delete**

de

**destruição definitiva**.

---

# 22. Auditoria

Eventos mínimos:

- login;
- logout;
- falha de login;
- leitura de caso;
- alteração de caso;
- download;
- upload;
- compartilhamento;
- alteração de permissão;
- acesso excepcional;
- criação de legal hold;
- liberação de legal hold;
- exclusão;
- alteração de política.

## Evento

```text
event_id
timestamp
actor_id
actor_role
action
resource_type
resource_id
purpose
result
ip
user_agent
correlation_id
```

Logs não devem armazenar conteúdo sensível desnecessário.

---

# 23. Compartilhamento

Fluxo:

```text
SELECT_RECIPIENT
↓
SELECT_PURPOSE
↓
CHECK_AUTHORIZATION
↓
SELECT_MINIMUM_DATA
↓
REVIEW
↓
CONFIRM
↓
TRANSMIT
↓
AUDIT
```

## Regra

Nunca:

```text
SEND_ALL_CASE
```

---

# 24. Destinatários

Criar catálogo controlado:

```text
recipient_id
recipient_type
organization
service
purpose
authorization_requirement
active
```

Exemplos de categoria:

- Conselho Tutelar;
- autoridade policial;
- Ministério Público;
- saúde;
- assistência social;
- outros destinatários formalmente validados.

O sistema não deve assumir que todo órgão público recebe qualquer informação.

---

# 25. APIs

## Princípios

- autenticação;
- autorização por endpoint;
- validação;
- rate limiting;
- versionamento;
- logs;
- idempotência quando necessário;
- mensagens de erro sem exposição de dados.

## Exemplo

```http
POST /api/v1/risk-assessments
GET /api/v1/risk-assessments/{id}
POST /api/v1/cases/{id}/attachments
POST /api/v1/cases/{id}/share
POST /api/v1/cases/{id}/legal-hold
DELETE /api/v1/cases/{id}
```

---

# 26. API de compartilhamento

A API deve exigir:

```json
{
  "recipient_id": "...",
  "purpose_code": "...",
  "selected_resources": ["..."],
  "authorization_reference": "..."
}
```

O backend deve rejeitar:

```json
{
  "share_entire_case": true
}
```

quando não houver fluxo institucional explicitamente autorizado.

---

# 27. Catálogo de textos

Todos os textos críticos devem ficar fora do código da interface.

Estrutura:

```text
text_key
language
version
content
category
approved_by
approved_at
status
```

Categorias:

- emergency;
- child_protection;
- privacy;
- consent_or_notice;
- attachments;
- sharing;
- result;
- errors.

---

# 28. Versionamento metodológico

Cada avaliação deve registrar:

```text
methodology_version
questionnaire_version
text_version
policy_version
```

Assim será possível saber qual versão da ferramenta foi utilizada.

---

# 29. Observabilidade

Monitorar:

- disponibilidade;
- erros;
- latência;
- falhas de autenticação;
- uploads rejeitados;
- malware detectado;
- tentativas de acesso negadas;
- compartilhamentos;
- eventos de segurança.

Nunca monitorar conteúdo sensível além do necessário.

---

# 30. Alertas de segurança

Alertar para:

- múltiplas tentativas de login;
- acesso excepcional;
- grande volume de downloads;
- exportação incomum;
- alteração de permissões;
- acesso fora do padrão;
- tentativa de acesso negado repetidamente;
- malware.

---

# 31. Incidentes

Pipeline:

```text
DETECT
↓
CLASSIFY
↓
CONTAIN
↓
PRESERVE
↓
ASSESS
↓
NOTIFY WHEN REQUIRED
↓
REMEDIATE
↓
REVIEW
```

O módulo de incidentes deve integrar-se ao `LEGAL_HOLD`.

---

# 32. Backups

Requisitos:

- criptografia;
- controle de acesso;
- testes de restauração;
- retenção definida;
- segregação;
- registro;
- monitoramento.

Backup não deve ser considerado mecanismo para contornar exclusão.

---

# 33. Ambientes

Separar:

```text
DEV
STAGING
PRODUCTION
```

Dados reais sensíveis não devem ser usados em DEV/STAGING quando dados sintéticos ou anonimizados forem suficientes.

---

# 34. CI/CD

Pipeline mínimo:

```text
COMMIT
↓
LINT
↓
UNIT TEST
↓
SAST
↓
DEPENDENCY SCAN
↓
BUILD
↓
INTEGRATION TEST
↓
SECURITY TEST
↓
APPROVAL
↓
DEPLOY
```

---

# 35. Gestão de segredos

Nunca colocar em:

- Git;
- frontend;
- logs;
- mensagens de erro;
- documentação pública.

Usar secret manager.

---

# 36. Dependências e fornecedores

Todo fornecedor que processe dados deve ser avaliado quanto a:

- finalidade;
- acesso;
- segurança;
- localização;
- subcontratação;
- retenção;
- exclusão;
- incidentes;
- responsabilidades contratuais.

A ANPD recomenda atenção à distribuição de funções e responsabilidades e à inclusão de cláusulas de segurança da informação em contratos com fornecedores de TI. citeturn0search1

---

# 37. Dados para desenvolvimento

Prioridade:

```text
dados sintéticos
>
dados anonimizados
>
dados reais, somente quando indispensáveis
```

Se dados reais forem indispensáveis:

- autorização formal;
- minimização;
- ambiente controlado;
- acesso restrito;
- prazo definido;
- eliminação posterior.

---

# 38. Privacidade do navegador

Considerar:

- `autocomplete` adequado;
- evitar conteúdo sensível em URL;
- evitar dados sensíveis em query string;
- evitar exposição em histórico;
- headers de segurança;
- CSP;
- proteção contra clickjacking;
- cache-control adequado.

Especial atenção:

```text
URL NÃO DEVE CONTER:
nome
CPF
descrição do caso
dados de saúde
informações sobre violência
```

---

# 39. Saída rápida

A interface pode disponibilizar:

**Sair rapidamente**

A implementação deve:

- levar a uma página neutra;
- evitar revelar conteúdo no destino;
- limpar estado local quando apropriado;
- não prometer que o navegador/histórico será apagado integralmente.

Texto:

> **Você saiu desta tela.**
>
> Para sua segurança, lembre-se de que o histórico e os arquivos do seu dispositivo podem continuar armazenados pelo próprio dispositivo ou navegador.

---

# 40. Acessibilidade

Requisitos:

- WCAG como referência;
- teclado;
- contraste;
- leitor de tela;
- foco visível;
- textos claros;
- mensagens não dependentes apenas de cor;
- linguagem simples;
- campos grandes;
- compatibilidade com dispositivos móveis.

---

# 41. Internacionalização

Mesmo que inicialmente somente português:

```text
pt-BR
```

deve ser tratado como locale.

Textos críticos versionados.

---

# 42. Privacidade analítica

Ferramentas de analytics não devem receber automaticamente:

- respostas do questionário;
- conteúdo de casos;
- nomes;
- documentos;
- textos de relatos;
- informações de saúde;
- informações de violência.

Analytics deve ser separado do domínio protegido.

---

# 43. Cookies e terceiros

Mapear todos os terceiros:

```text
analytics
captcha
storage
email
SMS
monitoramento
CDN
```

Cada integração deve ser classificada quanto ao tratamento de dados.

---

# 44. Modelo de ameaça

A arquitetura deve considerar pelo menos:

### Ameaças externas

- account takeover;
- brute force;
- XSS;
- CSRF;
- SQL injection;
- SSRF;
- malware upload;
- API abuse;
- scraping.

### Ameaças internas

- acesso indevido;
- abuso de privilégio;
- exportação;
- compartilhamento não autorizado;
- uso indevido de credenciais.

### Ameaças operacionais

- perda de backup;
- indisponibilidade;
- exclusão acidental;
- falha de fornecedor;
- incidente de segurança.

---

# 45. Controles contra abuso interno

Implementar:

- menor privilégio;
- MFA;
- logs;
- revisão periódica de acessos;
- expiração de acessos;
- segregação de funções;
- alertas;
- acesso excepcional;
- auditoria.

---

# 46. Testes

## Funcionais

- questionário;
- estados;
- emergência;
- proteção especial;
- anexos;
- compartilhamento.

## Segurança

- autenticação;
- autorização;
- privilege escalation;
- IDOR;
- upload;
- API;
- sessão;
- logs.

## Privacidade

- minimização;
- retenção;
- exclusão;
- legal hold;
- acesso;
- exportação.

## UX

- linguagem;
- acessibilidade;
- abandono;
- erro;
- mobile;
- saída rápida.

---

# 47. Critérios de aceite de segurança

A plataforma não será aprovada se:

- administrador puder acessar todo conteúdo;
- API permitir IDOR;
- arquivo sensível estiver público;
- link de arquivo não expirar quando exigido;
- upload aceitar tipos proibidos;
- dados sensíveis aparecerem em logs;
- respostas forem armazenadas sem finalidade;
- retenção universal estiver codificada;
- legal hold puder ser ignorado;
- compartilhamento não for auditável;
- produção compartilhar dados com desenvolvimento;
- MFA não existir para perfis críticos.

---

# 48. Critérios de aceite de privacidade

Não aprovar se:

- houver coleta sem finalidade;
- houver pergunta obrigatória sem justificativa;
- “Prefiro não responder” for tratado como “não”;
- dados forem compartilhados além do necessário;
- usuário não puder compreender a finalidade;
- exclusão não considerar exceções legais;
- dados forem mantidos indefinidamente sem justificativa.

---

# 49. Critérios de aceite de proteção

Não aprovar se:

- o sistema sugerir confronto;
- solicitar investigação detalhada;
- induzir relato repetitivo;
- confirmar crime;
- emitir diagnóstico;
- produzir laudo;
- exigir prova para orientação;
- bloquear orientação emergencial por login;
- tratar criança/adolescente como objeto de investigação.

---

# 50. Requisitos não funcionais

## Disponibilidade

Definir SLA conforme capacidade da FAM e criticidade real.

## Performance

Meta inicial:

- páginas públicas: P95 < 2,5 s;
- API comum: P95 < 500 ms, excluindo operações externas;
- upload: dependente do tamanho.

## Escalabilidade

Arquitetura deve permitir crescimento horizontal dos componentes stateless.

## Recuperação

Definir:

```text
RPO
RTO
```

antes da produção.

---

# 51. Recuperação de desastre

Definir:

- RPO;
- RTO;
- backup;
- restore;
- failover;
- comunicação;
- responsáveis;
- testes periódicos.

---

# 52. Administração

Painel administrativo deve separar:

```text
gestão de conteúdo
gestão de usuários
gestão de permissões
governança
segurança
auditoria
```

Nenhum painel deve conceder acesso automático aos casos.

---

# 53. Alterações de políticas

Mudança de:

- finalidade;
- base jurídica;
- retenção;
- acesso;
- compartilhamento;
- fluxo especial;

deve gerar:

```text
change_request
↓
impact_analysis
↓
approval
↓
version
↓
deployment
↓
audit
```

---

# 54. Registro de operações

Manter inventário das operações:

```text
operation_id
purpose
data_categories
subjects
systems
recipients
legal_basis
retention
security_controls
owner
version
```

Esse registro deve alimentar a documentação de governança.

---

# 55. Arquitetura de implantação

Modelo recomendado:

```text
                    INTERNET
                       │
                    CDN/WAF
                       │
                  LOAD BALANCER
                       │
              ┌────────┴────────┐
              │                 │
          APP NODE 1        APP NODE 2
              │                 │
              └────────┬────────┘
                       │
                 PRIVATE NETWORK
                       │
       ┌───────────────┼───────────────┐
       │               │               │
     DB              CACHE          OBJECT STORAGE
       │                               │
       └───────────────┬───────────────┘
                       │
                 AUDIT / EVENTS
                       │
                  BACKUP / DR
```

---

# 56. Princípio de exposição mínima

Somente devem ser públicos:

- conteúdo institucional;
- informações de serviços;
- materiais aprovados;
- páginas públicas.

Casos, anexos, logs e dados pessoais:

**privados por padrão.**

---

# 57. Requisitos para API de arquivos

Endpoints devem verificar:

```text
authenticated
+
authorized
+
case_scope
+
purpose
```

Download deve gerar evento de auditoria.

---

# 58. Requisitos para exclusão

Uma requisição de exclusão deve gerar:

```text
deletion_request
↓
policy_check
↓
legal_hold_check
↓
approval_when_required
↓
delete
↓
verify
↓
audit
```

---

# 59. Requisitos para titular

A arquitetura deve permitir responder a solicitações compatíveis com os direitos aplicáveis, sem criar mecanismo que permita acesso indevido a dados de terceiros.

Identidade do solicitante deve ser verificada de forma proporcional.

---

# 60. Segurança de mensagens

Não colocar dados sensíveis em:

- e-mail sem proteção adequada;
- notificações push;
- SMS;
- assunto de e-mail;
- URLs.

Exemplo proibido:

> “Seu caso de violência sexual foi atualizado.”

Preferir:

> “Há uma atualização disponível na sua área segura.”

---

# 61. Regras para notificações

Notificações devem ser discretas.

Não revelar:

- tipo de violência;
- nome do agressor;
- situação de saúde;
- conteúdo do relato;
- destinatário do encaminhamento.

---

# 62. Arquitetura de decisão jurídica

O sistema não “decide a lei”.

Ele executa políticas previamente aprovadas.

```text
GOVERNANÇA
     ↓
POLICY
     ↓
CONFIGURAÇÃO
     ↓
SISTEMA
```

Nunca:

```text
IA
↓
decisão jurídica automática
```

---

# 63. IA e automação

Se futuramente houver IA:

- não usar para confirmar crime;
- não usar para diagnosticar;
- não usar para determinar culpa;
- não usar para substituir profissional;
- não usar para decidir compartilhamento sensível sem governança;
- não enviar dados sensíveis a terceiros sem avaliação específica.

Qualquer IA deverá passar por análise de impacto, segurança, finalidade e governança antes de receber dados reais.

---

# 64. Telemetria

Telemetria deve ser separada do conteúdo.

Exemplo permitido:

```text
screen = risk_intro
duration = 34s
```

Exemplo proibido:

```text
answer = "fui agredida pelo meu marido"
```

---

# 65. Segregação de chaves

Diferenciar:

```text
DB_ENCRYPTION_KEY
OBJECT_STORAGE_KEY
LOG_KEY
BACKUP_KEY
APP_SECRET
```

Nenhum operador individual deve possuir todas as chaves sem necessidade.

---

# 66. Gestão de vulnerabilidades

Processo:

```text
IDENTIFY
→ PRIORITIZE
→ PATCH
→ TEST
→ DEPLOY
→ VERIFY
```

Vulnerabilidades críticas devem possuir tratamento prioritário.

---

# 67. Dependências

Manter:

- SBOM;
- versões fixadas;
- atualização;
- scanner;
- monitoramento de vulnerabilidades.

---

# 68. Documentação técnica mínima

Repositório deve conter:

```text
/architecture
/security
/privacy
/api
/database
/runbooks
/deployment
/testing
/incidents
```

---

# 69. Runbooks

Criar runbooks para:

- incidente;
- vazamento;
- indisponibilidade;
- restauração;
- malware;
- exclusão;
- legal hold;
- acesso excepcional;
- revogação de usuário.

---

# 70. Controle de mudanças

Toda mudança sensível deve possuir:

```text
ticket
impact
approval
implementation
test
rollback
audit
```

---

# 71. Rollback

Toda alteração de produção deve ter:

- estratégia de rollback;
- backup quando necessário;
- migração reversível quando possível;
- responsável;
- teste.

---

# 72. Checklist pré-produção

## Governança

- [ ] responsáveis designados
- [ ] RACI aprovado
- [ ] políticas aprovadas
- [ ] bases jurídicas validadas
- [ ] retenção aprovada

## Segurança

- [ ] MFA
- [ ] RBAC/ABAC
- [ ] logs
- [ ] criptografia
- [ ] WAF/rate limiting
- [ ] backup
- [ ] restore testado

## Privacidade

- [ ] finalidade
- [ ] minimização
- [ ] retenção
- [ ] exclusão
- [ ] legal hold
- [ ] direitos dos titulares

## UX

- [ ] textos aprovados
- [ ] emergência
- [ ] criança/adolescente
- [ ] não revitimização
- [ ] acessibilidade
- [ ] saída rápida

## Arquivos

- [ ] validação
- [ ] malware scan
- [ ] storage privado
- [ ] links temporários
- [ ] auditoria
- [ ] retenção

---

# 73. Matriz de rastreabilidade

| Princípio | Documento | Requisito |
|---|---|---|
| não investigação | OC-04/JUR-01 | TEC-PROT-01 |
| emergência | OC-04 | TEC-FLOW-01 |
| criança/adolescente | DEC-01/JUR-01 | TEC-FLOW-02 |
| finalidade | JUR-02 | TEC-POL-01 |
| menor privilégio | JUR-05 | TEC-ACC-01 |
| compartilhamento mínimo | JUR-02/OC-01 | TEC-SHR-01 |
| retenção | POL-ARQ/DEC-01 | TEC-RET-01 |
| legal hold | DEC-01/JUR-04 | TEC-RET-02 |
| arquivos | POL-ARQ | TEC-FILE-01 |
| incidentes | JUR-04 | TEC-SEC-01 |
| UX | JUR-03/REV-02 | TEC-UX-01 |

---

# 74. Fases de implementação

## Fase 0 — Governança

- aprovar documentos;
- designar responsáveis;
- validar bases;
- validar retenção.

## Fase 1 — Fundação

- identidade;
- banco;
- storage;
- políticas;
- logs;
- segurança.

## Fase 2 — Orientação

- questionário;
- estados;
- emergência;
- proteção especial.

## Fase 3 — Arquivos

- upload;
- scan;
- storage;
- download;
- retenção.

## Fase 4 — Atendimento

- casos;
- atribuição;
- permissões;
- encaminhamento.

## Fase 5 — Compartilhamento

- destinatários;
- seleção granular;
- auditoria.

## Fase 6 — Governança

- incidentes;
- legal hold;
- relatórios;
- auditoria.

---

# 75. Ordem recomendada de desenvolvimento

```text
1. identidade
2. autorização
3. auditoria
4. policy engine
5. orientação
6. emergência
7. proteção especial
8. casos
9. arquivos
10. retenção
11. compartilhamento
12. incidentes
13. administração
```

A ordem é deliberada: **segurança e governança vêm antes dos módulos que tratam o conteúdo sensível.**

---

# 76. Decisões que ainda dependem de aprovação

Não implementar definitivamente sem aprovação:

1. bases jurídicas específicas;
2. prazos finais de retenção;
3. responsáveis nominais;
4. destinatários institucionais definitivos;
5. fluxos excepcionais;
6. política de notificações;
7. fornecedores de armazenamento;
8. arquitetura definitiva de backup.

---

# 77. Resultado

A TEC-01 estabelece uma arquitetura completa baseada em:

```text
PROTEÇÃO
+
FINALIDADE
+
MENOR PRIVILÉGIO
+
SEGREGAÇÃO
+
AUDITORIA
+
RETENÇÃO CONTROLADA
+
LEGAL HOLD
+
SEGURANÇA
+
NÃO REVITIMIZAÇÃO
```

Ela deve servir como documento-base para:

- arquitetura;
- backend;
- frontend;
- banco;
- DevOps;
- segurança;
- QA;
- UX;
- governança.

---

# 78. Próximo documento

**UX-01 — Especificação de Experiência da Usuária e Fluxos de Interface**

A UX-01 deverá partir dos textos já aprovados na REV-02 e especificar:

- mapa de telas;
- jornada;
- estados;
- perguntas;
- mensagens;
- botões;
- acessibilidade;
- emergência;
- criança/adolescente;
- anexos;
- compartilhamento;
- encerramento;
- saída rápida;
- desktop/mobile.

Depois da UX-01, o próximo passo será:

**BACKLOG-01 — Backlog Técnico e Critérios de Aceite**

