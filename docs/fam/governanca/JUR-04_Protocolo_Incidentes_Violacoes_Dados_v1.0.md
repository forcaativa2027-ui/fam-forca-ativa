# JUR-04 — Protocolo de Incidentes e Violações de Dados

**Instituição:** Força Ativa da Mulher — FAM  
**Plataforma:** Plataforma FAM  
**Versão:** 1.0  
**Data:** 24/08/2026  
**Status:** minuta institucional + técnica  
**Classificação:** segurança, privacidade, incidentes e resposta

> **Nota:** documento para validação jurídica, de proteção de dados e segurança da informação antes da produção.

## 1. Objetivo

Estabelecer o procedimento da FAM para prevenir, identificar, conter, avaliar, registrar, comunicar e corrigir incidentes que envolvam dados pessoais tratados pela plataforma.

A LGPD determina medidas de segurança desde a concepção até a execução do serviço e prevê comunicação de incidentes que possam acarretar risco ou dano relevante. citeturn0search9

A Resolução CD/ANPD nº 15/2024 regulamenta a comunicação de incidentes e permanece vigente. citeturn0search0turn0search24

## 2. Princípio central

> **Incidente não é assunto para esconder, improvisar ou resolver informalmente. É evento que deve ser identificado, contido, avaliado, registrado e tratado por fluxo institucional.**

## 3. O que é incidente

Pode incluir, entre outros:

- acesso não autorizado;
- vazamento;
- perda de arquivo;
- exclusão indevida;
- alteração indevida;
- envio ao destinatário errado;
- compartilhamento excessivo;
- exposição em tela ou notificação;
- roubo de credencial;
- comprometimento de conta;
- invasão;
- ransomware;
- download indevido;
- dispositivo perdido contendo dados;
- falha de configuração;
- exposição de backup;
- erro humano.

Nem toda vulnerabilidade é, por si só, incidente. A ANPD diferencia vulnerabilidade de incidente consumado. citeturn0search4

## 4. Primeira regra

Qualquer pessoa que suspeite de incidente deve comunicar imediatamente pelo canal interno definido pela FAM.

**Não investigar por conta própria.**

**Não apagar evidências.**

**Não compartilhar o incidente em grupos informais.**

**Não tentar ocultar o ocorrido.**

## 5. Fluxo institucional

```text
DETECÇÃO
   ↓
COMUNICAÇÃO INTERNA
   ↓
PRESERVAÇÃO
   ↓
CONTENÇÃO
   ↓
CLASSIFICAÇÃO
   ↓
AVALIAÇÃO DE RISCO/DANO
   ↓
DECISÃO SOBRE COMUNICAÇÃO
   ↓
ANPD / TITULARES / OUTROS DESTINATÁRIOS, QUANDO APLICÁVEL
   ↓
REMEDIAÇÃO
   ↓
REGISTRO FINAL
   ↓
LIÇÕES APRENDIDAS
```

## 6. Regra de autoridade

A decisão de comunicar incidente à ANPD e aos titulares não deve ser tomada individualmente por desenvolvedor, voluntário ou diretor sem competência definida.

Deverá envolver, conforme estrutura da FAM:

- responsável pelo tratamento;
- encarregado/DPO, quando designado;
- responsável técnico;
- assessoria jurídica;
- responsável institucional.

A ANPD informa que a comunicação deve ser feita pelo encarregado ou representante legalmente constituído do controlador. citeturn0search4

## 7. Critério de comunicação

A ANPD informa que o incidente deve ser comunicado quando, cumulativamente:

1. a ocorrência estiver confirmada;
2. envolver dados pessoais sujeitos à LGPD;
3. puder acarretar risco ou dano relevante aos titulares. citeturn0search4

## 8. Prazo regulatório

A Resolução CD/ANPD nº 15/2024 estabelece comunicação à ANPD e aos titulares, quando aplicável, no prazo de **3 dias úteis**, ressalvada legislação específica. citeturn0search4turn0search24

> **A equipe não deve aguardar o encerramento completo da investigação para iniciar a avaliação de comunicação.**

Quando informações estiverem incompletas, o regulamento admite comunicação preliminar e complementar nas condições aplicáveis. citeturn0search4

## 9. Dados de alta criticidade

Na plataforma FAM, merecem tratamento prioritário incidentes envolvendo:

- violência sexual;
- saúde;
- crianças/adolescentes;
- pessoas idosas em situação de vulnerabilidade;
- pessoas com deficiência;
- localização;
- documentos de identificação;
- imagens íntimas;
- áudios ou vídeos sensíveis;
- informações sobre risco ou ameaça;
- dados de acesso;
- credenciais.

## 10. Classificação interna

### Nível 1 — baixo
Evento sem exposição relevante confirmada e contido rapidamente.

### Nível 2 — moderado
Exposição limitada ou potencial de impacto relevante.

### Nível 3 — alto
Dados sensíveis ou grande quantidade de dados potencialmente expostos.

### Nível 4 — crítico
Risco significativo à segurança física/moral, exposição ampla, invasão ativa, comprometimento de contas ou situação que possa exigir comunicação imediata.

> A classificação interna não substitui a análise jurídica de “risco ou dano relevante” exigida para comunicação.

## 11. Contenção

Medidas possíveis:

- bloquear conta;
- revogar sessão;
- revogar token;
- alterar credencial;
- desativar integração;
- restringir acesso;
- retirar arquivo exposto;
- bloquear compartilhamento;
- isolar sistema;
- preservar logs.

A contenção deve evitar destruir evidências necessárias à investigação técnica.

## 12. Preservação de evidências

Registrar, quando aplicável:

- data/hora;
- usuário;
- sistema;
- IP/logs disponíveis;
- ação;
- arquivo;
- destinatário;
- configuração;
- versão do sistema;
- eventos relacionados.

Não copiar conteúdo sensível para canais pessoais.

## 13. Proibição de investigação informal

É vedado:

- criar grupos paralelos;
- encaminhar prints para pessoas não autorizadas;
- utilizar contas pessoais;
- baixar toda a base “para investigar”;
- modificar logs;
- apagar registros;
- discutir identidade da usuária fora do fluxo.

## 14. Comunicação interna inicial

Texto padrão:

> **INCIDENTE DE SEGURANÇA — NÃO COMPARTILHAR**
>
> Foi identificado/suspeitado um evento que pode envolver dados pessoais.
>
> Não altere, apague ou encaminhe evidências.
>
> Registre somente as informações necessárias e encaminhe pelo canal institucional.

## 15. Avaliação do impacto

Perguntas mínimas:

1. Quais dados foram afetados?
2. Quantas pessoas podem ter sido afetadas?
3. Os dados são sensíveis?
4. Há crianças/adolescentes?
5. Há risco físico, moral, financeiro ou discriminatório?
6. Houve acesso efetivo ou apenas tentativa?
7. Os dados estavam criptografados?
8. Quem recebeu os dados?
9. O acesso foi contido?
10. Há risco de continuidade?

## 16. Comunicação à titular

Quando aplicável, a comunicação deverá usar linguagem simples, direta e individualizada quando possível.

A ANPD informa que o comunicado deve contemplar, entre outros pontos:

- natureza e categoria dos dados;
- medidas técnicas e de segurança;
- riscos e possíveis impactos;
- medidas adotadas;
- data do conhecimento do incidente;
- contato para informações. citeturn0search4

## 17. Texto-base para comunicação à usuária

> ### Aviso importante sobre suas informações
>
> Identificamos um incidente de segurança que pode ter afetado informações relacionadas à sua conta.
>
> Estamos avaliando e tratando o ocorrido.
>
> **O que pode ter sido afetado:** [informação]
>
> **Quando identificamos:** [data]
>
> **Possíveis riscos:** [descrição]
>
> **O que fizemos:** [medidas]
>
> **O que recomendamos:** [orientação]
>
> **Contato:** [canal oficial]

O texto final deverá ser individualizado conforme o incidente.

## 18. Não minimizar

Evitar:

> “Foi apenas um pequeno vazamento.”

Preferir:

> “Identificamos um incidente que pode ter afetado [categoria de dados]. Estamos adotando medidas para reduzir os riscos.”

## 19. Não criar pânico

Evitar linguagem alarmista sem evidência.

A comunicação deve informar:

- o que se sabe;
- o que ainda está sendo avaliado;
- quais medidas foram tomadas;
- o que a usuária pode fazer.

## 20. Incidente com profissional interno

Se um profissional acessar indevidamente um caso:

1. preservar registros;
2. suspender acesso se necessário;
3. avaliar extensão;
4. registrar;
5. comunicar responsáveis;
6. avaliar necessidade de comunicação externa;
7. aplicar medidas administrativas cabíveis.

O vínculo profissional não elimina a obrigação de segurança e confidencialidade.

## 21. Incidente causado por fornecedor

Contratos com operadores e fornecedores devem prever:

- comunicação rápida à FAM;
- preservação de evidências;
- cooperação;
- segurança;
- confidencialidade;
- auditoria quando cabível;
- apoio à comunicação;
- responsabilidades.

## 22. Incidente com desenvolvedor

O desenvolvedor não deve comunicar diretamente à usuária ou à ANPD, salvo se possuir formalmente essa atribuição.

Deve:

- comunicar internamente;
- preservar evidências;
- seguir o playbook;
- não ocultar o incidente;
- colaborar com a avaliação.

## 23. Incidente envolvendo arquivo

Exemplos:

- PDF enviado ao órgão errado;
- foto disponível para usuário incorreto;
- áudio acessível por terceiro;
- vídeo exposto em URL pública;
- documento baixado sem autorização.

A resposta deve incluir contenção do acesso e análise de quem efetivamente teve acesso.

## 24. Incidente envolvendo credencial

Se houver suspeita de comprometimento:

1. revogar sessões;
2. invalidar tokens;
3. redefinir credencial;
4. verificar acessos;
5. identificar operações realizadas;
6. avaliar exposição;
7. registrar.

## 25. Incidente envolvendo dispositivo compartilhado

A FAM deverá distinguir:

- falha do sistema;
- exposição causada por configuração local;
- exposição decorrente de notificação;
- acesso por pessoa que utilizou o dispositivo.

Mesmo quando a causa não for exclusivamente da plataforma, a FAM deve avaliar se suas escolhas de UX contribuíram para o risco.

## 26. Registro de incidente

Campos mínimos:

| Campo | Conteúdo |
|---|---|
| `incident_id` | identificador |
| `detected_at` | data/hora |
| `reported_by` | comunicante |
| `system` | sistema afetado |
| `data_categories` | categorias |
| `sensitive_data` | sim/não |
| `affected_subjects` | titulares |
| `containment` | medidas |
| `risk_level` | classificação |
| `legal_assessment` | avaliação |
| `anpd_notification` | status |
| `subject_notification` | status |
| `resolved_at` | encerramento |
| `lessons_learned` | melhorias |

## 27. Trilha de auditoria

O sistema deverá registrar:

- quem acessou;
- quando;
- qual registro;
- qual ação;
- origem;
- resultado.

Logs devem ter proteção contra alteração indevida e acesso restrito.

## 28. Comunicação com autoridades

A FAM deverá manter procedimento específico para:

- ANPD;
- autoridade policial;
- Ministério Público;
- órgãos de proteção;
- serviços de saúde;
- outros destinatários legalmente competentes.

O compartilhamento decorrente de incidente seguirá JUR-02.

## 29. Retenção dos registros de incidente

Registros de incidentes não devem ser eliminados simplesmente porque o incidente foi encerrado.

O prazo deverá ser definido na política de retenção e considerando:

- obrigação legal;
- defesa de direitos;
- auditoria;
- prestação de contas;
- investigação;
- segurança.

## 30. Requisitos técnicos

- **JUR-04-TEC-01:** criar registro formal de incidente.
- **JUR-04-TEC-02:** permitir classificação.
- **JUR-04-TEC-03:** preservar logs.
- **JUR-04-TEC-04:** permitir revogação de sessões.
- **JUR-04-TEC-05:** permitir bloqueio de acesso.
- **JUR-04-TEC-06:** registrar contenção.
- **JUR-04-TEC-07:** controlar permissões de resposta.
- **JUR-04-TEC-08:** separar ambiente de incidente do ambiente comum.
- **JUR-04-TEC-09:** impedir exclusão informal de registros.
- **JUR-04-TEC-10:** gerar evidências para auditoria.
- **JUR-04-TEC-11:** controlar comunicação de titulares.
- **JUR-04-TEC-12:** manter histórico das decisões.

## 31. Testes

Simular pelo menos:

- acesso indevido;
- arquivo enviado ao destinatário errado;
- conta comprometida;
- exposição de URL;
- vazamento de backup;
- exclusão acidental;
- ransomware;
- erro de permissão;
- fornecedor comprometido;
- notificação sensível exposta.

## 32. Pós-incidente

Após contenção:

1. causa raiz;
2. impacto;
3. medidas corretivas;
4. alteração necessária no sistema;
5. revisão de permissões;
6. revisão de UX;
7. treinamento;
8. atualização de documentação;
9. avaliação de reincidência.

## 33. Princípio de aprendizagem

> **O objetivo do pós-incidente não é apenas descobrir quem errou; é descobrir por que o sistema permitiu que o erro produzisse risco e como evitar sua repetição.**

## 34. Documentos relacionados

- JUR-01 — Fluxos Especiais de Proteção;
- JUR-02 — Bases Jurídicas, Finalidades e Compartilhamento;
- JUR-03 — Atendimento e Não Revitimização;
- POL-ARQ-01 — Arquivos, Segurança, Retenção e Exclusão;
- JUR-05 — Responsabilidades Institucionais;
- OC-01 — Matriz de Órgãos e Encaminhamento.

## 35. Próxima etapa

Após aprovação:

**JUR-05 — Matriz de Responsabilidades Institucionais**

Depois:

> **Revisão cruzada JUR-01 + JUR-02 + JUR-03 + JUR-04 + OC-04**

## 36. Referências oficiais

- LGPD — Lei nº 13.709/2018, especialmente arts. 46–48. citeturn0search9
- ANPD — Resolução CD/ANPD nº 15/2024 — Regulamento de Comunicação de Incidente de Segurança. citeturn0search24turn0search0
- ANPD — procedimento oficial para Comunicação de Incidente de Segurança. citeturn0search4
- ANPD — Resolução CD/ANPD nº 2/2022, aplicável a agentes de tratamento de pequeno porte, conforme redação vigente. citeturn0search6

## 37. Aprovação

| Área | Status |
|---|---|
| Direção FAM | Pendente |
| Assessoria jurídica | Pendente |
| Proteção de dados / encarregado | Pendente |
| Segurança da informação | Pendente |
| Tecnologia | Pendente |
| Metodologia | Pendente |

## 38. Princípio final

> **Incidente tratado rapidamente, com transparência e método, tende a causar menos dano do que incidente ocultado, improvisado ou tratado sem registro.**
