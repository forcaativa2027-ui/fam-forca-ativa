# BACKLOG-02 — M07-C
## Policy Engine — Motor de Políticas e Decisão de Autorização

**Projeto:** FAM  
**Versão:** 1.0  
**Status:** Especificação arquitetural  
**Dependências:** M04, M05, M06, M07-A, M07-B, JUR-01, OC-04

---

## 1. Finalidade

O Policy Engine é a camada central responsável por transformar regras institucionais, jurídicas e de segurança em decisões técnicas verificáveis.

```text
SOLICITAÇÃO
     ↓
IDENTIDADE
     ↓
ATRIBUTOS
     ↓
RECURSO
     ↓
FINALIDADE
     ↓
POLÍTICAS
     ↓
POLICY ENGINE
     ↓
ALLOW / DENY / REQUIRE_REVIEW
     ↓
AUDITORIA
```

## 2. Princípio institucional

> Nenhum usuário, cargo, função ou privilégio técnico deverá produzir acesso automático a informação sensível.

A decisão deverá considerar identidade, role, atributos, recurso, ação, finalidade, escopo, contexto e política vigente.

## 3. Arquitetura

```text
APPLICATION
     ↓
AUTHORIZATION API
     ↓
POLICY ENGINE
     ↓
┌─────────────────────────────────┐
│ Policy Registry                 │
│ Attribute Provider              │
│ Context Provider                │
│ Decision Engine                 │
│ Policy Governance               │
│ Version Control                 │
│ Audit                           │
└─────────────────────────────────┘
     ↓
ALLOW / DENY / REVIEW
     ↓
AUDIT
```

## 4. Componentes

### C1 — Policy Registry
Repositório das políticas aprovadas.

### C2 — Attribute Provider
Fornece atributos confiáveis do sujeito, recurso e contexto.

### C3 — Policy Evaluation
Identifica e avalia as políticas aplicáveis.

### C4 — Decision Engine
Produz a decisão final.

### C5 — Policy Governance
Controla criação, revisão, aprovação e publicação.

### C6 — Version Control
Mantém histórico das versões publicadas.

### C7 — Audit
Registra decisões e eventos relevantes.

## 5. Modelo Policy

```text
policy_id
name
description
domain
version
status
priority
scope
effective_from
effective_until
owner
created_by
approved_by
created_at
updated_at
```

Estados:

```text
DRAFT
UNDER_REVIEW
APPROVED
PUBLISHED
SUSPENDED
RETIRED
```

**DRAFT não pode controlar produção.**

## 6. Modelo PolicyRule

```text
rule_id
policy_id
effect
resource_type
actions
conditions
priority
```

Efeitos:

```text
ALLOW
DENY
REQUIRE_REVIEW
```

## 7. Modelo PolicyCondition

As condições poderão avaliar:

```text
subject.role
subject.scope
subject.status
credential.status

resource.type
resource.classification
resource.case_id
resource.owner

action

context.purpose
context.channel
context.time
context.emergency
context.risk
```

## 8. AuthorizationRequest

Toda solicitação deverá chegar ao motor com estrutura equivalente a:

```text
AuthorizationRequest
{
    subject,
    action,
    resource,
    purpose,
    context
}
```

Atributos confiáveis não poderão ser definidos arbitrariamente pelo cliente.

## 9. Decision

A resposta deverá possuir:

```text
decision_id
decision
reason_code
policy_id
policy_version
timestamp
```

Resultados:

```text
ALLOW
DENY
REQUIRE_REVIEW
```

## 10. Ordem de avaliação

```text
1. IDENTIDADE
2. AUTENTICAÇÃO
3. ROLE
4. ATRIBUTOS
5. RECURSO
6. AÇÃO
7. FINALIDADE
8. ESCOPO
9. POLÍTICAS
10. CONFLITOS
11. DECISÃO
12. AUDITORIA
```

## 11. Regras de segurança

### Deny by default

```text
nenhuma política aplicável
        ↓
      DENY
```

### Conflito

```text
DENY > ALLOW
```

### Política expirada

```text
EXPIRED → DENY
```

### Credencial inválida

```text
INVALID → DENY
```

## 12. Matriz inicial de políticas

| ID | Domínio | Recurso | Ação | Condição principal | Resultado |
|---|---|---|---|---|---|
| POLICY-001 | Identidade | Conta | LOGIN | autenticação válida | ALLOW |
| POLICY-002 | Casos | Caso | VIEW | atribuição + escopo | ALLOW |
| POLICY-003 | Dados | Sensível | VIEW | necessidade + finalidade | condicionado |
| POLICY-004 | Arquivos | Arquivo | VIEW | escopo autorizado | ALLOW |
| POLICY-005 | Arquivos | Arquivo | DOWNLOAD | autorização específica | condicionado |
| POLICY-006 | Compartilhamento | Dados | SHARE | destinatário + finalidade + autorização | condicionado |
| POLICY-007 | Encaminhamento | Caso | FORWARD | finalidade + destinatário autorizado | condicionado |
| POLICY-008 | Titular | Dados próprios | ACCESS | identificação validada | ALLOW |
| POLICY-009 | Emergência | Caso | VIEW | break glass válido | REVIEW/ALLOW |
| POLICY-010 | Administração | Conteúdo sensível | VIEW | função técnica | DENY |
| POLICY-011 | Direção | Conteúdo sensível | VIEW | cargo isoladamente | DENY |
| POLICY-012 | Auditoria | Logs | AUDIT | função autorizada | ALLOW |

> Esta matriz é inicial e deverá ser validada contra M04, M05, M06, JUR-01 e OC-04 antes da publicação.

## 13. Integração com M05 — Compartilhamento

O Policy Engine deverá avaliar:

```text
QUEM?
O QUÊ?
PARA QUEM?
POR QUÊ?
QUAL A BASE/AUTORIZAÇÃO APLICÁVEL?
QUAL O ESCOPO?
QUAL O TEMPO?
QUAL O NÍVEL DE SENSIBILIDADE?
```

Somente após avaliação poderá resultar em ALLOW.

## 14. Integração com M06 — Direitos da titular

```text
TITULAR
 ↓
IDENTIFICAÇÃO
 ↓
SOLICITAÇÃO
 ↓
DIREITO SOLICITADO
 ↓
RECURSOS ENVOLVIDOS
 ↓
POLÍTICA
 ↓
DECISÃO
```

O fluxo deverá impedir acesso indevido a dados de terceiros.

## 15. Integração com M04 — Arquivos

As ações deverão ser independentes:

```text
EXISTÊNCIA
VISUALIZAÇÃO
DOWNLOAD
EXPORTAÇÃO
COMPARTILHAMENTO
EXCLUSÃO
```

Exemplo:

```text
VIEW = ALLOW
DOWNLOAD = DENY
SHARE = DENY
DELETE = DENY
```

## 16. Versionamento

Políticas publicadas não deverão ser sobrescritas silenciosamente.

```text
POLICY-017
 ├── v1.0
 ├── v1.1
 ├── v1.2
 └── v2.0
```

Toda decisão deverá registrar a versão utilizada.

## 17. Publicação

```text
DRAFT
  ↓
REVISÃO INSTITUCIONAL
  ↓
REVISÃO JURÍDICA
  ↓
VALIDAÇÃO TÉCNICA
  ↓
APPROVED
  ↓
PUBLISHED
```

Somente `PUBLISHED` poderá controlar produção.

## 18. Rollback

```text
POLICY v2.0
     ↓
PROBLEMA
     ↓
SUSPEND
     ↓
ROLLBACK
     ↓
POLICY v1.2
```

Toda reversão deverá ser auditada.

## 19. Break Glass

```text
emergency = true
```

não significa acesso irrestrito.

Deverá verificar:

```text
emergency
+
justification
+
authorized_role
+
scope
+
time_limit
```

## 20. Auditoria

```text
AuthorizationDecision
 ├── decision_id
 ├── subject_id
 ├── action
 ├── resource_id
 ├── purpose
 ├── decision
 ├── reason_code
 ├── policy_id
 ├── policy_version
 ├── timestamp
 └── risk_level
```

A auditoria deverá permitir reconstruir a decisão sem armazenar desnecessariamente o conteúdo sensível.

## 21. Governança

Por padrão, nenhuma pessoa deverá concentrar:

```text
CRIAR POLÍTICA
+
APROVAR POLÍTICA
+
PUBLICAR POLÍTICA
+
ALTERAR AUDITORIA
```

Deverá existir segregação de funções.

## 22. Proteção do Policy Engine

```text
ALTERAÇÃO DE POLICY
        ↓
AUTENTICAÇÃO FORTE
        ↓
AUTORIZAÇÃO
        ↓
APROVAÇÃO
        ↓
AUDITORIA
```

Tentativas não autorizadas deverão gerar evento de segurança.

## 23. Falha segura

Para operações sensíveis:

```text
POLICY ENGINE OFFLINE
        ↓
DENY / FAIL CLOSED
```

Exceções deverão ser explicitamente definidas para operações que não envolvam dados protegidos.

## 24. Textos de interface

### Acesso permitido
> Acesso autorizado.

### Acesso negado
> Acesso não autorizado. Você não possui permissão para realizar esta ação.

### Revisão
> Esta ação precisa de uma autorização adicional antes de continuar.

### Permissão expirada
> Esta autorização não está mais válida.

### Falha de autorização
> Não foi possível validar a autorização. A operação não foi realizada.

## 25. Critérios de aceite

- [ ] Policy Registry
- [ ] Policy Rule
- [ ] Policy Condition
- [ ] Authorization Request
- [ ] Decision
- [ ] versionamento
- [ ] publicação controlada
- [ ] rollback
- [ ] deny by default
- [ ] deny prevalente em conflito
- [ ] fail closed
- [ ] auditoria
- [ ] reason codes
- [ ] segregação de funções
- [ ] integração M04
- [ ] integração M05
- [ ] integração M06
- [ ] integração M07-B
- [ ] break glass controlado
- [ ] proteção contra alteração não autorizada

## 26. Próxima etapa

A próxima etapa é **M07-C.1 — Matriz Executável de Políticas**, detalhando POLICY-001 em diante com:

- sujeito;
- recurso;
- ação;
- finalidade;
- atributos obrigatórios;
- condições;
- efeito;
- prioridade;
- exceções;
- reason code;
- requisitos de auditoria;
- casos de teste.
