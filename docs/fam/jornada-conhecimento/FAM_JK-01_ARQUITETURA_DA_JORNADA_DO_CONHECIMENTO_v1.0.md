# FAM — JK-01
## Arquitetura Completa da Jornada do Conhecimento

**Versão:** 1.0  
**Status:** Base institucional, funcional e técnica  
**Integração:** Caderno Master / M04 / M05 / M06 / M07

---

## 1. Finalidade

A Jornada do Conhecimento organiza como a FAM transforma uma necessidade de informação em compreensão e, quando pertinente, em ação segura.

A arquitetura deve organizar conteúdo, navegação, busca, contexto, governança e evolução. Em arquitetura da informação, organização, rotulagem, navegação e busca são componentes centrais para a encontrabilidade; conteúdo também deve ser tratado como objeto com atributos e ciclo de vida. citeturn0search0turn0search4

```text
NECESSIDADE
 ↓
DESCOBERTA
 ↓
CONTEXTUALIZAÇÃO
 ↓
COMPREENSÃO
 ↓
DECISÃO
 ↓
AÇÃO
 ↓
RESULTADO
 ↓
APRENDIZADO
```

## 2. Princípios

- linguagem compreensível;
- orientação para tarefa;
- divulgação progressiva;
- múltiplas formas de descoberta;
- navegação previsível;
- conteúdo versionado;
- fonte identificável;
- acessibilidade;
- não revitimização;
- segurança por padrão;
- autorização separada da relevância;
- rastreabilidade.

A arquitetura deverá evitar excesso de escolhas e usar divulgação progressiva para revelar detalhes conforme a necessidade. citeturn0search5

## 3. Atores

| Ator | Papel |
|---|---|
| Usuária | consumir, compreender e utilizar conhecimento |
| Profissional | consultar conhecimento autorizado e orientar |
| Curador | organizar e manter conteúdo |
| Autor | produzir conteúdo |
| Revisor técnico | validar precisão |
| Revisor jurídico | validar conteúdo jurídico |
| Gestor institucional | aprovar publicação |
| Administrador técnico | operar infraestrutura sem acesso automático ao conteúdo |
| Auditor | verificar rastreabilidade e conformidade |

## 4. Etapas da jornada

| Etapa | Pergunta da usuária | Sistema deve oferecer |
|---|---|---|
| Necessidade | “O que preciso saber?” | entrada simples |
| Descoberta | “Onde encontro?” | busca/categorias |
| Contexto | “Isso se aplica a mim?” | resumo e contexto |
| Compreensão | “O que significa?” | explicação |
| Decisão | “O que posso fazer?” | opções |
| Ação | “Como faço?” | próximo passo |
| Resultado | “O que aconteceu?” | confirmação/status |
| Aprendizado | “O que aprendi?” | conteúdo relacionado |

## 5. Arquitetura funcional

```text
[INTERFACE]
    ↓
[DISCOVERY]
    ↓
[SEARCH / NAVIGATION]
    ↓
[KNOWLEDGE DELIVERY]
    ↓
[CONTEXT]
    ↓
[ACTION]
    ↓
[FEEDBACK]
```

## 6. Regra de separação

```text
JORNADA DO CONHECIMENTO
= relevância, descoberta e experiência

M07
= autorização e segurança
```

A busca pode localizar candidatos, mas somente o mecanismo de autorização determina se determinado conteúdo pode ser exibido.

```text
QUERY
 ↓
RETRIEVAL
 ↓
AUTHORIZATION
 ↓
VISIBLE RESULTS
```

## 7. Relação com módulos

```text
M04 → documentos/evidências
M05 → encaminhamentos
M06 → direitos da titular
M07 → autorização
JK  → conhecimento e experiência
```

## 8. Fluxo de conteúdo

```text
AUTOR
 ↓
CURADORIA
 ↓
REVISÃO
 ↓
APROVAÇÃO
 ↓
PUBLICAÇÃO
 ↓
DESCOBERTA
 ↓
USO
 ↓
FEEDBACK
 ↓
REVISÃO
```

## 9. Estados do conhecimento

```text
DRAFT
UNDER_REVIEW
APPROVED
PUBLISHED
SUPERSEDED
ARCHIVED
```

Somente `PUBLISHED` fica disponível para uso normal.

## 10. Segurança

Conteúdo restrito deverá ser filtrado antes da apresentação.

```text
CONTEÚDO
 ↓
CLASSIFICAÇÃO
 ↓
POLICY ENGINE
 ↓
VISIBILIDADE
```

A Jornada nunca deve funcionar como bypass de M07.

## 11. Métricas

- sucesso da busca;
- conteúdo encontrado;
- conclusão da tarefa;
- abandono;
- busca sem resultado;
- erro de navegação;
- compreensão declarada;
- acessibilidade;
- feedback qualitativo.

## 12. Critérios de aceite

- [ ] jornada principal definida;
- [ ] atores definidos;
- [ ] estados definidos;
- [ ] relação com M04–M07 definida;
- [ ] busca e navegação previstas;
- [ ] governança definida;
- [ ] autorização separada da descoberta;
- [ ] métricas definidas;
- [ ] conteúdo versionado.

