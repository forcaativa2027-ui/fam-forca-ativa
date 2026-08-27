# FAM — JK-08
## Acessibilidade, Inclusão e Linguagem Clara

**Versão:** 1.0  
**Status:** Base institucional, funcional e técnica  
**Dependências:** JK-01 a JK-07, M04, M05, M06, M07  
**Integração:** Caderno Master / Jornada do Conhecimento

---

# 1. Finalidade

O JK-08 estabelece os requisitos de acessibilidade, inclusão e linguagem clara para a experiência digital da FAM.

A referência técnica principal para acessibilidade web será o **WCAG 2.2**, recomendação do W3C, estruturado nos princípios **Perceptível, Operável, Compreensível e Robusto**. O próprio W3C recomenda o uso da versão mais atual do WCAG ao desenvolver ou atualizar políticas de acessibilidade. [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/)

Para necessidades cognitivas e de aprendizagem, o JK-08 também incorpora orientação suplementar do W3C sobre conteúdo claro, navegação previsível, redução de carga de memória, prevenção de erros e participação de usuários no processo de design. [W3C — Making Content Usable](https://www.w3.org/TR/coga-usable/)

---

# 2. Princípio central

> **A acessibilidade não é uma camada adicionada depois da interface. Ela é requisito estrutural da experiência.**

A FAM deverá ser projetada para que pessoas com diferentes capacidades possam:

```text
PERCEBER
 ↓
COMPREENDER
 ↓
NAVEGAR
 ↓
INTERAGIR
 ↓
CONCLUIR
 ↓
ACOMPANHAR
```

sem depender de uma única modalidade sensorial, motora ou cognitiva.

---

# 3. Quatro princípios de acessibilidade

```text
PERCEPTÍVEL
    ↓
OPERÁVEL
    ↓
COMPREENSÍVEL
    ↓
ROBUSTO
```

Esses quatro princípios formam a base do WCAG 2.2. [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/)

---

# 4. Inclusão

Inclusão significa considerar diferentes necessidades desde o início.

A FAM deverá considerar, entre outras:

- pessoas cegas ou com baixa visão;
- pessoas surdas ou com perda auditiva;
- pessoas com limitações motoras;
- pessoas com dificuldades de fala;
- pessoas com limitações cognitivas ou de aprendizagem;
- pessoas com diferentes níveis de letramento digital;
- pessoas que utilizam tecnologias assistivas;
- pessoas que acessam por celular ou conexão limitada.

O objetivo não é criar uma interface paralela para cada grupo, mas uma experiência principal que seja amplamente utilizável.

---

# 5. Linguagem clara

A linguagem deverá privilegiar:

```text
PALAVRAS CONHECIDAS
+
FRASES CURTAS
+
UMA IDEIA POR VEZ
+
INSTRUÇÕES DIRETAS
+
TERMOS CONSISTENTES
```

O W3C recomenda palavras fáceis de compreender, frases curtas, blocos pequenos, linguagem inequívoca, resumos e instruções separadas para favorecer acessibilidade cognitiva. [W3C — Clear Content](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o3-clear-content/)

---

# 6. Regra de tradução institucional

A interface deve transformar linguagem interna em linguagem da tarefa.

### Evitar

> Solicitação de tratamento de dados pessoais pelo titular.

### Preferir

> **Solicitar acesso às suas informações**

### Evitar

> Usuário não autorizado.

### Preferir

> **Este conteúdo não está disponível para o seu perfil de acesso.**

### Evitar

> Operação não processada.

### Preferir

> **Não foi possível concluir esta ação.**

---

# 7. Termos institucionais

Quando um termo técnico ou jurídico for indispensável:

```text
TERMO
 ↓
EXPLICAÇÃO SIMPLES
 ↓
APROFUNDAMENTO OPCIONAL
```

Exemplo:

> **Titular dos dados**  
> É a pessoa a quem as informações se referem.

---

# 8. Consistência terminológica

O mesmo conceito deverá ter o mesmo nome na interface.

Exemplo:

```text
“Solicitação”
```

não deve alternar sem motivo para:

```text
Pedido
Requerimento
Demanda
Protocolo
```

quando todos estiverem se referindo à mesma coisa.

O vocabulário oficial deverá ser mantido no JK-02.

---

# 9. Títulos

Títulos devem comunicar o conteúdo.

### Preferir

> Como solicitar acesso às suas informações

### Evitar

> Informações

---

# 10. Botões

Botões devem indicar a ação.

### Preferir

```text
Enviar solicitação
Continuar
Voltar
Acompanhar solicitação
Ver orientações
```

### Evitar

```text
OK
Clique aqui
Avançar
Prosseguir
```

quando houver uma descrição mais específica.

---

# 11. Instruções

Cada instrução deve responder:

```text
O QUE FAZER?
COMO FAZER?
O QUE ACONTECE DEPOIS?
```

Exemplo:

> **Anexe o documento solicitado.**  
> Depois, selecione **Continuar** para revisar sua solicitação.

---

# 12. Formulários

Formulários devem:

- solicitar somente dados necessários;
- possuir rótulos claros;
- indicar campos obrigatórios;
- preservar dados já preenchidos quando possível;
- explicar formatos;
- identificar erros junto ao campo;
- permitir correção simples;
- não depender exclusivamente de cor.

---

# 13. Erros

Mensagem padrão:

```text
O QUE ACONTECEU
+
COMO CORRIGIR
```

Exemplo:

> **Não foi possível enviar a solicitação.**  
> Verifique os campos destacados e tente novamente.

Evitar:

> Erro 422.

---

# 14. Prevenção de erros

Sempre que uma ação puder causar perda relevante ou consequência difícil de reverter:

```text
EXPLICAR
 ↓
CONFIRMAR
 ↓
EXECUTAR
```

Exemplo:

> **Excluir esta informação?**  
> Esta ação não poderá ser desfeita.

```text
[Cancelar]
[Excluir]
```

---

# 15. Navegação acessível

A navegação deverá permitir:

- teclado;
- leitor de tela;
- toque;
- diferentes tamanhos de tela;
- zoom/ampliação;
- tecnologias assistivas.

A ordem de foco deverá seguir a ordem lógica do conteúdo.

---

# 16. Foco

O estado de foco deve ser visível.

Nunca depender exclusivamente de:

```text
cor
sombra
movimento
```

para indicar onde o usuário está.

---

# 17. Leitores de tela

Componentes deverão possuir:

```text
nome acessível
função
estado
valor quando aplicável
```

Imagens informativas deverão possuir texto alternativo adequado.

Imagens decorativas não devem gerar ruído desnecessário para tecnologias assistivas.

---

# 18. Contraste e apresentação

Texto e controles deverão possuir contraste suficiente e permanecer compreensíveis quando a apresentação visual for modificada.

A interface não deverá depender apenas de cor para comunicar:

```text
erro
sucesso
status
seleção
obrigatoriedade
```

---

# 19. Movimento e animação

Movimento deve ter função clara.

Evitar:

```text
animação contínua
pisca-pisca
mudanças rápidas
efeitos que distraiam
```

Quando houver movimento relevante, oferecer controle ou alternativa adequada.

---

# 20. Áudio e vídeo

Conteúdo essencial em áudio ou vídeo deverá possuir alternativa equivalente.

Conforme o caso:

```text
ÁUDIO
→ transcrição

VÍDEO
→ legendas
→ transcrição quando apropriado
→ descrição de conteúdo visual quando necessária
```

A mídia nunca deve ser a única forma de transmitir informação essencial.

---

# 21. PDF

Todo PDF institucional deverá ser tratado como documento acessível quando destinado à consulta digital.

Requisitos:

- texto selecionável quando aplicável;
- estrutura lógica;
- títulos;
- ordem de leitura;
- tabelas adequadamente estruturadas;
- idioma definido;
- metadados apropriados;
- contraste adequado;
- alternativas para imagens informativas.

Quando o PDF não puder oferecer uma experiência acessível equivalente, disponibilizar versão HTML ou alternativa apropriada.

---

# 22. Imagens

Cada imagem deverá ser classificada:

```text
DECORATIVA
INFORMATIVA
FUNCIONAL
TEXTUAL
COMPLEXA
```

Imagem funcional deve comunicar sua ação.

Imagem informativa deve comunicar seu significado.

Imagem decorativa não deve competir com o conteúdo.

---

# 23. Conteúdo complexo

Para gráficos, diagramas, fluxos ou imagens complexas:

```text
VISUAL
+
RESUMO
+
DESCRIÇÃO TEXTUAL
```

A pessoa não deve depender exclusivamente da interpretação visual.

---

# 24. Acessibilidade cognitiva

A interface deverá:

- manter padrões consistentes;
- usar navegação previsível;
- reduzir necessidade de memorizar informações;
- dividir tarefas complexas;
- evitar instruções ambíguas;
- manter contexto;
- permitir recuperar-se de erros;
- apresentar resumos;
- reduzir distrações.

Esses padrões são especialmente relevantes para pessoas com limitações cognitivas e de aprendizagem. [W3C — Cognitive Accessibility](https://www.w3.org/WAI/cognitive/)

---

# 25. Carga cognitiva

Evitar:

```text
telas excessivamente densas
muitas decisões simultâneas
instruções longas
menus profundos
siglas sem explicação
informação irrelevante
```

Preferir:

```text
uma tarefa
uma decisão
um próximo passo
```

quando a situação permitir.

---

# 26. Memória

Não exigir que a pessoa memorize informação desnecessariamente.

Exemplo ruim:

> Digite novamente o número que apareceu na tela anterior.

Preferir:

> **Número da solicitação: 2026-000123**

com opção segura de consulta ou cópia quando apropriado.

---

# 27. Ajuda contextual

Ajuda deve aparecer no ponto da necessidade.

Exemplo:

> **Qual documento devo enviar?**

> Consulte a lista de documentos aceitos.

Não obrigar a pessoa a sair do fluxo para descobrir uma instrução básica.

---

# 28. Leitura em camadas

Conteúdo longo:

```text
RESUMO
 ↓
INFORMAÇÃO PRINCIPAL
 ↓
DETALHES
 ↓
FONTE
```

Isso permite compreensão rápida sem eliminar o acesso ao conteúdo completo.

---

# 29. Linguagem jurídica

A precisão jurídica não deve ser sacrificada pela simplificação.

Estratégia:

```text
EXPLICAÇÃO SIMPLES
+
TERMO JURÍDICO QUANDO NECESSÁRIO
+
FONTE / FUNDAMENTO
```

A versão simplificada não deverá alterar o sentido da regra original.

---

# 30. Linguagem de segurança

Mensagens de segurança devem ser compreensíveis sem revelar mecanismos internos.

### Preferir

> **Este conteúdo não está disponível para o seu perfil de acesso.**

### Evitar

> RBAC_DENY: POLICY-47 / CLASSIFICATION=L3.

---

# 31. Linguagem inclusiva

Evitar pressupostos desnecessários sobre:

```text
gênero
idade
estrutura familiar
capacidade
situação econômica
conhecimento técnico
```

Utilizar linguagem neutra e respeitosa quando o contexto permitir.

---

# 32. Não revitimização

A interface deverá minimizar repetição de informações sensíveis.

Antes de solicitar novamente um dado:

```text
É NECESSÁRIO?
 ↓
PODE SER REUTILIZADO COM SEGURANÇA?
 ↓
PODE SER DISPENSADO?
```

A experiência não deve obrigar a pessoa a relatar novamente uma situação apenas porque mudou de tela.

---

# 33. Situações sensíveis

Quando o fluxo envolver informação potencialmente delicada:

```text
EXPLICAR POR QUE O DADO É NECESSÁRIO
+
SOLICITAR SOMENTE O NECESSÁRIO
+
EVITAR EXPOSIÇÃO
```

---

# 34. Inclusão digital

A interface deverá considerar:

- telas pequenas;
- conexões lentas;
- dispositivos antigos quando suportados;
- baixo letramento digital;
- uso de teclado;
- uso de leitor de tela;
- dificuldade de precisão motora;
- interrupções durante o preenchimento.

---

# 35. Persistência segura

Quando um formulário puder ser interrompido:

```text
SALVAR PROGRESSO?
```

A decisão deverá considerar:

```text
sensibilidade
necessidade
retenção
segurança
```

Dados sensíveis não devem ser mantidos indefinidamente apenas para conveniência.

---

# 36. Testes de acessibilidade

A validação deverá combinar:

```text
TESTE AUTOMATIZADO
+
INSPEÇÃO MANUAL
+
TECNOLOGIA ASSISTIVA
+
TESTE COM USUÁRIOS
```

Não considerar uma ferramenta automática como prova suficiente de acessibilidade.

---

# 37. Tecnologias assistivas

Testar, conforme o público e plataforma:

```text
leitor de tela
navegação por teclado
zoom
reconhecimento de voz
dispositivos de entrada alternativos
```

---

# 38. Testes com pessoas

Sempre que possível, incluir pessoas com diferentes necessidades no processo de pesquisa e validação.

O W3C recomenda incorporar usuários e necessidades reais no desenvolvimento e nos testes de acessibilidade cognitiva. [W3C — Content Usable](https://www.w3.org/TR/coga-usable/)

---

# 39. Critérios de aceite

### Conteúdo

- [ ] linguagem clara;
- [ ] termos consistentes;
- [ ] títulos descritivos;
- [ ] instruções separadas;
- [ ] resumos para conteúdo extenso;
- [ ] explicação de termos técnicos.

### Interface

- [ ] navegação por teclado;
- [ ] foco visível;
- [ ] leitor de tela;
- [ ] contraste adequado;
- [ ] zoom;
- [ ] mensagens de erro compreensíveis;
- [ ] não dependência de cor.

### Mídia

- [ ] PDF acessível;
- [ ] imagens classificadas;
- [ ] alternativas textuais;
- [ ] áudio com transcrição;
- [ ] vídeo com legendas;
- [ ] conteúdo visual complexo com descrição.

### UX cognitiva

- [ ] padrões consistentes;
- [ ] pouca necessidade de memória;
- [ ] tarefas divididas;
- [ ] ajuda contextual;
- [ ] recuperação de erros;
- [ ] linguagem inequívoca.

### Governança

- [ ] acessibilidade incluída no processo de revisão;
- [ ] testes registrados;
- [ ] problemas classificados;
- [ ] correções acompanhadas.

---

# 40. Matriz de responsabilidade

| Atividade | UX | Conteúdo | Técnico | Acessibilidade | Jurídico | Gestão |
|---|---|---|---|---|---|---|
| Padrões de acessibilidade | C | I | C | R | I | A |
| Linguagem clara | R | R | I | C | C | A |
| Teste técnico | C | I | R | C | I | A |
| Teste com tecnologia assistiva | C | I | R | R | I | A |
| Revisão jurídica de linguagem | C | R | I | C | A/R | I |
| Conteúdo multimídia | C | R | R | C | I | A |
| Correção de barreiras | C | C | R | R | I | A |

---

# 41. Indicadores

```text
accessibility_defect_rate
keyboard_task_success
screen_reader_task_success
form_error_rate
content_comprehension
task_completion
help_request_rate
accessibility_feedback
time_to_recovery
```

O indicador mais importante não é apenas conformidade técnica, mas capacidade real de concluir tarefas.

---

# 42. Biblioteca de linguagem clara

### Início

> **O que você precisa saber?**

### Ação

> **O que você quer fazer?**

### Ajuda

> **Precisa de ajuda?**

### Documento

> **Envie o documento solicitado.**

### Erro

> **Não foi possível concluir esta ação.**

### Correção

> **Verifique as informações destacadas e tente novamente.**

### Segurança

> **Este conteúdo não está disponível para o seu perfil de acesso.**

### Sucesso

> **Tudo certo. Sua solicitação foi registrada.**

### Próximo passo

> **Agora você pode acompanhar sua solicitação.**

### Sessão

> **Sua sessão terminou por segurança. Entre novamente para continuar.**

---

# 43. Regra Master de linguagem

```text
SIMPLES SEM SER IMPRECISA.
DIRETA SEM SER RUDE.
INCLUSIVA SEM SER ARTIFICIAL.
TÉCNICA QUANDO NECESSÁRIO.
JURIDICAMENTE PRECISA QUANDO APLICÁVEL.
```

---

# 44. Regra Master de acessibilidade

```text
SE A PESSOA NÃO CONSEGUE PERCEBER,
NÃO É ACESSÍVEL.

SE NÃO CONSEGUE OPERAR,
NÃO É ACESSÍVEL.

SE NÃO CONSEGUE COMPREENDER,
NÃO É ACESSÍVEL.

SE A TECNOLOGIA NÃO CONSEGUE INTERPRETAR,
NÃO É ACESSÍVEL.
```

---

# 45. Integração no Caderno Master

```text
JK-01 — JORNADA
        ↓
JK-02 — TAXONOMIA
        ↓
JK-03 — MODELO DE CONTEÚDO
        ↓
JK-04 — BUSCA
        ↓
JK-05 — GOVERNANÇA
        ↓
JK-06 — TRILHAS
        ↓
JK-07 — UX
        ↓
JK-08 — ACESSIBILIDADE + INCLUSÃO + LINGUAGEM CLARA
        ↓
M04 / M05 / M06
        ↓
M07 — AUTORIZAÇÃO
        ↓
INTERFACE FAM
```

---

# 46. Próximo módulo

```text
JK-09 — DESIGN SYSTEM E PADRÕES DE INTERFACE
```

O JK-09 deverá transformar os princípios de JK-07 e JK-08 em componentes, estados, padrões, tokens, templates e regras reutilizáveis para implementação.
