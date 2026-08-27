# UX-01 — Especificação de Experiência da Usuária e Fluxos de Interface

## 1. Identificação

**Código:** UX-01  
**Título:** Especificação de Experiência da Usuária e Fluxos de Interface  
**Natureza:** Especificação funcional de UX/UI  
**Dependências principais:** TEC-01 e REV-02  
**Escopo:** Mapa de Risco e seus fluxos associados  
**Status:** Documento-base para desenvolvimento da interface

---

# 2. Objetivo

O UX-01 especifica a experiência da usuária durante a utilização do **Mapa de Risco**, transformando as regras técnicas, funcionais e textuais já definidas em uma sequência concreta de telas, estados, decisões e transições.

O documento deve permitir que as equipes de:

- UX;
- UI;
- frontend;
- backend;
- acessibilidade;
- segurança;
- testes;
- conteúdo;

compreendam exatamente como a experiência deverá funcionar.

O Mapa de Risco não deve se comportar como um formulário burocrático.

A experiência deverá transmitir:

- acolhimento;
- clareza;
- autonomia;
- privacidade;
- segurança;
- previsibilidade;
- simplicidade;
- possibilidade de interrupção;
- respeito à decisão da usuária.

---

# 3. Princípio central da experiência

A interface deverá partir do princípio de que a pessoa que utiliza o Mapa de Risco pode estar:

- com medo;
- sob pressão;
- emocionalmente abalada;
- sendo observada;
- utilizando o aparelho de outra pessoa;
- com pouco tempo disponível;
- com dificuldade de leitura;
- com deficiência;
- em situação de emergência;
- sem condições emocionais de responder determinadas perguntas.

Portanto, a experiência não poderá depender de longos textos, múltiplas decisões simultâneas ou conhecimento técnico.

A interface deverá ajudar sem assumir o controle da decisão da usuária.

---

# 4. Regra estrutural das telas

Sempre que aplicável, cada tela deverá ser especificada considerando:

### 4.1 O que a usuária vê

Conteúdo visual, título, texto, ícones, avisos e informações apresentadas.

### 4.2 O que a usuária pode fazer

Botões, respostas, navegação e ações disponíveis.

### 4.3 O que o sistema faz

Validações, armazenamento, classificação, encaminhamento ou alteração de fluxo.

### 4.4 O que o sistema não deve fazer

Restrições de comportamento necessárias para preservar segurança, privacidade e autonomia.

### 4.5 Próxima transição

Tela ou fluxo acionado depois da ação.

---

# 5. Fluxo geral

A jornada principal será:

**Entrada**

→ **Apresentação**

→ **Início do Mapa**

→ **Perguntas**

→ **Identificação de situações especiais**

→ **Tratamento de emergência, quando aplicável**

→ **Anexos opcionais**

→ **Processamento**

→ **Resultado**

→ **Orientações e encaminhamentos**

→ **Compartilhamento opcional**

→ **Encerramento**

A **Saída Rápida** deverá permanecer disponível durante as etapas em que sua utilização for considerada segura e tecnicamente possível.

---

# 6. Tela 01 — Entrada no Mapa de Risco

## Objetivo

Permitir acesso imediato à ferramenta sem criar barreiras desnecessárias.

## A usuária vê

- identificação visual discreta da ferramenta;
- título **Mapa de Risco**;
- breve explicação;
- botão principal para iniciar;
- acesso às informações de privacidade;
- recurso de acessibilidade;
- Saída Rápida.

## Ações

**Iniciar Mapa de Risco**

Ações secundárias:

- entender como funciona;
- acessibilidade;
- privacidade;
- sair.

## Regra de UX

Nenhuma informação sensível deverá aparecer antes que seja necessária para a utilização da ferramenta.

---

# 7. Tela 02 — Apresentação da ferramenta

Antes da primeira pergunta, a usuária deverá compreender:

1. para que serve o Mapa;
2. o que acontecerá durante o preenchimento;
3. que poderá interromper o processo;
4. que algumas perguntas poderão ser ignoradas;
5. que situações de emergência poderão gerar orientações específicas.

A linguagem deverá ser simples e acolhedora.

Não utilizar linguagem alarmista.

## CTA principal

**Começar**

## CTA secundário

**Agora não**

---

# 8. Tela 03 — Estrutura das perguntas

A experiência deverá privilegiar **uma pergunta por tela**.

Cada pergunta poderá conter:

- indicador discreto de progresso;
- pergunta;
- breve explicação quando necessária;
- opções de resposta;
- botão voltar;
- Saída Rápida.

Evitar formulários extensos verticalmente.

---

# 9. Padrão de resposta

Quando aplicável, utilizar:

**SIM**

**NÃO**

**PREFIRO NÃO RESPONDER**

A terceira opção é parte estrutural da experiência.

Não deverá ser apresentada visualmente como erro, omissão ou escolha inferior.

O sistema deverá registrar tecnicamente que a pergunta não foi respondida sem inferir automaticamente uma resposta negativa.

---

# 10. Perguntas condicionais

Nem todas as perguntas precisam ser apresentadas a todas as usuárias.

As respostas poderão ativar novos blocos.

Exemplo conceitual:

**SIM**

→ verificar se existe risco imediato

→ apresentar perguntas complementares

→ avaliar necessidade de orientação emergencial.

**NÃO**

→ continuar fluxo regular.

**PREFIRO NÃO RESPONDER**

→ continuar sem pressionar a usuária.

---

# 11. Fluxo de emergência

Se as respostas indicarem possibilidade de perigo imediato, o fluxo normal poderá ser interrompido.

A interface deverá apresentar uma tela específica.

## Prioridade

A prioridade deixa de ser completar o questionário.

Passa a ser apresentar opções claras e seguras.

A tela deverá:

- explicar brevemente a situação identificada;
- apresentar alternativas de ajuda;
- permitir continuar quando isso for seguro;
- permitir sair;
- preservar a autonomia da usuária.

O sistema não deverá presumir que a usuária pode telefonar, falar em voz alta ou abandonar imediatamente o local.

---

# 12. Fluxo de violência sexual

Quando houver indicação relacionada à violência sexual, a interface deverá migrar para um tratamento específico previsto nas regras do projeto.

A experiência deverá evitar:

- culpabilização;
- perguntas desnecessariamente detalhadas;
- linguagem gráfica;
- repetição da narrativa;
- exigência de relato completo para acesso às orientações.

As perguntas deverão existir somente quando houver finalidade objetiva para a avaliação ou encaminhamento.

---

# 13. Fluxo envolvendo criança ou adolescente

Quando houver indicação de criança ou adolescente envolvido na situação, o sistema deverá acionar o fluxo específico definido pelas regras da plataforma.

A interface deverá deixar claro que determinadas situações possuem proteção jurídica e institucional específica.

Entretanto, a comunicação não deverá utilizar ameaças ou linguagem que possa levar a usuária a abandonar o processo por medo.

---

# 14. Fluxo envolvendo pessoa idosa

Quando houver pessoa idosa envolvida, a interface deverá adaptar as orientações ao contexto correspondente.

Deverão ser consideradas também:

- dependência econômica;
- dependência física;
- isolamento;
- negligência;
- retenção de documentos;
- violência patrimonial;
- controle financeiro;
- dificuldades de comunicação;
- necessidade de acessibilidade.

---

# 15. Anexos

A inclusão de documentos, fotografias, vídeos, áudios ou outros registros deverá ser **opcional**, salvo situação futura expressamente regulamentada.

A interface deverá explicar:

- o que pode ser anexado;
- por que aquele conteúdo pode ser útil;
- quem poderá ter acesso;
- como será protegido;
- possibilidade de prosseguir sem anexos.

## Regra fundamental

**Não possuir provas não impede a utilização da ferramenta.**

A interface nunca deverá transmitir a ideia de que a usuária precisa produzir provas para ser ouvida.

---

# 16. Resultado

O resultado não deverá ser apresentado como sentença, diagnóstico ou certeza matemática.

A interface deverá comunicar que o Mapa identificou **indicadores de risco** com base nas respostas fornecidas.

A apresentação poderá utilizar níveis ou categorias definidos na TEC-01, mas deverá evitar transformar uma situação humana complexa em mera pontuação.

## Estrutura

**Resultado**

Breve explicação.

**Principais fatores identificados**

Apresentação resumida dos elementos relevantes.

**O que você pode fazer agora**

Ações possíveis.

**Onde buscar ajuda**

Encaminhamentos pertinentes.

---

# 17. Encaminhamento

Os encaminhamentos deverão ser contextuais.

O sistema poderá utilizar informações como:

- natureza da situação;
- nível de risco;
- existência de emergência;
- violência sexual;
- presença de criança ou adolescente;
- pessoa idosa;
- localização, quando fornecida e necessária;
- preferência da usuária.

Não apresentar uma lista indiscriminada de instituições.

A intenção é responder:

**“Diante do que você informou, quais são as opções mais adequadas agora?”**

---

# 18. Compartilhamento

O resultado poderá possuir recurso de compartilhamento quando permitido pelas regras da plataforma.

A decisão deverá ser explicitamente da usuária.

Antes do compartilhamento, informar:

- quais informações serão compartilhadas;
- com quem;
- finalidade;
- formato;
- possibilidade de cancelar.

## Regra

Nenhum compartilhamento sensível deverá ocorrer apenas porque a usuária pressionou um botão genérico de avanço.

Deverá existir ação inequívoca de confirmação.

---

# 19. Encerramento

Ao finalizar, a interface deverá informar claramente que o processo foi concluído.

Poderá apresentar:

- resumo das próximas opções;
- orientações escolhidas;
- possibilidade de acessar resultado;
- informações sobre armazenamento;
- opção de fechar;
- orientações de segurança digital quando pertinentes.

Não utilizar elementos de gamificação como:

- comemorações;
- confetes;
- pontuação;
- medalhas;
- mensagens de conquista.

O encerramento deverá ser discreto e respeitoso.

---

# 20. Saída Rápida

A **Saída Rápida** constitui componente de segurança e não apenas elemento de navegação.

Deverá possuir:

- posição consistente;
- acionamento simples;
- texto ou símbolo facilmente identificável;
- funcionamento em mobile e desktop;
- comportamento previamente definido pela TEC-01.

A Saída Rápida não deverá prometer capacidades que navegadores ou sistemas operacionais não conseguem garantir.

Em especial, a interface não deverá afirmar que pode apagar automaticamente todos os vestígios de navegação se tecnicamente isso não puder ser assegurado.

---

# 21. Navegação

A usuária deverá compreender constantemente:

- onde está;
- o que está sendo solicitado;
- como prosseguir;
- como voltar;
- como interromper;
- como sair rapidamente.

O progresso poderá ser apresentado de forma discreta.

Evitar mensagens como:

**“Você ainda precisa responder 27 perguntas.”**

Preferir indicadores neutros de avanço.

---

# 22. Estados da interface

O UX-01 deverá prever pelo menos:

- carregando;
- processamento;
- conexão lenta;
- perda de conexão;
- resposta salva;
- erro temporário;
- falha no envio;
- arquivo incompatível;
- arquivo muito grande;
- sessão expirada;
- retorno à sessão;
- conclusão.

As mensagens de erro nunca deverão culpabilizar a usuária.

---

# 23. Mobile First

O Mapa de Risco deverá ser projetado prioritariamente para dispositivos móveis.

A interface mobile deverá considerar:

- utilização com uma mão;
- botões grandes;
- áreas de toque adequadas;
- textos legíveis;
- teclado virtual;
- orientação vertical;
- telas pequenas;
- conexão móvel instável;
- interrupções;
- troca rápida de aplicativo.

A funcionalidade não poderá depender de hover.

---

# 24. Privacidade visual

Informações sensíveis não deverão aparecer desnecessariamente em:

- títulos de páginas;
- notificações;
- nomes de arquivos;
- mensagens externas;
- previews;
- elementos que possam ser vistos por terceiros.

Sempre que tecnicamente aplicável, a interface deverá reduzir exposição acidental.

---

# 25. Acessibilidade

O Mapa deverá buscar conformidade com os padrões de acessibilidade aplicáveis ao projeto.

A experiência deverá contemplar:

- navegação por teclado;
- leitores de tela;
- foco visível;
- contraste;
- ampliação;
- textos redimensionáveis;
- labels acessíveis;
- áreas de toque adequadas;
- linguagem compreensível;
- mensagens que não dependam exclusivamente de cores.

Nenhuma classificação de risco poderá ser comunicada somente por:

**verde / amarelo / vermelho.**

Deverá existir informação textual correspondente.

---

# 26. Linguagem

A linguagem utilizada em toda a experiência deverá ser:

- clara;
- respeitosa;
- não acusatória;
- não culpabilizadora;
- não infantilizada;
- não excessivamente jurídica;
- não excessivamente clínica.

Perguntas deverão evitar construções como:

**“Por que você não...”**

quando puderem sugerir julgamento da decisão da usuária.

---

# 27. Autonomia

A ferramenta orienta.

A ferramenta organiza informações.

A ferramenta identifica indicadores.

A ferramenta apresenta possibilidades.

A ferramenta não deverá retirar da usuária decisões que pertencem a ela, salvo tratamentos técnicos ou obrigações legais expressamente definidos na arquitetura normativa do projeto.

---

# 28. Matriz de especificação para implementação

Para cada tela implementada, deverá existir uma ficha contendo:

| Campo | Especificação |
|---|---|
| ID da tela | UX-MR-XXX |
| Nome | Nome funcional |
| Objetivo | Finalidade |
| Entrada | De onde a usuária chegou |
| Conteúdo | Textos e componentes |
| Ação principal | CTA |
| Ações secundárias | Outras possibilidades |
| Dados coletados | Quando houver |
| Dados armazenados | Quando houver |
| Validação | Regras |
| Condicional | Regras de ramificação |
| Segurança | Requisitos |
| Acessibilidade | Requisitos |
| Saída Rápida | Comportamento |
| Próxima tela | Destino |
| Erros | Estados previstos |

Essa matriz será a unidade básica de implementação do UX-01.

---

# 29. Macrofluxo

```text
ENTRADA
   │
   ▼
APRESENTAÇÃO
   │
   ▼
INICIAR MAPA
   │
   ▼
PERGUNTAS
   │
   ├── SIM ───────────────┐
   │                      │
   ├── NÃO                │
   │                      │
   └── PREFIRO NÃO        │
          RESPONDER       │
                          ▼
                  ANÁLISE DE FLUXO
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
     EMERGÊNCIA       FLUXOS         FLUXO
                      ESPECIAIS       REGULAR
          │               │               │
          └───────────────┴───────────────┘
                          │
                          ▼
                       ANEXOS
                     (OPCIONAL)
                          │
                          ▼
                       RESULTADO
                          │
                          ▼
                    ENCAMINHAMENTO
                          │
                          ▼
                   COMPARTILHAMENTO
                     (OPCIONAL)
                          │
                          ▼
                     ENCERRAMENTO
```

A **Saída Rápida** funciona transversalmente ao fluxo e não como uma etapa final da jornada.

---

# 30. Critério de conclusão do UX-01

O UX-01 será considerado concluído quando for possível entregar suas especificações a uma equipe de desenvolvimento e esta conseguir responder, para qualquer momento da jornada:

**O que aparece na tela?**

**O que a usuária pode fazer?**

**O que acontece quando ela faz isso?**

**Quais dados são tratados?**

**Qual é a próxima tela?**

**O que ocorre em situação excepcional?**

**Como a segurança é preservada?**

**Como uma pessoa com deficiência utiliza essa mesma função?**

---

# 31. Próxima evolução documental

Depois da consolidação do UX-01, o projeto estará preparado para avançar da experiência conceitual para a **especificação detalhada das telas e componentes de interface**, vinculando:

**REV-02 → conteúdo e linguagem**

**TEC-01 → comportamento técnico**

**UX-01 → experiência e fluxo**

Essa vinculação deverá impedir que textos, regras técnicas e interface evoluam como três sistemas independentes.

O objetivo final é que cada pergunta, alerta, decisão, resultado e encaminhamento possua rastreabilidade entre conteúdo, regra técnica e experiência da usuária.