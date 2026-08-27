# BACKLOG-02 — Módulo 06
## Direitos da Titular

**Projeto:** FAM  
**Versão:** 1.0  
**Status:** Especificação funcional e de interface

## 1. Objetivo

Transformar os direitos da titular em funcionalidades efetivamente acessíveis, compreensíveis, seguras e auditáveis.

A experiência deverá permitir que a titular exerça seus direitos sem precisar conhecer termos técnicos ou a arquitetura interna da FAM.

## BLG-092 — Princípios

A jornada de direitos deverá observar:

- linguagem clara;
- acessibilidade;
- autenticação proporcional;
- minimização;
- segurança;
- rastreabilidade;
- transparência;
- não criação de barreiras desnecessárias.

## BLG-093 — Central de direitos

A área deverá apresentar, em linguagem simples:

```text
MEUS DADOS E DIREITOS

[ Ver meus dados ]
[ Corrigir dados ]
[ Saber como meus dados são usados ]
[ Saber com quem foram compartilhados ]
[ Solicitar eliminação, quando aplicável ]
[ Manifestar oposição, quando aplicável ]
[ Consultar solicitações anteriores ]
```

A disponibilidade concreta de cada opção dependerá do direito e da hipótese jurídica aplicável.

## BLG-094 — Confirmação de tratamento

Interface:

> **Você quer saber se a FAM possui ou utiliza dados pessoais relacionados a você?**

Botão:

**Solicitar confirmação**

O sistema deverá gerar protocolo.

## BLG-095 — Acesso

Interface:

> **Você pode solicitar acesso às informações pessoais que a FAM mantém sobre você, observadas as regras de segurança e as limitações previstas em lei.**

O sistema deverá:
- autenticar a solicitante de forma proporcional;
- localizar os dados pertinentes;
- aplicar restrições legais;
- registrar a resposta;
- preservar auditoria.

## BLG-096 — Correção

> **Encontrou alguma informação incorreta ou desatualizada? Você pode solicitar a correção.**

Campos:
- dado a corrigir;
- informação correta;
- justificativa, quando necessária;
- documento comprobatório, somente se necessário.

Evitar exigir documentos quando não forem necessários.

## BLG-097 — Eliminação

A interface não deverá prometer eliminação irrestrita.

> **Você pode solicitar a eliminação de dados pessoais quando esse direito for aplicável. Alguns dados podem precisar ser mantidos por obrigação legal ou outra hipótese prevista em lei.**

Fluxo:

```text
SOLICITAÇÃO
 ↓
ANÁLISE
 ↓
APLICÁVEL?
 ├── SIM → EXCLUSÃO
 └── NÃO → JUSTIFICATIVA
```

## BLG-098 — Oposição

Quando juridicamente aplicável:

> **Você pode solicitar que determinado tratamento deixe de ser realizado quando houver fundamento para oposição.**

A solicitação deverá ser analisada conforme a finalidade e a base jurídica correspondente.

## BLG-099 — Portabilidade

Quando aplicável e regulamentada para a situação concreta:

> **Você pode solicitar a portabilidade dos seus dados nos casos previstos em lei e regulamentação.**

A arquitetura deverá prever formato estruturado e interoperável quando a obrigação for aplicável.

## BLG-100 — Revisão de decisões automatizadas

Quando houver decisão tomada unicamente com base em tratamento automatizado que produza efeitos relevantes, a plataforma deverá oferecer mecanismo adequado de informação e solicitação de revisão, conforme o regime jurídico aplicável.

Interface:

> **Quer saber como uma decisão automatizada relacionada ao seu atendimento foi tomada?**

Botão:

**Solicitar revisão/informações**

## BLG-101 — Protocolo

Toda solicitação deverá gerar identificador único:

```text
REQ-2026-000001
```

Registrar:
- protocolo;
- tipo de solicitação;
- data/hora;
- titular ou representante autenticado;
- status;
- responsável;
- prazo aplicável;
- resposta;
- fundamento da decisão;
- versão da política.

## BLG-102 — Estados da solicitação

```text
RECEBIDA
 ↓
EM ANÁLISE
 ↓
AGUARDANDO INFORMAÇÃO
 ↓
DECIDIDA
 ↓
RESPONDIDA
 ↓
ENCERRADA
```

Estados adicionais poderão ser utilizados conforme o processo.

## BLG-103 — Autenticação

A autenticação deverá ser proporcional ao risco.

```text
RISCO BAIXO
 → autenticação simples

RISCO ELEVADO
 → autenticação reforçada
```

Não solicitar dados excessivos apenas para abrir uma solicitação.

## BLG-104 — Representante

A arquitetura deverá prever atuação por representante quando juridicamente admitida.

Deverá validar:
- identidade;
- vínculo/representação;
- escopo da representação;
- validade.

## BLG-105 — Dados de terceiros

Uma solicitação da titular não autoriza acesso irrestrito a dados de outras pessoas.

Antes da resposta:

```text
DADOS DA TITULAR
+
DADOS DE TERCEIROS
       ↓
SEPARAÇÃO / RESTRIÇÃO
```

## BLG-106 — Resposta

A resposta deverá ser compreensível.

Evitar:

> “Solicitação indeferida por ausência de fundamento legal.”

Preferir:

> **Não podemos atender esta parte da solicitação porque determinadas informações precisam ser protegidas por uma regra legal ou porque sua manutenção ainda é necessária para uma finalidade autorizada.**

Quando apropriado, explicar o fundamento de maneira mais específica.

## BLG-107 — Prazo

O sistema deverá calcular e controlar os prazos aplicáveis a cada tipo de solicitação conforme legislação, regulamentação e política interna vigentes.

Não codificar um único prazo universal.

## BLG-108 — Escalonamento

Se a solicitação exigir análise especializada:

```text
ATENDIMENTO
 ↓
PRIVACIDADE / DPO
 ↓
JURÍDICO
 ↓
DECISÃO
```

A matriz RACI deverá definir responsabilidades.

## BLG-109 — Segurança da resposta

Respostas contendo dados pessoais deverão ser entregues em canal seguro.

Não enviar dados sensíveis em texto aberto para endereço não validado.

## BLG-110 — Auditoria

Registrar:

```text
RightsRequest
 ├── request_id
 ├── subject_id
 ├── request_type
 ├── received_at
 ├── authentication_level
 ├── assigned_to
 ├── decision
 ├── decision_basis
 ├── responded_at
 └── policy_version
```

O log não deverá duplicar o conteúdo integral dos dados pessoais.

## BLG-111 — Interface de acompanhamento

> **Sua solicitação**
>
> **Protocolo:** REQ-2026-000001  
> **Status:** Em análise  
> **Recebida em:** [data]

Botão:

**Ver detalhes**

## BLG-112 — Encerramento

> **Sua solicitação foi concluída.**

Quando houver impossibilidade total ou parcial:

> **Sua solicitação foi analisada. Algumas informações não puderam ser disponibilizadas ou alteradas, e explicamos o motivo na resposta.**

## BLG-113 — Critérios de aceite

- [ ] central de direitos disponível;
- [ ] linguagem clara;
- [ ] confirmação de tratamento;
- [ ] acesso;
- [ ] correção;
- [ ] eliminação quando aplicável;
- [ ] oposição quando aplicável;
- [ ] portabilidade quando aplicável;
- [ ] revisão de decisões automatizadas quando aplicável;
- [ ] protocolo único;
- [ ] acompanhamento;
- [ ] autenticação proporcional;
- [ ] representação;
- [ ] proteção de dados de terceiros;
- [ ] resposta fundamentada;
- [ ] controle de prazo;
- [ ] escalonamento;
- [ ] entrega segura;
- [ ] auditoria.

## BLG-114 — Testes

### Solicitações
- T69 — confirmação de tratamento
- T70 — acesso
- T71 — correção
- T72 — eliminação aplicável
- T73 — eliminação não aplicável
- T74 — oposição
- T75 — portabilidade aplicável
- T76 — revisão de decisão automatizada

### Segurança
- T77 — autenticação insuficiente
- T78 — acesso a dados de terceiro
- T79 — representante não validado
- T80 — resposta em canal inseguro

### Processo
- T81 — geração de protocolo
- T82 — acompanhamento
- T83 — controle de prazo
- T84 — escalonamento jurídico
- T85 — auditoria sem duplicação de conteúdo sensível

## 2. Textos finais de interface

### Entrada

> **Seus dados e seus direitos**
>
> Você pode consultar informações sobre como seus dados são tratados e exercer seus direitos de acordo com as regras aplicáveis.

### Correção

> **Corrigir uma informação**
>
> Informe o que está incorreto. Pediremos somente as informações necessárias para analisar sua solicitação.

### Eliminação

> **Solicitar eliminação**
>
> Você pode solicitar a eliminação de dados quando esse direito for aplicável. Algumas informações podem precisar ser mantidas por obrigação legal ou outra hipótese prevista em lei.

### Segurança

> **Para proteger suas informações, precisamos confirmar sua identidade antes de concluir esta solicitação.**

### Conclusão

> **Solicitação registrada**
>
> Seu protocolo é **[PROTOCOLO]**. Você poderá acompanhar o andamento por esta área.

## 3. Regra institucional

> **Exercer um direito não deve exigir da titular mais informação do que a necessária para verificar sua identidade, compreender a solicitação, analisá-la e entregar uma resposta segura.**
