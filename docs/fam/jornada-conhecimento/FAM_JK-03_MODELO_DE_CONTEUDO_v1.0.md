# FAM — JK-03
## Modelo de Conteúdo do Conhecimento

**Versão:** 1.0  
**Status:** Base para CMS/Knowledge Service

---

## 1. Finalidade

O modelo de conteúdo define os tipos de conhecimento, seus campos, relações, estados, regras de publicação e uso.

Um modelo estruturado permite reutilização, classificação, busca e entrega contextualizada; arquitetura de conhecimento também deve separar tipos de conteúdo, metadados, relações, permissões e governança. citeturn0search3turn0search12

## 2. Princípio

```text
CONTEÚDO ≠ PÁGINA
```

O conhecimento deve ser armazenado como objeto estruturado, podendo ser apresentado em diferentes interfaces.

## 3. Tipos de conteúdo

### KC-01 — Guia

```text
title
summary
audience
purpose
steps
next_action
related_content
sources
```

### KC-02 — Explicação

```text
title
short_explanation
detailed_explanation
examples
related_terms
sources
```

### KC-03 — FAQ

```text
question
short_answer
detailed_answer
related_topics
next_action
sources
```

### KC-04 — Procedimento

```text
title
when_to_use
requirements
steps
expected_result
exceptions
next_action
```

### KC-05 — Política

```text
title
scope
rule
conditions
exceptions
effective_from
effective_until
source
approval
```

### KC-06 — Protocolo

```text
title
trigger
actors
steps
decision_points
escalation
audit_requirements
```

### KC-07 — Referência

```text
title
source_type
citation
summary
authority
publication_date
```

### KC-08 — Formulário/Serviço

```text
title
purpose
eligibility
requirements
action
expected_result
support
```

## 4. Metadados comuns

Todo objeto deverá possuir, conforme aplicável:

```text
content_id
content_type
title
summary
language
audience
classification
taxonomy_terms
status
owner
author
reviewer
version
created_at
updated_at
review_date
source
approval_reference
```

## 5. Ciclo de vida

```text
DRAFT
 ↓
UNDER_REVIEW
 ↓
APPROVED
 ↓
PUBLISHED
 ↓
SUPERSEDED
 ↓
ARCHIVED
```

## 6. Versionamento

Conteúdo publicado não deve ser sobrescrito silenciosamente.

```text
KC-001 v1.0
KC-001 v1.1
KC-001 v2.0
```

Relacionamentos:

```text
SUPERSEDES
SUPERSEDED_BY
```

## 7. Fontes

Conteúdo de natureza jurídica, institucional ou técnica deverá possuir referência de origem quando aplicável.

```text
source_type
source_reference
verified_at
verified_by
```

## 8. Conteúdo e autorização

O modelo deve separar:

```text
METADADOS PARA DESCOBERTA
        ≠
CONTEÚDO PROTEGIDO
```

A exposição de um título ou categoria também deve respeitar as regras de visibilidade quando o conteúdo for restrito.

## 9. Conteúdo para diferentes públicos

O mesmo assunto pode possuir representações distintas:

```text
USUÁRIA
→ linguagem simples

PROFISSIONAL
→ orientação operacional

JURÍDICO/TÉCNICO
→ referência completa
```

Quando possível, essas representações devem apontar para uma mesma origem governada, evitando versões divergentes.

## 10. Relações entre conteúdos

```text
EXPLAINS
RELATED_TO
NEXT_STEP
REQUIRES
SUPPORTS
SOURCE_OF
SUPERSEDES
```

Exemplo:

```text
Guia de acesso
 ↓ EXPLAINS
Direito de acesso
 ↓ NEXT_STEP
Solicitação M06
```

## 11. Regras de publicação

```text
AUTOR
 ↓
CURADOR
 ↓
REVISÃO TÉCNICA
 ↓
REVISÃO JURÍDICA (quando aplicável)
 ↓
APROVAÇÃO INSTITUCIONAL
 ↓
PUBLISHED
```

## 12. Atualização

Conteúdos deverão possuir:

```text
review_date
```

Conteúdo crítico ou sujeito a mudança deverá ser revisado conforme periodicidade definida pela governança.

## 13. Conteúdo expirado

Conteúdo fora de validade:

```text
não deve aparecer como orientação vigente
```

Pode permanecer como referência histórica quando permitido:

```text
status = ARCHIVED
```

## 14. Segurança editorial

O sistema deverá impedir:

- publicação sem proprietário;
- publicação sem versão;
- alteração silenciosa de conteúdo publicado;
- publicação de conteúdo restrito sem classificação;
- remoção de referência obrigatória;
- bypass de aprovação.

## 15. Interface

Cada conteúdo orientativo deverá procurar apresentar:

```text
TÍTULO
RESUMO
O QUE ISSO SIGNIFICA
O QUE VOCÊ PODE FAZER
PRÓXIMO PASSO
SAIBA MAIS
FONTES
```

## 16. Critérios de aceite

- [ ] tipos de conteúdo definidos;
- [ ] campos mínimos definidos;
- [ ] metadados definidos;
- [ ] ciclo de vida definido;
- [ ] versionamento definido;
- [ ] fontes definidas;
- [ ] relações definidas;
- [ ] autorização integrada ao modelo;
- [ ] publicação governada;
- [ ] representação por público prevista.

## 17. Integração

```text
JK-02 TAXONOMIA
       ↓
JK-03 MODELO DE CONTEÚDO
       ↓
KNOWLEDGE SERVICE
       ↓
JK-01 JORNADA
       ↓
INTERFACE
       ↓
M07 AUTHORIZATION
```

