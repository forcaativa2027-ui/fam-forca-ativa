# MASTER-01 — Caderno Mestre de Documentação, Implantação e Jornada de Conhecimento

## 1. Missão do Caderno Master

O MASTER-01 será a porta de entrada oficial para toda a documentação da funcionalidade FAM.

A partir de sua aprovação, nenhuma equipe deverá precisar perguntar:

> “Qual documento devemos utilizar?”

O MASTER-01 deverá responder:

- quais documentos estão vigentes;
- quais foram substituídos;
- para que serve cada documento;
- quando utilizá-lo;
- qual documento consultar durante a codificação;
- quais documentos são jurídicos;
- quais definem comportamento;
- quais definem interface;
- quais definem segurança;
- quais definem encaminhamento;
- quais constituem apenas referência histórica;
- de onde nasceu cada requisito importante.

O MASTER-01 também governará a nova área:

# INFO — DIREITOS E DEVERES

que transformará a base pública e governamental utilizada na construção da FAM em uma jornada acessível de conhecimento para as mulheres.

---

# PARTE I — O PACOTE DOCUMENTAL REAL

## 2. Documentação identificada no pacote

O pacote consolidado entregue para elaboração deste Master contém, entre outros, os seguintes grupos documentais.

### 2.1 Fundamentos

- Índice do Pacote Documental FAM;
- Documento 2A — Matriz Comparativa;
- Documento 2B — Matriz Metodológica;
- Princípios Institucionais;
- Matriz de Necessidades;
- Marco Institucional e Referencial Técnico.

### 2.2 Operação e encaminhamento

- OC-01 — Matriz de Órgãos e Encaminhamento;
- OC-02 — Matriz de Evidências e Arquivos;
- OC-03 — Fluxo de Encaminhamento da Usuária;
- OC-04 — Matriz de Situações de Risco e Respostas.

### 2.3 Proteção jurídica

- JUR-01 — Fluxos Especiais de Proteção;
- JUR-02 — Matriz de Bases Jurídicas, Finalidades e Compartilhamento;
- JUR-03 — Política de Atendimento e Não Revitimização;
- JUR-04 — Protocolo de Incidentes e Violações de Dados;
- JUR-05 — Matriz de Responsabilidades Institucionais — RACI.

### 2.4 Segurança documental e dados

- POL-ARQ-01 — Política de Arquivos, Segurança, Retenção e Exclusão.

### 2.5 Governança profissional

- AC-02 — Credenciamento Profissional.

### 2.6 Decisões e consolidação

- DEC-01 — Resolução dos Pontos Críticos;
- REV-01 — Matriz Executiva de Revisão Cruzada;
- REV-02 — Matriz de Conflitos, Lacunas, Decisões e Textos de Interface.

### 2.7 Implementação

- TEC-01 — Especificação Técnica e Arquitetura Completa;
- UX-01 — Especificação de Experiência da Usuária e Fluxos de Interface.

---

# 3. Documentos duplicados e versões superadas

O pacote contém documentos produzidos durante diferentes momentos de amadurecimento.

Isso é natural durante a fase documental, mas não deverá ser transferido para a fase de desenvolvimento.

O MASTER deverá estabelecer uma regra:

> **A equipe de desenvolvimento trabalha somente com a versão consolidada registrada como vigente.**

Versões anteriores poderão permanecer arquivadas para:

- auditoria;
- histórico;
- compreensão da evolução;
- recuperação de decisão.

Mas não deverão aparecer na biblioteca principal do desenvolvedor.

---

# 4. Três bibliotecas

A documentação deverá ser organizada conceitualmente em três conjuntos.

## BIBLIOTECA A — DOCUMENTAÇÃO VIGENTE

Utilizada para desenvolvimento.

## BIBLIOTECA B — HISTÓRICO

Versões substituídas.

Não utilizar para codificação.

## BIBLIOTECA C — FONTES OFICIAIS

Legislação, cartilhas, protocolos, guias e documentos governamentais que fundamentaram a solução.

Esta terceira biblioteca também alimentará o INFO — Direitos e Deveres.

---

# PARTE II — MAPA DE USO DOS DOCUMENTOS

## 5. Documentos de fundamento

### Marco Institucional e Referencial Técnico

**Pergunta que responde:**

> O que é a ferramenta e quais princípios justificam sua existência?

Utilização:

- onboarding de desenvolvedores;
- apresentação institucional;
- decisões estratégicas;
- análise de escopo;
- validação de novas funcionalidades.

Não utilizar isoladamente para programar regras específicas.

---

### Documento 2A — Matriz Comparativa

Utilizar para compreender:

- instrumentos estudados;
- diferenças;
- convergências;
- elementos aproveitados;
- elementos rejeitados ou adaptados.

É documento de fundamentação.

---

### Documento 2B — Matriz Metodológica

Utilizar quando surgir a pergunta:

> “Por que a ferramenta pergunta, classifica ou organiza desta maneira?”

Ele sustenta a metodologia adotada.

---

### Princípios Institucionais

É uma espécie de Constituição comportamental da funcionalidade.

Qualquer nova função deverá ser confrontada com esses princípios.

---

### Matriz de Necessidades

Liga problemas identificados às necessidades que a plataforma deverá atender.

Deverá ser utilizada em:

- backlog;
- priorização;
- análise de cobertura;
- identificação de funcionalidades ausentes.

---

# 6. Documentos operacionais

## OC-01 — Órgãos e Encaminhamento

Fonte para construção do mecanismo de orientação e encaminhamento.

Deverá alimentar futuramente uma estrutura parametrizável de:

- órgão;
- competência;
- serviço;
- público;
- território;
- canal;
- horário;
- natureza do atendimento.

---

## OC-02 — Evidências e Arquivos

Deverá orientar:

- anexos;
- tipos de evidência;
- arquivos;
- finalidade;
- armazenamento;
- acesso;
- proteção.

Trabalha obrigatoriamente em conjunto com POL-ARQ-01 e JUR-02.

---

## OC-03 — Fluxo de Encaminhamento

Responde:

> “Depois de identificar determinada situação, qual é o caminho de orientação da usuária?”

Deverá ser associado ao motor de encaminhamento.

---

## OC-04 — Situações de Risco e Respostas

É um dos documentos centrais do motor.

Relaciona:

**SITUAÇÃO → INDICADOR → RESPOSTA → AÇÃO**

Deverá possuir rastreabilidade direta com o código.

---

# 7. Documentos jurídicos

## JUR-01 — Fluxos Especiais

Fundamental para situações envolvendo:

- criança;
- adolescente;
- pessoa idosa;
- pessoa com deficiência;
- outras situações especiais previstas.

Nenhum fluxo especial deverá ser implementado somente a partir do UX.

---

## JUR-02 — Bases Jurídicas e Compartilhamento

Documento central para responder:

- por que tratamos determinado dado;
- para qual finalidade;
- quando pode ser compartilhado;
- quais limites existem.

Deverá dialogar diretamente com backend, banco de dados, consentimentos e auditoria.

---

## JUR-03 — Não Revitimização

Documento transversal.

Deverá orientar:

- perguntas;
- mensagens;
- atendimento;
- IA;
- UX;
- suporte humano;
- encaminhamento.

A regra é:

> A plataforma não deverá obrigar uma mulher a reviver repetidamente uma violência para conseguir orientação.

---

## JUR-04 — Incidentes e Violações de Dados

Documento obrigatório para:

- segurança;
- resposta a incidentes;
- vazamento;
- acesso indevido;
- comunicação;
- auditoria.

---

## JUR-05 — RACI

Define:

> quem faz o quê.

Deverá ser consultado para funções administrativas, operacionais e de governança.

---

# 8. POL-ARQ-01

Documento técnico-jurídico central para:

- upload;
- armazenamento;
- criptografia;
- acesso;
- retenção;
- exclusão;
- evidências;
- logs;
- backups.

Nenhum módulo de anexos deverá entrar em produção sem sua observância.

---

# 9. DEC-01

DEC-01 registra decisões tomadas para resolver pontos críticos.

Sua função principal é impedir que questões já resolvidas sejam novamente abertas durante a implementação sem motivo novo.

---

# 10. REV-01

REV-01 é documento de auditoria documental.

Ele demonstra como os documentos foram confrontados.

Deverá permanecer como referência de consistência.

Não será normalmente documento de consulta diária do programador.

---

# 11. REV-02

REV-02 passa a ser uma das referências centrais de frontend.

Contém decisões consolidadas e textos de interface.

Quando o desenvolvedor perguntar:

> “Qual texto aparece aqui?”

a primeira consulta deverá ser REV-02, associada ao UX-01.

---

# 12. TEC-01

TEC-01 é a ponte principal entre documentação e software.

Deverá orientar:

- arquitetura;
- serviços;
- APIs;
- dados;
- segurança;
- regras;
- processamento;
- integrações;
- estados técnicos.

---

# 13. UX-01

UX-01 transforma todas as decisões anteriores em experiência.

Responde:

> “Como isso acontece para a usuária?”

TEC-01 e UX-01 deverão caminhar juntos:

**TEC-01 = comportamento técnico**

**UX-01 = comportamento percebido pela usuária**

---

# PARTE III — ORDEM DE LEITURA PARA IMPLANTAÇÃO

## 14. Desenvolvedor que chega hoje ao projeto

Não deverá receber vinte documentos aleatoriamente.

A sequência recomendada será:

### ETAPA 1 — Entenda

1. MASTER-01;
2. Marco Institucional;
3. Princípios Institucionais.

### ETAPA 2 — Entenda a metodologia

4. Matriz Comparativa;
5. Matriz Metodológica;
6. Matriz de Necessidades.

### ETAPA 3 — Entenda as decisões

7. DEC-01;
8. REV-02.

### ETAPA 4 — Entenda proteção e limites

9. JUR-01;
10. JUR-02;
11. JUR-03;
12. POL-ARQ-01;
13. JUR-04;
14. JUR-05.

### ETAPA 5 — Entenda operação

15. OC-01;
16. OC-02;
17. OC-03;
18. OC-04.

### ETAPA 6 — Construa

19. TEC-01;
20. UX-01.

REV-01 permanece como instrumento de auditoria e consulta de consolidação.

---

# PARTE IV — INFO — DIREITOS E DEVERES

## 15. Não será biblioteca de PDFs

A plataforma deverá possuir uma nova área:

# INFO

### Direitos • Proteção • Conhecimento

O objetivo não será simplesmente armazenar legislação.

A plataforma deverá transformar documentação pública confiável em conhecimento progressivo.

---

# 16. Fonte editorial

O INFO trabalhará com duas camadas completamente separadas:

## CONTEÚDO EXPLICADO PELA FAM

Conteúdo pedagógico produzido a partir das fontes oficiais.

## DOCUMENTO ORIGINAL

Documento oficial integral ou acesso à fonte governamental correspondente.

A usuária deverá conseguir distinguir claramente:

> “Estou lendo uma explicação.”

de:

> “Estou consultando o documento oficial.”

---

# 17. Jornada de Conhecimento

A jornada deverá começar pela vida cotidiana, e não pelo número de uma lei.

Em vez de começar:

**Lei nº 11.340/2006**

começaremos:

# Você conhece seus direitos?

E progressivamente chegaremos à legislação.

---

# 18. Trilha 1 — Conhecendo meus direitos

Nível introdutório.

Temas:

- o que são direitos;
- dignidade;
- liberdade;
- igualdade;
- autonomia;
- privacidade;
- integridade;
- acesso à informação;
- acesso aos serviços públicos.

---

# 19. Trilha 2 — Isso também pode ser violência?

Ensinar progressivamente as formas legalmente reconhecidas.

Incluindo:

- violência física;
- psicológica;
- sexual;
- patrimonial;
- moral;
- violência vicária;
- violência digital e outras manifestações tratadas pelas fontes oficiais.

Cada conteúdo deverá possuir:

**O que é**

**Como pode acontecer**

**Sinais**

**O que a legislação diz**

**O que posso fazer**

**Onde aprender mais**

**Fonte oficial**

---

# 20. Trilha 3 — Entendendo a Lei Maria da Penha

Não apresentar inicialmente dezenas de artigos.

Construir uma jornada:

1. Para que existe a Lei Maria da Penha?
2. A quem ela protege?
3. O que é violência doméstica e familiar?
4. Quais formas de violência existem?
5. O que são medidas protetivas?
6. Como funciona a rede de proteção?
7. Onde procurar orientação?
8. Leia a legislação.

---

# 21. Trilha 4 — Reconhecendo sinais de risco

Aqui ocorre integração pedagógica com o Mapa de Risco.

A usuária aprende sobre:

- ameaças;
- perseguição;
- controle;
- isolamento;
- escalada da violência;
- armas;
- dependência;
- ameaças envolvendo familiares;
- outros indicadores previstos na documentação.

Deverá existir separação clara:

**APRENDER**

não significa

**FAZER UMA AVALIAÇÃO**

---

# 22. Trilha 5 — Violência sexual

Conteúdo específico, sensível e não revitimizante.

Progressão:

**Entender**

→ **Reconhecer direitos**

→ **Conhecer formas de atendimento**

→ **Conhecer possibilidades**

→ **Acessar fontes oficiais**

---

# 23. Trilha 6 — Crianças e adolescentes

Explicar:

- proteção integral;
- direitos;
- rede de proteção;
- Conselho Tutelar;
- escuta especializada;
- depoimento especial;
- proteção contra revitimização;
- formas adequadas de buscar ajuda.

Fonte normativa central:

**Lei nº 13.431/2017**, além das normas correlatas utilizadas pela documentação FAM.

---

# 24. Trilha 7 — Pessoa idosa

Ensinar:

- direitos da pessoa idosa;
- negligência;
- violência física;
- violência psicológica;
- violência patrimonial;
- abuso financeiro;
- abandono;
- canais de proteção.

Fonte central:

**Estatuto da Pessoa Idosa.**

---

# 25. Trilha 8 — Mulher com deficiência

Conteúdo sobre:

- igualdade;
- acessibilidade;
- autonomia;
- comunicação;
- adaptações razoáveis;
- violência;
- barreiras;
- acesso à rede.

Fonte central:

**Lei Brasileira de Inclusão.**

---

# 26. Trilha 9 — Violência digital

Tema que deverá ganhar área própria.

Conteúdos:

- perseguição digital;
- invasão de contas;
- exposição;
- ameaça;
- divulgação de conteúdo;
- controle digital;
- golpes;
- preservação adequada de registros;
- segurança de contas;
- onde buscar orientação.

---

# 27. Trilha 10 — Minha privacidade também é um direito

A própria FAM poderá ensinar por que protege os dados da usuária.

Conteúdo:

- o que é dado pessoal;
- dado sensível;
- por que protegemos informações;
- quem pode acessar;
- compartilhamento;
- segurança;
- direitos relacionados aos dados pessoais.

Fontes:

**LGPD**

e materiais oficiais da **ANPD**.

---

# 28. Trilha 11 — Conhecendo a rede de proteção

Transformar OC-01 e OC-03 também em conhecimento.

Explicar:

- para que serve cada instituição;
- quando procurar;
- o que esperar;
- diferenças entre os órgãos;
- quais serviços podem ser oferecidos.

A mulher não deverá apenas receber:

> “Procure o órgão X.”

Ela deverá poder entender:

> “O que é esse órgão e como ele pode me ajudar?”

---

# 29. Trilha 12 — Quero me aprofundar

Último nível.

Aqui entra a biblioteca documental oficial.

Categorias:

### Legislação

### Cartilhas

### Guias

### Protocolos

### Manuais

### Políticas Públicas

### Estudos e documentos técnicos

### Proteção de dados

### Rede de atendimento

---

# PARTE V — ARQUITETURA PEDAGÓGICA

## 30. Quatro níveis

Todo assunto relevante poderá seguir:

```text
NÍVEL 1
ENTENDA EM 2 MINUTOS
       ↓
NÍVEL 2
APRENDA
       ↓
NÍVEL 3
APROFUNDE
       ↓
NÍVEL 4
CONSULTE A FONTE OFICIAL
```

---

# 31. Exemplo

## Violência patrimonial

### 1 — Entenda

“Controlar, esconder, destruir ou tomar seus bens, documentos ou recursos pode constituir violência patrimonial.”

### 2 — Aprenda

Situações e exemplos cotidianos.

### 3 — Aprofunde

Direitos, proteção e possibilidades.

### 4 — Fonte oficial

Lei Maria da Penha e material oficial correspondente.

---

# 32. Relação com o Mapa de Risco

O grande diferencial será conectar orientação e conhecimento.

Quando apropriado, depois de uma resposta ou resultado, a plataforma poderá oferecer:

**Entenda melhor este assunto**

Mas deverá evitar interromper uma situação urgente com conteúdo educacional.

A prioridade será sempre:

```text
EMERGÊNCIA
     ↓
PROTEÇÃO
     ↓
ORIENTAÇÃO
     ↓
CONHECIMENTO
```

Nunca o inverso.

---

# 33. Jornada sem obrigatoriedade

Não deverá existir:

> “Você precisa concluir o módulo 2 para acessar o módulo 3.”

Uma mulher pode precisar imediatamente do conteúdo mais avançado.

Portanto:

**progressão sugerida ≠ conteúdo bloqueado.**

---

# 34. Busca

O INFO deverá possuir busca própria.

Exemplos:

> “Ele controla meu dinheiro.”

> “Tenho direito a medida protetiva?”

> “O que é violência psicológica?”

> “Meu ex fica me seguindo.”

> “Alguém está usando meus filhos para me ameaçar.”

O sistema deverá aproximar a linguagem cotidiana dos conteúdos oficiais correspondentes.

---

# 35. Fontes oficiais iniciais

A Biblioteca Oficial deverá iniciar, no mínimo, com as fontes identificadas na documentação FAM e posteriormente passar por inventário documental completo.

Entre elas:

- Lei Maria da Penha;
- Lei Geral de Proteção de Dados;
- Lei nº 13.431/2017;
- Estatuto da Pessoa Idosa;
- Lei Brasileira de Inclusão;
- regulamentações da ANPD utilizadas pelo projeto;
- documentos oficiais sobre atendimento às mulheres;
- documentos oficiais sobre violência sexual;
- documentos oficiais sobre avaliação de risco;
- materiais oficiais sobre medidas protetivas;
- materiais sobre violência digital;
- documentos da rede de proteção;
- cartilhas e guias governamentais utilizados como referência na construção da FAM.

---

# 36. Ficha obrigatória da fonte

Cada fonte deverá possuir registro estruturado:

| Campo | Informação |
|---|---|
| Título | Nome oficial |
| Órgão | Instituição responsável |
| Tipo | Lei, guia, cartilha etc. |
| Ano | Publicação |
| Atualização | Última verificação |
| Tema | Classificação |
| Nível | Básico/intermediário/avançado |
| Utilizado pela FAM | Sim/Não |
| Documentos FAM relacionados | códigos |
| Fonte oficial | endereço |
| Situação | vigente/revisar/substituído |

---

# 37. Atualização normativa

O INFO não poderá se transformar em biblioteca estática.

A documentação governamental muda.

Portanto, cada item deverá possuir:

**ÚLTIMA VERIFICAÇÃO DA FONTE**

e mecanismo administrativo para:

- revisar;
- atualizar;
- substituir;
- arquivar;
- registrar alteração.

---

# 38. Dupla rastreabilidade

O projeto passará a possuir uma característica muito importante.

Uma norma poderá ser rastreada em duas direções.

### PARA DENTRO

```text
DOCUMENTO OFICIAL
      ↓
DOCUMENTAÇÃO FAM
      ↓
REGRA
      ↓
CÓDIGO
```

### PARA A MULHER

```text
DOCUMENTO OFICIAL
      ↓
CONTEÚDO PEDAGÓGICO
      ↓
JORNADA DE CONHECIMENTO
      ↓
AUTONOMIA INFORMACIONAL
```

A mesma base que fundamenta tecnicamente a plataforma passa também a produzir conhecimento.

---

# 39. Princípio do INFO

O INFO não deverá dizer apenas:

> “Você tem direitos.”

Deverá ajudar a mulher a compreender:

**quais são seus direitos,**

**como reconhecê-los,**

**onde eles estão previstos,**

**como o Estado se organiza para protegê-los,**

**onde procurar informação,**

**e como continuar aprendendo.**

---

# 40. Resultado esperado

A FAM passará a possuir quatro movimentos complementares:

```text
IDENTIFICAR
     ↓
ORIENTAR
     ↓
PROTEGER
     ↓
ENSINAR
```

O **Mapa de Risco** auxilia a compreender uma situação.

A **Rede de Encaminhamento** mostra possibilidades.

Os **Fluxos de Proteção** tratam situações especiais.

E o **INFO — Direitos e Deveres** cria uma cultura permanente de conhecimento.

Assim, a plataforma não estará estruturada somente para a mulher que procura ajuda em uma situação crítica.

Também estará preparada para a mulher que entra simplesmente porque decidiu:

> **“Quero conhecer melhor meus direitos.”**

E esse conhecimento poderá começar com uma explicação de dois minutos e, se ela desejar, terminar na leitura da própria legislação, protocolo, cartilha ou política pública que serviu de fundamento para a construção da FAM.