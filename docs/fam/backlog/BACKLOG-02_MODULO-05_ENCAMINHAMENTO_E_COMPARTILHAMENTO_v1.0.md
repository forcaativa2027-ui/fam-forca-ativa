# BACKLOG-02 — Módulo 05
## Encaminhamento e Compartilhamento

**Projeto:** FAM  
**Versão:** 1.0  
**Status:** Especificação funcional

## 1. Princípio central

> **Orientar não significa compartilhar. Encaminhar não significa necessariamente transmitir dados.**

A arquitetura deve priorizar orientação e encaminhamento sem dados antes de qualquer compartilhamento.

## BLG-070 — Tipos de encaminhamento

### A — Orientação
A FAM informa o caminho, sem transmitir dados.

### B — Encaminhamento sem dados
A usuária recebe as informações necessárias para procurar diretamente o serviço.

### C — Encaminhamento com compartilhamento
Somente quando houver fundamento, necessidade e autorização/base aplicável.

```text
CASO
 ↓
FINALIDADE
 ↓
BASE / AUTORIZAÇÃO
 ↓
DESTINATÁRIO
 ↓
DADOS MÍNIMOS
 ↓
TRANSMISSÃO
 ↓
AUDITORIA
```

## BLG-071 — Matriz de destinatários

O sistema deverá possuir Catálogo de Destinatários Institucionais.

| Destinatário | Tipo de apoio | Dados possíveis | Condição |
|---|---|---|---|
| CRAS | assistência/proteção social | mínimo necessário | conforme finalidade |
| Ministério Público | atuação institucional | mínimo necessário | fundamento aplicável |
| Delegacia/autoridade policial | segurança/investigação | mínimo necessário | fundamento aplicável |
| Serviço de saúde autorizado | atendimento em saúde | mínimo necessário | profissional/serviço legitimado |
| Outros | conforme catálogo | mínimo necessário | aprovação específica |

O catálogo definitivo deverá ser validado institucional e juridicamente.

## BLG-072 — Destinatário não é usuário interno

Os domínios internos e externos devem permanecer separados.

Cargo, função administrativa ou posição de direção não concede acesso automático a dados sensíveis.

## BLG-073 — Finalidade obrigatória

Todo compartilhamento deverá possuir código de finalidade.

Exemplos:

```text
PROTEÇÃO
ASSISTÊNCIA
ATENDIMENTO_EM_SAÚDE
ENCAMINHAMENTO_INSTITUCIONAL
OBRIGAÇÃO_LEGAL
```

Não utilizar “outros” como forma de contornar a governança.

## BLG-074 — Dados mínimos

Nunca enviar automaticamente o caso completo.

```text
CASO COMPLETO
 ↓
MINIMIZAÇÃO
 ↓
CONJUNTO MÍNIMO NECESSÁRIO
 ↓
DESTINATÁRIO
```

## BLG-075 — Tela de revisão

> **Revise as informações antes do encaminhamento**

**Destinatário:** [órgão/serviço]  
**Finalidade:** [finalidade]

**Informações que serão compartilhadas:**
- [item 1]
- [item 2]
- [item 3]

> **Somente as informações necessárias para esta finalidade serão encaminhadas.**

## BLG-076 — Compartilhamento sem consentimento

Quando o tratamento não depender de consentimento, a interface não deverá apresentar um falso pedido de autorização.

A base jurídica aplicável deverá ser definida pelo Policy Engine e pelas regras jurídicas aprovadas.

## BLG-077 — Compartilhamento dependente de consentimento

Quando consentimento for a base aplicável:

> **Você concorda que estas informações sejam encaminhadas para [destinatário] para a finalidade [finalidade]?**

Registrar finalidade, destinatário, versão da informação apresentada, data/hora e estado do consentimento.

## BLG-078 — Compartilhamento obrigatório

Hipóteses legais que exijam ou autorizem tratamento independentemente de consentimento deverão ser implementadas como regras jurídicas aprovadas.

```text
REGRA JURÍDICA
 ↓
POLICY ENGINE
 ↓
PERMITIDO / OBRIGATÓRIO / BLOQUEADO
```

## BLG-079 — Dupla confirmação

Compartilhamentos classificados como alto risco poderão exigir segunda autorização operacional conforme matriz RACI e classificação de risco.

## BLG-080 — Transmissão

Requisitos:
- criptografia em trânsito;
- autenticação do destinatário;
- controle de validade;
- integridade;
- registro;
- confirmação de entrega quando disponível.

Não utilizar canais pessoais ou informais para dados sensíveis.

## BLG-081 — Falha

> **Não foi possível concluir o encaminhamento. Nenhuma nova tentativa será realizada automaticamente sem validação.**

## BLG-082 — Estados

```text
SOLICITADO
 ↓
AUTORIZADO
 ↓
TRANSMITIDO
 ↓
CONFIRMADO
```

“Transmitido” não significa necessariamente “recebido e processado pelo órgão”.

## BLG-083 — Auditoria

```text
ShareEvent
 ├── event_id
 ├── case_id
 ├── recipient_id
 ├── purpose_code
 ├── legal_basis_reference
 ├── data_scope
 ├── actor_id
 ├── authorized_by
 ├── requested_at
 ├── transmitted_at
 ├── delivery_status
 └── policy_version
```

Não replicar o conteúdo integral no log.

## BLG-084 — Cancelamento

Antes da transmissão, o compartilhamento poderá ser cancelado conforme as regras aplicáveis. Depois da transmissão, o evento não poderá ser apagado apenas para eliminar o histórico.

## BLG-085 — Histórico

Quando apropriado, a usuária deverá poder visualizar que houve encaminhamento, destinatário, data, finalidade e categorias de informação utilizadas, sem exposição indevida de terceiros.

## BLG-086 — Encaminhamento sem compartilhamento

> **Você pode procurar diretamente este serviço. A FAM não enviará seus dados.**

## BLG-087 — Bloqueios

O sistema deverá bloquear:
- destinatário inexistente;
- finalidade ausente;
- autorização insuficiente;
- dado fora do escopo;
- política expirada sem revalidação.

## BLG-088 — Interface de confirmação

> **Antes de continuar**
>
> Estas informações serão encaminhadas somente para a finalidade indicada e dentro do escopo autorizado.
>
> **Destinatário:** [nome]  
> **Finalidade:** [finalidade]  
> **Informações:** [resumo]

Botões:
- **Confirmar encaminhamento**
- **Voltar**

## BLG-089 — Acesso interno indevido

Administrador técnico, suporte ou dirigente não poderá consultar caso sensível apenas para verificar o funcionamento do sistema.

Ambientes de desenvolvimento deverão utilizar dados fictícios, anonimizados ou controles específicos aprovados.

## BLG-090 — Critérios de aceite

- [ ] orientação sem compartilhamento;
- [ ] encaminhamento sem dados;
- [ ] finalidade obrigatória;
- [ ] destinatário no catálogo;
- [ ] base/autorização validada;
- [ ] dados minimizados;
- [ ] ausência de acesso interno automático;
- [ ] transmissão segura;
- [ ] falha sem reenvio automático;
- [ ] auditoria;
- [ ] histórico preservado;
- [ ] bloqueio de compartilhamento indevido;
- [ ] revalidação de política desatualizada.

## BLG-091 — Testes

### Fluxo
- T51 — orientação sem compartilhamento
- T52 — encaminhamento sem dados
- T53 — compartilhamento autorizado
- T54 — compartilhamento recusado

### Segurança
- T55 — destinatário inválido
- T56 — finalidade ausente
- T57 — dado fora do escopo
- T58 — profissional sem autorização
- T59 — administrador tentando acesso
- T60 — política expirada

### Transmissão
- T61 — transmissão criptografada
- T62 — falha de transmissão
- T63 — confirmação de entrega
- T64 — tentativa de reenvio

### Auditoria
- T65 — registro completo
- T66 — integridade do registro
- T67 — histórico do compartilhamento
- T68 — ausência de conteúdo sensível desnecessário no log

## 2. Regra institucional

> **A FAM não compartilha porque possui a informação. Compartilha somente quando existir finalidade legítima, destinatário legitimado, fundamento aplicável e necessidade de utilização daqueles dados.**
