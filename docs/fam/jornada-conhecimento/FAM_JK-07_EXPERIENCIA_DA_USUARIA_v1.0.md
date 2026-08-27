# FAM — JK-07
## Experiência da Usuária — UX Institucional + Textos Finais de Interface

**Versão:** 1.0  
**Status:** Base institucional, funcional e técnica  
**Dependências:** JK-01 a JK-06, M04, M05, M06, M07  
**Integração:** Caderno Master

---

# 1. Finalidade

O JK-07 consolida os princípios de experiência da usuária para toda a FAM e transforma a arquitetura da Jornada do Conhecimento em uma experiência coerente, compreensível, segura e acessível.

A experiência deve permitir:

```text
ENTRAR
 ↓
ENTENDER ONDE ESTÁ
 ↓
ENCONTRAR O QUE PRECISA
 ↓
COMPREENDER
 ↓
ESCOLHER
 ↓
AGIR
 ↓
ACOMPANHAR
 ↓
SAIR COM SEGURANÇA
```

A UX não substitui regras institucionais, jurídicas ou de segurança.

---

# 2. Princípio central

> **A FAM deve ser compreensível para quem precisa utilizá-la, sem exigir conhecimento prévio de sua estrutura interna.**

A interface deve falar a linguagem da tarefa da usuária, e não a linguagem da organização.

---

# 3. Princípios de UX

## 3.1 Clareza

Cada tela deve deixar evidente:

```text
ONDE ESTOU?
O QUE POSSO FAZER?
O QUE ACONTECE DEPOIS?
```

## 3.2 Previsibilidade

A mesma ação deve produzir comportamento consistente.

## 3.3 Autonomia

A usuária deve conseguir avançar, voltar, cancelar ou procurar informação sem depender de conhecimento técnico.

## 3.4 Divulgação progressiva

Mostrar primeiro o necessário para a tarefa e permitir aprofundamento quando desejado.

## 3.5 Segurança compreensível

Controles de segurança devem ser claros sem revelar informações internas desnecessárias.

## 3.6 Acessibilidade

A experiência deve ser utilizável por diferentes capacidades, dispositivos e formas de interação.

## 3.7 Não revitimização

A interface não deve obrigar a usuária a repetir informações sensíveis desnecessariamente.

## 3.8 Neutralidade

A interface deve informar e orientar sem pressionar a usuária a tomar uma decisão que pertença a ela.

---

# 4. Arquitetura da experiência

```text
HOME
 │
 ├── BUSCAR
 │     ↓
 │   RESULTADOS
 │     ↓
 │   CONTEÚDO
 │     ↓
 │   PRÓXIMO PASSO
 │
 ├── TEMAS
 │     ↓
 │   CONTEÚDOS
 │
 ├── TRILHAS
 │     ↓
 │   ETAPAS
 │     ↓
 │   AÇÃO
 │
 └── SERVIÇOS
       ↓
     FLUXO
       ↓
     RESULTADO
```

---

# 5. Modelo mental da usuária

A interface deve priorizar perguntas reais:

```text
“Preciso entender isso.”
“Quero saber se isso se aplica a mim.”
“O que eu faço agora?”
“Já fiz isso. E agora?”
“Como acompanho?”
“Preciso de ajuda.”
```

Essas perguntas devem orientar arquitetura, conteúdo e microcopy.

---

# 6. Hierarquia da informação

A ordem preferencial de apresentação:

```text
1. O que é
2. Por que isso importa
3. O que você pode fazer
4. Como fazer
5. O que acontece depois
6. Informações adicionais
7. Fontes
```

Informações jurídicas ou técnicas detalhadas podem ser disponibilizadas em camada de aprofundamento.

---

# 7. Página inicial

A página inicial deverá priorizar tarefas.

Estrutura proposta:

```text
[LOGO / IDENTIDADE]

O que você precisa saber?

[ BUSCAR ]

Você pode:
[Entender seus direitos]
[Encontrar um serviço]
[Acompanhar uma solicitação]
[Consultar orientações]

Temas
[Direitos] [Atendimento] [Proteção]
[Privacidade] [Serviços]

Precisa de ajuda?
```

---

# 8. Busca

Texto principal:

> **O que você precisa saber?**

Placeholder:

> **Digite uma dúvida, assunto ou ação**

A interface deve aceitar linguagem natural.

---

# 9. Resultados da busca

Cabeçalho:

> **Encontramos estas informações para você.**

Cada resultado deve priorizar:

```text
TÍTULO
RESUMO
TIPO
ATUALIZAÇÃO
PRÓXIMO PASSO
```

Não mostrar metadados técnicos desnecessários.

---

# 10. Resultado sem correspondência

> **Não encontramos um conteúdo correspondente.**

Complemento:

> Tente usar outras palavras ou escolha um dos temas abaixo.

Ações:

```text
[Ver temas]
[Refazer busca]
[Preciso de ajuda]
```

---

# 11. Resultado ambíguo

> **Talvez você esteja procurando uma destas opções.**

Evitar apresentar uma interpretação como certeza quando houver ambiguidade.

---

# 12. Conteúdo

Estrutura:

```text
TÍTULO

RESUMO

O QUE ISSO SIGNIFICA

O QUE VOCÊ PODE FAZER

PRÓXIMO PASSO

SAIBA MAIS

FONTES
```

A informação essencial deve aparecer antes dos detalhes.

---

# 13. Conteúdo protegido

Quando a pessoa não tiver autorização:

> **Este conteúdo não está disponível para o seu perfil de acesso.**

Não revelar:

- motivo interno da negativa;
- classificação interna;
- existência de informação protegida quando isso constituir informação indevida;
- identidade de terceiros;
- detalhes de políticas internas.

Quando houver alternativa segura:

> **Você pode consultar estas informações disponíveis para você.**

---

# 14. Ações

Botões devem representar ações concretas.

Preferir:

```text
Iniciar solicitação
Continuar
Acompanhar solicitação
Ver orientações
Voltar
Sair
```

Evitar:

```text
Clique aqui
OK
Prosseguir
Confirmar
```

quando o significado concreto puder ser expresso.

---

# 15. Confirmação

Antes de uma ação relevante:

```text
O QUE VAI ACONTECER?
O QUE SERÁ ENVIADO?
QUEM RECEBERÁ?
```

Quando aplicável:

> **Revise as informações antes de enviar.**

Botões:

```text
[Voltar e revisar]
[Enviar solicitação]
```

---

# 16. Sucesso

> **Solicitação enviada.**

Complemento:

> Sua solicitação foi registrada com sucesso.

Quando houver identificador apropriado:

> **Número da solicitação: {ID}**

Próximas ações:

```text
[Acompanhar solicitação]
[Voltar para o início]
```

---

# 17. Erros

Erros devem explicar:

```text
O QUE ACONTECEU
O QUE FAZER
```

Exemplo:

> **Não foi possível concluir esta ação.**

> Verifique as informações e tente novamente.

Botão:

```text
[Tentar novamente]
```

Não apresentar mensagens técnicas como:

```text
500 Internal Server Error
NullPointerException
Unauthorized
```

na interface da usuária.

---

# 18. Erros de validação

Mensagem junto ao campo:

> **Informe este dado para continuar.**

Quando houver formato específico:

> **Use o formato indicado.**

Evitar culpar a usuária:

```text
Entrada inválida.
Erro do usuário.
Você preencheu incorretamente.
```

---

# 19. Carregamento

> **Estamos carregando as informações…**

Para operações demoradas:

> **Isso pode levar alguns instantes.**

A interface deve evitar deixar a usuária sem indicação de estado.

---

# 20. Indisponibilidade

> **Este serviço está temporariamente indisponível.**

Complemento:

> Tente novamente mais tarde ou consulte as orientações disponíveis.

---

# 21. Jornada de conhecimento

Indicador:

> **Etapa {n} de {total}**

Ações:

```text
[Continuar]
[Voltar]
[Sair da trilha]
```

Ao sair:

> **Você pode sair agora e retornar quando quiser.**

---

# 22. Próximo passo

Toda tela orientativa deverá responder:

> **O que posso fazer agora?**

Exemplos:

> **Próximo passo: iniciar sua solicitação.**

> **Próximo passo: consultar o procedimento.**

> **Próximo passo: acompanhar seu encaminhamento.**

---

# 23. Retomada

Se o progresso for salvo:

> **Você pode continuar de onde parou.**

Botões:

```text
[Continuar]
[Começar novamente]
```

A interface deverá explicar quando houver armazenamento de progresso.

---

# 24. Cancelamento

Antes de perder informações não enviadas:

> **Sair sem salvar?**

> As informações preenchidas nesta etapa serão perdidas.

Ações:

```text
[Continuar preenchendo]
[Sair sem salvar]
```

---

# 25. Privacidade

Mensagens de privacidade devem ser curtas e objetivas.

Exemplo:

> **Usamos suas informações apenas quando necessário para realizar esta ação.**

Quando houver tratamento específico:

> **Você pode consultar as informações sobre como seus dados são utilizados.**

A interface não deve transformar a política de privacidade em texto incompreensível.

---

# 26. Consentimento

Quando consentimento for juridicamente adequado e necessário:

```text
FINALIDADE
O QUE SERÁ UTILIZADO
PARA QUE
COMO RETIRAR
```

O consentimento não deve ser presumido apenas pela utilização da interface.

---

# 27. Dados sensíveis

A UX deverá minimizar exposição.

Evitar:

```text
repetição de dados
campos desnecessários
pré-preenchimento sem necessidade
exibição integral de informações sensíveis
```

Quando necessário, usar mascaramento ou visualização controlada.

---

# 28. Acesso e sessão

A interface deverá comunicar:

> **Sua sessão está protegida.**

Antes de expiração:

> **Sua sessão está prestes a terminar. Deseja continuar?**

Depois:

> **Sua sessão terminou por segurança. Entre novamente para continuar.**

---

# 29. Navegação

A usuária deverá saber:

```text
onde está
de onde veio
para onde pode ir
```

Elementos possíveis:

```text
breadcrumb
menu
voltar
indicador de etapa
título de seção
```

A navegação não deve depender apenas de um botão “voltar” do navegador.

---

# 30. Responsividade

A experiência deve preservar:

```text
hierarquia
legibilidade
ações
segurança
acessibilidade
```

em:

```text
desktop
tablet
celular
```

Não reduzir simplesmente uma interface desktop para uma tela pequena.

---

# 31. Acessibilidade

Requisitos mínimos:

- navegação por teclado;
- foco visível;
- ordem lógica;
- textos alternativos;
- contraste adequado;
- campos identificados;
- mensagens de erro associadas aos campos;
- compatibilidade com leitores de tela;
- não depender exclusivamente de cor;
- conteúdo audiovisual com alternativas adequadas.

---

# 32. Mídia

Para:

```text
PDF
IMAGEM
ÁUDIO
VÍDEO
```

a interface deverá informar claramente:

```text
tipo
título
finalidade
tamanho/duração quando útil
```

Informação essencial não deve existir exclusivamente em uma mídia inacessível.

---

# 33. Confiança

A interface deverá deixar claro:

```text
quem fornece a informação
quando foi atualizada
qual é a fonte quando aplicável
o que é orientação
o que é procedimento
o que é fonte oficial
```

Evitar sinais artificiais de autoridade.

---

# 34. Encaminhamento

Quando a FAM não puder resolver diretamente uma necessidade:

> **Talvez seja necessário buscar atendimento junto ao órgão ou serviço responsável.**

Quando houver encaminhamento institucional:

```text
POR QUE
PARA QUEM
O QUE LEVAR
O QUE ACONTECE DEPOIS
COMO ACOMPANHAR
```

Não encaminhar dados além do necessário.

---

# 35. Situações de urgência

Quando houver fluxo institucional para situação urgente, a interface deverá destacar a orientação aplicável sem criar falsa promessa de atendimento.

Exemplo:

> **Se houver risco imediato, procure o serviço de emergência ou a autoridade competente conforme a situação.**

O texto definitivo deverá ser validado pelo fluxo institucional e jurídico correspondente.

---

# 36. Ajuda

A ajuda deve ser contextual.

> **Precisa de ajuda?**

Opções:

```text
Ver orientação
Voltar
Falar com atendimento
Consultar perguntas frequentes
```

Evitar obrigar a usuária a reiniciar todo o processo.

---

# 37. Busca + UX

O ciclo ideal:

```text
DÚVIDA
 ↓
BUSCA
 ↓
RESULTADO
 ↓
CONTEÚDO
 ↓
COMPREENSÃO
 ↓
AÇÃO
 ↓
CONFIRMAÇÃO
```

Se a busca falhar, a usuária deve receber caminhos alternativos.

---

# 38. Trilhas + UX

```text
OBJETIVO
 ↓
ETAPA
 ↓
CONTEÚDO
 ↓
AÇÃO
 ↓
RESULTADO
```

A trilha deve sempre comunicar progresso e próximo passo.

---

# 39. M07 + UX

O Policy Engine deve permanecer invisível como mecanismo técnico, mas compreensível em seu efeito.

```text
M07
 ↓
ALLOW
 → conteúdo normal

DENY
 → mensagem segura

CONDITIONAL
 → fluxo apropriado
```

A UX nunca deve revelar regras internas de autorização.

---

# 40. RACI de experiência

| Atividade | UX | Conteúdo | Técnico | Jurídico | Segurança | Gestão |
|---|---|---|---|---|---|---|
| Arquitetura UX | R | C | C | C | C | A |
| Microcopy | R | C | I | C | I | A |
| Acessibilidade | R | C | C | I | C | A |
| Fluxos | R | C | C | C | C | A |
| Mensagens de erro | R | C | C | I | C | A |
| Conteúdo jurídico | C | R | I | A/R | C | I |
| Segurança da interface | C | I | R | C | A/R | I |
| Teste com usuárias | R | C | C | I | C | A |

---

# 41. Métricas de UX

Indicadores:

```text
task_success_rate
time_on_task
drop_off_rate
search_success_rate
zero_result_rate
error_rate
completion_rate
help_request_rate
accessibility_issue_rate
user_satisfaction
```

Métricas devem ser interpretadas em conjunto.

Tempo menor nem sempre significa experiência melhor.

---

# 42. Pesquisa com usuárias

Testes devem avaliar:

```text
compreensão
encontrabilidade
clareza
confiança
capacidade de completar tarefa
acessibilidade
percepção de segurança
```

Métodos possíveis:

```text
teste de usabilidade
entrevista
card sorting
tree testing
teste de compreensão
análise de tarefas
```

Resultados devem alimentar JK-02, JK-04, JK-05 e JK-06 quando necessário.

---

# 43. Design system

A FAM deverá manter componentes consistentes para:

```text
botões
campos
mensagens
alertas
cards
menus
breadcrumbs
indicadores de etapa
modais
tabelas
resultados de busca
```

Cada componente deverá possuir estados:

```text
default
hover
focus
active
disabled
loading
error
success
```

---

# 44. Conteúdo e componente

O componente não deve impor uma linguagem técnica.

Exemplo:

```text
COMPONENTE:
Alert

CONTEÚDO:
“Não foi possível concluir sua solicitação.
Tente novamente.”
```

A linguagem deve ser definida pelo conteúdo e pela necessidade da usuária.

---

# 45. Segurança de interface

A interface deverá evitar:

- exposição de dados de terceiros;
- mensagens que permitam enumeração;
- URLs com dados sensíveis desnecessários;
- cópia automática de informações sensíveis;
- armazenamento local desnecessário;
- screenshots ou exportações sem controles apropriados;
- atalhos que contornem autorização.

---

# 46. Textos finais — biblioteca rápida

| Situação | Texto |
|---|---|
| Busca | O que você precisa saber? |
| Resultado | Encontramos estas informações para você. |
| Sem resultado | Não encontramos um conteúdo correspondente. |
| Ambígua | Talvez você esteja procurando uma destas opções. |
| Carregando | Estamos carregando as informações… |
| Erro | Não foi possível concluir esta ação. |
| Sucesso | Solicitação enviada. |
| Sessão | Sua sessão está protegida. |
| Expiração | Sua sessão está prestes a terminar. |
| Restrição | Este conteúdo não está disponível para o seu perfil de acesso. |
| Trilha | Etapa {n} de {total}. |
| Próximo | Continuar |
| Voltar | Voltar |
| Sair | Sair |
| Ajuda | Precisa de ajuda? |

---

# 47. Critérios de aceite

- [ ] princípios de UX definidos;
- [ ] arquitetura de experiência definida;
- [ ] home orientada a tarefas;
- [ ] busca integrada;
- [ ] conteúdo estruturado;
- [ ] mensagens de erro;
- [ ] mensagens de sucesso;
- [ ] privacidade;
- [ ] sessão;
- [ ] trilhas;
- [ ] encaminhamento;
- [ ] urgência;
- [ ] acessibilidade;
- [ ] mídia;
- [ ] segurança;
- [ ] RACI;
- [ ] métricas;
- [ ] testes com usuárias;
- [ ] design system;
- [ ] biblioteca de microcopy.

---

# 48. Regra Master

```text
A FAM NÃO DEVE EXIGIR QUE A USUÁRIA
ENTENDA O SISTEMA PARA CONSEGUIR USÁ-LO.

A EXPERIÊNCIA DEVE SER:

CLARA
SEGURA
ACESSÍVEL
PREVISÍVEL
AUTÔNOMA
RASTREÁVEL
HUMANA
```

E:

```text
UX NÃO AUTORIZA.
UX NÃO JULGA.
UX NÃO SUBSTITUI O SERVIÇO.

UX ORGANIZA A EXPERIÊNCIA
PARA QUE A PESSOA POSSA COMPREENDER,
ESCOLHER E AGIR COM SEGURANÇA.
```

---

# 49. Integração no Caderno Master

```text
JK-01 — JORNADA
        ↓
JK-02 — TAXONOMIA
        ↓
JK-03 — MODELO DE CONTEÚDO
        ↓
JK-04 — BUSCA E DESCOBERTA
        ↓
JK-05 — GOVERNANÇA
        ↓
JK-06 — TRILHAS
        ↓
JK-07 — EXPERIÊNCIA DA USUÁRIA
        ↓
M04 / M05 / M06
        ↓
M07 — AUTORIZAÇÃO
        ↓
INTERFACE FAM
```

**Próximo módulo recomendado: JK-08 — Acessibilidade, Inclusão e Linguagem Clara.**
