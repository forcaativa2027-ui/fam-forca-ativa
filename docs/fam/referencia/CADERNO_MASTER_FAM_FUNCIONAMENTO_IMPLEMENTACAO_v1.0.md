# CADERNO MASTER FAM
## Funcionamento e Implementação

**Projeto:** FAM  
**Documento:** Caderno Master de Funcionamento e Implementação  
**Versão:** 1.0  
**Status:** Documento mestre de consolidação  
**Data:** 27/08/2026

---

# 1. FINALIDADE

Este Caderno Master consolida a arquitetura funcional, metodológica, institucional, jurídica, técnica e operacional do sistema FAM.

Ele funciona como documento de referência para:

- compreender como o sistema funciona;
- definir como os módulos se relacionam;
- orientar a implementação;
- orientar testes e homologação;
- preservar as decisões institucionais;
- garantir rastreabilidade entre regra, política, implementação e auditoria.

```text
NECESSIDADES
    ↓
MODELO INSTITUCIONAL
    ↓
REGRAS JURÍDICAS
    ↓
POLÍTICAS
    ↓
MÓDULOS FUNCIONAIS
    ↓
ARQUITETURA TÉCNICA
    ↓
POLICY ENGINE
    ↓
INTERFACE
    ↓
TESTES
    ↓
HOMOLOGAÇÃO
    ↓
OPERAÇÃO
    ↓
AUDITORIA
```

---

# 2. PRINCÍPIOS MESTRES

O sistema deverá observar:

1. proteção da pessoa atendida;
2. minimização de dados;
3. necessidade de acesso;
4. finalidade determinada;
5. menor privilégio;
6. segregação de funções;
7. rastreabilidade;
8. segurança por padrão;
9. privacidade por padrão;
10. deny by default;
11. fail closed para operações sensíveis;
12. acesso contextual;
13. decisões auditáveis;
14. retenção controlada;
15. exclusão controlada;
16. não revitimização;
17. encaminhamento responsável;
18. separação entre infraestrutura e conteúdo;
19. nenhuma autoridade informal deverá produzir privilégio técnico;
20. nenhuma decisão crítica deverá depender exclusivamente da interface.

---

# 3. ARQUITETURA GERAL

```text
                    USUÁRIA
                       │
                       ↓
                  INTERFACE
                       │
                       ↓
                API / APPLICATION
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
         M04          M05          M06
      ARQUIVOS     ENCAMINH.    DIREITOS
          │            │            │
          └────────────┼────────────┘
                       ↓
                     M07
              AUTORIZAÇÃO CENTRAL
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
         RBAC         ABAC       POLICIES
          │            │            │
          └────────────┼────────────┘
                       ↓
                POLICY ENGINE
                       │
              ┌────────┼────────┐
              ↓        ↓        ↓
           ALLOW      DENY     REVIEW
                       │
                       ↓
                    AUDITORIA
```

---

# 4. MÓDULOS

## M04 — Arquivos e Evidências

Responsável pelo ciclo de vida dos arquivos e evidências.

Abrange:

```text
UPLOAD
IDENTIFICAÇÃO
CLASSIFICAÇÃO
ARMAZENAMENTO
VISUALIZAÇÃO
DOWNLOAD
EXPORTAÇÃO
COMPARTILHAMENTO
RETENÇÃO
EXCLUSÃO
AUDITORIA
```

Uma permissão de visualização não concede automaticamente download, exportação, compartilhamento ou exclusão.

---

## M05 — Encaminhamento e Compartilhamento

Responsável por controlar o fluxo de informação para terceiros e órgãos autorizados.

O sistema deverá avaliar:

```text
QUEM?
O QUÊ?
PARA QUEM?
POR QUÊ?
QUAL AUTORIZAÇÃO/BASE?
QUAL ESCOPO?
QUAL TEMPO?
QUAL SENSIBILIDADE?
```

O compartilhamento deverá ser minimizado, justificado e auditável.

---

## M06 — Direitos da Titular

Responsável pelos fluxos relacionados às solicitações da titular.

Fluxo:

```text
SOLICITAÇÃO
 ↓
IDENTIFICAÇÃO
 ↓
VALIDAÇÃO
 ↓
CLASSIFICAÇÃO DO DIREITO
 ↓
LOCALIZAÇÃO DOS RECURSOS
 ↓
POLÍTICA
 ↓
DECISÃO
 ↓
ATENDIMENTO
 ↓
AUDITORIA
```

Dados de terceiros deverão receber avaliação independente.

---

# 5. M07 — CONTROLE DE ACESSO

M07 constitui a camada central de autorização.

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
Matriz Executável
```

---

# 6. M07-A — MATRIZ DE PERMISSÕES

Define:

```text
SUJEITO
RECURSO
AÇÃO
ESCOPO
FINALIDADE
PERMISSÃO
```

As permissões devem ser explícitas.

---

# 7. M07-B — RBAC + ABAC

## RBAC

Define funções:

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

Role não equivale a acesso irrestrito.

## ABAC

Complementa RBAC com atributos:

```text
subject
resource
action
purpose
scope
assignment
credential
context
risk
```

---

# 8. M07-C — POLICY ENGINE

É o motor responsável pela decisão.

```text
REQUEST
 ↓
IDENTITY
 ↓
ATTRIBUTES
 ↓
RESOURCE
 ↓
PURPOSE
 ↓
POLICIES
 ↓
DECISION
 ↓
AUDIT
```

Resultados:

```text
ALLOW
DENY
REQUIRE_REVIEW
```

Regras:

```text
DENY BY DEFAULT
DENY > ALLOW
FAIL CLOSED
```

---

# 9. M07-C.1 — MATRIZ EXECUTÁVEL

A matriz inicial contém políticas para:

```text
POLICY-001  Identidade
POLICY-002  Casos
POLICY-003  Dados sensíveis
POLICY-004  Arquivos
POLICY-005  Download
POLICY-006  Compartilhamento
POLICY-007  Encaminhamento
POLICY-008  Direitos da titular
POLICY-009  Break Glass
POLICY-010  Administração técnica
POLICY-011  Direção
POLICY-012  Auditoria
POLICY-013  Exportação
POLICY-014  Exclusão
POLICY-015  Representação
```

---

# 10. GOVERNANÇA JURÍDICA

Os módulos técnicos deverão ser subordinados às regras institucionais e jurídicas aprovadas.

```text
REGRA
 ↓
INTERPRETAÇÃO INSTITUCIONAL
 ↓
VALIDAÇÃO JURÍDICA
 ↓
POLICY
 ↓
IMPLEMENTAÇÃO
```

A implementação não poderá alterar silenciosamente a finalidade ou o alcance de uma regra aprovada.

---

# 11. COMPARTILHAMENTO COM ÓRGÃOS E AUTORIDADES

O sistema deverá permitir fluxos específicos para autoridades e instituições legitimamente habilitadas.

Exemplos previstos no modelo institucional:

```text
CRAS
MINISTÉRIO PÚBLICO
DELEGACIAS
AUTORIDADES MÉDICAS CREDENCIADAS
```

O fato de determinada instituição ser potencialmente destinatária não significa que qualquer usuário poderá compartilhar dados com ela.

A autorização deverá ser:

```text
CONTEXTUAL
JUSTIFICADA
LIMITADA
REGISTRADA
AUDITÁVEL
```

---

# 12. REGRA DE ACESSO A INFORMAÇÕES SENSÍVEIS

O acesso deverá estar vinculado à necessidade profissional legítima e ao escopo autorizado.

A função, cargo ou posição institucional, isoladamente, não deverá conceder acesso.

Especialmente:

```text
DIREÇÃO
ADMINISTRAÇÃO
PARCEIROS
OUTROS MEMBROS
```

não deverão possuir acesso automático a conteúdo sensível apenas em razão de sua posição.

---

# 13. ADMINISTRAÇÃO TÉCNICA

Separar:

```text
ACESSO À INFRAESTRUTURA
          ≠
ACESSO AO CONTEÚDO
```

Administrador técnico poderá administrar componentes autorizados da infraestrutura sem receber automaticamente capacidade de ler conteúdo protegido.

---

# 14. RETENÇÃO E EXCLUSÃO

O ciclo de vida do recurso deverá considerar:

```text
CRIAÇÃO
 ↓
USO
 ↓
RETENÇÃO
 ↓
REVISÃO
 ↓
EXCLUSÃO OU PRESERVAÇÃO
```

A exclusão deverá respeitar:

```text
retention_policy
legal_hold
resource_status
authorization
```

Se houver retenção obrigatória ou preservação válida:

```text
DELETE → DENY
```

---

# 15. SEGURANÇA DE ARQUIVOS

Cada arquivo deverá possuir, conforme aplicável:

```text
ID
TIPO
CLASSIFICAÇÃO
CASO
PROPRIETÁRIO
SENSIBILIDADE
DATA
RETENÇÃO
STATUS
HASH/INTEGRIDADE
```

Operações deverão ser separadas:

```text
VIEW
DOWNLOAD
EXPORT
SHARE
DELETE
```

---

# 16. FLUXO DE AUTORIZAÇÃO

```text
1. Usuário solicita ação
2. Sistema autentica identidade
3. Sistema obtém atributos confiáveis
4. Sistema identifica recurso
5. Sistema identifica finalidade
6. Policy Engine encontra políticas
7. Condições são avaliadas
8. Conflitos são resolvidos
9. Decisão é produzida
10. Sistema executa ou bloqueia
11. Evento é auditado
```

---

# 17. AUDITORIA

Decisões sensíveis deverão produzir registro.

```text
decision_id
subject_id
action
resource_id
purpose
decision
reason_code
policy_id
policy_version
timestamp
risk_level
```

Para compartilhamento:

```text
recipient
authorization_reference
```

A auditoria deverá permitir reconstruir o motivo da decisão.

---

# 18. VERSIONAMENTO

Políticas publicadas não deverão ser sobrescritas.

```text
POLICY-X
 ├── v1.0
 ├── v1.1
 └── v2.0
```

Toda decisão deverá apontar para a versão efetivamente utilizada.

---

# 19. PUBLICAÇÃO DE POLÍTICAS

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

Somente políticas publicadas deverão controlar produção.

---

# 20. BREAK GLASS

Acesso emergencial não significa acesso irrestrito.

```text
EMERGÊNCIA
 ↓
JUSTIFICATIVA
 ↓
PAPEL AUTORIZADO
 ↓
ESCOPO
 ↓
TEMPO
 ↓
DECISÃO
 ↓
AUDITORIA REFORÇADA
```

---

# 21. INTERFACE

A interface deverá refletir as decisões do sistema sem revelar informações internas desnecessárias.

## Permitido

> Acesso autorizado.

## Negado

> Acesso não autorizado. Você não possui permissão para realizar esta ação.

## Revisão

> Esta ação precisa de uma autorização adicional antes de continuar.

## Expirado

> Esta autorização não está mais válida.

## Falha

> Não foi possível validar a autorização. A operação não foi realizada.

---

# 22. EXPERIÊNCIA DA USUÁRIA

A experiência deverá seguir:

```text
CLAREZA
+
SEGURANÇA
+
PREVISIBILIDADE
+
NÃO REVITIMIZAÇÃO
```

A interface não deverá exigir que a usuária repita desnecessariamente informações já disponíveis no sistema.

Mensagens deverão explicar:

```text
O QUE ACONTECEU
O QUE PODE SER FEITO
QUAL É O PRÓXIMO PASSO
```

sem expor dados protegidos.

---

# 23. IMPLEMENTAÇÃO TÉCNICA

A implementação deverá ser incremental.

## Fase 1 — Fundação

```text
IDENTIDADE
AUTENTICAÇÃO
USUÁRIOS
ROLES
```

## Fase 2 — Recursos

```text
CASOS
ARQUIVOS
EVIDÊNCIAS
CLASSIFICAÇÃO
```

## Fase 3 — Autorização

```text
RBAC
ABAC
POLICY ENGINE
```

## Fase 4 — Fluxos

```text
ENCAMINHAMENTO
COMPARTILHAMENTO
DIREITOS DA TITULAR
```

## Fase 5 — Governança

```text
AUDITORIA
RETENÇÃO
EXCLUSÃO
BREAK GLASS
VERSIONAMENTO
```

## Fase 6 — Interface

```text
UX
MENSAGENS
ESTADOS
REVISÕES
ACESSIBILIDADE
```

---

# 24. CONTRATOS ENTRE COMPONENTES

Cada módulo deverá possuir interfaces bem definidas.

```text
AUTH SERVICE
     ↓
IDENTITY
     ↓
AUTHORIZATION SERVICE
     ↓
POLICY ENGINE
     ↓
RESOURCE SERVICE
     ↓
AUDIT SERVICE
```

Nenhum módulo deverá contornar o Policy Engine para executar operação protegida.

---

# 25. MODELO DE AUTORIZAÇÃO

Representação conceitual:

```text
Can(
    subject,
    action,
    resource,
    purpose,
    context
)
```

Resposta:

```text
{
  decision,
  reason_code,
  policy_id,
  policy_version
}
```

---

# 26. FAIL-SAFE

Para operações sensíveis:

```text
POLICY ENGINE INDISPONÍVEL
        ↓
DENY
```

Não assumir autorização por falha de infraestrutura.

---

# 27. TESTES

A implementação deverá possuir testes:

### Funcionais

```text
login
casos
arquivos
download
share
export
delete
direitos
```

### Segurança

```text
elevação de privilégio
bypass
manipulação de role
acesso fora do escopo
acesso a outro caso
contorno do Policy Engine
```

### Governança

```text
versionamento
aprovação
publicação
rollback
auditoria
retenção
legal hold
```

### Experiência

```text
clareza
mensagens
fluxos de erro
não revitimização
acessibilidade
```

---

# 28. HOMOLOGAÇÃO

Antes da entrada em produção:

```text
DESENVOLVIMENTO
 ↓
TESTES AUTOMATIZADOS
 ↓
TESTES DE SEGURANÇA
 ↓
REVISÃO JURÍDICA
 ↓
REVISÃO INSTITUCIONAL
 ↓
HOMOLOGAÇÃO
 ↓
PRODUÇÃO
```

Nenhum componente crítico deverá entrar em produção sem critérios de aceite definidos.

---

# 29. MATRIZ DE RASTREABILIDADE

Cada requisito deverá poder ser rastreado:

```text
NECESSIDADE
   ↓
REQUISITO
   ↓
DOCUMENTO
   ↓
POLICY
   ↓
COMPONENTE
   ↓
TESTE
   ↓
EVIDÊNCIA
```

Exemplo:

```text
Necessidade N-01
 ↓
M04
 ↓
POLICY-004
 ↓
Authorization Service
 ↓
T-M04-001
 ↓
Log de teste
```

---

# 30. CONTROLE DE MUDANÇAS

Toda mudança relevante deverá registrar:

```text
change_id
motivo
solicitante
impacto
documentos afetados
políticas afetadas
aprovação
implementação
testes
data
versão
```

Mudanças em políticas de segurança ou acesso deverão receber avaliação de impacto.

---

# 31. CRITÉRIOS PARA PRODUÇÃO

O sistema somente deverá ser considerado pronto quando:

- [ ] identidade implementada;
- [ ] autenticação implementada;
- [ ] RBAC implementado;
- [ ] ABAC implementado;
- [ ] Policy Engine implementado;
- [ ] matriz executável implementada;
- [ ] M04 integrado;
- [ ] M05 integrado;
- [ ] M06 integrado;
- [ ] auditoria implementada;
- [ ] retenção implementada;
- [ ] exclusão controlada;
- [ ] break glass controlado;
- [ ] administração separada do conteúdo;
- [ ] testes de segurança concluídos;
- [ ] testes funcionais concluídos;
- [ ] revisão jurídica concluída;
- [ ] homologação concluída;
- [ ] documentação versionada.

---

# 32. ORDEM OFICIAL DE IMPLEMENTAÇÃO

```text
01. NECESSIDADES
        ↓
02. PRINCÍPIOS
        ↓
03. POLÍTICAS
        ↓
04. M04 — ARQUIVOS
        ↓
05. M05 — ENCAMINHAMENTO
        ↓
06. M06 — DIREITOS
        ↓
07. M07-A — PERMISSÕES
        ↓
08. M07-B — RBAC + ABAC
        ↓
09. M07-C — POLICY ENGINE
        ↓
10. M07-C.1 — MATRIZ EXECUTÁVEL
        ↓
11. IMPLEMENTAÇÃO
        ↓
12. TESTES
        ↓
13. HOMOLOGAÇÃO
        ↓
14. PRODUÇÃO
        ↓
15. AUDITORIA CONTÍNUA
```

---

# 33. DOCUMENTOS DE REFERÊNCIA DO CADERNO

O Caderno Master consolida e deve ser lido em conjunto com:

- M04 — Arquivos e Evidências;
- M05 — Encaminhamento e Compartilhamento;
- M06 — Direitos da Titular;
- M07-A — Matriz de Permissões;
- M07-B — RBAC + ABAC;
- M07-C — Policy Engine;
- M07-C.1 — Matriz Executável de Políticas;
- POL-ARQ-01;
- OC-01 a OC-04;
- JUR-01 a JUR-05;
- TEC-01;
- REV-01;
- REV-02;
- AUD-01;
- DEC-01.

---

# 34. REGRA MASTER

O sistema FAM deverá funcionar segundo o princípio:

```text
NÃO É O CARGO QUE AUTORIZA.
NÃO É A INTERFACE QUE AUTORIZA.
NÃO É O ADMINISTRADOR QUE AUTORIZA.

A AUTORIZAÇÃO RESULTA DA POLÍTICA APLICÁVEL,
DOS ATRIBUTOS CONFIÁVEIS,
DA FINALIDADE,
DO ESCOPO,
DO CONTEXTO
E DA DECISÃO AUDITÁVEL DO SISTEMA.
```

---

# 35. ESTADO DO PROJETO

```text
DOCUMENTAÇÃO
████████████████████████░  CONSOLIDAÇÃO

GOVERNANÇA
███████████████████████░░  ESTRUTURADA

AUTORIZAÇÃO
██████████████████████░░░  M07 EM CONSOLIDAÇÃO

POLICY ENGINE
████████████████████░░░░░  ESPECIFICADO

IMPLEMENTAÇÃO
██████████░░░░░░░░░░░░░░  PRÓXIMA FASE

TESTES
██████░░░░░░░░░░░░░░░░░░  A CONSTRUIR

HOMOLOGAÇÃO
██░░░░░░░░░░░░░░░░░░░░░░  FUTURA
```

---

# 36. PRÓXIMA ETAPA

A partir deste Caderno Master, a próxima etapa técnica é transformar a documentação consolidada em:

```text
M07-C.2
DSL / MODELO TÉCNICO DAS POLICIES
        ↓
M07-C.3
TESTES AUTOMATIZADOS DE AUTORIZAÇÃO
        ↓
M08
IMPLEMENTAÇÃO / INTEGRAÇÃO
```

O Caderno Master passa a ser o documento de referência para verificar se cada implementação permanece coerente com as decisões institucionais, jurídicas e técnicas anteriores.
