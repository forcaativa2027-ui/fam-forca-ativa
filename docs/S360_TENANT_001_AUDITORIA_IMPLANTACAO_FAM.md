# Auditoria S360-TENANT-001 — Implantação FAM

**Projeto:** FAM — Força Ativa da Mulher  
**Referência técnica:** Servo360 / tenant `third_sector` / template `THIRD_SECTOR_DEFAULT`  
**Data:** 26 de agosto de 2026  
**Autor:** Manus AI

## 1. Conclusão executiva

O documento S360-TENANT-001 confirma que a FAM deve ser implementada como **tenant parametrizado do Servo360**, e não como fork independente. A base actual já possui elementos funcionais importantes, incluindo autenticação, perfil de Administrador Geral, módulos administrativos, conteúdos institucionais, rádio, agenda, INFO, workflow editorial de banners FAM018/FAM019 e integração com Supabase/Vercel.

Entretanto, a auditoria do clone local mostra que a parametrização ainda não está completa. Permanecem referências herdadas da CEC em serviços, rótulos, rotas e módulos administrativos, enquanto a configuração de tenant ainda não aparece como uma camada única capaz de controlar branding, menus, labels, módulos, contactos e dados institucionais.

A próxima implantação recomendada não é uma nova expansão de negócio. É a **Fase FAM-TENANT-001 — núcleo de parametrização institucional**, começando por uma configuração central e por um conjunto seguro de labels/módulos. Essa entrega deve preceder a população ampla de conteúdo e a expansão de voluntariado, projectos e beneficiários.

> O objectivo é fazer o Servo360 adaptar-se à FAM, sem apagar dados existentes, sem duplicar a plataforma e sem alterar a paleta de cores aprovada.

## 2. Estado identificado

| Área | Situação observada | Classificação |
|---|---|---|
| Vercel e Supabase | Projecto oficial `fam-forca-ativa` estabilizado e acessível | Concluído |
| Autenticação e Administrador Geral | Conta `tecnologiaagilize@gmail.com` mapeada ao perfil equivalente ao antigo `apostolo` | Concluído |
| Carrossel institucional | FAM018 implementado | Concluído |
| Workflow editorial de banners | FAM019 implementado e integrado ao painel | Concluído |
| Configuração visual FAM | Existem componentes e conteúdo FAM, mas a camada de tenant não é única nem completa | Parcial |
| Terminologia | Existe `orgTerminology`, porém os defaults ainda contêm conceitos da CEC e a documentação indica escopo global/por igreja | Parcial |
| Dados de cultos | `institutional.ts` mantém serviço e fallback explícito de cultos da CEC Manaus | Bloqueador de conformidade FAM |
| Menus e módulos | Há painéis e componentes com conceitos CEC, MDA, Life Group, Genealogia, Kids e CECmais | Parcial; precisa de flags por tenant |
| Notícias | Há base editorial, mas os campos obrigatórios e categorias parametrizáveis precisam de validação contra o template | Parcial |
| Rádio e vídeos | Existem módulos, mas categorias administráveis por tenant devem ser confirmadas | Parcial |
| Voluntariado e talentos | O template prevê formulários e matching; não há evidência suficiente de fluxo completo correspondente | Pendente |
| Doação e dados institucionais | Há `GivingAdmin` com Pix, porém a fonte única com razão social, CNPJ, banco, contactos e identidade ainda precisa ser consolidada | Parcial |
| Projetos, beneficiários e transparência | Recomendados pelo template como terceiro setor ampliado; não devem bloquear o MVP institucional | Backlog posterior |

## 3. Evidências técnicas relevantes

A busca no código encontrou referências herdadas que precisam ser tratadas por configuração ou removidas da experiência FAM sem remover tabelas ou dados globais. Entre elas estão `CEC Family`, `CEC Manaus`, `Cultos`, `Life Group`, `Discipulado`, `CEC ID`, `CECmais`, `MDA` e `Acompanhamento Pastoral`.

O serviço institucional contém funções e fallback de horários de culto da CEC Manaus. Esse comportamento é incompatível com a decisão congelada `THIRD-005`, segundo a qual Cultos fica desabilitado no tenant FAM e não deve aparecer como conteúdo padrão.

O serviço de terminologia já oferece uma direcção reutilizável, mas os valores padrão ainda são religiosos e o comentário do código indica que o multi-tenant foi apenas parcialmente retomado. Isso significa que o próximo passo deve consolidar o contexto do tenant antes de acrescentar novos módulos.

## 4. Matriz de requisitos do template

| Requisito documental | Implementação actual | Acção recomendada | Prioridade |
|---|---|---|---|
| FAM como tenant `third_sector` | Parcial; identidade aparece em componentes e páginas, sem camada central comprovada | Criar/confirmar configuração institucional única por tenant | P0 |
| Branding configurável | Parcial | Centralizar leitura de nome, logos, contactos e dados sem alterar tokens de cor | P0 |
| Próximos Cultos → Próximos Eventos | Parcial | Ocultar cultos no FAM e usar agenda/eventos na home | P0 |
| Cultos desabilitados | Não garantido; existe fallback CEC | Adicionar flag de módulo e impedir fallback religioso no FAM | P0 |
| Notícias editoriais | Parcial | Garantir autor, fonte, data, categorias FAM e detalhe editorial | P1 |
| Rádio com categorias configuráveis | Módulo existente; parametrização deve ser confirmada | Validar tenant_id, CRUD e visibilidade | P1 |
| Vídeos com categorias configuráveis | Módulo existente; categoria religiosa fixa pode permanecer | Migrar categorias para configuração por tenant | P1 |
| Participar / voluntariado | Não comprovado como fluxo completo | Implementar formulário mínimo e encaminhamento WhatsApp configurável | P1 |
| Fale Conosco | Rota existente | Substituir linguagem de oração por contacto institucional e WhatsApp configurável | P1 |
| Doação | `GivingAdmin` possui Pix | Consolidar perfil institucional e fonte única de dados | P1 |
| Menus públicos e autenticados | Parcial | Aplicar flags e labels FAM sem apagar rotas/dados | P0 |
| Área autenticada FAM | Parcial | Confirmar Visão Geral, Acompanhamento, Comunicação, Parceiros, FAM Academy, Kids e FAM Mais | P1 |
| Admin FAM | Parcial | Ocultar MDA/Life Group/Genealogia/Comunidades e renomear recursos conforme o template | P1 |
| Permissões por módulo | Delegações existentes | Vincular permissões a módulos parametrizados do tenant | P1 |
| Isolamento, auditoria e escopo | Há mecanismos em partes do sistema | Reutilizar RLS e auditoria; não criar tabelas duplicadas sem verificar equivalentes | P0 |
| Projetos, beneficiários, transparência | Não são necessários ao MVP imediato | Planejar fase de terceiro setor ampliado | P2 |

## 5. Ordem de implantação recomendada

### Implantação 1 — FAM-TENANT-001: configuração institucional central

Esta é a próxima implantação necessária. Deve criar ou consolidar uma fonte única para o contexto FAM, contendo `display_name`, `short_name`, `tenant_type`, `template`, contactos institucionais, WhatsApp, website, endereço, CNPJ, Pix e referências de assets. A implementação deve reutilizar tabelas equivalentes quando existirem e operar de forma não destrutiva.

A mesma entrega deve introduzir flags de módulos e menus para o tenant, permitindo desabilitar Cultos, Life Group, Discipulado no label antigo, recursos de Ministério e categorias religiosas na experiência FAM sem excluir dados globais.

### Implantação 2 — FAM-TENANT-002: labels e navegação FAM

Depois da configuração central, aplicar os labels congelados: **Acompanhamento**, **Comunicação**, **Parceiros**, **FAM Academy**, **FAM Mais**, **Membro ID** e **Grupo de Voluntários**. A home deve exibir **Próximos Eventos**, e não Próximos Cultos. O botão de retorno deve permanecer funcional em todas as páginas.

### Implantação 3 — FAM-PUBLIC-001: público institucional mínimo

Validar o formato editorial de Notícias, as categorias FAM, Rádio e Vídeos parametrizáveis, Fale Conosco com WhatsApp configurável, Doação com dados institucionais e o fluxo inicial de Participar/Voluntariado.

### Implantação 4 — teste operacional do FAM018/FAM019

Com o tenant e os menus estabilizados, executar o banner de teste através de rascunho, revisão, aprovação pelo Administrador Geral, publicação, verificação na home, pausa/arquivamento e conferência da auditoria.

### Implantação 5 — operação de produção

Somente depois das anteriores, configurar SMTP próprio, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, rotina de expurgo/importação e scanner de malware. Essas configurações dependem de decisão operacional e não devem ser simuladas no código.

## 6. O que não deve ser feito

Não deve ser criado um fork FAM, nem devem ser removidos globalmente os dados ou as rotas religiosas. Também não devem ser alterados os tokens ou a paleta de cores. O WhatsApp não deve ficar fixo no código, e as categorias de Rádio e Vídeos não devem permanecer rígidas. A ocultação de um módulo deve ocorrer por configuração e permissão, preservando a integridade histórica dos dados.

## 7. Critério de aceite da próxima implantação

A próxima entrega poderá ser considerada concluída quando o sistema resolver o tenant FAM por configuração, mostrar identidade e contactos institucionais correctos, não exibir Cultos nem terminologia religiosa inadequada na experiência FAM, apresentar Próximos Eventos, respeitar as flags de módulos e manter o mesmo código compatível com tenants de igreja.

Além disso, nenhuma alteração poderá mudar a paleta de cores actual, apagar dados, quebrar o acesso do Administrador Geral ou introduzir dependência de cargo eclesiástico para gestão FAM.

## 8. Decisão recomendada

A recomendação é iniciar agora a **Implantação FAM-TENANT-001 — configuração institucional, labels, módulos e menus**. O teste do banner deve continuar no plano, mas é mais seguro executá-lo depois que a camada de tenant estiver consolidada, pois a publicação pública depende da navegação e da identidade correctas da FAM.

---

**Fonte principal:** documento fornecido pelo utilizador, `S360-TENANT-001_Template_Terceiro_Setor_Associacoes_Institutos_OSCs_OSCIPs_v1.0.md`, especialmente as secções 3–6, 22–24, 47–65.
