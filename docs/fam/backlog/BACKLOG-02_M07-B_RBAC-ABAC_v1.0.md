# BACKLOG-02 — M07-B
## Modelo de Autorização RBAC + ABAC

**Projeto:** FAM  
**Versão:** 1.0  
**Status:** Especificação técnica  
**Dependências:** M04, M05, M06, M07-A, JUR-01, OC-04

## 1. Objetivo

Definir como o sistema determina quem pode executar qual ação, sobre qual recurso, em qual contexto e para qual finalidade.

```text
RBAC + ABAC + POLÍTICAS + CONTEXTO
              ↓
DECISÃO DE AUTORIZAÇÃO
```

## 2. Regra fundamental

```text
USUÁRIO → FUNÇÃO → ATRIBUTOS → RECURSO → FINALIDADE → CONTEXTO → POLÍTICA → DECISÃO
```

Ter uma função não significa possuir acesso irrestrito.

## 3. RBAC

Perfis funcionais iniciais:

```text
TITULAR
PROFISSIONAL
SUPERVISOR
PRIVACIDADE
JURÍDICO
ADMIN_SISTEMA
AUDITOR
DIREÇÃO
```

Roles de sistema não devem ser confundidas com cargos organizacionais.

## 4. ABAC

### Sujeito
```text
subject.id
subject.role
subject.status
subject.credential_status
subject.organization
subject.scope
```

### Recurso
```text
resource.id
resource.type
resource.case_id
resource.sensitivity
resource.owner
resource.classification
```

### Ações
```text
VIEW
READ
UPDATE
DOWNLOAD
SHARE
EXPORT
DELETE
AUDIT
```

### Contexto
```text
purpose
case_assignment
authorization
time
channel
risk_level
policy_version
```

## 5. Decisão

```text
Can(Subject, Action, Resource, Context)
```

Resultados:

```text
ALLOW
DENY
REQUIRE_REVIEW
```

## 6. Regras essenciais

- `purpose` é obrigatório para operações sensíveis.
- O escopo deve ser mínimo e explícito.
- A sensibilidade do recurso influencia os controles.
- Cada ação é avaliada separadamente.
- Ausência de autorização suficiente resulta em `DENY`.
- Em conflito entre políticas aplicáveis, `DENY > ALLOW`.
- Permissões temporárias devem possuir `valid_from` e `valid_until`.
- Emergência não concede acesso irrestrito.
- Representação deve validar identidade, vínculo, escopo e validade.
- Atributos críticos devem vir de fontes confiáveis do servidor.
- Administradores técnicos devem permanecer separados do conteúdo sensível.

## 7. Exemplos

### Profissional atribuído
```text
ROLE=PROFISSIONAL
CASE=183
ACTION=VIEW
PURPOSE=ATENDIMENTO
ASSIGNMENT=SIM
CREDENTIAL=VÁLIDA
        ↓
ALLOW
```

### Profissional fora do caso
```text
ROLE=PROFISSIONAL
CASE=999
ASSIGNMENT=NÃO
        ↓
DENY
```

### Administrador técnico
```text
ROLE=ADMIN_SISTEMA
ACTION=VIEW
RESOURCE=ARQUIVO_SENSÍVEL
        ↓
DENY
```

### Direção

A role `DIREÇÃO` não concede acesso universal. Qualquer exceção deverá ser contextual, autorizada e auditável.

## 8. Break Glass

```text
EMERGÊNCIA
 ↓
POLÍTICA ESPECÍFICA
 ↓
JUSTIFICATIVA
 ↓
ESCOPO LIMITADO
 ↓
TEMPO LIMITADO
 ↓
AUDITORIA REFORÇADA
```

## 9. Menor privilégio

```text
NECESSIDADE MÍNIMA
+
TEMPO MÍNIMO
+
ESCOPO MÍNIMO
+
DADOS MÍNIMOS
```

## 10. Segregação de funções

```text
REQUEST_SHARE
    ≠
APPROVE_SHARE
    ≠
EXECUTE_SHARE
    ≠
AUDIT_SHARE
```

## 11. Fluxo técnico

```text
REQUEST
 ↓
AUTHENTICATION
 ↓
IDENTITY
 ↓
RBAC
 ↓
ABAC ATTRIBUTES
 ↓
POLICY EVALUATION
 ↓
RISK CHECK
 ↓
DECISION
 ↓
ENFORCEMENT
 ↓
AUDIT
```

## 12. Política conceitual

```text
POLICY:
  resource: CASE_DATA
  action: VIEW

  subject:
    role: PROFESSIONAL

  conditions:
    assignment: true
    credential: valid
    purpose: TREATMENT
    sensitivity: HIGH

  effect:
    ALLOW
```

## 13. Reason codes

```text
ALLOW_ASSIGNED_CASE
ALLOW_VALID_AUTHORIZATION
DENY_NO_ASSIGNMENT
DENY_INSUFFICIENT_SCOPE
DENY_INVALID_CREDENTIAL
DENY_PURPOSE_MISMATCH
DENY_POLICY_EXPIRED
DENY_SENSITIVE_CONTENT
```

## 14. Auditoria

```text
AuthorizationDecision
 ├── decision_id
 ├── subject_id
 ├── role
 ├── action
 ├── resource_id
 ├── purpose
 ├── policy_id
 ├── policy_version
 ├── decision
 ├── reason_code
 ├── timestamp
 └── risk_level
```

## 15. Critérios de aceite

- [ ] RBAC implementado
- [ ] ABAC implementado
- [ ] cargo separado de função
- [ ] finalidade considerada
- [ ] escopo considerado
- [ ] relacionamento com caso considerado
- [ ] sensibilidade considerada
- [ ] permissões temporárias
- [ ] emergência controlada
- [ ] representação
- [ ] segregação de funções
- [ ] deny by default
- [ ] atributos críticos confiáveis
- [ ] decisões auditáveis
- [ ] nenhum acesso universal por cargo

## 16. Testes

- T86 — profissional recebe role correta
- T87 — administrador não recebe conteúdo
- T88 — direção não recebe acesso universal
- T89 — profissional atribuído → ALLOW
- T90 — profissional não atribuído → DENY
- T91 — finalidade incompatível → DENY
- T92 — escopo insuficiente → DENY
- T93 — credencial expirada → DENY
- T94 — manipulação de role pelo cliente
- T95 — acesso a outro caso
- T96 — download sem autorização
- T97 — share sem autorização
- T98 — permissão temporária válida
- T99 — permissão temporária expirada
- T100 — break glass
- T101 — representação inválida
- T102 — decisão ALLOW registrada
- T103 — decisão DENY registrada
- T104 — reason_code registrado
- T105 — policy_version registrada
