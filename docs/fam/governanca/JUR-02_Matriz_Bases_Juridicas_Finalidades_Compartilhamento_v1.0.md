# JUR-02 — Matriz de Bases Jurídicas, Finalidades e Compartilhamento

**Instituição:** Força Ativa da Mulher — FAM  
**Plataforma:** Plataforma FAM  
**Versão:** 1.0  
**Data:** 24/08/2026  
**Status:** minuta institucional + técnica para validação jurídica  
**Classificação:** governança de dados / proteção / desenvolvimento

> **Nota:** este documento organiza a governança de tratamento de dados da plataforma. A definição final das bases legais e dos fluxos de compartilhamento deve ser validada pela assessoria jurídica e pelo responsável pela proteção de dados da FAM antes da entrada em produção.

---

# 1. Objetivo

Estabelecer uma matriz que permita responder, para cada operação da plataforma:

> **Qual dado? → para qual finalidade? → por que é necessário? → quem pode acessar? → pode ser compartilhado? → com quem? → qual fundamento jurídico? → como registrar? → quando eliminar?**

A LGPD considera dados referentes à saúde e à vida sexual como dados pessoais sensíveis e estabelece hipóteses específicas para seu tratamento. citeturn0search0turn0search1

---

# 2. Regra central da FAM

> **Nenhuma pessoa terá acesso a dados sensíveis apenas por possuir cargo, vínculo institucional, associação, direção, parceria, voluntariado ou privilégio administrativo.**

O acesso dependerá cumulativamente de:

1. função compatível;
2. necessidade profissional;
3. finalidade definida;
4. autorização adequada;
5. dados mínimos necessários;
6. registro e auditoria.

---

# 3. Fundamentos da LGPD aplicáveis

Para dados pessoais comuns, a LGPD prevê as bases do art. 7º.

Para dados pessoais sensíveis, aplica-se o art. 11, que possui hipóteses próprias e mais restritas. Entre elas estão consentimento específico e destacado, obrigação legal/regulatória, exercício regular de direitos, proteção da vida ou incolumidade física e determinadas hipóteses relacionadas à saúde. citeturn0search0turn0search1

### Regra institucional

> **Não escolher uma base jurídica apenas porque ela parece conveniente.**

A base deverá corresponder à operação concreta.

---

# 4. Dados tratados pela Ferramenta

## 4.1 Respostas de risco

Podem revelar:

- situação de violência;
- saúde;
- violência sexual;
- vulnerabilidade;
- presença de crianças/adolescentes;
- situação envolvendo pessoa idosa;
- existência ou acesso a arma;
- perigo atual.

Algumas dessas informações podem constituir dados pessoais sensíveis ou dados pessoais de alta criticidade contextual.

## 4.2 Identificação

Quando necessária:

- nome;
- e-mail;
- telefone;
- identificadores de conta;
- informações necessárias ao atendimento.

## 4.3 Arquivos

Possíveis:

- PDF;
- imagem;
- áudio;
- vídeo;
- documentos complementares.

Arquivos podem conter dados pessoais e sensíveis mesmo quando a usuária não percebe isso.

---

# 5. Princípio da finalidade

Cada operação deverá possuir finalidade específica.

Exemplos:

| Finalidade | Permitida |
|---|---|
| orientação inicial | sim |
| proteção | sim |
| encaminhamento | sim, quando aplicável |
| atendimento profissional | sim, quando aplicável |
| auditoria de segurança | sim, limitada |
| treinamento genérico | somente com dados adequadamente anonimizados ou outra base juridicamente validada |
| curiosidade administrativa | não |
| divulgação pública | não, salvo hipótese juridicamente válida |
| marketing | não para dados coletados na ferramenta de proteção, salvo análise jurídica específica e separada |

---

# 6. Princípio da necessidade

A FAM deverá coletar apenas o que seja necessário para a finalidade definida.

A existência de uma funcionalidade tecnológica não constitui justificativa para coletar mais dados.

---

# 7. Matriz principal

| Categoria | Finalidade | Necessidade | Acesso | Compartilhamento | Fundamento a validar | Registro |
|---|---|---|---|---|---|---|
| perigo atual | proteção | alta | profissional autorizado | autoridade/serviço competente conforme caso | art. 11, II, e, quando aplicável; legislação específica | obrigatório |
| ferimento/saúde | orientação/proteção | alta | profissional autorizado | saúde, quando aplicável | art. 11, II, e, e/ou hipótese específica de saúde conforme agente e operação | obrigatório |
| violência sexual | proteção/saúde | alta | profissional autorizado | rede competente conforme caso | hipótese específica aplicável | obrigatório |
| arma/acesso a arma | segurança | alta quando relevante | profissional autorizado | autoridade competente conforme caso | hipótese aplicável ao tratamento/compartilhamento | obrigatório |
| criança/adolescente | proteção | mínima necessária | profissional autorizado | rede/autoridade competente | legislação específica + LGPD | obrigatório |
| pessoa idosa | proteção | mínima necessária | profissional autorizado | rede/autoridade competente | legislação específica + LGPD | obrigatório |
| pessoa com deficiência | proteção/acessibilidade | necessária | profissional autorizado | conforme caso | LGPD + legislação específica | obrigatório |
| contato da usuária | atendimento | necessária | equipe autorizada | conforme finalidade | hipótese aplicável | obrigatório |
| documento | finalidade específica | estritamente necessária | profissional autorizado | somente se fundamentado | hipótese aplicável | obrigatório |
| imagem | proteção/documentação | estritamente necessária | profissional autorizado | somente se fundamentado | hipótese aplicável | obrigatório |
| áudio | proteção/documentação | estritamente necessária | profissional autorizado | somente se fundamentado | hipótese aplicável | obrigatório |
| vídeo | proteção/documentação | estritamente necessária | profissional autorizado | somente se fundamentado | hipótese aplicável | obrigatório |

> **A coluna “fundamento a validar” é intencional.** Ela impede que a equipe técnica transforme esta matriz preliminar em parecer jurídico automático.

---

# 8. Consentimento

Quando a base jurídica for consentimento, ele deverá ser:

- livre;
- informado;
- inequívoco;
- específico para finalidade determinada;
- destacado quando envolver dado sensível.

A LGPD define consentimento como manifestação livre, informada e inequívoca para finalidade determinada; para dados sensíveis, o art. 11 exige consentimento específico e destacado para finalidades específicas. citeturn0search0

### Não utilizar

> “Aceito tudo.”

### Preferir

> “Autorizo o tratamento destas informações para a finalidade X.”

---

# 9. Consentimento não é autorização universal

A aceitação do formulário não autoriza automaticamente:

- acesso por diretores;
- acesso por associados;
- acesso por desenvolvedores;
- compartilhamento com órgãos;
- divulgação;
- uso para treinamento;
- uso para marketing;
- conservação indefinida.

Cada operação precisa de finalidade e fundamento próprios.

---

# 10. Proteção da vida e da integridade

A LGPD prevê, para dados sensíveis, tratamento sem consentimento quando indispensável à proteção da vida ou da incolumidade física do titular ou de terceiro. citeturn0search0

### Aplicação institucional

Quando houver situação de perigo grave e atual, a FAM deverá avaliar:

1. qual dado é necessário;
2. qual ação é necessária;
3. quem é o destinatário competente;
4. qual é a finalidade;
5. qual fundamento jurídico sustenta a operação;
6. como registrar a decisão.

### Proibição

Não transformar “proteção da vida” em justificativa genérica para qualquer acesso.

---

# 11. Tutela da saúde

A LGPD estabelece hipótese específica para tutela da saúde, limitada a procedimento realizado por profissionais de saúde, serviços de saúde ou autoridade sanitária. citeturn0search0

Portanto:

> **A FAM não deverá declarar que qualquer tratamento de dado de saúde realizado pela plataforma está automaticamente amparado pela “tutela da saúde”.**

É necessário analisar o papel efetivamente exercido pela FAM e a operação concreta.

---

# 12. Crianças e adolescentes

O tratamento deverá ser integrado ao JUR-01 e às normas específicas de proteção.

A plataforma deve priorizar:

- proteção;
- minimização;
- confidencialidade;
- não revitimização;
- encaminhamento à rede competente.

Não utilizar a plataforma para produzir investigação própria.

---

# 13. Pessoa idosa

O tratamento deverá observar o Estatuto da Pessoa Idosa e o fluxo específico definido no JUR-01.

A FAM deve distinguir:

> **deveres gerais de proteção e comunicação**

de:

> **obrigações específicas aplicáveis aos serviços de saúde.**

---

# 14. Compartilhamento com órgãos públicos

O simples fato de um destinatário ser órgão público não torna qualquer compartilhamento automaticamente permitido.

O compartilhamento deverá considerar:

- competência do destinatário;
- finalidade;
- necessidade;
- fundamento;
- quantidade de dados;
- segurança;
- registro.

A própria ANPD orienta que o compartilhamento deve observar a finalidade e a necessidade, e que o uso de dados pelo Poder Público deve estar relacionado às competências legais e às finalidades específicas aplicáveis. citeturn0search23turn0search3

---

# 15. Matriz de órgãos e finalidade

| Destinatário | Possível finalidade | Regra |
|---|---|---|
| CRAS/rede socioassistencial | proteção/assistência | somente dados necessários ao atendimento |
| Conselho Tutelar | proteção de criança/adolescente | fluxo específico |
| Ministério Público | atuação institucional/defesa de direitos | competência e finalidade específicas |
| autoridade policial/delegacia | segurança/investigação oficial | somente conforme fundamento e necessidade |
| serviço de saúde | atendimento de saúde | somente dados necessários |
| autoridade sanitária | finalidade sanitária legal | conforme competência |
| outros órgãos públicos | proteção/atendimento | validar competência e fundamento |

---

# 16. Regra do “mínimo necessário”

Antes de qualquer compartilhamento, o profissional deverá responder:

> **O destinatário precisa de todo o conteúdo?**

Se não:

> **Enviar somente o necessário.**

### Exemplo

Se a finalidade for atendimento médico:

**pode ser necessário:**
- identificação;
- informação essencial sobre o ferimento;
- contexto mínimo relevante.

**pode não ser necessário:**
- histórico completo da plataforma;
- arquivos sem relação;
- informações administrativas;
- conversas internas.

---

# 17. Compartilhamento integral proibido por padrão

O sistema não deverá possuir botão genérico:

> **“Enviar todo o caso”.**

O compartilhamento deverá ser composto por:

- destinatário;
- finalidade;
- campos selecionados;
- arquivos selecionados;
- justificativa;
- confirmação;
- registro.

---

# 18. Regra para diretores e administradores

### Não permitido por cargo

- consultar casos por curiosidade;
- visualizar relatos;
- baixar arquivos;
- exportar banco;
- encaminhar informação pessoal;
- compartilhar dados em grupos internos.

### Permitido

Acesso estritamente necessário para função institucional específica e previamente autorizada.

---

# 19. Regra para desenvolvedores

Desenvolvedores não deverão acessar dados reais sensíveis de produção para:

- testar telas;
- corrigir layout;
- reproduzir bugs comuns;
- realizar demonstrações;
- treinamento.

Preferência:

> **dados fictícios ou adequadamente anonimizados.**

---

# 20. Regra para associados e voluntários

Ser associado ou voluntário não confere acesso a dados de atendimento.

Mesmo que a pessoa:

- conheça a usuária;
- seja amiga;
- seja diretora;
- seja fundadora;
- seja parceira;
- tenha participado da criação da plataforma.

---

# 21. Regra para profissionais credenciados

O profissional deverá possuir:

- identificação individual;
- credenciamento vigente;
- perfil compatível;
- finalidade profissional;
- acesso mínimo;
- obrigação de confidencialidade;
- registro de atividade;
- possibilidade de auditoria.

---

# 22. Matriz “PODE / NÃO PODE”

| Operação | Regra |
|---|---|
| profissional autorizado acessar caso necessário | **PODE** |
| diretor acessar por cargo | **NÃO PODE** |
| associado acessar | **NÃO PODE** |
| desenvolvedor acessar produção sem necessidade | **NÃO PODE** |
| enviar todo o cadastro a órgão público | **NÃO PODE por padrão** |
| enviar dados mínimos necessários | **PODE quando juridicamente fundamentado** |
| registrar acesso | **DEVE** |
| compartilhar senha | **NÃO PODE** |
| usar dado real em teste | **NÃO PODE por padrão** |
| anonimizar para estatística | **DEVE SER PREFERIDO quando possível** |
| manter dado indefinidamente | **NÃO PODE sem fundamento de conservação** |

---

# 23. Registro de decisão

Todo compartilhamento de dados sensíveis deverá gerar registro contendo:

- identificador do caso;
- data/hora;
- responsável;
- destinatário;
- finalidade;
- fundamento jurídico selecionado;
- dados compartilhados;
- arquivos compartilhados;
- justificativa;
- método de envio;
- status.

---

# 24. Registro de negativa

Também deverá ser possível registrar:

> **“Compartilhamento não realizado.”**

Com motivo:

- ausência de necessidade;
- ausência de fundamento;
- destinatário inadequado;
- solicitação excessiva;
- informação insuficiente;
- risco de exposição;
- outro motivo documentado.

---

# 25. Fluxo técnico de compartilhamento

```text
SOLICITAÇÃO
    ↓
IDENTIFICAÇÃO DO DESTINATÁRIO
    ↓
FINALIDADE
    ↓
FUNDAMENTO JURÍDICO
    ↓
ANÁLISE DE NECESSIDADE
    ↓
SELEÇÃO DOS DADOS MÍNIMOS
    ↓
SELEÇÃO DE ARQUIVOS
    ↓
CONFIRMAÇÃO PROFISSIONAL
    ↓
ENVIO SEGURO
    ↓
REGISTRO
    ↓
AUDITORIA
```

---

# 26. Requisitos técnicos

### JUR-02-TEC-01
Cada finalidade deve possuir código próprio.

### JUR-02-TEC-02
Cada fluxo de compartilhamento deve possuir destinatário definido.

### JUR-02-TEC-03
O sistema deve registrar a finalidade do compartilhamento.

### JUR-02-TEC-04
O sistema deve impedir compartilhamento genérico de todo o cadastro.

### JUR-02-TEC-05
O sistema deve permitir seleção granular de dados.

### JUR-02-TEC-06
O sistema deve permitir seleção granular de arquivos.

### JUR-02-TEC-07
O sistema deve exigir profissional autorizado para operação sensível.

### JUR-02-TEC-08
O sistema deve registrar a base/fundamento jurídico definido pela governança.

### JUR-02-TEC-09
O sistema deve registrar a decisão e o responsável.

### JUR-02-TEC-10
O sistema deve possuir trilha de auditoria.

### JUR-02-TEC-11
O sistema deve bloquear acesso por cargo sem autorização funcional.

### JUR-02-TEC-12
O sistema deve separar produção, homologação e desenvolvimento.

---

# 27. Modelo de autorização

Antes do envio:

> **Finalidade:** proteção/atendimento/encaminhamento  
> **Destinatário:** [órgão/serviço]  
> **Fundamento:** [selecionado na matriz jurídica aprovada]  
> **Dados selecionados:** [lista]  
> **Arquivos selecionados:** [lista]  
> **Responsável:** [profissional]  
> **Data/hora:** [registro automático]

---

# 28. Transparência para a usuária

Quando o compartilhamento puder ser informado previamente, apresentar:

> **Suas informações poderão ser encaminhadas somente quando houver necessidade e fundamento para isso. Sempre que possível e compatível com sua segurança, informaremos quais informações serão encaminhadas, para quem e com qual finalidade.**

Não prometer:

> “Nunca compartilharemos seus dados.”

---

# 29. Direitos da titular

A plataforma deverá permitir o exercício dos direitos previstos na LGPD dentro das condições legais aplicáveis.

Entre eles estão direitos relacionados a:

- confirmação da existência de tratamento;
- acesso;
- correção;
- informações sobre compartilhamento;
- eliminação quando cabível;
- revogação do consentimento quando essa for a base aplicável.

A implementação desses direitos deverá ser detalhada na futura política de privacidade e procedimento de atendimento ao titular.

---

# 30. Retenção

O JUR-02 não fixa sozinho os prazos de retenção.

Os prazos serão definidos na:

> **POL-ARQ-01 — Política de Arquivos, Segurança, Retenção e Exclusão.**

A finalidade do tratamento não deve ser prolongada artificialmente para justificar retenção indefinida.

---

# 31. Segurança

A FAM deverá aplicar medidas técnicas e administrativas proporcionais ao risco.

A LGPD estabelece os princípios de segurança, prevenção, responsabilização e prestação de contas, entre outros. citeturn0search5

---

# 32. Relatório de Impacto

A LGPD define relatório de impacto à proteção de dados pessoais como documentação do controlador que descreve processos de tratamento capazes de gerar riscos às liberdades civis e direitos fundamentais, bem como medidas de mitigação. citeturn0search0

Dada a natureza da plataforma, a FAM deverá avaliar formalmente com o responsável jurídico/DPO se é recomendável ou necessária a elaboração de um:

> **RIPD — Relatório de Impacto à Proteção de Dados Pessoais.**

---

# 33. Governança

Alterações que impliquem:

- nova finalidade;
- nova categoria de dado;
- novo destinatário;
- novo tipo de arquivo;
- nova base jurídica;
- novo fluxo de emergência;
- alteração de retenção;
- alteração de acesso;

deverão gerar revisão do JUR-02.

---

# 34. Regra para desenvolvimento

O desenvolvedor não deverá decidir:

> “qual artigo da LGPD usar”.

O desenvolvimento deverá implementar:

> **regras aprovadas pela governança jurídica e institucional.**

Fluxo:

```text
JUR-02
  ↓
REGRA DE NEGÓCIO
  ↓
REQUISITO FUNCIONAL
  ↓
IMPLEMENTAÇÃO
  ↓
TESTE
  ↓
AUDITORIA
```

---

# 35. Matriz mínima para banco de dados

Sugestão de campos:

| Campo | Finalidade |
|---|---|
| `purpose_id` | identificar finalidade |
| `legal_basis_id` | identificar fundamento aprovado |
| `recipient_id` | destinatário |
| `access_profile_id` | perfil de acesso |
| `sharing_reason` | justificativa |
| `shared_fields` | campos enviados |
| `shared_files` | arquivos enviados |
| `professional_id` | responsável |
| `timestamp` | data/hora |
| `audit_id` | trilha de auditoria |
| `retention_rule_id` | regra de retenção |

---

# 36. Regra institucional sobre vantagem econômica

A plataforma não deverá utilizar os dados sensíveis coletados para exploração econômica incompatível com sua finalidade.

A LGPD estabelece restrições específicas ao compartilhamento de dados pessoais sensíveis, inclusive dados de saúde, quando houver objetivo de obter vantagem econômica. citeturn0search0

---

# 37. Regra de interpretação

Quando houver dúvida entre:

- coletar mais ou menos;
- compartilhar mais ou menos;
- manter mais ou menos;
- permitir mais ou menos acesso;

a regra operacional será:

> **menor exposição compatível com a finalidade legítima.**

Isso não substitui análise jurídica quando houver obrigação legal específica.

---

# 38. Documentos relacionados

- Documento 2A — Matriz Comparativa;
- Documento 2B — Núcleo Metodológico;
- Princípios Institucionais;
- Matriz de Necessidades;
- OC-04 — Matriz de Situações de Risco e Respostas;
- JUR-01 — Fluxos Especiais de Proteção;
- POL-ARQ-01 — Política de Arquivos, Segurança, Retenção e Exclusão;
- AC-02 — Credenciamento Profissional;
- OC-01 — Matriz de Órgãos e Encaminhamento;
- OC-02 — Matriz de Evidências e Arquivos;
- OC-03 — Fluxo de Encaminhamento e Informação à Usuária.

---

# 39. Próximos documentos

Após validação do JUR-02:

**JUR-03 — Política de Atendimento e Não Revitimização**

**JUR-04 — Protocolo de Incidentes e Violações de Dados**

**JUR-05 — Matriz de Responsabilidades Institucionais**

Depois:

> **Revisão conjunta OC-04 + JUR-01 + JUR-02**

Somente então consolidar a especificação técnica da plataforma.

---

# 40. Aprovação

| Área | Situação |
|---|---|
| Direção institucional | Pendente |
| Assessoria jurídica | Pendente |
| Proteção de dados / encarregado | Pendente |
| Responsável metodológico | Pendente |
| Responsável técnico | Pendente |
| UX/UI | Pendente |

---

# 41. Referências oficiais

- Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais. citeturn0search0turn0search5
- ANPD — Perguntas Frequentes sobre LGPD. citeturn0search1
- ANPD — Guia Orientativo sobre Tratamento de Dados Pessoais pelo Poder Público. citeturn0search23turn0search2
- ANPD — regulamentações vigentes. citeturn0search6

---

# 42. Princípio final

> **A FAM não deve perguntar apenas “podemos acessar este dado?”. Deve perguntar: “quem precisa dele, para qual finalidade, com qual fundamento, durante quanto tempo e qual é o mínimo necessário?”**

Essa pergunta deve orientar a arquitetura jurídica, técnica e operacional da Plataforma FAM.
