# JUR-05 — Matriz de Responsabilidades Institucionais
## Governança, acesso a dados sensíveis e matriz RACI

**Instituição:** Força Ativa da Mulher — FAM  
**Plataforma:** Plataforma FAM  
**Versão:** 1.0  
**Data:** 24/08/2026  
**Status:** minuta institucional + técnica + RACI  
**Classificação:** governança, proteção de dados, segurança e responsabilidades

> **Nota de validação:** este documento deverá ser aprovado pela direção da FAM e validado juridicamente, especialmente quanto às funções de controlador, operador, encarregado, profissionais habilitados e procedimentos de compartilhamento.

---

# 1. Objetivo

Definir claramente:

- quem pode acessar dados;
- quem pode visualizar dados sensíveis;
- quem pode decidir sobre encaminhamentos;
- quem pode autorizar compartilhamentos;
- quem responde por incidentes;
- quem administra a tecnologia;
- quem pode alterar conteúdos;
- quem não possui autorização;
- quais responsabilidades permanecem mesmo após encerramento do vínculo.

O objetivo é impedir que a expressão **“sou da FAM”** seja confundida com autorização para acesso a informações sensíveis.

---

# 2. Princípio institucional

> **Pertencer à FAM não significa possuir autorização para acessar informações sensíveis.**

O acesso deverá decorrer de:

1. função formal;
2. necessidade profissional;
3. finalidade determinada;
4. autorização compatível;
5. nível de acesso definido;
6. registro/auditoria quando aplicável.

---

# 3. Regra de privilégio mínimo

Cada pessoa deverá ter somente o acesso necessário para executar sua função.

> **Se uma pessoa não precisa ver determinado dado para executar sua atividade, ela não deve ter acesso a esse dado.**

---

# 4. Separação de funções

A plataforma deverá evitar concentração indevida de poderes.

Sempre que tecnicamente possível, separar:

- atendimento;
- decisão de encaminhamento;
- administração técnica;
- administração de usuários;
- auditoria;
- gestão jurídica;
- gestão de segurança;
- gestão de dados.

Quem administra infraestrutura não deve automaticamente ter acesso ao conteúdo dos casos.

---

# 5. Perfis institucionais

## 5.1 Direção da FAM

Responsabilidades:

- aprovar políticas;
- designar responsáveis;
- garantir recursos;
- aprovar estrutura de governança;
- supervisionar conformidade.

**Não possui, pelo simples fato de ocupar cargo de direção, autorização automática para visualizar dados sensíveis de casos.**

---

## 5.2 Responsável pela proteção de dados / Encarregado

Quando formalmente designado:

- orientar questões de proteção de dados;
- atuar como canal institucional;
- apoiar avaliações;
- coordenar comunicação relacionada à proteção de dados;
- acompanhar incidentes;
- orientar direitos dos titulares.

O acesso ao conteúdo deverá ser limitado ao necessário para sua função.

---

## 5.3 Profissional especializado credenciado

Pode acessar dados somente:

- dentro de sua atribuição;
- quando necessário;
- dentro de sua área de atuação;
- pelo sistema autorizado;
- durante o período necessário.

Exemplos:

- profissional de saúde habilitado;
- assistente social;
- psicólogo;
- advogado;
- profissional técnico especificamente designado.

A habilitação profissional não autoriza acesso irrestrito a toda a base.

---

## 5.4 Equipe de atendimento

A equipe deverá receber somente os dados necessários para realizar o atendimento ou encaminhamento.

Não deverá visualizar automaticamente:

- histórico integral;
- anexos não necessários;
- dados de outros atendimentos;
- informações sem relação com sua função.

---

## 5.5 Tecnologia / desenvolvimento

Pode administrar:

- código;
- infraestrutura;
- autenticação;
- permissões;
- logs;
- backups;
- disponibilidade.

Não deve acessar o conteúdo dos casos salvo quando:

- tecnicamente indispensável;
- formalmente autorizado;
- registrado;
- limitado ao mínimo necessário.

---

## 5.6 Suporte técnico

O suporte não deverá receber conteúdo sensível por padrão.

Quando necessário para resolver incidente:

1. abrir chamado;
2. limitar acesso;
3. registrar autorização;
4. preservar evidências;
5. encerrar o acesso após a intervenção.

---

## 5.7 Voluntários

Não possuem autorização automática para acessar dados sensíveis.

O acesso somente poderá existir se:

- houver função formal;
- houver necessidade;
- houver treinamento;
- houver autorização;
- houver controles técnicos;
- houver compromisso de confidencialidade.

---

## 5.8 Parceiros

A existência de parceria com a FAM não concede acesso à plataforma.

Qualquer tratamento por parceiro deverá ser previamente definido em instrumento adequado e dentro da finalidade autorizada.

---

# 6. Regra especial sobre compartilhamento

Conforme a política institucional definida pela FAM, informações sensíveis não deverão ser compartilhadas internamente por mera conveniência.

O compartilhamento externo seguirá:

- finalidade;
- base jurídica aplicável;
- necessidade;
- destinatário legítimo;
- segurança;
- registro.

Entre os possíveis destinatários institucionais podem existir órgãos públicos e serviços competentes, conforme a situação e a legislação aplicável.

**A FAM não deverá transformar essa lista em autorização automática. Cada caso exige avaliação.**

---

# 7. Acesso proibido

É proibido acessar caso:

- por curiosidade;
- por amizade;
- por vínculo familiar;
- por posição hierárquica;
- para “ajudar informalmente”;
- para treinamento sem anonimização/salvaguardas;
- para uso pessoal;
- para compartilhar com terceiros;
- para demonstrar funcionamento da plataforma.

---

# 8. Acesso emergencial

Em situações excepcionais, poderá existir procedimento de **break-glass**.

Requisitos:

- motivo obrigatório;
- identificação do usuário;
- registro automático;
- acesso temporário;
- revisão posterior;
- justificativa;
- auditoria.

> **Emergência não significa acesso ilimitado.**

---

# 9. Matriz de níveis de acesso

| Nível | Perfil típico | Dados sensíveis | Anexos | Administração |
|---|---|---:|---:|---:|
| 0 | público | Não | Não | Não |
| 1 | associado/usuário autenticado | Somente próprios | próprios, se permitido | Não |
| 2 | atendimento autorizado | necessários | necessários | Não |
| 3 | profissional especializado | necessários à função | necessários | Não |
| 4 | proteção de dados/jurídico | conforme necessidade | conforme necessidade | Limitada |
| 5 | segurança/TI | metadados/logs | excepcional | Técnica |
| 6 | administrador da plataforma | Não por padrão | Não por padrão | Sim |
| 7 | auditoria | conforme escopo | conforme escopo | Não |

---

# 10. Matriz de permissões

| Ação | Público | Atendimento | Profissional | Jurídico/DPO | TI | Direção |
|---|---:|---:|---:|---:|---:|---:|
| Criar orientação | Sim | Sim | Sim | Não | Não | Não |
| Ver próprio atendimento | Sim | Não* | Não* | Não* | Não | Não* |
| Ver caso atribuído | Não | Sim | Sim | Conforme necessidade | Não | Não |
| Ver anexos | Não | Conforme função | Conforme função | Conforme necessidade | Não* | Não |
| Exportar dados | Não | Não* | Não* | Conforme autorização | Não* | Não |
| Compartilhar externamente | Não | Não automático | Conforme fluxo | Conforme competência | Não | Não automático |
| Alterar permissões | Não | Não | Não | Não | Sim | Conforme governança |
| Acessar logs técnicos | Não | Não | Não | Conforme necessidade | Sim | Não |
| Excluir dados | Não | Não | Não | Conforme política | Conforme procedimento | Não automático |

`*` sujeito à finalidade, autorização e arquitetura definitiva.

---

# 11. Matriz RACI

### Legenda

- **R — Responsible:** executa a atividade.
- **A — Accountable:** responde pela decisão/resultado.
- **C — Consulted:** deve ser consultado.
- **I — Informed:** deve ser informado.

---

# 12. RACI — Governança

| Atividade | Direção | DPO/Proteção | Jurídico | Atendimento | Profissional | TI | Segurança |
|---|---|---|---|---|---|---|---|
| Aprovar políticas | A | C | C | I | I | C | C |
| Definir perfis | A | C | C | C | C | R | C |
| Revisar política | A | R | C | C | C | C | C |
| Treinar equipe | A | R | C | R | R | C | C |
| Auditar acessos | I | A/R | C | I | I | R | R |
| Rever permissões | A | C | C | C | C | R | R |

---

# 13. RACI — Atendimento

| Atividade | Direção | DPO | Jurídico | Atendimento | Profissional | TI |
|---|---|---|---|---|---|---|
| Receber orientação | I | I | I | R | R | I |
| Identificar necessidade | I | C | C | R | R | I |
| Avaliar emergência | I | C | C | R | R | I |
| Encaminhar | I | C | C | R | R | I |
| Registrar atendimento | I | C | C | R | R | I |
| Decisão clínica | I | I | I | I | A/R | I |
| Decisão jurídica | I | C | A/R | I | C | I |

---

# 14. RACI — Dados

| Atividade | Direção | DPO | Jurídico | Atendimento | Profissional | TI |
|---|---|---|---|---|---|---|
| Definir finalidade | A | R | C | C | C | I |
| Definir necessidade | A | R | C | C | C | C |
| Configurar retenção | A | R | C | I | I | R |
| Controlar acesso | A | C | I | I | I | R |
| Revisar acesso | A | R | C | C | C | R |
| Responder titular | A | R | C | C | C | I |
| Eliminar conforme política | A | C | C | I | I | R |

---

# 15. RACI — Incidentes

| Atividade | Direção | DPO | Jurídico | Atendimento | TI | Segurança |
|---|---|---|---|---|---|---|
| Detectar | I | I | I | R | R | R |
| Registrar | I | A/R | C | R | R | R |
| Conter | I | C | I | I | R | A/R |
| Avaliar impacto | A | R | C | C | R | R |
| Avaliar comunicação | A | R | R | I | C | C |
| Comunicar ANPD | A | R | C | I | C | C |
| Comunicar titular | A | R | C | C | C | C |
| Pós-incidente | A | R | C | C | R | R |

---

# 16. RACI — Alterações na plataforma

| Atividade | Direção | DPO | Jurídico | Metodologia | UX | TI |
|---|---|---|---|---|---|---|
| Alterar pergunta sensível | A | C | C | R | R | R |
| Alterar classificação | A | C | C | R | C | R |
| Alterar texto jurídico | A | C | R | C | R | R |
| Alterar fluxo de emergência | A | C | R | R | C | R |
| Alterar retenção | A | R | C | C | I | R |
| Alterar permissão | A | C | C | I | I | R |
| Deploy | I | I | I | I | C | R |

---

# 17. RACI — Compartilhamento externo

| Atividade | Direção | DPO | Jurídico | Atendimento | Profissional | TI |
|---|---|---|---|---|---|---|
| Identificar necessidade | A | C | C | R | R | I |
| Avaliar finalidade | A | R | C | C | C | I |
| Avaliar fundamento | A | C | R | I | C | I |
| Preparar informação | I | R | C | R | R | I |
| Enviar | A | R | C | R* | R* | C |
| Registrar | I | R | C | R | R | R |

`*` somente quando formalmente autorizado pelo fluxo institucional.

---

# 18. Matriz de incompatibilidades

A FAM deverá evitar acumulação das seguintes funções sem controles adicionais:

| Combinação | Risco |
|---|---|
| Atendimento + auditoria do próprio atendimento | Alto |
| Desenvolvimento + acesso irrestrito ao conteúdo | Alto |
| Direção + acesso irrestrito | Alto |
| Profissional + administração técnica | Alto |
| Operador técnico + decisão jurídica | Alto |
| Auditor + alteração de logs | Crítico |
| Usuário + administrador | Crítico |

---

# 19. Segregação técnica

A arquitetura deverá, sempre que possível, separar:

```text
DADOS DE CONTEÚDO
       │
       ├── Atendimento
       ├── Profissional autorizado
       └── Fluxos jurídicos autorizados

METADADOS
       │
       ├── Segurança
       └── TI

CONFIGURAÇÃO
       │
       └── Administração técnica

AUDITORIA
       │
       └── Auditoria independente
```

---

# 20. Acesso de administrador

Administrador de sistema não deve equivaler a administrador do conteúdo.

A plataforma deverá buscar arquitetura em que:

> **“poder administrar o sistema” ≠ “poder ler os casos”.**

Quando acesso técnico ao conteúdo for inevitável, deverá existir:

- justificativa;
- autorização;
- escopo;
- prazo;
- registro;
- auditoria.

---

# 21. Contas individuais

É proibido compartilhar credenciais.

Cada pessoa deverá possuir:

- usuário individual;
- autenticação adequada;
- perfil;
- permissões;
- registro de atividade.

---

# 22. Encerramento de vínculo

Quando alguém:

- sair da FAM;
- mudar de função;
- deixar de atuar no projeto;
- perder habilitação;
- deixar de ser fornecedor;

o acesso deverá ser revogado ou ajustado imediatamente conforme o procedimento institucional.

---

# 23. Revisão periódica

Os acessos deverão ser revisados periodicamente e também após:

- mudança de função;
- incidente;
- alteração de sistema;
- mudança de fornecedor;
- mudança de legislação;
- mudança metodológica.

---

# 24. Responsabilidade individual

Todo usuário autorizado deverá compreender:

> **Acesso é uma responsabilidade, não um privilégio pessoal.**

A pessoa autorizada responde pelo uso indevido de suas credenciais e pelo tratamento incompatível com sua função, sem prejuízo das responsabilidades institucionais e legais cabíveis.

---

# 25. Termo de confidencialidade e responsabilidade

Antes do acesso a dados sensíveis, a pessoa deverá receber orientação e, quando juridicamente aplicável, assinar instrumento institucional contendo:

- dever de confidencialidade;
- finalidade;
- limites de acesso;
- proibição de compartilhamento;
- comunicação de incidentes;
- consequências do uso indevido;
- obrigação pós-vínculo.

---

# 26. Treinamento

O acesso deverá ser precedido por treinamento compatível com a função.

Conteúdo mínimo:

- proteção de dados;
- segurança;
- não revitimização;
- limites de acesso;
- incidentes;
- phishing;
- dispositivos compartilhados;
- anexos;
- compartilhamento;
- comunicação institucional.

---

# 27. Regra para diretores e parceiros

> **Cargo, autoridade institucional, parceria ou proximidade pessoal não constituem autorização automática para acesso a dados sensíveis.**

Essa regra deverá aparecer também na documentação interna de governança.

---

# 28. Regra para equipe técnica

A equipe técnica deverá receber dados reais somente quando:

- não houver alternativa técnica;
- o acesso for indispensável;
- houver autorização;
- houver controle;
- houver registro;
- o acesso for temporário sempre que possível.

Preferência:

> **dados fictícios → dados anonimizados → dados minimizados → dados reais somente quando indispensáveis.**

---

# 29. Requisitos técnicos

- **JUR-05-TEC-01:** RBAC ou modelo equivalente de controle de acesso.
- **JUR-05-TEC-02:** contas individuais.
- **JUR-05-TEC-03:** MFA para perfis privilegiados.
- **JUR-05-TEC-04:** segregação entre conteúdo e administração.
- **JUR-05-TEC-05:** logs de acesso.
- **JUR-05-TEC-06:** revisão periódica de permissões.
- **JUR-05-TEC-07:** revogação de acesso.
- **JUR-05-TEC-08:** princípio do menor privilégio.
- **JUR-05-TEC-09:** break-glass auditável.
- **JUR-05-TEC-10:** ambientes de teste sem dados reais, quando possível.
- **JUR-05-TEC-11:** proteção contra contas compartilhadas.
- **JUR-05-TEC-12:** trilha de auditoria.
- **JUR-05-TEC-13:** alertas para acesso anômalo.
- **JUR-05-TEC-14:** segregação de funções administrativas.

---

# 30. Critérios de aceitação

A arquitetura será considerada adequada quando:

- nenhum cargo gerar acesso automático;
- cada acesso possuir finalidade;
- permissões forem individualizadas;
- dados sensíveis forem segregados;
- administradores técnicos não tiverem acesso irrestrito ao conteúdo;
- acessos forem auditáveis;
- acessos puderem ser revogados;
- incidentes puderem ser investigados;
- funções críticas forem segregadas.

---

# 31. Documentos relacionados

- JUR-01 — Fluxos Especiais de Proteção;
- JUR-02 — Bases Jurídicas, Finalidades e Compartilhamento;
- JUR-03 — Atendimento e Não Revitimização;
- JUR-04 — Incidentes e Violações de Dados;
- POL-ARQ-01 — Arquivos, Segurança, Retenção e Exclusão;
- OC-04 — Matriz de Situações de Risco;
- OC-01 — Matriz de Órgãos e Encaminhamento.

---

# 32. Próxima etapa

Com JUR-01 a JUR-05 estruturados, a próxima etapa recomendada é uma:

## REVISÃO CRUZADA DE GOVERNANÇA

**JUR-01 + JUR-02 + JUR-03 + JUR-04 + JUR-05 + OC-04 + POL-ARQ-01**

Objetivo:

- eliminar conflitos;
- verificar lacunas;
- padronizar termos;
- verificar responsabilidades;
- alinhar UX e jurídico;
- alinhar retenção e incidentes;
- preparar a especificação definitiva para desenvolvimento.

---

# 33. Aprovação

| Área | Status |
|---|---|
| Direção FAM | Pendente |
| Assessoria jurídica | Pendente |
| Proteção de dados / encarregado | Pendente |
| Metodologia | Pendente |
| Segurança da informação | Pendente |
| Tecnologia | Pendente |
| UX/UI | Pendente |

---

# 34. Princípio final

> **Nenhuma pessoa deve ter acesso a uma informação sensível simplesmente porque consegue tecnicamente acessá-la.**

A autorização deve nascer da função, da necessidade, da finalidade e dos controles institucionais.
