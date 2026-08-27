# FAM — JK-04
## Busca e Descoberta

**Versão:** 1.0  
**Status:** Base institucional, funcional e técnica  
**Dependências:** JK-01, JK-02, JK-03, M07, Caderno Master

---

# 1. Finalidade

O JK-04 define como a usuária e os profissionais autorizados encontram conhecimento dentro da FAM.

A busca não é apenas uma caixa de pesquisa. Ela é um conjunto formado por:

```text
BUSCA
+
NAVEGAÇÃO
+
TAXONOMIA
+
FILTROS
+
CONTEXTO
+
RELEVÂNCIA
+
AUTORIZAÇÃO
```

Objetivo:

> permitir que a pessoa encontre rapidamente o conhecimento adequado para compreender sua situação e identificar o próximo passo.

---

# 2. Princípio fundamental

A arquitetura deverá separar três perguntas:

```text
1. O que a pessoa procura?
        ↓
2. Qual conteúdo é relevante?
        ↓
3. A pessoa pode visualizar esse conteúdo?
```

Portanto:

```text
QUERY
 ↓
RETRIEVAL
 ↓
RANKING
 ↓
AUTHORIZATION
 ↓
PRESENTATION
```

O mecanismo de busca **não concede acesso**.

---

# 3. Experiência da usuária

A entrada principal deverá aceitar linguagem natural.

Exemplos:

```text
"quero saber quais são meus direitos"

"como acesso minhas informações?"

"preciso encaminhar um caso"

"como funciona o atendimento?"
```

O sistema deverá procurar compreender a intenção sem exigir que a usuária conheça a taxonomia interna.

---

# 4. Modos de descoberta

A FAM deverá oferecer pelo menos:

### Busca livre

```text
Digite uma dúvida ou assunto...
```

### Navegação por temas

```text
Direitos
Atendimento
Proteção
Privacidade
Serviços
```

### Busca por tarefa

```text
Quero entender
Quero solicitar
Quero acompanhar
Quero encaminhar
Quero consultar
```

### Conteúdo relacionado

```text
Você também pode querer saber:
- ...
- ...
- ...
```

---

# 5. Intenção

A busca deverá tentar identificar a intenção:

```text
INFORMAR
ENTENDER
SOLICITAR
EXECUTAR
ENCAMINHAR
ACOMPANHAR
CONSULTAR
```

Exemplo:

```text
"quero ver meus dados"
        ↓
INTENT = ACCESS_INFORMATION
        ↓
conteúdos sobre direito de acesso
        ↓
próximo passo M06
```

---

# 6. Taxonomia

O JK-04 utiliza o JK-02 como vocabulário de referência.

Os conteúdos podem ser recuperados por:

```text
tema
tipo
público
finalidade
etapa
sinônimo
termo relacionado
```

Exemplo:

```text
"ver meus dados"
"acessar minhas informações"
"quero minhas informações"
        ↓
Acesso às informações
```

---

# 7. Normalização da consulta

Antes da recuperação:

```text
QUERY
 ↓
NORMALIZAÇÃO
 ↓
RECONHECIMENTO DE SINÔNIMOS
 ↓
IDENTIFICAÇÃO DE INTENÇÃO
 ↓
RECUPERAÇÃO
```

A normalização não deverá alterar o sentido jurídico ou factual da solicitação.

---

# 8. Relevância

O ranking deverá considerar, conforme aplicável:

```text
correspondência textual
intenção
tema
tipo de conteúdo
público
etapa da jornada
atualidade
status
qualidade editorial
```

Conteúdo mais recente não deverá automaticamente superar conteúdo juridicamente ou institucionalmente mais adequado.

---

# 9. Segurança

A busca deverá aplicar autorização **antes da exibição do conteúdo protegido**.

```text
CANDIDATOS
 ↓
CLASSIFICAÇÃO
 ↓
POLICY ENGINE
 ↓
RESULTADOS VISÍVEIS
```

Nenhuma interface poderá consultar diretamente um índice protegido ignorando M07.

---

# 10. Metadados visíveis

Para conteúdo autorizado, o resultado poderá mostrar:

```text
título
resumo
tipo
tema
atualização
próximo passo
```

Não mostrar desnecessariamente:

```text
dados internos
IDs técnicos
informações de outros casos
metadados sensíveis
razões internas de segurança
```

---

# 11. Resultado vazio

Quando não houver resultado:

> Não encontramos um conteúdo correspondente. Tente usar outras palavras ou escolha um dos temas abaixo.

Oferecer:

```text
temas relacionados
sinônimos
perguntas sugeridas
apoio/encaminhamento
```

Não revelar que um conteúdo restrito existe apenas porque a busca não pode exibi-lo.

---

# 12. Resultado parcial

Quando houver baixa confiança:

> Talvez você esteja procurando uma destas opções:

```text
[Opção 1]
[Opção 2]
[Opção 3]
```

Evitar afirmar uma interpretação como certeza quando a intenção for ambígua.

---

# 13. Busca contextual

Quando a usuária estiver dentro de um fluxo:

```text
M06 — Direitos
        ↓
Busca contextual
        ↓
priorizar conteúdos sobre o direito atual
```

O contexto pode melhorar relevância, mas não pode ampliar autorização.

```text
CONTEXTO
≠
PERMISSÃO
```

---

# 14. Busca para profissionais

Profissionais autorizados poderão receber:

```text
protocolos
procedimentos
orientações técnicas
políticas
materiais operacionais
```

O conjunto de resultados dependerá de:

```text
role
atributos
escopo
finalidade
contexto
```

---

# 15. Busca por documento

Para conteúdos documentais:

```text
título
autor
versão
tipo
tema
data
status
fonte
```

A pesquisa por versão deverá permitir identificar claramente qual documento está vigente.

---

# 16. Conteúdo vigente

O sistema deverá priorizar:

```text
PUBLISHED
```

Conteúdo:

```text
SUPERSEDED
ARCHIVED
```

não deve aparecer como orientação vigente.

Quando permitido como histórico, deverá ser claramente identificado.

---

# 17. Destaques

A página inicial poderá apresentar:

```text
Mais procurados
Comece por aqui
Novidades
Temas importantes
Próximos passos
```

Destaques editoriais deverão passar por governança.

---

# 18. Recomendações

Recomendações devem ser baseadas preferencialmente em:

```text
tema atual
etapa atual
intenção
conteúdo relacionado
próximo passo
```

Evitar recomendações baseadas em inferências pessoais desnecessárias.

---

# 19. Histórico

Se houver histórico de busca, sua utilização deverá ser transparente e minimizada.

O histórico não deverá ser necessário para o funcionamento básico da Jornada.

Quando armazenado:

```text
finalidade
retenção
acesso
exclusão
```

deverão estar definidos.

---

# 20. Acessibilidade

A busca deverá ser operável por:

```text
teclado
leitor de tela
navegação sem mouse
texto ampliado
interfaces responsivas
```

Mensagens de erro e resultados deverão ser compreensíveis.

---

# 21. Interface — textos finais

### Campo de busca

> O que você precisa saber?

### Placeholder alternativo

> Digite uma dúvida, assunto ou ação

### Busca em andamento

> Procurando informações para você…

### Resultado

> Encontramos estas informações para você.

### Resultado vazio

> Não encontramos um conteúdo correspondente.

### Busca ambígua

> Talvez você esteja procurando uma destas opções.

### Conteúdo restrito

> Este conteúdo não está disponível para o seu perfil de acesso.

### Falha técnica

> Não foi possível concluir a busca. Tente novamente.

### Próximo passo

> Se quiser continuar, veja o próximo passo.

---

# 22. Arquitetura técnica

```text
[UI]
 ↓
[SEARCH API]
 ↓
[QUERY NORMALIZER]
 ↓
[INTENT / TAXONOMY]
 ↓
[RETRIEVAL]
 ↓
[RANKING]
 ↓
[POLICY ENGINE]
 ↓
[RESULT FILTER]
 ↓
[KNOWLEDGE SERVICE]
 ↓
[UI]
```

---

# 23. Índice de conhecimento

O índice deverá conter somente os campos necessários para descoberta.

Exemplo:

```text
content_id
title
summary
taxonomy_terms
content_type
audience
purpose
status
version
updated_at
visibility_class
```

Conteúdo sensível deverá possuir arquitetura de armazenamento e indexação compatível com sua classificação.

---

# 24. Contrato conceitual da API

Entrada:

```text
SearchRequest {
  query
  context
  audience
  filters
}
```

Saída:

```text
SearchResult {
  content_id
  title
  summary
  type
  relevance
  next_action
}
```

A resposta final deverá conter somente recursos autorizados.

---

# 25. Auditoria

Para buscas sensíveis ou ações decorrentes da busca, registrar conforme necessidade:

```text
search_id
subject_id
timestamp
intent
filters
result_count
selected_content_id
action_after_search
```

Evitar armazenar a consulta integral quando isso puder registrar informação sensível desnecessária.

---

# 26. Segurança contra abuso

O componente deverá considerar:

```text
rate limiting
autenticação
autorização
isolamento de índices
validação de parâmetros
proteção contra enumeração
logs de segurança
```

Tentativas de consultar recursos fora do escopo deverão ser tratadas pelo modelo de segurança e auditoria.

---

# 27. Métricas

Indicadores:

```text
search_success_rate
zero_result_rate
query_refinement_rate
content_selection_rate
task_completion_rate
abandonment_rate
```

Métricas devem servir para melhorar a experiência, não para monitorar indevidamente pessoas.

---

# 28. Testes

### Funcionais

- busca por termo;
- busca por frase;
- busca por sinônimo;
- busca por tema;
- filtros;
- conteúdo relacionado;
- resultado vazio;
- resultado ambíguo.

### Segurança

- conteúdo fora do escopo;
- enumeração;
- acesso direto ao índice;
- bypass do Policy Engine;
- manipulação de filtros;
- conteúdo arquivado aparecendo como vigente.

### UX

- linguagem simples;
- compreensão;
- teclado;
- leitor de tela;
- mobile/responsivo;
- mensagens de erro.

---

# 29. Critérios de aceite

- [ ] busca livre implementável;
- [ ] navegação por temas;
- [ ] intenção prevista;
- [ ] sinônimos integrados;
- [ ] ranking definido;
- [ ] conteúdo vigente priorizado;
- [ ] autorização antes da exibição;
- [ ] resultado vazio tratado;
- [ ] busca contextual;
- [ ] acessibilidade;
- [ ] auditoria;
- [ ] métricas;
- [ ] testes funcionais e de segurança.

---

# 30. Regra Master

```text
A BUSCA AJUDA A ENCONTRAR.
A TAXONOMIA AJUDA A ORGANIZAR.
O RANKING AJUDA A PRIORIZAR.
A JORNADA AJUDA A COMPREENDER.

MAS:

O POLICY ENGINE DECIDE O QUE PODE SER ACESSADO.
```

---

# 31. Próximo documento

```text
JK-04
Busca e Descoberta
        ↓
JK-05
Curadoria e Governança
```

JK-05 deverá definir quem cria, revisa, valida, aprova, publica, atualiza, substitui e arquiva cada conteúdo.
