# MASTER-01 — Caderno Mestre de Governança Documental e Implantação da Plataforma FAM

**Código:** MASTER-01  
**Versão:** 1.0  
**Situação:** Baseline para implantação  
**Finalidade:** Governança documental, rastreabilidade e orientação da codificação

---

# 1. Objetivo

O MASTER-01 estabelece a documentação oficial que deverá orientar a implantação da funcionalidade FAM.

Sua função é impedir que:

- versões superadas sejam utilizadas;
- documentos duplicados concorram entre si;
- decisões já consolidadas sejam reabertas sem necessidade;
- regras jurídicas sejam implementadas somente a partir da interface;
- textos antigos retornem ao sistema;
- código seja produzido sem rastreabilidade documental.

A partir deste documento, a implantação deverá trabalhar sobre um **baseline documental controlado**.

---

# 2. Regra-mestra

> Nenhum requisito da FAM deverá ser implementado com base em documento substituído, duplicado, rascunho, conversa ou interpretação isolada de um desenvolvedor.

A fonte será sempre o conjunto documental vigente registrado neste MASTER.

---

# 3. Pacote analisado

O pacote documental consolidado contém 25 arquivos Markdown.

Foram identificados:

- documentos institucionais;
- matrizes metodológicas;
- documentos operacionais;
- políticas;
- documentos jurídicos;
- decisões de consolidação;
- revisões cruzadas;
- arquitetura técnica;
- especificação UX.

Também foram identificadas duplicidades e versões anteriores.

---

# 4. Exclusões do baseline

## 4.1 OC-04 duplicado

Existem:

`OC-04_Matriz_Situacoes_Risco_Respostas_v1.1.md`

e

`OC-04_Matriz_Situacoes_Risco_Respostas_v1.1 (1).md`

O segundo deverá ser tratado como **cópia duplicada** e não deverá integrar o baseline operacional.

---

## 4.2 POL-ARQ-01

Existem uma versão inicial:

`05_POL-ARQ-01_POLITICA_ARQUIVOS_SEGURANCA_RETENCAO_EXCLUSAO.md`

e uma versão consolidada:

`POL-ARQ-01_Politica_Arquivos_Seguranca_Retencao_Exclusao_v1.1.md`

Para implantação, a referência será:

**POL-ARQ-01 v1.1**

A versão inicial permanece apenas como histórico.

---

# 5. Registro Mestre

| Código | Documento | Situação | Uso principal |
|---|---|---|---|
| MASTER-01 | Caderno Mestre | VIGENTE | Governança |
| 2A | Matriz Comparativa | VIGENTE | Fundamentação |
| 2B | Matriz Metodológica | VIGENTE | Metodologia |
| PI | Princípios Institucionais | VIGENTE | Princípios |
| MN | Matriz de Necessidades | VIGENTE | Requisitos |
| MARCO | Marco Institucional e Referencial Técnico | VIGENTE | Fundamento institucional |
| AC-02 | Credenciamento Profissional | VIGENTE | Perfis e acesso |
| OC-01 | Órgãos e Encaminhamento | VIGENTE | Rede |
| OC-02 | Evidências e Arquivos | VIGENTE | Evidências |
| OC-03 | Fluxo de Encaminhamento | VIGENTE | Encaminhamento |
| OC-04 v1.1 | Situações de Risco e Respostas | VIGENTE | Motor de risco |
| JUR-01 | Fluxos Especiais de Proteção | VIGENTE | Proteção especial |
| JUR-02 | Bases Jurídicas e Compartilhamento | VIGENTE | Dados |
| JUR-03 | Atendimento e Não Revitimização | VIGENTE | Atendimento |
| JUR-04 | Incidentes e Violações | VIGENTE | Segurança |
| JUR-05 | Responsabilidades/RACI | VIGENTE | Governança |
| POL-ARQ-01 v1.1 | Política de Arquivos | VIGENTE | Arquivos e retenção |
| DEC-01 | Resolução dos Pontos Críticos | VIGENTE | Decisões |
| REV-01 | Revisão Cruzada | REFERÊNCIA | Auditoria |
| REV-02 | Decisões e Textos de Interface | VIGENTE | Conteúdo/UX |
| TEC-01 | Especificação Técnica Consolidada | VIGENTE | Engenharia |
| UX-01 | Experiência e Fluxos | VIGENTE | Interface |

---

# 6. Hierarquia documental

A documentação deverá ser interpretada em camadas.

```text
FONTES OFICIAIS
       ↓
FUNDAMENTOS FAM
       ↓
METODOLOGIA
       ↓
POLÍTICAS E REGRAS JURÍDICAS
       ↓
DECISÕES CONSOLIDADAS
       ↓
REGRAS OPERACIONAIS
       ↓
TEC-01
       ↓
UX-01
       ↓
CÓDIGO
       ↓
TESTES
```

Uma camada inferior não poderá contrariar silenciosamente uma camada superior.

---

# 7. Como utilizar cada grupo

## 7.1 Marco + Princípios

Utilizar para responder:

> Por que a FAM existe e quais limites não podem ser ultrapassados?

São documentos de orientação institucional.

---

## 7.2 2A — Matriz Comparativa

Responde:

> Quais modelos e instrumentos foram estudados?

Utilizar para fundamentação e auditoria metodológica.

---

## 7.3 2B — Matriz Metodológica

Responde:

> Qual lógica metodológica orienta a ferramenta?

Deverá ser consultada antes de alterar:

- perguntas;
- critérios;
- indicadores;
- agrupamentos;
- lógica de avaliação.

---

## 7.4 Matriz de Necessidades

Responde:

> Qual necessidade real determinada funcionalidade procura resolver?

Será importante para backlog e priorização.

---

# 8. Documentos operacionais

## OC-01

Governará o cadastro e utilização da rede de órgãos e serviços.

## OC-02

Governará evidências e arquivos.

## OC-03

Governará a experiência de encaminhamento.

## OC-04

Será uma das principais referências do motor de situações de risco e respostas.

---

# 9. Documentos jurídicos

## JUR-01

Obrigatório para fluxos especiais.

## JUR-02

Obrigatório para tratamento e compartilhamento de dados.

## JUR-03

Transversal a toda interação com a mulher.

## JUR-04

Obrigatório para segurança e resposta a incidentes.

## JUR-05

Define responsabilidades institucionais.

---

# 10. DEC-01

DEC-01 deverá funcionar como registro das decisões críticas já solucionadas.

Uma decisão registrada em DEC-01 não deverá ser reaberta durante desenvolvimento simplesmente por preferência técnica ou estética.

---

# 11. REV-01

REV-01 é documento de auditoria.

Não deverá normalmente produzir código diretamente.

Sua função é demonstrar que houve confronto entre os diferentes documentos.

---

# 12. REV-02

REV-02 é fonte prioritária para:

- textos;
- mensagens;
- alertas;
- decisões consolidadas de interface.

Quando houver texto correspondente em REV-02, o desenvolvedor não deverá criar uma nova redação por conta própria.

---

# 13. TEC-01

TEC-01 será o documento central da engenharia.

Governará:

- arquitetura;
- backend;
- APIs;
- banco;
- autenticação;
- autorização;
- serviços;
- segurança;
- auditoria;
- persistência;
- processamento;
- regras técnicas.

---

# 14. UX-01

UX-01 será a referência principal para implementação da experiência.

Governará:

- telas;
- estados;
- navegação;
- interações;
- mobile;
- acessibilidade;
- Saída Rápida;
- apresentação do resultado;
- compartilhamento;
- encerramento.

---

# 15. Regra TEC + UX

Nenhuma tela deverá ser implementada apenas lendo UX-01.

O desenvolvedor deverá verificar:

```text
UX-01
  ↕
TEC-01
  ↕
REV-02
  ↕
REGRA OPERACIONAL/JURÍDICA
```

---

# 16. Identificação de requisitos

Adotar:

- `REQ-FAM-###` — requisito funcional;
- `RULE-FAM-###` — regra;
- `UX-FAM-###` — experiência;
- `SEC-FAM-###` — segurança;
- `PRIV-FAM-###` — privacidade;
- `ACC-FAM-###` — acessibilidade;
- `CNT-FAM-###` — conteúdo;
- `DATA-FAM-###` — dados;
- `TEST-FAM-###` — teste.

---

# 17. Matriz de rastreabilidade

Todo requisito relevante deverá permitir chegar à sua origem.

| ID | Fonte | Regra | TEC | UX | Código | Teste |
|---|---|---|---|---|---|---|
| REQ-FAM-001 | 2B/OC-04 | RULE | TEC | UX | componente | teste |
| REQ-FAM-002 | JUR-03 | RULE | TEC | UX | componente | teste |
| REQ-FAM-003 | POL-ARQ | RULE | TEC | UX | serviço | teste |

---

# 18. Regra de alteração

Depois do início da codificação:

> documentação vigente não deverá ser sobrescrita silenciosamente.

Uma alteração deverá registrar:

1. necessidade;
2. documento afetado;
3. decisão;
4. impacto;
5. requisito afetado;
6. código afetado;
7. teste afetado;
8. nova versão.

---

# 19. Ordem recomendada de leitura

Para um novo integrante:

### Nível 1 — Conhecer

MASTER-01  
→ Marco  
→ Princípios

### Nível 2 — Compreender

2A  
→ 2B  
→ Matriz de Necessidades

### Nível 3 — Conhecer as decisões

DEC-01  
→ REV-02

### Nível 4 — Conhecer limites

JUR-01 a JUR-05  
→ POL-ARQ-01  
→ AC-02

### Nível 5 — Operação

OC-01 a OC-04

### Nível 6 — Implementar

TEC-01  
→ UX-01

---

# 20. Ordem de codificação

## IMPL-01 — Fundação

- estrutura;
- dados;
- autenticação;
- autorização;
- perfis;
- auditoria;
- segurança.

## IMPL-02 — Motor

- perguntas;
- respostas;
- condicionais;
- avaliação;
- indicadores;
- fluxos especiais.

## IMPL-03 — Experiência

- entrada;
- apresentação;
- questionário;
- resultado;
- encaminhamento;
- compartilhamento;
- encerramento.

## IMPL-04 — Proteção

- emergência;
- violência sexual;
- criança/adolescente;
- pessoa idosa;
- outros fluxos especiais.

## IMPL-05 — Arquivos

- anexos;
- armazenamento;
- segurança;
- retenção;
- exclusão.

## IMPL-06 — Mobile e acessibilidade

Validação integral.

## IMPL-07 — Segurança

Testes específicos.

## IMPL-08 — Homologação

Validação documental + funcional + UX + segurança.

---

# 21. Novo módulo INFO

A documentação governamental que fundamentou a FAM deverá originar também:

# INFO — Conhecimento que Protege

O INFO não pertence ao motor do Mapa de Risco.

É uma camada de conhecimento da plataforma.

---

# 22. Relação entre FAM e INFO

```text
                   FONTE OFICIAL
                    /          \
                   ↓            ↓
          DOCUMENTAÇÃO FAM    INFO
                  ↓             ↓
               CÓDIGO       APRENDIZAGEM
                  ↓             ↓
              PROTEÇÃO     CONHECIMENTO
```

Assim, a mesma fonte pública possui duas funções.

**Internamente:** fundamentar a plataforma.

**Externamente:** ensinar.

---

# 23. Atualização normativa

Toda fonte jurídica ou governamental utilizada deverá possuir:

- órgão;
- título;
- versão;
- endereço oficial;
- data da publicação;
- data da última conferência;
- documentos FAM relacionados;
- conteúdos INFO relacionados;
- situação.

Estados:

**VIGENTE**

**ALTERADA**

**REVISÃO NECESSÁRIA**

**SUBSTITUÍDA**

---

# 24. Regra de impacto normativo

Quando uma fonte oficial mudar:

```text
FONTE ALTERADA
      ↓
IDENTIFICAR DOCUMENTOS FAM
      ↓
IDENTIFICAR REQUISITOS
      ↓
VERIFICAR CÓDIGO
      ↓
VERIFICAR TESTES
      ↓
VERIFICAR INFO
```

A atualização da Lei Maria da Penha em 2026 demonstra exatamente a necessidade desse mecanismo.

---

# 25. Baseline

Com este MASTER, ficam estabelecidas quatro bases:

### BASE DOCUMENTAL

Documentos vigentes.

### BASE NORMATIVA

Fontes oficiais.

### BASE DE IMPLEMENTAÇÃO

TEC-01 + UX-01 + documentos relacionados.

### BASE DE CONHECIMENTO

INFO-01 e suas fontes oficiais.

---

# 26. Princípio final

A documentação não termina quando começa o código.

Ela passa a exercer outra função.

O modelo de governança será:

> **FONTE → FUNDAMENTO → DECISÃO → REGRA → CÓDIGO → TESTE → AUDITORIA**

e, simultaneamente:

> **FONTE → EXPLICAÇÃO → APRENDIZAGEM → CONHECIMENTO → AUTONOMIA**

Esse será o modelo documental permanente da FAM.