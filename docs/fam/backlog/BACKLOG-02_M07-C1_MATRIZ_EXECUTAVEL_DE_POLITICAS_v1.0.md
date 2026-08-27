# BACKLOG-02 — M07-C.1
## Matriz Executável de Políticas

**Projeto:** FAM  
**Versão:** 1.0  
**Status:** Especificação funcional/técnica  
**Dependências:** M04, M05, M06, M07-A, M07-B, M07-C, JUR-01, OC-04

---

## 1. Objetivo

Transformar as regras institucionais e de segurança em uma matriz estruturada que possa ser implementada, testada e auditada pelo Policy Engine.

A matriz não substitui a validação jurídica. Ela representa tecnicamente políticas já aprovadas.

```text
REGRA INSTITUCIONAL
        ↓
VALIDAÇÃO
        ↓
POLICY
        ↓
CONDIÇÕES
        ↓
DECISÃO
        ↓
AUDITORIA
```

---

## 2. Regra central

O sistema deverá operar sob:

```text
DENY BY DEFAULT
```

Quando não existir autorização suficiente, a decisão será:

```text
DENY
```

Em conflito:

```text
DENY > ALLOW
```

---

# 3. Estrutura da matriz

Cada política deverá conter:

| Campo | Finalidade |
|---|---|
| Policy ID | Identificação única |
| Domínio | Área funcional |
| Sujeito | Quem solicita |
| Recurso | O que será acessado |
| Ação | Operação solicitada |
| Finalidade | Por que o acesso é necessário |
| Condições | Requisitos para autorização |
| Efeito | ALLOW, DENY ou REVIEW |
| Prioridade | Ordem de avaliação |
| Exceções | Situações especiais |
| Reason Code | Motivo da decisão |
| Auditoria | Registro obrigatório |
| Versão | Política utilizada |

---

# 4. Matriz executável — visão geral

| ID | Domínio | Ação | Regra padrão | Resultado |
|---|---|---|---|---|
| POLICY-001 | Identidade | LOGIN | autenticação válida | ALLOW |
| POLICY-002 | Casos | VIEW | caso dentro do escopo | ALLOW |
| POLICY-003 | Dados sensíveis | VIEW | necessidade + finalidade | ALLOW condicionado |
| POLICY-004 | Arquivos | VIEW | escopo autorizado | ALLOW |
| POLICY-005 | Arquivos | DOWNLOAD | autorização específica | ALLOW condicionado |
| POLICY-006 | Compartilhamento | SHARE | destinatário + finalidade + autorização | ALLOW condicionado |
| POLICY-007 | Encaminhamento | FORWARD | finalidade + destinatário autorizado | ALLOW condicionado |
| POLICY-008 | Direitos da titular | ACCESS | identidade e legitimidade validadas | ALLOW |
| POLICY-009 | Emergência | BREAK_GLASS | critérios de emergência | REVIEW/ALLOW |
| POLICY-010 | Administração | VIEW_CONTENT | função técnica | DENY |
| POLICY-011 | Direção | VIEW_SENSITIVE | cargo isoladamente | DENY |
| POLICY-012 | Auditoria | AUDIT | função e escopo autorizados | ALLOW |
| POLICY-013 | Exportação | EXPORT | autorização específica | DENY por padrão |
| POLICY-014 | Exclusão | DELETE | política de retenção e autorização | condicionado |
| POLICY-015 | Representação | ACCESS | representação válida | ALLOW condicionado |

---

# 5. POLICY-001 — Identidade e autenticação

**Sujeito:** qualquer usuário  
**Recurso:** conta/sessão  
**Ação:** LOGIN

### Condições

```text
identity_exists = true
credential_valid = true
account_status = ACTIVE
authentication_success = true
```

### Efeito

```text
ALLOW
```

Caso qualquer requisito essencial falhe:

```text
DENY
```

### Reason codes

```text
ALLOW_VALID_AUTHENTICATION
DENY_INVALID_CREDENTIAL
DENY_ACCOUNT_INACTIVE
DENY_AUTHENTICATION_FAILED
```

### Auditoria

Registrar tentativa bem-sucedida e falha relevante.

---

# 6. POLICY-002 — Acesso a casos

**Ação:** VIEW  
**Recurso:** CASE

### ALLOW quando

```text
subject.role = PROFESSIONAL
AND
case_assignment = true
AND
subject.status = ACTIVE
AND
credential.status = VALID
AND
purpose = COMPATIBLE
AND
scope includes case
```

### DENY quando

```text
case_assignment = false
OR
scope insufficient
OR
credential invalid
OR
purpose incompatible
```

### Reason codes

```text
ALLOW_ASSIGNED_CASE
DENY_NO_ASSIGNMENT
DENY_INSUFFICIENT_SCOPE
DENY_PURPOSE_MISMATCH
```

---

# 7. POLICY-003 — Dados sensíveis

**Recurso:** SENSITIVE_DATA  
**Ação:** VIEW

### Requisitos adicionais

```text
need_to_know = true
purpose = declared
purpose = compatible
scope = sufficient
credential = valid
```

Quanto maior a classificação do dado, maior deverá ser o nível de controle.

### Regra

```text
SENSITIVE / HIGHLY_SENSITIVE
        ↓
NECESSIDADE COMPROVADA
        ↓
POLÍTICA ESPECÍFICA
        ↓
ALLOW
```

Sem os requisitos:

```text
DENY
```

---

# 8. POLICY-004 — Visualização de arquivos

**Recurso:** FILE  
**Ação:** VIEW

### ALLOW

```text
file_exists = true
AND
resource_scope = authorized
AND
purpose = compatible
AND
subject_authorized = true
```

### Importante

`VIEW` não concede automaticamente:

```text
DOWNLOAD
SHARE
EXPORT
DELETE
```

---

# 9. POLICY-005 — Download

**Recurso:** FILE  
**Ação:** DOWNLOAD

O download será mais restritivo que a visualização.

### ALLOW condicionado

```text
VIEW = ALLOW
AND
DOWNLOAD_POLICY = ALLOW
AND
purpose = compatible
AND
risk <= permitted
```

Caso contrário:

```text
DENY
```

### Reason codes

```text
ALLOW_AUTHORIZED_DOWNLOAD
DENY_DOWNLOAD_NOT_AUTHORIZED
DENY_DOWNLOAD_RISK
```

---

# 10. POLICY-006 — Compartilhamento

**Recurso:** DATA / FILE / CASE  
**Ação:** SHARE

### Avaliação obrigatória

```text
WHO?
WHAT?
TO WHOM?
WHY?
AUTHORIZATION?
SCOPE?
TIME?
SENSITIVITY?
```

### ALLOW somente quando

```text
recipient_authorized = true
AND
purpose = compatible
AND
scope = sufficient
AND
authorization = valid
AND
data_minimization = satisfied
```

Caso contrário:

```text
DENY
```

### Auditoria reforçada

Registrar:

```text
sender
recipient
resource
purpose
authorization
timestamp
policy_version
decision
```

---

# 11. POLICY-007 — Encaminhamento

**Ação:** FORWARD

O encaminhamento deverá verificar:

```text
case_scope
purpose
recipient
authorization
sensitivity
minimum_necessary
```

Nenhum encaminhamento poderá ser realizado apenas porque o usuário possui acesso ao caso.

---

# 12. POLICY-008 — Direitos da titular

**Sujeito:** TITULAR  
**Recurso:** próprios dados  
**Ação:** ACCESS / REQUEST

### Condições

```text
identity_verified = true
request_valid = true
resource_belongs_to_subject = true
```

### Proteção de terceiros

Caso o recurso contenha dados de terceiros:

```text
THIRD_PARTY_DATA
        ↓
SEPARATE EVALUATION
```

O direito da titular não deverá resultar automaticamente na exposição de dados de terceiros.

---

# 13. POLICY-009 — Break Glass

**Ação:** BREAK_GLASS

### Condições mínimas

```text
emergency = true
justification = present
authorized_role = true
scope = limited
time_limit = defined
```

### Resultado

```text
REQUIRE_REVIEW
```

ou, quando a política específica permitir:

```text
ALLOW
```

Sempre:

```text
ENHANCED_AUDIT = true
```

---

# 14. POLICY-010 — Administrador técnico

**Sujeito:** ADMIN_SISTEMA  
**Ação:** VIEW_CONTENT

### Regra

```text
ROLE = ADMIN_SISTEMA
        ↓
INFRASTRUCTURE ACCESS
        ≠
CONTENT ACCESS
```

Resultado padrão:

```text
DENY
```

O administrador poderá operar infraestrutura sem visualizar o conteúdo protegido.

---

# 15. POLICY-011 — Direção

**Sujeito:** DIREÇÃO  
**Ação:** VIEW_SENSITIVE

### Regra fundamental

```text
ROLE = DIREÇÃO
```

não constitui fundamento suficiente para acesso.

Resultado:

```text
DENY
```

Somente uma política específica, com finalidade, necessidade, escopo e autorização válidos, poderá produzir outra decisão.

---

# 16. POLICY-012 — Auditoria

**Ação:** AUDIT

Acesso a registros de auditoria deverá ser limitado às funções autorizadas.

### Condições

```text
audit_role = authorized
AND
scope = sufficient
AND
purpose = legitimate
```

A auditoria não deverá conceder automaticamente acesso ao conteúdo dos recursos auditados.

---

# 17. POLICY-013 — Exportação

**Ação:** EXPORT

Regra padrão:

```text
DENY
```

A exportação deverá exigir autorização específica.

### ALLOW condicionado

```text
VIEW = ALLOW
AND
EXPORT_POLICY = ALLOW
AND
purpose = compatible
AND
scope = sufficient
AND
risk = permitted
```

---

# 18. POLICY-014 — Exclusão

**Ação:** DELETE

A exclusão deverá ser avaliada conjuntamente com:

```text
retention_policy
legal_hold
resource_status
ownership
authorization
```

### Regra

```text
LEGAL_HOLD = true
        ↓
DENY DELETE
```

A existência de uma solicitação de exclusão não deverá ignorar retenções ou obrigações aplicáveis.

---

# 19. POLICY-015 — Representação

**Ação:** ACCESS

### Condições

```text
representative_identity_verified = true
representation_valid = true
representation_scope = sufficient
representation_active = true
```

Sem representação válida:

```text
DENY
```

---

# 20. Prioridades

Proposta inicial:

```text
PRIORITY 1000 — BLOQUEIOS ABSOLUTOS
PRIORITY 900  — SEGURANÇA
PRIORITY 800  — DADOS SENSÍVEIS
PRIORITY 700  — ESCOPO
PRIORITY 600  — FINALIDADE
PRIORITY 500  — PERMISSÕES FUNCIONAIS
PRIORITY 400  — EXCEÇÕES
PRIORITY 100  — DEFAULT
```

Políticas de bloqueio não deverão ser anuladas por permissões genéricas de menor prioridade.

---

# 21. Conflitos

Exemplo:

```text
POLICY-002 → ALLOW VIEW
POLICY-011 → DENY VIEW
```

Se ambas forem aplicáveis:

```text
DENY
```

O motor deverá registrar:

```text
CONFLICT_DETECTED
```

e a política que prevaleceu.

---

# 22. Matriz de ações

| Ação | Padrão | Requisitos adicionais |
|---|---|---|
| VIEW | DENY | escopo + finalidade |
| READ | DENY | escopo + finalidade |
| UPDATE | DENY | função + escopo |
| DOWNLOAD | DENY | autorização específica |
| SHARE | DENY | destinatário + finalidade + autorização |
| EXPORT | DENY | autorização específica |
| DELETE | DENY | retenção + autorização |
| AUDIT | DENY | função + escopo |
| BREAK_GLASS | REVIEW | emergência + justificativa |

---

# 23. Reason codes

### ALLOW

```text
ALLOW_VALID_AUTHENTICATION
ALLOW_ASSIGNED_CASE
ALLOW_AUTHORIZED_VIEW
ALLOW_AUTHORIZED_DOWNLOAD
ALLOW_AUTHORIZED_SHARE
ALLOW_VALID_REPRESENTATION
ALLOW_VALID_RIGHTS_REQUEST
ALLOW_EMERGENCY_ACCESS
```

### DENY

```text
DENY_INVALID_CREDENTIAL
DENY_NO_ASSIGNMENT
DENY_INSUFFICIENT_SCOPE
DENY_PURPOSE_MISMATCH
DENY_SENSITIVE_CONTENT
DENY_DOWNLOAD_NOT_AUTHORIZED
DENY_SHARE_NOT_AUTHORIZED
DENY_EXPORT_NOT_AUTHORIZED
DENY_DELETE_RETENTION
DENY_LEGAL_HOLD
DENY_INVALID_REPRESENTATION
DENY_ROLE_INSUFFICIENT
DENY_POLICY_EXPIRED
```

### REVIEW

```text
REVIEW_EMERGENCY
REVIEW_SENSITIVE_OPERATION
REVIEW_EXCEPTION
```

---

# 24. Auditoria obrigatória

Para decisões sensíveis:

```text
decision_id
subject_id
resource_id
action
purpose
decision
reason_code
policy_id
policy_version
timestamp
risk_level
```

Para compartilhamento e encaminhamento, acrescentar:

```text
recipient
authorization_reference
```

---

# 25. Versionamento

Cada política deverá possuir versão imutável após publicação.

```text
POLICY-006
 ├── v1.0
 ├── v1.1
 └── v2.0
```

As decisões deverão apontar para a versão efetivamente utilizada.

---

# 26. Testes mínimos

## Autorização

- [ ] usuário autorizado → ALLOW
- [ ] usuário não autorizado → DENY
- [ ] escopo insuficiente → DENY
- [ ] finalidade incompatível → DENY
- [ ] credencial inválida → DENY

## Arquivos

- [ ] VIEW sem DOWNLOAD
- [ ] DOWNLOAD sem SHARE
- [ ] EXPORT bloqueado por padrão
- [ ] DELETE bloqueado por retenção

## Compartilhamento

- [ ] destinatário autorizado
- [ ] destinatário não autorizado
- [ ] finalidade incompatível
- [ ] autorização expirada
- [ ] auditoria reforçada

## Administração

- [ ] admin técnico sem conteúdo
- [ ] direção sem acesso universal
- [ ] tentativa de elevação de privilégio bloqueada

## Emergência

- [ ] break glass válido
- [ ] justificativa ausente
- [ ] escopo excessivo
- [ ] tempo expirado
- [ ] auditoria reforçada

---

# 27. Critérios de aceite

O M07-C.1 será considerado pronto quando:

- [ ] todas as ações críticas tiverem política definida;
- [ ] toda política tiver ID único;
- [ ] toda política tiver versão;
- [ ] toda decisão tiver reason code;
- [ ] deny by default estiver implementado;
- [ ] conflitos forem resolvidos de forma determinística;
- [ ] políticas de M04 estiverem representadas;
- [ ] políticas de M05 estiverem representadas;
- [ ] políticas de M06 estiverem representadas;
- [ ] RBAC/ABAC estiverem vinculados;
- [ ] auditoria estiver definida;
- [ ] break glass estiver definido;
- [ ] retenção/legal hold estiverem integrados;
- [ ] administração técnica estiver separada do conteúdo;
- [ ] direção não possuir privilégio automático;
- [ ] todos os fluxos críticos possuírem testes.

---

# 28. Próxima etapa

```text
M07-A
Matriz de Permissões
      ↓
M07-B
RBAC + ABAC
      ↓
M07-C
Policy Engine
      ↓
M07-C.1
Matriz Executável de Políticas
      ↓
M07-C.2
DSL / Modelo Técnico das Policies
      ↓
M07-C.3
Testes Automatizados de Autorização
```

O **M07-C.1** constitui a ponte entre a governança documental e a implementação efetiva do Policy Engine.
