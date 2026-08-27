# FAM — JK-02
## Taxonomia do Conhecimento

**Versão:** 1.0  
**Status:** Modelo inicial controlado

---

## 1. Finalidade

A taxonomia estabelece como o conhecimento será classificado, nomeado, relacionado e recuperado.

Taxonomia, no contexto de arquitetura da informação, organiza e rotula conceitos para melhorar localização e compreensão; pode combinar hierarquia, facetas, sinônimos e relações. citeturn0search1turn0search7

## 2. Regra central

A taxonomia não deve refletir apenas a estrutura interna da FAM.

Ela deve contemplar:

```text
COMO A FAM ORGANIZA
+
COMO A USUÁRIA PROCURA
+
COMO O CONTEÚDO É UTILIZADO
```

## 3. Eixos principais

### Eixo A — Tema

```text
Direitos
Atendimento
Proteção
Documentos
Encaminhamentos
Segurança
Privacidade
Serviços
```

### Eixo B — Tipo de conteúdo

```text
Guia
Explicação
Pergunta frequente
Procedimento
Política
Protocolo
Formulário
Referência
Documento técnico
```

### Eixo C — Público

```text
Usuária
Profissional
Gestão
Jurídico
Privacidade
Técnico
Auditoria
```

### Eixo D — Finalidade

```text
Informar
Orientar
Ensinar
Solicitar
Encaminhar
Decidir
Executar
Consultar
```

### Eixo E — Etapa da jornada

```text
Descobrir
Entender
Decidir
Agir
Acompanhar
Revisar
```

## 4. Classificação combinada

Um conteúdo poderá possuir:

```text
tema = direitos
tipo = guia
publico = usuaria
finalidade = orientar
etapa = agir
```

Isso permite múltiplas formas de descoberta sem duplicar o conteúdo.

## 5. Vocabulário controlado

Cada termo deverá possuir:

```text
term_id
preferred_label
alternative_labels
definition
parent
related_terms
status
```

Exemplo:

```text
term_id: DIREITOS_ACESSO
preferred_label: Acesso às informações
alternative_labels:
  - acessar meus dados
  - ver minhas informações
status: ACTIVE
```

## 6. Sinônimos

O sistema deverá reconhecer expressões equivalentes sem necessariamente publicá-las como títulos.

```text
“quero ver meus dados”
→
“Acesso às informações”
```

## 7. Relações

Tipos mínimos:

```text
BROADER_THAN
NARROWER_THAN
RELATED_TO
EXPLAINS
REQUIRES
NEXT_STEP
SOURCE_OF
SUPERSEDES
```

## 8. Taxonomia proposta

```text
FAM
├── Direitos
│   ├── Acesso
│   ├── Correção
│   ├── Solicitações
│   └── Representação
├── Atendimento
│   ├── Como funciona
│   ├── Orientações
│   └── Próximos passos
├── Proteção
│   ├── Segurança
│   ├── Encaminhamentos
│   └── Situações especiais
├── Privacidade
│   ├── Dados
│   ├── Compartilhamento
│   ├── Retenção
│   └── Exclusão
└── Serviços
    ├── Guias
    ├── Formulários
    └── Contatos
```

## 9. Facetas

Além da hierarquia, usar:

```text
tema
tipo
público
finalidade
etapa
status
atualização
```

Taxonomias simples e combinadas tendem a ser mais administráveis que estruturas excessivamente complexas; a validação deve incluir testes com usuários. citeturn0search1

## 10. Governança

Nenhum termo crítico deve ser alterado informalmente.

Mudança:

```text
PROPOSTA
 ↓
ANÁLISE
 ↓
REVISÃO
 ↓
APROVAÇÃO
 ↓
PUBLICAÇÃO
```

## 11. Testes

Testar:

- termos usados pela usuária;
- sinônimos;
- erros ortográficos frequentes;
- buscas por tarefa;
- buscas por tema;
- busca por tipo;
- combinação de facetas.

## 12. Critérios de aceite

- [ ] eixos definidos;
- [ ] vocabulário controlado;
- [ ] sinônimos previstos;
- [ ] relações definidas;
- [ ] facetas definidas;
- [ ] governança definida;
- [ ] testes de findability previstos.

