# FAM — JK-06
## Trilhas de Conhecimento

**Versão:** 1.0  
**Status:** Base institucional, funcional e técnica  
**Dependências:** JK-01, JK-02, JK-03, JK-04, JK-05, M07  
**Integração:** Caderno Master / Jornada do Conhecimento

---

# 1. Finalidade

As Trilhas de Conhecimento organizam conteúdos relacionados em percursos orientados para uma necessidade, objetivo ou etapa da jornada.

Uma trilha não é apenas uma lista de documentos.

```text
OBJETIVO
 ↓
CONTEXTO
 ↓
CONHECIMENTO
 ↓
COMPREENSÃO
 ↓
AÇÃO
 ↓
PRÓXIMO PASSO
```

O objetivo é reduzir a carga cognitiva e ajudar a usuária a entender o que precisa saber antes de agir.

---

# 2. Princípios

- orientação por objetivo;
- progressão lógica;
- linguagem adequada ao público;
- conteúdo essencial antes de conteúdo aprofundado;
- autonomia da usuária;
- nenhum passo obrigatório sem justificativa;
- possibilidade de sair da trilha a qualquer momento;
- acessibilidade;
- conteúdo vigente;
- autorização aplicada em todos os pontos;
- não transformar a trilha em mecanismo de vigilância.

---

# 3. Tipos de trilha

### 3.1 Trilha informativa

Para compreender um assunto.

```text
O que é?
 ↓
Por que importa?
 ↓
O que preciso saber?
```

### 3.2 Trilha orientativa

Para chegar a uma ação.

```text
Entender
 ↓
Ver opções
 ↓
Escolher
 ↓
Agir
```

### 3.3 Trilha procedimental

Para executar um procedimento.

```text
Requisitos
 ↓
Passos
 ↓
Confirmação
 ↓
Resultado
```

### 3.4 Trilha de direitos

Para compreender e exercer um direito.

```text
Direito
 ↓
Quando se aplica
 ↓
Como exercer
 ↓
Solicitar
 ↓
Acompanhar
```

### 3.5 Trilha profissional

Para orientar profissionais autorizados.

```text
Contexto
 ↓
Protocolo
 ↓
Critérios
 ↓
Decisão
 ↓
Encaminhamento
```

---

# 4. Estrutura de uma trilha

Cada trilha deverá possuir:

```text
trail_id
title
summary
audience
purpose
difficulty
estimated_time
steps
prerequisites
completion_rule
owner
version
status
review_date
```

---

# 5. Estrutura de cada etapa

```text
step_id
position
title
objective
content_refs
action
optional
completion_condition
next_step
```

Exemplo:

```text
ETAPA 1
Entenda seu direito

ETAPA 2
Veja quando ele se aplica

ETAPA 3
Saiba como solicitar

ETAPA 4
Faça sua solicitação
```

---

# 6. Regra de progressão

A trilha deve apresentar primeiro o conhecimento necessário para o próximo passo.

```text
NECESSÁRIO AGORA
        ↓
ÚTIL DEPOIS
        ↓
APROFUNDAMENTO
```

Conteúdo secundário não deve bloquear a ação principal.

---

# 7. Entrada na trilha

A usuária poderá chegar por:

```text
BUSCA
CATEGORIA
CONTEÚDO
RECOMENDAÇÃO
FLUXO DE SERVIÇO
LINK INSTITUCIONAL
```

A entrada deve identificar claramente:

> **Você está começando uma trilha sobre este tema.**

---

# 8. Navegação

A interface deverá mostrar:

```text
Etapa 1 de 4
● ○ ○ ○
```

ou equivalente acessível.

A usuária deve conseguir:

```text
voltar
avançar
sair
retomar
consultar conteúdo relacionado
```

---

# 9. Retomada

Quando tecnicamente necessário e permitido, a trilha poderá registrar progresso.

```text
trail_id
subject_id
current_step
updated_at
```

Esse registro deve possuir finalidade definida e retenção limitada.

O progresso não deve ser usado para inferir atributos pessoais que não sejam necessários.

---

# 10. Conteúdo protegido

Cada etapa poderá apontar para conteúdos com diferentes classificações.

Antes da exibição:

```text
STEP
 ↓
CONTENT
 ↓
M07 POLICY ENGINE
 ↓
ALLOW / DENY / OTHER POLICY RESULT
```

Se o conteúdo não puder ser exibido, a trilha deve apresentar uma alternativa segura quando possível.

Não revelar detalhes sobre conteúdo protegido.

---

# 11. Trilhas adaptativas

Uma trilha pode apresentar caminhos diferentes conforme informações explicitamente fornecidas pela usuária.

```text
PERGUNTA
   ↓
RESPOSTA
   ├── CAMINHO A
   └── CAMINHO B
```

A adaptação deverá ser:

- explicável;
- limitada ao necessário;
- reversível quando possível;
- compatível com as permissões.

---

# 12. Exemplo de trilha para usuária

## “Entenda e exerça seu direito de acesso”

```text
INÍCIO
 ↓
1. O que é o direito de acesso?
 ↓
2. Que tipo de informação pode ser solicitada?
 ↓
3. Como fazer a solicitação?
 ↓
4. O que acontece depois?
 ↓
ACOMPANHAR SOLICITAÇÃO
```

Conteúdos jurídicos ou institucionais associados deverão ser apresentados conforme sua classificação e revisão.

---

# 13. Exemplo de trilha para profissional

## “Realizar encaminhamento”

```text
INÍCIO
 ↓
1. Identificar a necessidade
 ↓
2. Consultar critérios
 ↓
3. Verificar documentação necessária
 ↓
4. Selecionar encaminhamento autorizado
 ↓
5. Registrar ação
 ↓
6. Acompanhar resultado
```

O profissional só visualizará protocolos e informações compatíveis com seu escopo de acesso.

---

# 14. Próxima ação

Toda trilha orientada à ação deverá indicar claramente o próximo passo.

Exemplos:

> **Próximo passo: iniciar sua solicitação.**

> **Próximo passo: consultar o procedimento.**

> **Próximo passo: acompanhar seu encaminhamento.**

---

# 15. Saída da trilha

Ao concluir:

```text
CONCLUÍDA
 ↓
RESULTADO
 ↓
PRÓXIMA AÇÃO
```

Mensagem:

> **Você concluiu esta trilha.**

Quando houver uma ação subsequente:

> **Agora você pode continuar para o próximo passo.**

---

# 16. Abandono

Sair da trilha não deve ser tratado como falha.

Mensagem:

> **Você pode sair agora e retornar quando quiser.**

Se houver salvamento de progresso, informar isso de forma clara.

---

# 17. Trilhas e conteúdo

A trilha referencia conteúdos existentes.

```text
TRILHA
 ├── KC-001
 ├── KC-014
 ├── KC-021
 └── SERVIÇO-004
```

Preferência:

```text
REUTILIZAR CONTEÚDO GOVERNADO
```

em vez de duplicar textos dentro da trilha.

---

# 18. Versionamento

Trilha e conteúdo possuem versões independentes.

```text
TRAIL v2.0
    ├── KC-001 v1.3
    ├── KC-014 v2.0
    └── KC-021 v1.1
```

Alteração de conteúdo crítico deverá disparar avaliação de compatibilidade da trilha.

---

# 19. Governança

Uma trilha deverá possuir:

```text
owner
curator
technical_review
legal_review_when_applicable
ux_review
institutional_approval
```

Publicação:

```text
DRAFT
 ↓
REVIEW
 ↓
APPROVED
 ↓
PUBLISHED
```

---

# 20. Acessibilidade

A trilha deverá permitir:

- navegação por teclado;
- leitor de tela;
- foco visível;
- ordem lógica;
- textos compreensíveis;
- alternativas para mídia;
- indicação clara do progresso;
- não depender apenas de cor ou ícones.

---

# 21. Mídia

Quando uma trilha utilizar:

```text
PDF
IMAGEM
ÁUDIO
VÍDEO
```

cada mídia deverá possuir classificação, origem, versão e regras de acesso compatíveis.

Conteúdo audiovisual não deve ser a única forma de transmitir informação essencial.

---

# 22. Segurança

A trilha não deve armazenar ou expor mais informação pessoal do que o necessário para sua finalidade.

```text
MINIMIZAÇÃO
+
MENOR PRIVILÉGIO
+
AUTORIZAÇÃO
+
AUDITORIA
```

A existência de uma trilha não concede acesso a dados de atendimento ou de terceiros.

---

# 23. Auditoria

Registrar, conforme necessidade:

```text
trail_started
step_viewed
step_completed
trail_completed
trail_abandoned
action_started
```

Eventos sensíveis deverão ser avaliados quanto à necessidade de registro e retenção.

---

# 24. Métricas

Indicadores úteis:

```text
completion_rate
step_dropoff_rate
time_to_completion
search_to_trail_rate
action_completion_rate
help_request_rate
```

As métricas devem avaliar a qualidade da jornada, sem transformar comportamento da usuária em perfil desnecessário.

---

# 25. Testes

### Conteúdo

- sequência correta;
- referências válidas;
- conteúdo vigente;
- ausência de contradições.

### UX

- compreensão;
- clareza;
- retomada;
- abandono;
- navegação;
- acessibilidade.

### Segurança

- autorização por etapa;
- conteúdo restrito;
- acesso direto;
- manipulação de `trail_id`;
- tentativa de atravessar etapas sem autorização.

---

# 26. Textos finais de interface

### Início

> **Vamos começar?**

> Esta trilha vai orientar você passo a passo.

### Progresso

> **Etapa {n} de {total}**

### Próximo

> **Continuar**

### Voltar

> **Voltar**

### Sair

> **Sair da trilha**

### Conclusão

> **Trilha concluída.**

### Conteúdo indisponível

> **Este conteúdo não está disponível para o seu perfil de acesso.**

### Erro

> **Não foi possível carregar esta etapa. Tente novamente.**

---

# 27. Critérios de aceite

- [ ] tipos de trilha definidos;
- [ ] estrutura de trilha definida;
- [ ] estrutura de etapa definida;
- [ ] progressão definida;
- [ ] retomada controlada;
- [ ] conteúdo reutilizável;
- [ ] M07 integrado;
- [ ] versionamento;
- [ ] governança;
- [ ] acessibilidade;
- [ ] mídia governada;
- [ ] auditoria;
- [ ] métricas;
- [ ] testes de segurança;
- [ ] textos de interface.

---

# 28. Regra Master

```text
A TRILHA NÃO DECIDE PELA USUÁRIA.

ELA ORGANIZA O CAMINHO PARA QUE A USUÁRIA
POSSA COMPREENDER, ESCOLHER E AGIR.

CONTEÚDO ORIENTA.
TRILHA ORGANIZA.
SERVIÇO EXECUTA.
M07 AUTORIZA.
```

---

# 29. Integração

```text
JK-02 — TAXONOMIA
        ↓
JK-03 — MODELO DE CONTEÚDO
        ↓
JK-05 — GOVERNANÇA
        ↓
JK-04 — BUSCA
        ↓
JK-06 — TRILHAS
        ↓
SERVIÇOS / M04 / M05 / M06
        ↓
M07 — AUTORIZAÇÃO
```

**Próximo módulo: JK-07 — Experiência da Usuária.**
