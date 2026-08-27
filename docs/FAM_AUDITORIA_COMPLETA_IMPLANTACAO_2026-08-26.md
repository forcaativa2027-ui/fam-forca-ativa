# FAM — Auditoria Completa de Implantação

> **Data:** 26/08/2026  
> **Baseline:** `/home/ubuntu/upload/final.tar.gz` — 32 entradas: 30 ficheiros Markdown e 2 diretórios-contêiner  
> **Repositório:** `forcaativa2027-ui/fam-forca-ativa`  
> **Projecto Vercel oficial:** [fam-0cef/fam-forca-ativa](https://vercel.com/fam-0cef/fam-forca-ativa)  
> **Projecto Supabase:** `untlbpzafiojirmpogqp`  
> **Regra:** auditoria não destrutiva; nenhuma migration foi executada durante esta auditoria.

## 1. Resultado executivo

A plataforma FAM possui uma base funcional de MVP significativamente avançada no clone local e no projecto Vercel oficial. O núcleo de análise de risco, máquina de estados, ProtectionFlow, conversação pública, painel operacional, encaminhamento com confirmação, ciclo de anexos e identidade institucional já está representado no código e nas migrations FAM001–FAM017.

A implantação **ainda não deve ser declarada pronta para dados reais**. O principal motivo não é ausência de código do MVP, mas ausência de evidência operacional completa: a aplicação precisa de validação remota formal do schema e das RLS, configuração de segredos server-side, SMTP próprio, escolha de scanner real, execução do cron de expurgo, publicação de conteúdo INFO aprovado, teste E2E não destrutivo e aprovação institucional/jurídica.

O projecto Vercel oficial está identificado e saudável no ponto de vista de deployment: o deployment de Production está Ready, servido pela branch `main`, no commit `06ede0f`. Nesse projecto foram observadas apenas as variáveis públicas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`, ambas em Production e Preview. As variáveis server-side exigidas pelo caderno — `SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET` — ainda precisam de ser confirmadas/configuradas no projecto oficial.

## 2. Fontes e hierarquia documental

O pacote final contém documentos de governança, fundamentos, metodologia, decisões críticas, operação, proteção jurídica, UX, arquitetura e implantação. A ordem correcta de interpretação é: governança documental e princípios; matrizes comparativa e metodológica; matriz de necessidades; DEC-01; documentos OC/JUR/POL/AC; TEC-01 e UX-01; plano mestre de implantação; caderno técnico e matriz de rastreabilidade.

A duplicata nominal de `OC-04_Matriz_Situacoes_Risco_Respostas_v1.1.md` continua a ser um problema documental de controle, não uma nova regra funcional. Deve ser mantida apenas uma cópia vigente na biblioteca institucional e a outra deve ser arquivada como histórico, sem apagar evidência.

## 3. Matriz consolidada de implantação

| Área documental | Evidência local | Estado actual | O que falta para considerar implantado |
|---|---|---|---|
| Governança documental e rastreabilidade | `docs/CADERNO_TECNICO_DESENVOLVIMENTO_IMPLANTACAO_FAM.md`, `docs/FAM_FASE2_RASTREABILIDADE.md` | Parcialmente implementada | Associar IDs de requisito a cada entrega futura e registrar aprovação institucional.
| Fundação técnica e modelo de risco | `famRisk.ts`, `famRiskEngine.ts`, `famAssessmentState.ts` | Implementada no código | Homologar contra schema remoto e executar cenários E2E.
| Catálogo metodológico versionado | `famRiskCatalog.ts`, FAM016, FAM017 | Implementada localmente; estrutura remota observada | Executar/verificar as consultas FAM016, confirmar versão publicada e validar persistência/recuperação sem mistura de versões.
| ProtectionFlow e fluxos especiais | `famProtectionFlow.ts`, testes e UI pública | Implementada no código | Validação jurídica/metodológica de JUR-01/JUR-03 e teste de emergência, criança/adolescente, violência sexual, idosa, deficiência e revelação espontânea.
| Atendimento conversacional | `FamSupportCenter.tsx`, `fam-atendimento/page.tsx`, FAM001/FAM005 | Implementada no MVP | Testar concorrência, retomada, pausa segura, encerramento confirmado, realtime e permissões com contas reais de homologação.
| Encaminhamento | `famReferrals.ts`, `famReferralRequests.ts`, `famReferralOperations.ts`, FAM004/FAM005/FAM012–FAM014 | Implementada no código e fluxo | Validar RPC/RLS remotamente e executar E2E completo até confirmação e snapshot/hash.
| Evidências e anexos | `famAttachments.ts`, `famEvidencePurge.ts`, `famMalwareScanner.ts`, FAM002/FAM009/FAM011/FAM015 | Parcial | Contratar/escolher scanner real ou aprovar ClamAV privado; configurar worker; testar MIME, tamanho, quarentena, limpeza, expiração, legal hold e auditoria.
| Expurgo e retenção | `/api/cron/fam-evidence`, FAM009, `vercel.json` | Código e cron declarados | Configurar `CRON_SECRET`, verificar disponibilidade do segredo no projecto oficial e provar execução auditada do cron.
| INFO e fontes | `famInfo.ts`, `/admin/fam-info`, FAM010 | Estrutura implementada | Cadastrar conteúdo aprovado, fontes, versões, revisão e publicar apenas itens aprovados.
| Importação em lote | `/admin/fam-importacao`, `/api/admin/fam-import`, FAM008 | Código implementado | Configurar `SUPABASE_SERVICE_ROLE_KEY` somente no servidor, SMTP próprio, testar idempotência, limites e fila sem dados reais.
| Cadastro territorial | FAM006/FAM007 e fluxo de registro | Implementado no código | Confirmar sede activa FAM-Samambaia-DF no remoto e testar etapas 6–10 sem rate limit do SMTP padrão.
| Governança e delegações | GOV001–GOV010, preset Administrador FAM e elevação de `tecnologiaagilize@gmail.com` | Parcialmente configurada | Verificar em produção o acesso efectivo por módulo, escopo, suspensão/reativação e separação de funções.
| Acessibilidade e copy | onboarding, BackButton, Quick Exit, identidade FAM | Parcialmente implementada | Executar revisão com teclado/leitor, mobile, saída rápida, textos JUR-03 e confirmação institucional de copy.
| Produção Vercel | projecto oficial Ready, branch `main`, commit `06ede0f` | Deployment operacional | Confirmar variáveis públicas no projecto oficial, adicionar segredos server-side e escolher um domínio oficial único.
| Supabase/Auth/Storage/Realtime | Relações FAM visíveis no Table Editor remoto | Estrutura remota observada | Validar migrations, políticas RLS, buckets, realtime, MFA e logs através de consultas de leitura e checklist de segurança.
| Privacidade e incidentes | JUR-02, JUR-04, JUR-05, `/privacidade` e auditoria | Documentação e partes do código | Aprovação DPO/jurídica, fluxo de incidente, matriz RACI, direitos da titular e retenção formalmente publicados.

## 4. Inventário técnico actual

O clone contém as migrations FAM001–FAM017, GOV010, SEC001–SEC002 e STORAGE001, além do histórico mais amplo da plataforma. O núcleo FAM inclui os serviços de risco, catálogo, ProtectionFlow, anexos, expurgo, scanner, INFO, encaminhamento, operações, auditoria e suporte. Existem sete ficheiros de teste específicos FAM, com **34 ocorrências de `it`/`test` identificadas no clone**; a matriz de Fase 2 reporta 19 testes executados no comando específico e deve ser reconciliada com a contagem actual antes do aceite formal.

As rotas FAM presentes são `/analise-risco`, `/admin/fam-atendimento`, `/admin/fam-expurgo`, `/admin/fam-importacao`, `/admin/fam-info`, `/api/admin/fam-evidence`, `/api/admin/fam-import`, `/api/admin/fam-info` e `/api/cron/fam-evidence`.

No Supabase remoto, o Table Editor autenticado mostrou relações FAM relevantes, incluindo `fam_assessment_state_history`, `fam_attendants`, `fam_audit_events`, `fam_case_shares`, `fam_conversations`, `fam_document_sources`, entidades INFO, bases jurídicas, legal holds, mensagens, encaminhamentos, retenção, respostas, anexos, casos, questionários, perguntas, regras, sinais e auditoria de compartilhamento. Essa observação comprova que as relações estão expostas ao editor remoto, mas **não substitui** a conferência de colunas, constraints, RLS, funções e dados de versão.

## 5. Lacunas que bloqueiam produção

### 5.1 Configuração do projecto Vercel oficial

O projecto oficial é `fam-forca-ativa`, não o projecto/alias antigo `forcaativa2027-ui-fam-forca-ativa`. O projecto oficial está ligado ao GitHub, utiliza `main`, e o deployment Ready conhecido é `fam-forca-ativa-812im3jlf-fam-0cef.vercel.app`.

Devem ser confirmadas no projecto oficial, sem revelar valores no código:

| Variável | Ambiente | Finalidade | Situação a confirmar |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | Cliente browser | Observada configurada.
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Cliente browser | Observada configurada.
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview conforme necessidade | Rotas server-side de importação/expurgo | Não observada na auditoria Vercel.
| `CRON_SECRET` | Production | Autorização do cron de expurgo | Não observada na auditoria Vercel.

A service role nunca deve possuir prefixo `NEXT_PUBLIC_`, nem ser enviada para componentes client-side, logs ou repositório.

### 5.2 Supabase remoto

A aplicação deve manter o princípio de migrations aditivas e não destrutivas. Antes de qualquer migration adicional, é necessário verificar `information_schema.columns`, constraints, índices, políticas em `pg_policies`, funções em `pg_proc`/`pg_get_functiondef` e a existência de versões publicadas. As versões FAM003 incompatíveis baseadas em `case_id` não devem ser executadas no projecto que utiliza `risk_case_id`.

O aceite remoto requer evidência dos seguintes pontos: catálogo metodológico publicado; perguntas e regras coerentes; `fam_risk_cases` com versão e estado; histórico de estado; auditoria; encaminhamento; snapshot/hash; anexos e retenção; legal hold; INFO; sede FAM-Samambaia-DF; e políticas públicas restritas a conteúdo publicado.

### 5.3 E-mail e importação em massa

O fluxo de convite em lote não deve depender do provedor SMTP padrão do Supabase, porque o limite de envio já foi atingido na experiência de cadastro. É necessário configurar SMTP próprio, definir remetente institucional, validar domínio e testar a fila em pequenos lotes. A operação de até 25 convites por processamento deve permanecer preservada até a homologação do provedor.

### 5.4 Scanner e ciclo de vida de ficheiros

O adaptador agnóstico de scanner está no código, mas a decisão operacional não está fechada. Antes de aceitar anexos reais é necessário escolher um serviço externo com avaliação de privacidade ou um ClamAV privado, definir timeout e comportamento de falha, manter quarentena por padrão, bloquear arquivo não limpo, impedir MIME spoofing, aplicar limites de tamanho/tipo, congelar somente anexos limpos no snapshot e auditar expiração/expurgo/legal hold.

### 5.5 Conteúdo INFO e aprovação

O módulo INFO não deve ser considerado completo apenas porque possui tabelas e editor. Falta inserir conteúdo institucional aprovado, associar fontes e versões, registrar revisão e publicar apenas artigos no estado permitido. Conteúdo jurídico, orientativo ou de emergência precisa de aprovação da autoridade correspondente antes de exposição pública.

### 5.6 Administração, delegações e acesso

A conta `tecnologiaagilize@gmail.com` foi elevada ao perfil compatível com Administrador Geral/antigo Apóstolo no histórico da implantação. Ainda falta validar no projecto oficial e no Supabase, com a sessão real, que as permissões efectivas correspondem ao preset esperado e que a separação por módulos — FAM, governança, informação, património, pagamentos e demais áreas — não concede acesso excessivo a dados sensíveis.

## 6. Ordem de implantação recomendada

| Ordem | Entrega | Dependência | Critério de saída |
|---:|---|---|---|
| 1 | Fechar referência oficial Vercel/GitHub | Projecto `fam-forca-ativa` | Nenhuma alteração é feita no alias antigo; branch `main` é a fonte única.
| 2 | Fechar configuração Vercel | Acesso ao projecto oficial | Variáveis públicas e segredos server-side presentes nos ambientes adequados.
| 3 | Validar Supabase de forma não destrutiva | Sessão SQL Editor/backup | Relações, colunas, funções, RLS, buckets e realtime conferidos.
| 4 | Homologar FAM016/FAM017 | Catálogo e persistência | Versão metodológica publicada/recuperada sem mistura de versões.
| 5 | Homologar análise e ProtectionFlow | Catálogo validado | Cenários críticos sem diagnóstico, com emergência prioritária e autonomia preservada.
| 6 | Homologar atendimento e encaminhamento | Casos e atendentes de teste | Fila, realtime, pausa, retomada, encerramento, confirmação e snapshot/hash comprovados.
| 7 | Fechar evidências | Scanner escolhido | Quarentena, limpeza, bloqueio, expiração, legal hold e expurgo auditados.
| 8 | Fechar INFO e privacidade | Conteúdo e aprovação | Conteúdo aprovado, fontes, versões, política de privacidade e RACI publicados.
| 9 | Configurar SMTP/importação | SMTP e service role | Convites em lote testados com idempotência e sem exposição de chave.
| 10 | Executar E2E e aceite institucional | Todos os itens anteriores | Checklist assinado e decisão formal de entrada em operação.

## 7. O que não deve ser feito

Não executar cegamente todos os 111 ficheiros da pasta de migrations, pois esse conjunto inclui histórico da plataforma CEC, correcções já incorporadas, duplicatas e migrations com dependências específicas. Não executar `FAM003_REPAIR_case_id.sql` no projecto remoto que já utiliza `risk_case_id`. Não apagar tabelas, versões ou dados históricos para “limpar” o estado. Não publicar conteúdo INFO não aprovado. Não enviar service role para o browser. Não iniciar importação de massa sem SMTP próprio e sem limites operacionais.

## 8. Decisão de prontidão

A FAM estará pronta para dados reais somente quando houver simultaneamente: documentação vigente; rastreabilidade requisito–código–migration–teste–evidência; schema remoto conferido; RLS e least privilege aprovados; variáveis e segredos configurados; catálogo metodológico validado; fluxo de emergência homologado; encaminhamento confirmado e congelado por snapshot/hash; scanner definido; expurgo auditado; INFO aprovado; acessibilidade verificada; SMTP de produção; E2E concluído; e aprovação formal da Direção, DPO/jurídico, responsável técnico e operação.

## 9. Próxima execução segura

A próxima execução deve ser a **validação remota não destrutiva do projecto Supabase oficial**, seguida da conferência das variáveis server-side no projecto Vercel oficial. Só depois devem ser aplicadas migrations adicionais, sempre uma por vez, com resultado registado. A implementação funcional restante deve começar pelo fechamento do ciclo de evidências e pela configuração do cron, pois esses itens afectam directamente a segurança de dados reais.

## Referências

[1]: https://vercel.com/fam-0cef/fam-forca-ativa "Projecto Vercel oficial FAM"
[2]: https://supabase.com/dashboard/project/untlbpzafiojirmpogqp/editor "Supabase Table Editor do projecto FAM"
[3]: https://github.com/forcaativa2027-ui/fam-forca-ativa "Repositório GitHub FAM"
