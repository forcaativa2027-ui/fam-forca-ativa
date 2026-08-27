# DEC-01 — Resolução dos 4 Pontos Críticos

**Instituição:** Força Ativa da Mulher — FAM  
**Plataforma:** Plataforma FAM  
**Versão:** 1.0  
**Data:** 25/08/2026  
**Status:** decisão executiva + especificação preliminar para validação jurídica  
**Escopo:** crianças/adolescentes; bases jurídicas; retenção; responsáveis institucionais

> **Nota:** este documento organiza decisões de governança e requisitos para a plataforma. A validação jurídica final deve ser realizada pela assessoria jurídica/encarregado da FAM antes da entrada em produção.

---

# 1. Objetivo

Resolver os quatro bloqueadores identificados na REV-01 sem transformar a plataforma em órgão de investigação, serviço policial, serviço de saúde ou órgão de proteção estatal.

A regra central permanece:

> **A FAM orienta, identifica sinais de atenção, protege a informação e conecta a usuária à rede competente. Não investiga, não produz laudo e não confirma crime.**

---

# 2. DEC-01 — Crianças e adolescentes

## 2.1 Decisão institucional

A resposta **“SIM”** para:

> **Há crianças ou adolescentes em situação de risco?**

não deverá gerar investigação adicional dentro da plataforma.

O fluxo deverá priorizar:

1. segurança imediata;
2. proteção da criança/adolescente;
3. orientação objetiva;
4. acionamento da rede competente;
5. coleta mínima necessária;
6. registro controlado.

A Lei nº 13.431/2017 estabelece o sistema de garantia de direitos de crianças e adolescentes vítimas ou testemunhas de violência e diferencia escuta especializada de depoimento especial. A escuta especializada é limitada ao relato estritamente necessário à sua finalidade; o depoimento especial ocorre perante autoridade policial ou judiciária. citeturn0search0turn0search1

## 2.2 Regra de não investigação

A plataforma NÃO deverá:

- interrogar criança ou adolescente;
- solicitar narrativa detalhada para “comprovar” a violência;
- pedir que a pessoa repita várias vezes o relato;
- tentar determinar autoria;
- classificar a informação como crime confirmado;
- produzir laudo;
- orientar confronto com o suposto agressor;
- substituir escuta especializada ou depoimento especial.

## 2.3 Revelação espontânea

Se uma criança/adolescente ou terceiro revelar espontaneamente uma situação de violência:

> **Não peça detalhes além do necessário para orientar e proteger.**

A Lei nº 13.431/2017 prevê procedimentos próprios para a revelação espontânea e assegura proteção contra sofrimento e revitimização. citeturn0search0

## 2.4 Encaminhamento

Para situações de violência envolvendo criança/adolescente, a plataforma deverá disponibilizar orientação para a rede competente.

O fluxo institucional deverá contemplar, conforme o caso:

- Conselho Tutelar;
- autoridade policial;
- serviço oficial de recebimento/monitoramento de denúncias;
- Ministério Público, quando aplicável ao fluxo da autoridade competente;
- saúde;
- assistência social;
- demais serviços da rede de proteção.

A Lei nº 13.431/2017 determina que qualquer pessoa que tenha conhecimento ou presencie ação ou omissão que constitua violência contra criança ou adolescente comunique imediatamente ao serviço de recebimento e monitoramento de denúncias, ao Conselho Tutelar ou à autoridade policial; esses órgãos, por sua vez, cientificarão o Ministério Público. citeturn0search0

## 2.5 Regra importante

**CRAS não será apresentado como único ou automático destino para todo caso de violência contra criança/adolescente.**

A assistência social integra a rede, mas o encaminhamento deverá considerar a natureza e urgência da situação.

## 2.6 UX proposta

Após AR-05 = SIM:

> ### Precisamos priorizar a proteção
>
> Você informou que há uma criança ou adolescente em situação de risco.
>
> A FAM não realiza investigação nem substitui os órgãos de proteção.
>
> **Se houver perigo imediato, procure um local seguro e acione o serviço de emergência adequado.**
>
> Em situações de violência, procure a rede oficial de proteção, como o Conselho Tutelar ou a autoridade policial.
>
> **Você não precisa fornecer detalhes desnecessários para receber orientação inicial.**

Botão:

`Ver orientação de proteção`

Não mostrar:

`Conte exatamente o que aconteceu`

---

# 3. DEC-02 — Bases jurídicas

## 3.1 Decisão institucional

Nenhum fluxo deverá ser colocado em produção com uma base jurídica genérica definida apenas pelo desenvolvedor ou pela equipe de atendimento.

Cada operação deverá possuir:

```text
DADO
↓
FINALIDADE
↓
NECESSIDADE
↓
BASE JURÍDICA
↓
ACESSO
↓
COMPARTILHAMENTO
↓
RETENÇÃO
↓
REGISTRO
```

O JUR-02 já estabelece essa estrutura e determina validação jurídica antes da produção. fileciteturn2file2L277-L296

## 3.2 Dados sensíveis

A LGPD define como sensíveis, entre outros, dados referentes à saúde e à vida sexual. O art. 11 prevê hipóteses específicas para seu tratamento, incluindo proteção da vida ou incolumidade física e tutela da saúde em procedimento realizado por profissionais/serviços de saúde ou autoridade sanitária. citeturn0search2

Portanto:

> **A plataforma não deverá usar “consentimento” como solução automática para todos os tratamentos.**

A base jurídica deve corresponder à operação concreta.

## 3.3 Matriz preliminar de enquadramento

| Operação | Enquadramento a validar |
|---|---|
| orientação inicial | finalidade específica + base aplicável validada juridicamente |
| proteção diante de perigo à vida/integridade | proteção da vida/incolumidade, quando presentes os requisitos legais |
| atendimento/encaminhamento de saúde | tutela da saúde somente dentro dos limites legais |
| cumprimento de obrigação legal | obrigação legal/regulatória quando existente |
| exercício regular de direitos | quando a operação efetivamente se enquadrar |
| compartilhamento com autoridade competente | fundamento correspondente à operação e ao destinatário |
| armazenamento para defesa institucional | somente se houver fundamento aplicável e necessidade |
| estatística | preferir anonimização quando possível |

Esta tabela é **matriz de validação**, não autorização automática.

## 3.4 Regra técnica

O sistema não deverá permitir que um usuário simplesmente escolha:

`Base jurídica = outra`

sem justificativa e governança.

As bases disponíveis em produção deverão ser cadastradas pela governança.

## 3.5 Requisito

Criar entidade/configuração:

```text
legal_basis
purpose_code
data_category
recipient_type
retention_class
approved_by
approved_at
version
```

Alterações deverão gerar nova versão.

---

# 4. DEC-03 — Retenção e exclusão

## 4.1 Decisão principal

A retenção **não será definida por um único prazo para todo o banco**.

Serão separadas pelo menos cinco classes:

| Classe | Conteúdo | Regra |
|---|---|---|
| R1 | respostas da ferramenta sem atendimento continuado | prazo operacional definido pela FAM |
| R2 | arquivos enviados | conforme finalidade específica |
| R3 | registros de atendimento/encaminhamento | conforme necessidade e obrigação aplicável |
| R4 | logs de segurança/auditoria | conforme política de segurança e necessidade de responsabilização |
| R5 | incidentes/violações | preservar enquanto necessário à investigação, resposta, defesa e obrigações aplicáveis |

A LGPD estabelece que o término do tratamento ocorre, entre outras hipóteses, quando a finalidade é alcançada ou os dados deixam de ser necessários, e prevê eliminação após o término, ressalvadas hipóteses de conservação previstas no art. 16. citeturn1search0turn1search1

## 4.2 Revisão da regra de 30 dias

O prazo de **30 dias** não será aplicado automaticamente a todos os dados.

Ele permanecerá, por ora, como **parâmetro operacional proposto para arquivos da Classe R1**, quando não houver atendimento continuado, obrigação de conservação ou outra justificativa documentada.

Não será utilizado como regra para:

- logs de segurança;
- registros de incidentes;
- documentos necessários à defesa de direitos;
- dados sujeitos a obrigação legal;
- registros de atendimento que ainda estejam em finalidade ativa.

## 4.3 Legal hold

Quando houver:

- incidente;
- investigação;
- demanda judicial/administrativa;
- obrigação legal;
- solicitação formal de autoridade;
- necessidade documentada de preservação para exercício regular de direitos;

o dado poderá ser colocado em:

`LEGAL_HOLD`

Enquanto estiver nesse estado, a exclusão automática ficará suspensa para o conjunto estritamente necessário.

## 4.4 Ciclo de vida

```text
ACTIVE
  ↓
RETENTION_REVIEW
  ↓
┌─────────────────────────────┐
│ finalidade ainda existe?    │
└─────────────────────────────┘
       ↓ SIM              ↓ NÃO
     ACTIVE          há fundamento?
                         ↓ SIM      ↓ NÃO
                    LEGAL_HOLD    DELETE
```

## 4.5 Backups

A exclusão lógica não significa necessariamente destruição instantânea de todas as cópias de backup.

A arquitetura deverá possuir:

- prazo de retenção de backup;
- rotação;
- controle de acesso;
- criptografia;
- procedimento de restauração;
- procedimento de expiração;
- documentação de exclusão.

## 4.6 Requisito técnico

Nenhum desenvolvedor deverá implementar:

```text
deleteAfter = 30 days
```

como regra universal.

A retenção deverá ser configurável por classe e finalidade.

---

# 5. DEC-04 — Responsáveis institucionais

## 5.1 Decisão

O RACI será mantido por **funções**, não por nomes pessoais.

Isso evita que a arquitetura dependa da pessoa que atualmente ocupa determinado cargo.

O JUR-05 já estabelece que autorização decorre de função, necessidade, finalidade e controles institucionais. fileciteturn3file2

## 5.2 Funções mínimas

### Direção/Governança

Responsável por:

- aprovar políticas;
- designar responsáveis;
- prover recursos;
- aprovar exceções estratégicas;
- supervisionar conformidade.

Não possui acesso automático ao conteúdo.

### Proteção de Dados / Encarregado

Quando formalmente designado:

- orientar proteção de dados;
- atuar como canal institucional;
- acompanhar incidentes;
- apoiar direitos dos titulares;
- orientar governança.

O acesso ao conteúdo será limitado ao necessário.

### Jurídico

Responsável por:

- validar bases jurídicas;
- validar fluxos excepcionais;
- orientar compartilhamentos de maior risco;
- analisar obrigações legais;
- apoiar legal hold.

### Profissional especializado

Pode acessar somente:

- casos dentro de sua atribuição;
- dados necessários;
- finalidade definida;
- credenciamento vigente;
- autorização correspondente.

### Atendimento

Acessa apenas o conjunto necessário à atividade de atendimento.

### Segurança da Informação

Administra controles de segurança, sem acesso automático ao conteúdo.

### Tecnologia

Administra infraestrutura e software.

Não utiliza dados reais sensíveis para desenvolvimento/teste por padrão. O JUR-02 já estabelece preferência por dados fictícios ou adequadamente anonimizados. fileciteturn3file3L200-L214

### Auditoria

Acessa registros necessários à auditoria, sem acesso irrestrito ao conteúdo.

## 5.3 Regra absoluta

> **Administrador do sistema não é sinônimo de leitor dos casos.**

A plataforma deverá separar:

```text
ADMINISTRAÇÃO TÉCNICA
≠
ACESSO AO CONTEÚDO
```

---

# 6. RACI consolidado para os quatro pontos

| Atividade | Direção | Jurídico | Proteção de Dados | Profissional | TI | Segurança | Auditoria |
|---|---|---|---|---|---|---|---|
| Aprovar política | A | C | C | I | C | C | I |
| Validar base jurídica | I | A/R | C | C | I | I | I |
| Definir retenção | A | C/R | R | C | C | C | I |
| Definir fluxo criança/adolescente | I | A/R | C | C | I | I | I |
| Executar encaminhamento | I | C | I | A/R | I | I | I |
| Implementar controles | I | C | C | I | A/R | R | I |
| Acessar caso | I | C | C | R | I | I | I |
| Acessar por exceção | A | C/R | C | C | R técnico | R | I |
| Colocar em legal hold | I | A/R | R | C | R técnico | C | I |
| Executar exclusão | I | C | A | I | R | C | I |
| Auditar acesso | I | C | C | I | C | C | A/R |

**Legenda:**  
A = Accountable / responsável final  
R = Responsible / executa  
C = Consulted / consultado  
I = Informed / informado

---

# 7. O que muda imediatamente na plataforma

## 7.1 Formulário

A resposta AR-05 deverá ser tratada como evento de proteção especial.

Não permitir que o sistema gere:

> “Crime confirmado”

ou:

> “Denúncia confirmada”.

Usar:

> **“Foi identificado um sinal que pode exigir proteção especial.”**

## 7.2 Compartilhamento

Nenhum botão:

`Enviar para órgão público`

deve funcionar sem:

- destinatário;
- finalidade;
- fundamento aprovado;
- seleção granular;
- responsável;
- registro.

O JUR-02 já exige essa sequência. fileciteturn2file1L182-L206

## 7.3 Arquivos

Manter:

> **O envio de arquivos é opcional.**

e:

> **Envie somente o que for necessário.**

A política de arquivos já estabelece esses textos e critérios. fileciteturn2file3L375-L404

## 7.4 Acesso

Implementar RBAC/ABAC com:

```text
usuário
+
função
+
credenciamento
+
finalidade
+
necessidade
+
caso
+
permissão
```

Nunca:

```text
cargo = acesso total
```

---

# 8. Quatro bloqueadores — status após decisão

| Bloqueador | Nova situação |
|---|---|
| Crianças/adolescentes | 🟠 Resolvido em nível institucional; necessita validação jurídica final |
| Bases jurídicas | 🟠 Estrutura definida; bases concretas dependem de aprovação jurídica |
| Retenção | 🟠 Modelo definido; prazos finais ainda dependem de governança |
| Responsáveis | 🟢 Estrutura funcional definida; nomes/designações pendentes |

**Conclusão:** os quatro bloqueadores deixam de impedir a arquitetura conceitual, mas **não autorizam por si só a entrada em produção**.

---

# 9. Decisões que devem ser congeladas

A partir desta versão, nenhuma equipe técnica deverá alterar sem revisão cruzada:

1. definição de sinal de atenção;
2. fluxo de criança/adolescente;
3. bases jurídicas;
4. classificação de dados;
5. retenção;
6. legal hold;
7. perfis de acesso;
8. compartilhamento;
9. RACI;
10. textos críticos de orientação.

---

# 10. Próxima etapa documental

Com os quatro pontos resolvidos em nível executivo, o próximo documento deverá ser:

**REV-02 — Matriz de Conflitos, Lacunas e Decisões v1.0**

Ele transformará estas decisões em alterações específicas nos documentos existentes.

Depois:

**TEC-01 — Especificação Técnica Consolidada**

Somente então:

**UX-01 — Catálogo de Telas, Estados, Mensagens e Fluxos**

e posteriormente o backlog de desenvolvimento.

---

# 11. Fontes jurídicas principais para validação

- Lei nº 13.431/2017 — Sistema de garantia de direitos da criança e do adolescente vítima ou testemunha de violência. citeturn0search0turn0search1
- Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais. citeturn0search2turn1search0
- Lei nº 10.741/2003 — Estatuto da Pessoa Idosa, com redação atualizada. citeturn0search3

---

# 12. Aprovação

| Área | Status |
|---|---|
| Direção FAM | Pendente |
| Jurídico | Pendente |
| Proteção de Dados / Encarregado | Pendente |
| Segurança | Pendente |
| Tecnologia | Pendente |
| UX/UI | Pendente |

**Status geral:** 🟠 **DECISÕES EXECUTIVAS CONSOLIDADAS — VALIDAÇÃO JURÍDICA E FORMALIZAÇÃO PENDENTES.**
