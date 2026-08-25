# Índice de Migrations — CEC Family

> Gerado ao reconciliar duas fontes que haviam divergido: a pasta
> `supabase/migrations/` do ZIP do repositório e o pacote `sql_tar.gz`
> (arquivo pessoal do usuário). Este é o conjunto **canônico** — deve
> substituir as duas fontes anteriores.

## O que foi feito nesta reconciliação

1. **Removida 1 duplicata literal:** `FLEX001_niveis_flexiveis (1).sql`
   era cópia idêntica de `FLEX001_niveis_flexiveis.sql`.
2. **7 arquivos substituídos pela versão mais nova** (existiam nas duas
   fontes com conteúdo diferente; o `sql_tar.gz` continha correções
   posteriores que não tinham sido copiadas de volta pro ZIP):
   - `CECID004_checkin_portaria_eventos.sql`
   - `CT002b_invite_scope.sql` (ganhou `drop function if exists` antes do `create or replace`, evitando erro de assinatura)
   - `CT002c_invite_identity.sql`
   - `FLEX001_niveis_flexiveis.sql` (corrigiu referência a colunas `anc.out_state_id` etc.)
   - `RELMDA003_consolidacao_fase3.sql`
   - `RELMDA003_relatorio_area_consolidado.sql`
   - `TORRE001_escopo_territorial.sql` (ganhou recriação da view `control_tower_summary` derrubada pelo `drop ... cascade`)
3. **10 arquivos recuperados** que só existiam no `sql_tar.gz` e não
   estavam em `supabase/migrations/` do ZIP (incluindo `DOSS001_rede_relacionamentos.sql`,
   que já tínhamos identificado como órfão numa conversa anterior):
   - `CLASS001_expandir_journey_stage.sql`
   - `CT002d_fix_member_creation.sql`
   - `CT002e_fix_classificacao_convite.sql`
   - `DOSS001_rede_relacionamentos.sql`
   - `FLEX001b_health_flex.sql`
   - `GOV005_remove_trigger_antigo.sql`
   - `GOV007a_add_enum_usuarios.sql`
   - `GOV007b_reclassifica_permissoes.sql`
   - `REL001_member_relocations.sql`
   - `SEARCH001_pesquisa_global.sql`

**Total: 111 migrations.**

⚠️ Isso é o histórico **do que já foi escrito**, não confirmação de que
tudo foi de fato executado no Supabase de produção — como o workflow é
colar no SQL Editor manualmente, sempre existe a chance de um arquivo
aqui nunca ter sido rodado, ou de algo ter sido rodado direto no banco
sem nunca virar arquivo. Rule #11 do contexto do projeto continua
válida: antes de mexer em função/tabela sem certeza, rodar introspecção
(`information_schema.columns`, `pg_get_functiondef`) em vez de supor.

## Convenção de prefixos (o que significa cada um)

| Prefixo | Área |
|---|---|
| `M*`, `C*`, `B*`, `migration_*` | Fase inicial do projeto (nomenclatura antes de virar sigla por módulo) |
| `CAD` | Cadastro / dados pessoais do membro |
| `CECID` | CEC ID (carteirinha digital) |
| `CECMAIS` | CECmais (ofertas/serviços) |
| `CLASS` | Classificação / Situação Ministerial |
| `CONT` | Conteúdo (notícias, pregações, banners) |
| `CT002*` | Convites (Central de Convites) |
| `DASH` | Dashboard executivo |
| `DOSS` | Dossiê Ministerial Digital |
| `EVT` | Eventos com inscrição |
| `FIX` | Correções pontuais de bug |
| `FLEX` | Níveis territoriais flexíveis |
| `FORM` | Formação (cursos/turmas/matrículas) |
| `GIVE` | Dízimo / Momento da Generosidade |
| `GOV` | Governança / Delegações |
| `LID` | Liderança (leadership_assignments) |
| `MEO` | Estrutura territorial (árvore MEO-001) |
| `REG` | Cadastro/Onboarding público |
| `REL` | Realocação de membro |
| `RELMDA` | Relatório de Life Groups (RELMDA) |
| `SEARCH` | Pesquisa global |
| `SEC` | Sessões de usuário |
| `STORAGE` | Buckets de storage |
| `TORRE` | Torre de Controle |

## Tabela completa (ordem alfabética)

| Arquivo | Descrição (1ª linha de comentário no arquivo) |
|---|---|
| `AUDIT001_expandida.sql` | AUDIT001 — Auditoria expandida (IP + before/after + justificativa) |
| `B2_church_info_daily_words.sql` | Tabelas: church_info (cultos por igreja) + daily_words (palavra). |
| `B4b_monthly_report.sql` | Fiel ao papel fisico enviado pelo cliente. |
| `C12_block1_patrimony_foundation.sql` | - Tabelas: properties, assets, property_documents, asset_documents, asset_photos |
| `C13_quick_wins.sql` | 1. Seed completo de Sedes + Núcleos (Manaus, Brasília + 16 núcleos) |
| `C13b_communities_admin.sql` | - Novos campos administrativos em churches |
| `C13c_hierarchical_permissions.sql` | - profiles.church_id (escopo do pastor) |
| `C13d_visualizations.sql` | 1) Genealogia ministerial (LG mãe → LGs filhos) |
| `C15_pre_production_critical.sql` | Idempotente. |
| `C16_ministerial_intelligence.sql` | Score Ministerial, Rankings, Funil de Retenção, |
| `C17_ministry_goals.sql` | Metas por nível hierárquico + acompanhamento vs. realizado |
| `C18_control_tower.sql` | View consolidada de alertas críticos para liderança nacional |
| `C22_pastoral_timeline.sql` | mudança de etapa (journey_stage) do membro |
| `C23_trilha_maturidade.sql` | Aditiva sobre C22_pastoral_timeline.sql — não altera nada existente. |
| `C24_evangelism_groups.sql` | Uma célula (life_group) pode ser responsável por um ou mais |
| `CAD001_dados_pessoais_completos.sql` | melhoria: Cadastro/Realocação/Carteirinha, Seções 5 e 9). |
| `CAD002_member_photos_bucket.sql` | Cada pessoa só pode enviar/trocar a própria foto; leitura pública |
| `CAD003_fix_member_self_update.sql` | complementação de cadastro (Card "Complete seu cadastro"). |
| `CAD004_fix_email_membro.sql` | membro (Pessoas > Membros). O insert do consume_invite_link não |
| `CECID001_carteirinha.sql` | Identificador único permanente, status de elegibilidade (com |
| `CECID002_fix_status_travado.sql` | "Aguardando foto" mesmo depois da foto ser enviada. |
| `CECID002_leitor_portaria.sql` | CECID002 — Leitor de QR na Portaria (Fase 2 do CEC ID) |
| `CECID003_member_since.sql` | (data oficial de ingresso como membro — diferente de data de |
| `CECID004_checkin_portaria_eventos.sql` | eventos, portaria, CTL/TADEL — genérico por "evento/local" |
| `CECMAIS001_catalogo_ofertas.sql` | 5 tipos distintos de oferta, cada um com seu próprio fluxo |
| `CLASS001_expandir_journey_stage.sql` | os cargos de liderança espiritual que faltavam na classificação. |
| `CLASS001_situacao_ministerial_lideranca.sql` | incluir Apóstolo(a), Pastor(a) Principal/Auxiliar e os demais |
| `CONT001_duracao_video.sql` | Adiciona campo de duração às pregações (opcional, preenchido |
| `CONT002_posicao_noticias.sql` | Adiciona campo "Posição" (sort_order) às notícias, pra permitir |
| `CONT003_ordem_pregacoes.sql` | mesmo padrão de Notícias e Banners). |
| `CONT004_pregacoes_descricao_pdf.sql` | usuário) e link de PDF pra download da palavra. |
| `CT002_invite_links.sql` | Tabelas: invite_links, invite_link_uses |
| `CT002b_invite_scope.sql` | Permite que um convite de Pastor/Supervisor já defina o nível |
| `CT002c_invite_identity.sql` | Acrescenta logo_url da igreja e o nome da unidade organizacional |
| `CT002d_fix_member_creation.sql` | o registro de "membro" (só atualizava o profile), por isso a |
| `CT002e_fix_classificacao_convite.sql` | como "Novo Convertido" em Pessoas > Membros. |
| `CT002f_fix_role_definitivo.sql` | outro cargo) ficava com profiles.role = 'membro' em vez do |
| `DASH001_central_pendencias.sql` | Junta numa lista só tudo que já existia espalhado: pedidos de |
| `DASH002_ministerios_eventos.sql` | e Eventos pro Dashboard Executivo. |
| `DASH003_notificacoes_dismissals.sql` | As notificações em si já são computadas dinamicamente a partir |
| `DASH004_inteligencia_ministerial.sql` | Compara o crescimento de membros de cada Setor nos últimos 6 |
| `DASH005_metas_ministerio.sql` | A view goals_vs_actual já existente só cobre escopo 'nacional' |
| `DASH006_painel_usuarios.sql` | indicadores que já existiam espalhados (sessões, delegações, |
| `DOSS001_rede_relacionamentos.sql` | Sobe a cadeia de discipulado (quem discipula quem discipula...) |
| `DOSS002_relacionamentos_familiares.sql` | Registra vínculos de família — quando o familiar também é da |
| `DOSS003_motor_regras.sql` | Avalia um conjunto de regras pra um membro específico e devolve |
| `EVT001_eventos_schema.sql` | EVT001 — Módulo de Eventos com Inscrição (sem pagamento por enquanto) |
| `FIX001_target_audience.sql` | (migration original M6_lg_suggestion.sql parece nunca ter sido |
| `FIX002_backfill_member_church_id.sql` | FIX002 — Corrige members.church_id ausente |
| `FIX002_journey_stage_label.sql` | does not exist" ao mudar a Situação Ministerial de um membro. |
| `FIX003_apostolo_write_e_convite_sem_lg.sql` | FIX003 — Apóstolo consegue corrigir/remover membros órfãos |
| `FIX003_pastoral_timeline_colunas.sql` | does not exist" ao mudar a Situação Ministerial de um membro. |
| `FIX004_estado_territorial.sql` | Carteira de Membro. |
| `FIX004_member_structure_names.sql` | FIX004 — Corrige exibição falsa de "sem Life Group" na aba Estrutura |
| `FIX005_member_self_update.sql` | FIX005 — Membro não conseguia salvar o próprio cadastro complementar |
| `FIX005_sermons_rls.sql` | for table sermons" ao cadastrar uma Pregação. |
| `FIX006_self_member_creation.sql` | FIX006 — Qualquer usuário pode criar o próprio cadastro de membro |
| `FIX_churches_rls.sql` | Garante que apóstolos/pastores podem INSERIR/EDITAR/APAGAR comunidades. |
| `FLEX001_niveis_flexiveis.sql` | Troca FK fixa (districts.nucleo_id obrigatório, sectors.district_id |
| `FLEX001b_health_flex.sql` | view do dashboard, agora considerando que Distrito/Setor/Igreja |
| `FORM001_cursos_turmas_matriculas.sql` | Turmas e Matrículas). Não existia nada disso no sistema — só o |
| `GIVE001_dizimo_ofertas.sql` | GIVE001 — Dízimo e Ofertas (Fase 3) |
| `GIVE002_qrcode_pix.sql` | GIVE002 — QR Code do PIX por igreja |
| `GIVE003_complete_giving_system.sql` | GIVE003 — Completa o sistema "Momento da Generosidade" |
| `GOV001_conselho_diretor.sql` | O frontend (DelegationsAdmin.tsx, src/services/delegations.ts) |
| `GOV002_travamento_modulos.sql` | A partir de agora, só o Apóstolo (Administrador Nacional) vê o |
| `GOV004_remove_overload_antiga.sql` | coexistindo (sobrecarga de função) — uma antiga com parâmetro |
| `GOV005_remove_trigger_antigo.sql` | antigo em module_delegations — mod_del_fill_critical, chamando |
| `GOV006_permissoes_atomicas.sql` | UX-003 (Perfil → Papel → Permissões atômicas → Escopo com herança). |
| `GOV007a_add_enum_usuarios.sql` | Precisa rodar SOZINHO primeiro (o Postgres não deixa usar um |
| `GOV007b_reclassifica_permissoes.sql` | no GOV007a), reclassifica as permissões e cria as novas. |
| `GOV008a_add_enum_suspensa.sql` | GOV-002 §17.1: Suspensão de delegações. Passo 1/2 — precisa |
| `GOV008b_suspender_reativar.sql` | GOV-002 §17.1: Suspensão de delegações. Passo 2/2 — precisa |
| `GOV009_central_delegacoes_busca.sql` | GOV-002 §9: Central de Delegações — busca de usuários. |
| `IA1_indicators.sql` | (Fecha Caderno 11-B itens 18 e 19, sem dependência de IA) |
| `LID001_leadership_assignments.sql` | Log de designações ministeriais com histórico preservado — |
| `M1a_public_content.sql` | Tabelas: news, public_prayer_requests, visit_requests |
| `M1b_banners_geo_categories.sql` | Tabelas/colunas: banners, life_groups(state/city/neighborhood), events.event_type |
| `M2a_multicommunity_foundation.sql` | - Expande `churches` (slug, pastor_id, logo_url, banner_url, cores) |
| `M2b_scoped_public_forms.sql` | - Adiciona church_id em public_prayer_requests e visit_requests |
| `M3_patch_life_group_id.sql` | Permite que o wizard publico capture qual LG o visitante escolheu. |
| `M3_visitor_pipeline.sql` | Tabela: visitor_pipeline (anteciparmos do M4) |
| `M4_M5_crm_acolhimento.sql` | Views para os 7 menus da Central de Acolhimento |
| `M6_lg_suggestion.sql` | - Campo target_audience em life_groups (Supervisor de Área decide) |
| `M7_geocoding.sql` | - Tabela: geocode_cache (cache de Nominatim) |
| `MEO001_estrutura_territorial.sql` | Migração direta (recria a árvore territorial). Dado real hoje é |
| `MEO001b_health_view_fix.sql` | view do dashboard para a nova direção da árvore territorial. |
| `M_engagement_evasion_badges.sql` | - View: members_at_risk_evasion |
| `M_mda_health.sql` | - Funções de saúde por LG, Setor, Área, Distrito, Igreja |
| `M_ministries.sql` | Tabelas: ministries, ministry_members (N:N), ministry_posts |
| `M_weekly_report_expanded.sql` | - Move quantitativos do mensal físico → relatório semanal |
| `M_weekly_report_full_11B.sql` | Multiplicação, Saúde do LG e Necessidades Pastorais |
| `REG001_cadastro_completo.sql` | REG001 — Cadastro completo (estilo app Universal) — Fase 2 |
| `REL001_definitivo.sql` | (aba Estrutura do editor de membro "não salva os dados |
| `REL001_member_relocations.sql` | melhoria, Seção 5). Preserva histórico completo — nunca |
| `RELMDA001_schema_completo.sql` | Groups e Supervisão de Rede. |
| `RELMDA001_schema_relatorio_lg_fase1.sql` | RELMDA001 — Relatório Semanal de Life Group (Fase 1) |
| `RELMDA002_prazos_configuraveis.sql` | Cada Igreja pode ter seu próprio dia/horário limite de envio do |
| `RELMDA002_supervisao_fase2.sql` | RELMDA002 — Supervisão de Rede (Fase 2) |
| `RELMDA003_consolidacao_fase3.sql` | RELMDA003 — Consolidação por Setor/Rede com drill-down (Fase 3) |
| `RELMDA003_relatorio_area_consolidado.sql` | Relatório Consolidado por Área (demanda nova, item 3). Reúne, |
| `RELMDA004_dashboard_fase4.sql` | RELMDA004 — Dashboard e Comparativo Mensal (Fase 4) |
| `RELMDA005_alertas_fase5.sql` | RELMDA005 — Alertas e Prazos (Fase 5) |
| `SEARCH001_pesquisa_global.sql` | Inteligente. Busca unificada por Pessoas, Igrejas e Life Groups |
| `SEC001_sessoes.sql` | Registra sessões ativas por dispositivo (não substitui o |
| `STORAGE001_institutional_assets.sql` | Bucket de storage pra arquivos institucionais (QR Code de |
| `TORRE001_escopo_territorial.sql` | Problema: control_tower_alerts não respeitava abrangência — |
| `TORRE002_relmda_alerta_escopo.sql` | "RELMDA Atrasado" (o frontend já espera `alertas_relmda_atrasado` |
| `migration_33_fix_monthly_report.sql` | MIGRATION 33 — Fix RPC monthly_report_prefill |
| `migration_34_expansion_church_ids.sql` | MIGRATION 34 — Fix vw_expansion_cities: adiciona church_ids |
| `migration_34_expansion_church_ids_v2.sql` | MIGRATION 34 — Fix vw_expansion_cities: adiciona church_ids |

## Ações recomendadas no GitHub (nesta ordem)

1. **Apagar os 29 `.sql` soltos na raiz do repo** (fora de `supabase/migrations/`)
   que eram cópias idênticas — já estão preservados aqui dentro de `supabase/migrations/`:
   `AUDIT001_expandida.sql`, `CAD003_fix_member_self_update.sql`, `CAD004_fix_email_membro.sql`,
   `CECID002_fix_status_travado.sql`, `CECID002_leitor_portaria.sql`, `CECID003_member_since.sql`,
   `CECMAIS001_catalogo_ofertas.sql`, `CLASS001_situacao_ministerial_lideranca.sql`,
   `DASH001_central_pendencias.sql`, `DASH002_ministerios_eventos.sql`,
   `DASH003_notificacoes_dismissals.sql`, `DASH004_inteligencia_ministerial.sql`,
   `DASH005_metas_ministerio.sql`, `DASH006_painel_usuarios.sql`, `DOSS001_rede_relacionamentos.sql`,
   `DOSS002_relacionamentos_familiares.sql`, `EVT001_eventos_schema.sql`, `FIX001_target_audience.sql`,
   `FIX002_backfill_member_church_id.sql`, `FIX003_apostolo_write_e_convite_sem_lg.sql`,
   `FIX004_member_structure_names.sql`, `FIX005_sermons_rls.sql`, `FORM001_cursos_turmas_matriculas.sql`,
   `GOV006_permissoes_atomicas.sql`, `RELMDA001_schema_relatorio_lg_fase1.sql`,
   `RELMDA002_supervisao_fase2.sql`, `RELMDA003_consolidacao_fase3.sql`,
   `RELMDA004_dashboard_fase4.sql`, `RELMDA005_alertas_fase5.sql`, `TORRE001_escopo_territorial.sql`.

2. **Substituir o conteúdo de `supabase/migrations/`** pelo conteúdo desta pasta
   (111 arquivos + este `INDEX.md`). Isso já contempla: a remoção da duplicata `FLEX001 (1)`,
   a atualização dos 7 arquivos com correção mais nova, e a adição dos 10 arquivos recuperados.

3. **Não é preciso rodar nada no Supabase.** Nenhum desses arquivos é código novo — é só
   organização do repositório. As correções que estavam "perdidas" (ex: fix do `TORRE001`)
   só precisam ser rodadas de fato no SQL Editor se você não tiver certeza se já rodou —
   nesse caso, confirme antes com uma consulta de introspecção (ex: `select pg_get_viewdef('public.control_tower_summary')`
   pra ver se a view já existe do jeito novo).

4. **Depois disso, todo `.sql` novo entra direto em `supabase/migrations/`**, nunca solto na
   raiz — e nunca em duas fontes diferentes (ZIP local vs. pasta pessoal). Se você mantém
   uma cópia local própria (como o `sql_tar.gz`), ela devia ser exatamente esta pasta daqui
   pra frente, pra não divergir de novo.
