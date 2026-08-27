# REV-01 — Matriz Executiva de Revisão Cruzada

**Instituição:** Força Ativa da Mulher — FAM  
**Plataforma:** Plataforma FAM  
**Versão:** 1.0  
**Data:** 24/08/2026  
**Status:** revisão executiva preliminar  
**Objetivo:** verificar coerência entre os documentos institucionais, jurídicos, metodológicos, técnicos e de UX antes da consolidação da especificação da plataforma.

---

## 1. Documentos analisados

- OC-04 — Matriz de Situações de Risco e Respostas v1.1
- JUR-01 — Fluxos Especiais de Proteção v1.0
- JUR-02 — Matriz de Bases Jurídicas, Finalidades e Compartilhamento v1.0
- JUR-03 — Política de Atendimento e Não Revitimização v1.0
- JUR-04 — Protocolo de Incidentes e Violações de Dados v1.0
- JUR-05 — Matriz de Responsabilidades Institucionais + RACI v1.0
- POL-ARQ-01 — Política de Arquivos, Segurança, Retenção e Exclusão v1.1
- OC-01 — Matriz de Órgãos e Encaminhamento

---

# 2. Resultado executivo

| Eixo | Situação | Prioridade |
|---|---|---|
| Finalidade da ferramenta | Coerente | 🟢 |
| “Sinais de atenção”, não diagnóstico/conclusão criminal | Coerente | 🟢 |
| Necessidade e minimização | Coerente | 🟢 |
| “Prefiro não responder” | Coerente | 🟢 |
| Emergência | Coerente, requer fechamento operacional | 🟠 |
| Violência sexual | Coerente | 🟢 |
| Crianças/adolescentes | Fluxo ainda precisa de detalhamento jurídico | 🔴 |
| Pessoa idosa | Princípios definidos | 🟡 |
| Pessoa com deficiência | Princípios definidos | 🟡 |
| Compartilhamento externo | Bem estruturado | 🟢 |
| Controle de acesso | Bem estruturado | 🟢 |
| Direção/voluntários/parceiros sem acesso automático | Coerente | 🟢 |
| Acesso técnico excepcional | Coerente | 🟢 |
| Incidentes | Bem estruturado | 🟢 |
| Arquivos | Bem estruturado | 🟢 |
| Retenção | Necessita decisão institucional final | 🔴 |
| Exclusão/backups | Necessita especificação técnica | 🟠 |
| RACI | Estruturado, mas precisa validação de papéis reais | 🟠 |
| Órgãos e encaminhamentos | Necessita fechamento com OC-01 | 🟠 |
| UX | Coerente com metodologia | 🟢 |
| Terminologia | Precisa padronização final | 🟡 |
| Base jurídica de cada operação | Precisa validação jurídica final | 🔴 |

---

# 3. Matriz de coerência

## 3.1 Finalidade

**Regra consolidada:**

A ferramenta orienta e identifica sinais de atenção; não confirma crime, não produz laudo e não substitui serviços profissionais.

**Documentos:** OC-04 + JUR-02 + JUR-03.

**Resultado:** 🟢 CONSISTENTE.

**Decisão:** manter como princípio transversal.

---

## 3.2 “Prefiro não responder”

OC-04 determina que:

`SIM ≠ NÃO ≠ NÃO_RESPONDIDO`

e que “Prefiro não responder” nunca seja convertido em “não”.

JUR-03 também exige possibilidade de não resposta para perguntas sensíveis.

**Resultado:** 🟢 CONSISTENTE.

**Requisito técnico obrigatório:**

```text
SIM
NAO
NAO_RESPONDIDO
```

Nunca usar valor booleano simples para perguntas sensíveis.

---

## 3.3 Emergência

OC-04 determina prioridade para perigo atual.

JUR-01 determina interrupção dos fluxos secundários quando AR-01 = SIM.

JUR-03 determina que a interface não deve exigir cadastro, histórico ou anexos antes da orientação essencial.

**Resultado:** 🟢 conceitualmente consistente.

**Lacuna:** fechar tecnicamente:

- quais telas aparecem;
- quais informações são exibidas;
- quais canais oficiais são mantidos;
- como funciona a saída rápida;
- o que acontece se a usuária abandonar o fluxo.

**Prioridade:** 🟠.

---

## 3.4 Violência sexual

OC-04 e JUR-01 estabelecem:

- orientação especializada;
- segurança;
- saúde;
- proteção;
- não exigência de prova;
- não exigência de relato detalhado;
- anexos opcionais.

JUR-03 reforça não revitimização.

POL-ARQ-01 reforça proteção dos arquivos.

**Resultado:** 🟢 CONSISTENTE.

---

## 3.5 Crianças e adolescentes

OC-04 determina fluxo jurídico específico.

JUR-01 também prevê fluxo especial.

**Problema:** a regra existe, mas ainda não está suficientemente operacionalizada.

**Lacuna crítica:**

- quem decide;
- quando encaminhar;
- quais informações podem ser compartilhadas;
- quais são os fluxos obrigatórios;
- como tratar quem fornece a informação versus titular;
- como registrar;
- quais exceções existem.

**Resultado:** 🔴 BLOQUEADOR ANTES DA PRODUÇÃO.

**Ação:** criar/fechar fluxo jurídico específico para criança/adolescente.

---

## 3.6 Pessoa idosa

JUR-01 estabelece autonomia e impede presunção de incapacidade.

**Resultado:** 🟡 ADEQUADO, mas necessita integração com OC-04 e UX.

**Ação:** garantir que o formulário e os encaminhamentos não tratem idade como incapacidade.

---

## 3.7 Pessoa com deficiência

JUR-01 estabelece acessibilidade e autonomia.

JUR-03 complementa com requisitos de UX.

**Resultado:** 🟢 CONSISTENTE.

**Ação:** transformar em requisitos de aceite de acessibilidade.

---

# 4. Dados e base jurídica

JUR-02 determina que cada operação responda:

> dado → finalidade → necessidade → acesso → compartilhamento → destinatário → fundamento → registro → eliminação.

OC-04 aplica necessidade + finalidade + destinatário competente.

**Resultado:** 🟢 CONSISTENTE.

**Lacuna crítica:** a matriz operacional definitiva de bases jurídicas ainda depende de validação jurídica.

**Resultado executivo:** 🔴 antes de produção.

---

# 5. Compartilhamento

JUR-02 exige:

- destinatário definido;
- finalidade;
- fundamento;
- necessidade;
- seleção mínima;
- profissional autorizado;
- registro;
- auditoria.

POL-ARQ-01 exige os mesmos princípios para arquivos.

JUR-05 impede compartilhamento automático por cargo.

**Resultado:** 🟢 CONSISTENTE.

**Regra consolidada:**

> Nunca compartilhar “o caso inteiro” por padrão. Compartilhar somente os dados e arquivos necessários à finalidade definida.

---

# 6. Acesso interno

JUR-02, JUR-05 e POL-ARQ-01 convergem:

> cargo, direção, associação, parceria, voluntariado ou administração técnica não geram acesso automático.

**Resultado:** 🟢 CONSISTENTE.

**Requisito estrutural:**

```text
função
+
necessidade
+
finalidade
+
autorização
+
menor privilégio
+
auditoria
```

---

# 7. Acesso técnico

JUR-05 e POL-ARQ-01 estabelecem que TI não deve possuir acesso ao conteúdo por padrão.

JUR-04 exige controle e registro em situações de incidente.

**Resultado:** 🟢 CONSISTENTE.

**Ação:** implementar acesso excepcional auditável.

---

# 8. Arquivos

POL-ARQ-01 estabelece:

- upload opcional;
- formatos;
- limites;
- antimalware;
- criptografia;
- controle de acesso;
- logs;
- retenção;
- exclusão;
- backup;
- links privados.

JUR-01 e JUR-03 estabelecem que arquivos não devem ser exigidos como prova.

**Resultado:** 🟢 CONSISTENTE.

**Ponto de atenção:** os limites de tamanho são parâmetros operacionais propostos e deverão ser validados com infraestrutura.

---

# 9. Retenção

POL-ARQ-01 propõe:

- Classe A — até 30 dias;
- Classe B — durante período necessário;
- Classe C — enquanto houver fundamento de conservação.

JUR-04 determina que registros de incidentes não sejam eliminados simplesmente porque o incidente terminou.

**Resultado:** 🔴 NECESSITA FECHAMENTO.

**Questão a decidir:**

Os 30 dias se aplicam somente a arquivos de orientação sem atendimento continuado ou também a respostas estruturadas do formulário?

**Recomendação executiva:**

Separar:

```text
dados da ferramenta
≠
arquivos
≠
registros de atendimento
≠
registros de auditoria
≠
registros de incidente
```

Cada classe deve possuir sua própria regra de retenção.

---

# 10. Exclusão e backups

POL-ARQ-01 exige considerar:

- arquivo;
- cópias;
- cache;
- versões;
- thumbnails;
- índices;
- backups;
- sistemas integrados.

**Resultado:** 🟠 REQUER ESPECIFICAÇÃO TÉCNICA.

**Ação:** criar matriz técnica de ciclo de vida do dado.

---

# 11. Incidentes

JUR-04 estabelece:

```text
detecção
→ registro
→ contenção
→ avaliação
→ comunicação
→ remediação
→ pós-incidente
```

JUR-05 define responsabilidades.

POL-ARQ-01 define rastreabilidade.

**Resultado:** 🟢 CONSISTENTE.

**Ação:** validar nomes reais dos responsáveis e canais internos.

---

# 12. RACI

JUR-05 já possui RACI para:

- governança;
- atendimento;
- dados;
- incidentes;
- alterações;
- compartilhamento.

**Resultado:** 🟠 ESTRUTURA ADEQUADA, MAS DEPENDENTE DA GOVERNANÇA REAL.

**Questão:** os papéis “DPO/Proteção”, “Jurídico”, “Segurança” e “TI” precisam corresponder a pessoas/funções efetivamente existentes ou formalmente designadas.

Não devemos implementar nomes de cargos que não tenham responsável institucional.

---

# 13. UX

JUR-03 e OC-04 são consistentes quanto a:

- linguagem clara;
- não culpabilização;
- não investigação;
- não exigência de prova;
- interrupção;
- orientação antes da coleta;
- “Prefiro não responder”;
- saída segura.

**Resultado:** 🟢 CONSISTENTE.

**Ponto de atenção:** os textos jurídicos e de emergência devem possuir controle de versão e aprovação antes de publicação.

---

# 14. Terminologia

A revisão recomenda padronizar:

### Usar

**Ferramenta de Orientação e Identificação de Sinais de Atenção**

**sinais de atenção**

**orientação**

**possível situação de urgência**

**encaminhamento**

### Evitar

“diagnóstico”

“avaliação criminal”

“crime confirmado”

“laudo”

“prova”

“risco criminal confirmado”

“caso comprovado”

---

# 15. Matriz de conflitos/lacunas

| ID | Achado | Documentos | Severidade | Decisão |
|---|---|---|---|---|
| RC-01 | Fluxo de criança/adolescente ainda incompleto | OC-04/JUR-01 | 🔴 | Fechar fluxo jurídico |
| RC-02 | Bases jurídicas precisam validação final | JUR-02 | 🔴 | Revisão jurídica |
| RC-03 | Retenção de dados do formulário não separada de arquivos | JUR-02/POL-ARQ/JUR-04 | 🔴 | Criar classes de retenção |
| RC-04 | Exclusão em backups precisa especificação | POL-ARQ | 🟠 | Especificar arquitetura |
| RC-05 | RACI depende de responsáveis reais | JUR-05 | 🟠 | Formalizar funções |
| RC-06 | Fluxo operacional de emergência precisa fechamento | OC-04/JUR-01/JUR-03 | 🟠 | Especificar UX |
| RC-07 | OC-01 precisa ser confrontado com JUR-02 | OC-01/JUR-02 | 🟠 | Revisar destinatários |
| RC-08 | Limites de arquivos precisam teste técnico | POL-ARQ | 🟡 | Validar infraestrutura |
| RC-09 | Terminologia precisa glossário único | todos | 🟡 | Criar glossário |
| RC-10 | Textos críticos precisam controle de versão | JUR-03/JUR-01 | 🟡 | Governança editorial |

---

# 16. Bloqueadores antes do desenvolvimento

Não recomendamos iniciar a implementação dos fluxos sensíveis antes de resolver:

### BLOQUEADOR 1
Fluxo de proteção de criança/adolescente.

### BLOQUEADOR 2
Validação jurídica das bases aplicáveis a cada operação.

### BLOQUEADOR 3
Modelo definitivo de retenção separado por categoria de informação.

### BLOQUEADOR 4
Definição formal dos responsáveis institucionais.

---

# 17. Decisões já suficientemente maduras

Podem ser tratadas como princípios consolidados:

1. ferramenta não diagnostica;
2. ferramenta não confirma crime;
3. resultado é “sinal de atenção”;
4. “Prefiro não responder” é estado independente;
5. perigo atual tem precedência;
6. orientação essencial vem antes de documentação;
7. arquivo não é prova automática;
8. upload é opcional quando a finalidade permitir;
9. acesso não decorre do cargo;
10. compartilhamento não é automático;
11. menor privilégio;
12. auditoria;
13. não revitimização;
14. linguagem clara;
15. segurança desde a arquitetura.

---

# 18. Matriz executiva de decisão

| Tema | Decisão atual | Próxima ação |
|---|---|---|
| Nome da ferramenta | Aprovado | Manter |
| Metodologia | Sinais de atenção | Manter |
| Emergência | Prioridade máxima | Fechar UX |
| Violência sexual | Fluxo especial | Manter |
| Crianças/adolescentes | Fluxo especial | **Fechar juridicamente** |
| Pessoa idosa | Autonomia | Integrar UX |
| Pessoa com deficiência | Acessibilidade | Testar |
| Dados sensíveis | Acesso mínimo | Validar jurídico |
| Compartilhamento | Granular | Integrar OC-01 |
| Arquivos | Upload opcional | Validar infraestrutura |
| Retenção | Por finalidade | **Separar categorias** |
| Exclusão | Ciclo de vida | Especificar |
| Incidentes | JUR-04 | Integrar RACI |
| Acessos | Menor privilégio | Implementar RBAC |
| Administração técnica | Sem acesso automático | Implementar segregação |
| RACI | Estruturado | Formalizar responsáveis |
| UX | Linguagem clara | Criar catálogo de textos |
| Auditoria | Obrigatória | Implementar logs |

---

# 19. Conclusão executiva

A documentação apresenta **coerência estrutural elevada**.

Os principais fundamentos estão alinhados:

```text
METODOLOGIA
    ↓
SINAIS DE ATENÇÃO
    ↓
ORIENTAÇÃO
    ↓
PROTEÇÃO
    ↓
ENCAMINHAMENTO
    ↓
FINALIDADE
    ↓
MENOR DADO NECESSÁRIO
    ↓
MENOR ACESSO NECESSÁRIO
    ↓
AUDITORIA
    ↓
RETENÇÃO JUSTIFICADA
    ↓
EXCLUSÃO
```

Os principais pontos que ainda impedem o fechamento definitivo são:

1. proteção de crianças/adolescentes;
2. validação jurídica das bases;
3. matriz definitiva de retenção;
4. formalização dos responsáveis;
5. integração final dos órgãos e encaminhamentos.

---

# 20. Próximo documento recomendado

Depois desta matriz executiva:

**REV-02 — Matriz de Conflitos, Lacunas e Decisões**

Ela deverá transformar cada achado em uma decisão objetiva:

```text
ACHADO
↓
RISCO
↓
DECISÃO
↓
DOCUMENTO A ALTERAR
↓
TEXTO NOVO
↓
REQUISITO TÉCNICO
↓
IMPACTO UX
↓
STATUS
```

Somente depois disso será recomendável produzir a **Especificação Técnica Consolidada da Plataforma FAM**.

---

## Status da revisão

**REV-01:** concluída em nível executivo.

**Classificação geral:** 🟠 **APTA PARA CONSOLIDAÇÃO, MAS NÃO PARA IMPLEMENTAÇÃO DEFINITIVA DOS FLUXOS SENSÍVEIS.**

**Regra:** nenhum documento individual deve ser considerado isoladamente; alterações em finalidade, acesso, compartilhamento, retenção ou critérios de encaminhamento devem gerar revisão cruzada.
