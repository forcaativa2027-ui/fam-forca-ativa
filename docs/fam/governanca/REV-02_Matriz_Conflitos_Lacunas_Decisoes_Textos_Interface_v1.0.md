# REV-02 — Matriz de Conflitos, Lacunas e Decisões
## + Catálogo de Textos Finais de Interface

**Instituição:** Força Ativa da Mulher — FAM  
**Plataforma:** Plataforma FAM  
**Versão:** 1.0  
**Data:** 25/08/2026  
**Status:** consolidação executiva + técnica + UX, sujeita à validação jurídica final

> Este documento transforma as decisões da REV-01 e DEC-01 em alterações concretas nos documentos, requisitos técnicos e textos de interface. Não substitui parecer jurídico.

---

# 1. Regra-mestra

A plataforma deve funcionar como:

**orientação + identificação de sinais de atenção + proteção + encaminhamento**

e não como:

**investigação + diagnóstico + perícia + confirmação de crime.**

A LGPD exige finalidade, adequação e necessidade no tratamento de dados pessoais e classifica dados de saúde e vida sexual como dados pessoais sensíveis. citeturn0search0

---

# 2. Matriz executiva

| ID | Conflito/lacuna | Decisão | Documento afetado | Requisito técnico | UX | Status |
|---|---|---|---|---|---|---|
| RC-01 | Criança/adolescente | Fluxo especial, sem investigação | OC-04/JUR-01 | estado AR-05 + fluxo protegido | telas específicas | 🟠 |
| RC-02 | Bases jurídicas | Base por operação | JUR-02 | catálogo versionado de bases | aviso contextual | 🔴 |
| RC-03 | Retenção | 5 classes | POL-ARQ/JUR-02/JUR-04 | policy engine | informação de retenção | 🟠 |
| RC-04 | Responsabilidades | RACI por função | JUR-05 | RBAC/ABAC | sem exposição interna | 🟢 |
| RC-05 | Emergência | Prioridade absoluta | OC-04/JUR-01/JUR-03 | emergency state | tela imediata | 🟠 |
| RC-06 | Compartilhamento | Mínimo necessário | JUR-02/OC-01 | seleção granular + log | confirmação clara | 🟠 |
| RC-07 | Arquivos | Ciclo de vida completo | POL-ARQ | validação/cripto/expiração | aviso antes do upload | 🟠 |
| RC-08 | Acesso técnico | Segregação | JUR-05/POL-ARQ | acesso excepcional auditável | não aplicável | 🟢 |
| RC-09 | Incidentes | preservação + resposta | JUR-04 | legal hold + incident log | comunicação controlada | 🟠 |
| RC-10 | Terminologia | glossário único | todos | catálogo de strings | linguagem padronizada | 🟢 |

---

# 3. RC-01 — Crianças e adolescentes

## Decisão

Quando a usuária indicar situação de risco envolvendo criança/adolescente:

- não iniciar interrogatório;
- não solicitar narrativa detalhada;
- não pedir confirmação repetida;
- não classificar crime;
- não orientar confronto;
- priorizar proteção e rede competente.

A Lei 13.431/2017 estabelece escuta especializada perante órgão da rede de proteção, limitada ao necessário, e depoimento especial perante autoridade policial ou judiciária. Também prevê procedimentos próprios diante da revelação espontânea e proteção contra revitimização. citeturn0search1

## Texto de interface

### Tela

**Há uma criança ou adolescente em situação de risco?**

Se você acredita que uma criança ou adolescente pode estar em perigo, podemos mostrar orientações de proteção.

**Você não precisa contar detalhes desnecessários para receber a orientação inicial.**

Opções:

- **Sim**
- **Não**
- **Prefiro não responder**

### Após “Sim”

**Vamos priorizar a proteção**

Você informou que há uma criança ou adolescente em situação de risco.

A FAM não realiza investigação, não confirma crimes e não substitui os órgãos da rede de proteção.

Se houver perigo imediato, procure um local seguro e acione o serviço de emergência adequado.

Em situações de violência, a orientação poderá indicar serviços oficiais de proteção, como Conselho Tutelar ou autoridade policial, conforme o caso.

**Você não precisa enviar fotos, vídeos, áudios ou documentos para receber esta orientação.**

Botões:

**Ver orientação de proteção**

**Voltar**

---

# 4. RC-02 — Bases jurídicas

## Decisão

A aplicação não terá uma “base jurídica padrão” para todo o sistema.

Cada operação deverá estar associada a uma configuração aprovada:

```text
purpose_code
data_category
legal_basis
recipient_type
retention_class
approved_by
version
effective_at
```

A LGPD estabelece hipóteses distintas para tratamento de dados pessoais e, para dados sensíveis, hipóteses específicas no art. 11. Portanto, o enquadramento deve ser feito por operação e finalidade. citeturn0search0

## Texto de interface — informação geral

**Como usamos suas informações**

Pedimos apenas as informações necessárias para oferecer a orientação solicitada, proteger seus dados e, quando aplicável, orientar o acesso a serviços competentes.

Algumas informações podem ser consideradas dados pessoais sensíveis. O tratamento dessas informações segue as regras aplicáveis de proteção de dados.

**Leia a Política de Privacidade**

## Não usar

- “Ao continuar, você autoriza qualquer uso dos seus dados.”
- “Seus dados serão usados para qualquer finalidade necessária.”
- “Ao enviar, você concorda com todos os compartilhamentos.”

---

# 5. RC-03 — Retenção

## Decisão

Cinco classes:

**R1 — Respostas da ferramenta**  
**R2 — Arquivos**  
**R3 — Atendimento/encaminhamento**  
**R4 — Segurança/auditoria**  
**R5 — Incidentes/violações**

A LGPD prevê término do tratamento quando a finalidade é alcançada ou os dados deixam de ser necessários e disciplina hipóteses de conservação após o término. citeturn0search0

## Requisito

Nenhum prazo universal.

O sistema deve calcular a política por:

```text
classe
+
finalidade
+
status
+
legal_hold
+
obrigação aplicável
```

## Texto de interface

### Antes do envio

**Por quanto tempo essas informações serão mantidas?**

As informações serão mantidas somente pelo período necessário para a finalidade informada ou enquanto houver fundamento legal para sua conservação.

**Saiba mais sobre retenção e exclusão**

### Exclusão

**Solicitação de exclusão**

Você pode solicitar informações sobre os dados tratados pela FAM e, quando aplicável, sua exclusão.

Algumas informações podem precisar ser conservadas quando houver obrigação legal ou outra hipótese prevista em lei.

**Solicitar atendimento sobre meus dados**

---

# 6. RC-04 — Responsabilidades e acesso

## Decisão

O acesso depende de:

```text
função
+
necessidade
+
finalidade
+
credenciamento
+
permissão
```

Não depende simplesmente de cargo.

## Regra técnica

```text
administrator != case_reader
```

Acesso excepcional:

```text
solicitação
→ justificativa
→ autorização
→ acesso temporário
→ registro
→ encerramento
```

## Texto interno

**Acesso restrito**

Este conteúdo contém informações protegidas. O acesso é permitido somente a usuários autorizados, dentro de sua função e finalidade.

---

# 7. RC-05 — Emergência

## Decisão

Se houver perigo acontecendo agora, a interface deve interromper caminhos secundários e priorizar segurança.

## Tela

# Sua segurança vem primeiro

Você informou que pode existir perigo ou ameaça acontecendo agora.

Se você estiver em perigo imediato:

- procure um local seguro, se puder;
- evite confrontar a pessoa que ameaça você;
- procure o serviço de emergência adequado à sua situação.

A FAM não substitui serviços de emergência, polícia, saúde ou proteção pública.

**Ver orientação de segurança**

**Sair**

## Regra UX

Não exigir:

- login;
- anexos;
- cadastro;
- relato detalhado;

antes da orientação inicial de segurança.

---

# 8. RC-06 — Compartilhamento

## Decisão

Compartilhamento somente quando houver:

1. destinatário definido;
2. finalidade definida;
3. fundamento aplicável;
4. necessidade;
5. seleção mínima de dados;
6. responsável;
7. registro.

## Tela de confirmação

# Revise antes de compartilhar

Você está prestes a encaminhar informações para:

**[DESTINATÁRIO]**

**Finalidade:** [FINALIDADE]

Serão compartilhados:

☐ Informações básicas necessárias  
☐ Registro da orientação  
☐ Documento selecionado  
☐ Outro item autorizado

**Não serão enviados dados ou arquivos além dos selecionados.**

Botões:

**Confirmar encaminhamento**

**Voltar e revisar**

## Proibição

Nunca utilizar:

**“Enviar caso completo”**

como opção padrão.

---

# 9. RC-07 — Arquivos

## Decisão

Upload continua opcional.

Antes do upload:

**Você não precisa enviar arquivos para receber orientação inicial.**

Se decidir enviar:

**Envie somente arquivos necessários para a finalidade indicada.**

## Texto de erro

**Arquivo não aceito**

Este tipo de arquivo não pode ser enviado pela plataforma.

Consulte os formatos permitidos ou escolha outro arquivo.

## Arquivo excedendo limite

**Arquivo muito grande**

O tamanho máximo permitido para este tipo de arquivo é **[LIMITE]**.

## Upload concluído

**Arquivo recebido**

O arquivo foi enviado e será tratado conforme as regras de segurança, acesso e retenção da FAM.

---

# 10. RC-08 — Acesso técnico

## Decisão

TI e administradores de infraestrutura não recebem acesso automático ao conteúdo.

Dados reais sensíveis não devem ser usados em desenvolvimento/testes quando dados fictícios, anonimizados ou sintéticos forem suficientes.

## Requisito

Ambientes:

```text
produção
homologação
desenvolvimento
```

devem ser segregados.

---

# 11. RC-09 — Incidentes e preservação

## Decisão

Incidente gera:

```text
detecção
→ registro
→ contenção
→ avaliação
→ resposta
→ preservação
→ remediação
→ encerramento
```

Quando houver necessidade de preservar dados:

`LEGAL_HOLD = TRUE`

A exclusão automática ficará suspensa apenas para o conjunto necessário.

## Texto interno

**Preservação ativada**

Este conjunto de informações está sob preservação controlada. Rotinas automáticas de exclusão não devem removê-lo enquanto o período de preservação estiver vigente.

---

# 12. RC-10 — Glossário definitivo

| Termo | Usar | Evitar |
|---|---|---|
| Ferramenta de Orientação e Identificação de Sinais de Atenção | ✓ | “análise criminal” |
| sinal de atenção | ✓ | diagnóstico |
| orientação | ✓ | conclusão |
| encaminhamento | ✓ | denúncia automática |
| possível situação de risco | ✓ | crime confirmado |
| proteção | ✓ | investigação |
| profissional autorizado | ✓ | administrador com acesso total |
| arquivo enviado | ✓ | prova |
| informações protegidas | ✓ | informações secretas |
| rede competente | ✓ | “órgão que resolverá o caso” |

---

# 13. Catálogo de mensagens críticas

## Aviso geral

> **Esta ferramenta oferece orientação e ajuda a identificar sinais de atenção. Ela não confirma nem descarta crimes, não produz laudos e não substitui serviços de emergência, polícia, saúde ou atendimento profissional.**

## Não responder

> **Você pode preferir não responder. Isso não será interpretado como “não”.**

## Anexos

> **O envio de arquivos é opcional. Envie somente o que for necessário.**

## Privacidade

> **Suas informações são protegidas e o acesso é restrito conforme a finalidade e as autorizações aplicáveis.**

## Compartilhamento

> **Quando houver encaminhamento, serão compartilhadas somente as informações necessárias para a finalidade autorizada ou legalmente aplicável.**

## Encerramento

> **Se preferir, você pode sair desta ferramenta a qualquer momento.**

## Resultado

> **Foram identificados sinais que podem merecer atenção. Isso não significa que tenha ocorrido um crime nem substitui uma avaliação profissional.**

---

# 14. Requisitos técnicos derivados

| Código | Requisito |
|---|---|
| TEC-RC01 | estados SIM/NÃO/NÃO_RESPONDER separados |
| TEC-RC02 | motor de regras por finalidade |
| TEC-RC03 | catálogo versionado de bases jurídicas |
| TEC-RC04 | retenção por classe |
| TEC-RC05 | legal hold |
| TEC-RC06 | RBAC/ABAC |
| TEC-RC07 | acesso excepcional auditável |
| TEC-RC08 | seleção granular para compartilhamento |
| TEC-RC09 | log de compartilhamento |
| TEC-RC10 | segregação de ambientes |
| TEC-RC11 | validação de arquivo por tipo/tamanho |
| TEC-RC12 | expiração de links |
| TEC-RC13 | catálogo central de textos |
| TEC-RC14 | versionamento de textos críticos |
| TEC-RC15 | fluxo de emergência sem bloqueio por login |

---

# 15. Critérios de aceite

A funcionalidade não será considerada pronta se:

- “Prefiro não responder” virar “não”;
- a plataforma afirmar que um crime foi confirmado;
- upload for obrigatório sem justificativa;
- usuário administrativo puder ler qualquer caso;
- compartilhamento ocorrer sem destinatário e finalidade;
- retenção for aplicada por prazo universal;
- exclusão ignorar legal hold;
- fluxo de criança/adolescente solicitar investigação detalhada;
- texto de emergência exigir cadastro antes da orientação essencial;
- ambiente de teste utilizar dados reais sensíveis sem necessidade;
- texto jurídico aprovado for alterado diretamente no código.

---

# 16. Alterações documentais necessárias

| Documento | Alteração |
|---|---|
| OC-04 | incorporar estados e fluxo de emergência/criança |
| JUR-01 | incorporar fluxo especial consolidado |
| JUR-02 | incorporar matriz operacional de bases e compartilhamento |
| JUR-03 | incorporar catálogo de textos críticos |
| JUR-04 | incorporar legal hold e integração com retenção |
| JUR-05 | incorporar RACI definitivo por função |
| POL-ARQ-01 | incorporar classes R1-R5 e ciclo de vida |
| OC-01 | cruzar destinatários com finalidade/base/necessidade |

---

# 17. Governança de mudanças

Nenhuma alteração nos seguintes itens poderá ser feita apenas pela equipe de desenvolvimento:

- finalidade;
- base jurídica;
- destinatários;
- critérios de encaminhamento;
- retenção;
- exclusão;
- permissões;
- textos de emergência;
- textos de proteção de crianças/adolescentes.

Alterações deverão gerar nova versão documental e revisão cruzada quando afetarem outro documento.

---

# 18. Status

**REV-02:** consolidada em nível executivo + técnico + UX.

**Situação:**

🟢 princípios e linguagem geral consolidados  
🟠 fluxos especiais precisam validação jurídica e operacional  
🔴 bases jurídicas concretas ainda dependem de aprovação formal  
🟠 prazos finais de retenção dependem da matriz definitiva da FAM

## Próxima etapa

**TEC-01 — Especificação Técnica Consolidada da Plataforma FAM**

A TEC-01 deverá transformar os requisitos desta REV-02 em:

- arquitetura de dados;
- entidades;
- estados;
- permissões;
- APIs;
- logs;
- retenção;
- armazenamento;
- upload;
- fluxos;
- regras de negócio;
- critérios de aceite;
- segurança;
- observabilidade.

