# FAM — JK-05
## Curadoria e Governança do Conhecimento

**Versão:** 1.0  
**Status:** Base institucional, funcional e técnica  
**Dependências:** JK-01, JK-02, JK-03, JK-04, M04, M07  
**Integração:** Caderno Master

---

# 1. Finalidade

O JK-05 estabelece como o conhecimento da FAM é criado, organizado, revisado, validado, aprovado, publicado, atualizado, substituído e arquivado.

A finalidade é garantir que a informação apresentada na Jornada do Conhecimento seja:

- correta;
- compreensível;
- atualizada;
- rastreável;
- adequada ao público;
- compatível com a classificação de acesso;
- institucionalmente autorizada;
- tecnicamente governada.

---

# 2. Princípio central

```text
NENHUM CONTEÚDO CRÍTICO
DEVE SER PUBLICADO
SEM GOVERNANÇA.
```

Governança não significa que todas as pessoas precisam acessar o conteúdo.

Ao contrário:

```text
GOVERNANÇA
≠
ACESSO
```

A governança define **quem pode produzir, revisar, aprovar e publicar**.

O M07 define **quem pode acessar o conteúdo depois de publicado**.

---

# 3. Separação de responsabilidades

```text
AUTORIA
   ↓
CURADORIA
   ↓
REVISÃO
   ↓
APROVAÇÃO
   ↓
PUBLICAÇÃO
   ↓
ACESSO
```

Nenhuma etapa deve ser confundida com a seguinte.

Especialmente:

```text
ADMINISTRADOR TÉCNICO
≠
AUTOR
≠
REVISOR
≠
APROVADOR
```

Ter acesso administrativo à infraestrutura não cria autorização para ler conteúdo sensível.

---

# 4. Papéis de governança

| Papel | Responsabilidade principal |
|---|---|
| Autor | produzir ou propor conteúdo |
| Curador | organizar, classificar e verificar completude |
| Revisor técnico | validar precisão técnica |
| Revisor jurídico | validar matéria jurídica quando aplicável |
| Revisor de experiência | avaliar clareza e compreensão |
| Aprovador institucional | autorizar publicação |
| Publicador | executar publicação autorizada |
| Gestor do conhecimento | administrar ciclo de vida |
| Auditor | verificar rastreabilidade e controles |
| Administrador técnico | manter plataforma e infraestrutura |

---

# 5. Regra de menor privilégio

Cada papel deve receber somente as permissões necessárias.

Exemplo:

```text
AUTOR
CREATE / EDIT_DRAFT

CURADOR
CLASSIFY / REQUEST_REVIEW

REVISOR
REVIEW

APROVADOR
APPROVE / REJECT

PUBLICADOR
PUBLISH

AUDITOR
AUDIT / READ_AUDIT_LOG
```

Nenhum desses papéis recebe automaticamente acesso a dados pessoais ou casos individuais.

---

# 6. Matriz RACI

| Atividade | Autor | Curador | Revisor Técnico | Jurídico | Experiência | Aprovador | Publicador |
|---|---|---|---|---|---|---|---|
| Criar conteúdo | R | C | I | I | C | I | I |
| Classificar | C | R | C | C | C | I | I |
| Revisar técnica | I | C | R | C | C | I | I |
| Revisar jurídica | I | C | C | R | I | C | I |
| Revisar linguagem/UX | C | C | C | I | R | I | I |
| Aprovar | I | C | C | C | C | A | I |
| Publicar | I | I | I | I | I | A | R |
| Atualizar | R | A/R | C | C | C | I | I |
| Arquivar | I | R | C | C | I | A | R |

**Legenda:** R = Responsible; A = Accountable; C = Consulted; I = Informed.

A matriz pode ser refinada por tipo de conteúdo.

---

# 7. Tipos de conteúdo e revisão

| Conteúdo | Técnica | Jurídica | UX/Linguagem | Institucional |
|---|---:|---:|---:|---:|
| Guia | Sim | quando aplicável | Sim | Sim |
| Explicação | Sim | quando aplicável | Sim | Sim |
| FAQ | Sim | quando aplicável | Sim | Sim |
| Procedimento | Sim | Sim quando houver regra jurídica | Sim | Sim |
| Política | Sim | Sim | Sim | Sim |
| Protocolo | Sim | conforme escopo | Sim | Sim |
| Referência | verificar fonte | conforme natureza | quando publicada | Sim |
| Formulário/Serviço | Sim | conforme requisitos | Sim | Sim |

---

# 8. Ciclo de vida

```text
DRAFT
  ↓
CURATION
  ↓
UNDER_REVIEW
  ↓
APPROVED
  ↓
PUBLISHED
  ↓
REVIEW_DUE
  ↓
UPDATED
  ↓
PUBLISHED
```

Alternativas:

```text
REJECTED
SUPERSEDED
ARCHIVED
```

---

# 9. Estados

### DRAFT

Conteúdo em elaboração.

Não aparece para usuárias.

### CURATION

Conteúdo sendo classificado e preparado.

### UNDER_REVIEW

Conteúdo submetido a revisão.

### APPROVED

Conteúdo formalmente aprovado.

Ainda pode depender da publicação operacional.

### PUBLISHED

Conteúdo vigente e disponível segundo as regras de acesso.

### SUPERSEDED

Substituído por versão posterior.

### ARCHIVED

Retirado do uso corrente.

### REJECTED

Não aprovado para publicação.

---

# 10. Regras de publicação

Um conteúdo não poderá entrar em `PUBLISHED` se faltar requisito obrigatório.

Exemplo:

```text
content_id
title
content_type
owner
classification
version
status
source
approval
```

Conforme o tipo:

```text
review_date
legal_review
technical_review
ux_review
```

também poderão ser obrigatórios.

---

# 11. Versionamento

Conteúdo publicado nunca deve ser alterado silenciosamente.

```text
v1.0
 ↓
v1.1
 ↓
v2.0
```

Cada versão deverá possuir:

```text
version
created_at
author
change_summary
approval_reference
effective_from
```

Alterações substanciais devem gerar nova versão claramente identificável.

---

# 12. Controle de mudanças

Toda alteração relevante deverá registrar:

```text
O QUE MUDOU
POR QUE MUDOU
QUEM ALTEROU
QUEM REVISOU
QUEM APROVOU
QUANDO ENTROU EM VIGOR
```

---

# 13. Conteúdo jurídico

Conteúdo que apresente direitos, obrigações, regras legais ou interpretação jurídica deverá possuir fluxo jurídico apropriado.

```text
PROPOSTA
 ↓
REVISÃO TÉCNICA
 ↓
REVISÃO JURÍDICA
 ↓
APROVAÇÃO
 ↓
PUBLICAÇÃO
```

O sistema não deve apresentar opinião jurídica como se fosse norma oficial.

Quando houver interpretação, isso deverá ser explicitamente identificado.

---

# 14. Fontes

Conteúdos que dependam de fontes externas ou documentos oficiais deverão registrar, quando aplicável:

```text
source_type
source_reference
source_title
publication_date
verified_at
verified_by
```

A fonte deverá ser atualizada quando a alteração de uma norma ou referência puder afetar o conteúdo.

---

# 15. Revisão periódica

Cada conteúdo deverá possuir uma regra de revisão.

```text
review_date
review_frequency
criticality
owner
```

A periodicidade deverá ser definida conforme o risco e a volatilidade do assunto, não por uma única regra para todo o acervo.

---

# 16. Alertas

O sistema poderá gerar:

```text
REVIEW_DUE
REVIEW_OVERDUE
SOURCE_CHANGED
CONTENT_SUPERSEDED
APPROVAL_EXPIRING
```

Conteúdo crítico vencido não deverá continuar sendo apresentado como orientação vigente sem decisão formal da governança.

---

# 17. Curadoria

O curador verifica:

- classificação correta;
- taxonomia;
- público;
- finalidade;
- duplicidades;
- relações;
- completude;
- existência de fonte;
- estado do conteúdo;
- necessidade de revisão;
- coerência com conteúdos relacionados.

O curador **não substitui** a revisão jurídica ou técnica quando essas forem exigidas.

---

# 18. Duplicidade

Antes de criar novo conteúdo:

```text
BUSCAR EXISTENTE
 ↓
IDENTIFICAR DUPLICIDADE
 ↓
REUTILIZAR / ATUALIZAR / CRIAR
```

Preferência:

```text
UMA FONTE GOVERNADA
+
MÚLTIPLAS APRESENTAÇÕES
```

em vez de várias versões independentes do mesmo conhecimento.

---

# 19. Conteúdo para públicos diferentes

O conteúdo poderá ter camadas:

```text
USUÁRIA
→ linguagem simples

PROFISSIONAL
→ orientação operacional

TÉCNICO/JURÍDICO
→ conteúdo completo
```

Quando as camadas tratarem do mesmo assunto, devem manter relação explícita para reduzir divergências.

---

# 20. Conteúdo sensível

Informação sensível deverá possuir classificação antes de publicação.

```text
CONTEÚDO
 ↓
CLASSIFICAÇÃO
 ↓
REVISÃO DE SEGURANÇA
 ↓
POLICY ENGINE
```

A classificação editorial não substitui autorização.

---

# 21. Dados de casos reais

Casos reais não devem ser utilizados como conteúdo educativo ou exemplo público sem o tratamento e as autorizações aplicáveis.

Sempre que possível:

```text
CASO REAL
 ↓
ANONIMIZAÇÃO / DESIDENTIFICAÇÃO
 ↓
REVISÃO
 ↓
CONTEÚDO EDUCACIONAL
```

A simples remoção do nome não deve ser presumida suficiente quando outros elementos puderem identificar uma pessoa.

---

# 22. Interface administrativa

O painel de governança deverá apresentar:

```text
Conteúdo
Status
Responsável
Versão
Classificação
Última revisão
Próxima revisão
Pendências
Aprovação
```

A interface deverá deixar claro:

> **Você está editando uma versão de trabalho. Esta alteração não será publicada até passar pelo fluxo de aprovação.**

---

# 23. Interface de aprovação

Texto recomendado:

> **Aprovar publicação**

> Ao aprovar, você confirma que o conteúdo foi revisado dentro do seu escopo de responsabilidade e está apto para publicação.

Botões:

```text
[APROVAR]
[DEVOLVER PARA REVISÃO]
[REJEITAR]
```

---

# 24. Interface de revisão

> **Revisão necessária**

> Confira o conteúdo, as fontes, a classificação e as informações de atualização antes de concluir sua revisão.

---

# 25. Interface de conteúdo desatualizado

> **Este conteúdo está em revisão.**

> Algumas informações podem estar sendo atualizadas. Consulte a versão vigente antes de tomar uma decisão.

---

# 26. Auditoria

Eventos mínimos de governança:

```text
CONTENT_CREATED
CONTENT_EDITED
CONTENT_SUBMITTED
CONTENT_REVIEWED
CONTENT_APPROVED
CONTENT_REJECTED
CONTENT_PUBLISHED
CONTENT_SUPERSEDED
CONTENT_ARCHIVED
CLASSIFICATION_CHANGED
```

Cada evento deverá possuir, conforme aplicável:

```text
event_id
timestamp
actor
content_id
version
action
result
```

---

# 27. Separação entre auditoria e conteúdo

O registro de que uma pessoa revisou um conteúdo não significa autorização para essa pessoa acessar dados de casos.

```text
AUDITORIA DO CONHECIMENTO
≠
ACESSO A CASOS
```

---

# 28. Métricas de governança

Indicadores:

```text
conteúdos publicados
conteúdos em revisão
revisões atrasadas
tempo médio de revisão
conteúdos rejeitados
conteúdos duplicados
conteúdos sem fonte
conteúdos sem proprietário
```

As métricas devem apoiar melhoria do acervo e controle institucional.

---

# 29. Exceções

Qualquer publicação emergencial deverá possuir:

```text
justificativa
responsável
escopo
prazo
revisão posterior
registro de auditoria
```

A urgência não elimina a necessidade de rastreabilidade.

---

# 30. Matriz de decisão

```text
NOVO CONTEÚDO?
    │
    ├── NÃO → localizar conteúdo existente
    │
    └── SIM
          ↓
      CLASSIFICAR
          ↓
       REVISAR
          ↓
   JURÍDICO? ── SIM → revisão jurídica
          │
          ↓
      APROVAR
          ↓
      PUBLICAR
```

---

# 31. Critérios de aceite

- [ ] papéis definidos;
- [ ] RACI definida;
- [ ] ciclo de vida definido;
- [ ] estados definidos;
- [ ] versionamento;
- [ ] controle de mudanças;
- [ ] revisão jurídica quando aplicável;
- [ ] revisão técnica;
- [ ] revisão de experiência;
- [ ] fontes;
- [ ] revisão periódica;
- [ ] alertas;
- [ ] classificação;
- [ ] auditoria;
- [ ] exceções controladas;
- [ ] integração com M07.

---

# 32. Regra Master

```text
CRIAR NÃO É PUBLICAR.

REVISAR NÃO É APROVAR.

APROVAR NÃO É ACESSAR.

ADMINISTRAR O SISTEMA NÃO É TER DIREITO
DE LER CONTEÚDO SENSÍVEL.

PUBLICAR NÃO SIGNIFICA LIBERAR PARA TODOS.
```

---

# 33. Integração no Caderno Master

```text
JK-02 — TAXONOMIA
        ↓
JK-03 — MODELO DE CONTEÚDO
        ↓
JK-05 — CURADORIA E GOVERNANÇA
        ↓
JK-04 — BUSCA E DESCOBERTA
        ↓
M07 — AUTORIZAÇÃO
        ↓
JORNADA DA USUÁRIA
```

**Próximo módulo:** JK-06 — Trilhas de Conhecimento.
