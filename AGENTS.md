# AGENTS.md — Contexto do Projeto FAM (Forca Ativa da Mulher)

## Visao Geral

Plataforma web para o Instituto FAM (Forca Ativa da Mulher), migrada da plataforma CEC (Comunidade Evangelica Crista). Atende gestao pastoral, protecao de mulheres, cadastro de membros, radio web, eventos e vida comunitaria.

- **URL producao**: https://fam-forca-ativavercel-mz0u76i9m-fam-0cef.vercel.app
- **GitHub**: https://github.com/forcaativa2027-ui/fam-forca-ativa (branch `main`)
- **Supabase**: Projeto `untlbpzafiojirmpogqp`
- **Migracoes**: FAM001-FAM012 ja aplicadas no Supabase

## Stack Tecnico

| Camada | Tecnologia | Versao |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.5 |
| Linguagem | TypeScript | ^5.4.0 |
| UI | React + Tailwind CSS + Radix UI + Lucide React | 18.3.1 |
| Backend/Auth/DB | Supabase (supabase-js + SSR) | 2.45.0 |
| Data Fetching | TanStack React Query | ^5.56.2 |
| Forms | React Hook Form + Zod | ^7.53.0 |
| Deploy | Vercel | - |
| Node.js | v18.20.8 | - |

## Estrutura de Diretorios

```
src/
  app/                    # Pages Next.js (App Router)
    admin/                # Painel administrativo (9+ secoes)
    painel/               # Painel do membro/lider
    api/                  # API routes (admin, bible, cron, radio)
    cadastrar/            # Cadastro publico (wizard 10 etapas)
    entrar/               # Login
    convite/[token]/      # Convite por link
    analise-risco/        # Analise de risco (FAM)
    radio/                # Radio web
    live/                 # Transmissao ao vivo
    eventos/              # Eventos
  components/
    admin/                # Painel admin (MembersAdmin, AdminSidebar, etc.)
    panel/                # Painel do membro
    public/               # Componentes publicos (RegisterWizard, PublicHome, etc.)
    radio/                # Radio web
    ui/                   # Primitivas UI (Button, Card, Input, etc.)
  hooks/                  # Custom hooks React
  lib/supabase/           # Clientes Supabase (client, server, admin)
  schemas/                # Validacoes Zod
  services/               # Camada de negocio (~114 arquivos)
  types/domain.ts         # Tipos TypeScript dominio
```

## Hierarquia de Roles

```
apostolo > pastor > supervisor > lider > discipulador > membro > visitante
```

**Roles admin**: `apostolo`, `pastor` (acesso total ao painel admin)

**Jornada do membro** (progressao):
`visitante` -> `novo_convertido` -> `consolidacao` -> `discipulado` -> `batismo` -> `membro_ativo` -> `membro_efetivo` -> `servo` -> `lider_formacao` -> `lider` -> `diacono` -> `supervisor` -> ... -> `pastor` -> `apostolo` -> `missionario`

## Tabelas Supabase Principais (~220 tabelas)

**Core**: `profiles`, `members`, `churches`, `sectors`, `districts`, `states`, `life_groups`, `ministries`, `events`

**FAM (protecao/risco)**: `fam_risk_cases`, `fam_risk_rules`, `fam_risk_answers`, `fam_conversations`, `fam_messages`, `fam_professional_credentials`, `fam_attendants`, `fam_referrals`

**Radio**: `radio_config`, `radio_episodes`, `radio_programs`, `radio_playlists`, `radio_listeners`

**Pipeline de cadastro**: `visitor_pipeline` (registros publicos entram aqui)

**Financas/Patrimonio**: `finances`, `finance_budgets`, `patrimony_*`

**Cursos**: `courses`, `course_modules`, `course_lessons`, `course_enrollments`

## RPCs Principais

| Funcao | Uso |
|---|---|
| `visitor_pipeline_create_v2` | Cadastro publico (cria entrada no pipeline) |
| `create_my_member_record` | Membro cria proprio registro apos login |
| `create_invite_link` / `consume_invite_link` | Sistema de convites |
| `approve_member_card` / `issue_member_card` | Aprovacao/emissao de carteirinha |
| `dashboard_stats` | Dashboard administrativo |
| `my_active_modules` | Controle de modulos delegados |
| `lg_meeting_roles_confirm_own` | Confirmacao de escala de reuniao |

## Variaveis de Ambiente Obrigatorias

### Producao (Vercel)

| Variavel | Finalidade |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anonima do Supabase (client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role (server-side, admin) |
| `NEXT_PUBLIC_SITE_URL` | URL publica do site |
| `NEXT_PUBLIC_TENANT_TEMPLATE` | Template do tenant (`third_sector`) |

### Integracoes

| Variavel | Finalidade |
|---|---|
| `OPENAI_API_KEY` | Transcricao e sumarizacao (radio) |
| `RESEND_API_KEY` | Servico de email (notificacoes radio) |
| `CRON_SECRET` | Protecao de cron endpoints |

## Fluxos de Cadastro

### 1. Cadastro Publico (`/cadastrar`)
- Wizard de 10 etapas: Conta -> TipoCadastro -> Verificacao -> Pessoal -> Localizacao -> **Comunidade** -> Fe -> Jornada -> Intencao -> Finalizacao
- Fluxo basico (2 etapas): Conta -> TipoCadastro(basico) -> FinalizacaoBasica
- Cria `auth.user` via `supabase.auth.signUp()`
- Cria entrada no pipeline via `visitor_pipeline_create_v2` RPC
- **community_id (igreja) e life_group_id sao OPCIONAIS** — admin vincula depois

### 2. Cadastro por Convite (`/convite/[token]`)
- Link de convite gerado por admin
- Cria `auth.user` + consome link via `consume_invite_link` RPC
- Vinculo vem pre-configurado no convite

### 3. Cadastro Admin (`MembersAdmin` + `/api/admin/create-member`)
- Admin cria `auth.user` com senha `cec1234` + registro em `members`
- Requer role `apostolo` ou `pastor`
- **church_id e life_group_id sao OPCIONAIS** — admin vincula depois

## Trabalho Realizado (historico de commits)

### COR-UX-01 (commit `9dbdcccc`)
- Perfis FAM: `adm_general`, `adm_instituicao`, `usuario_delegado`, `usuario_comum`
- Removido `apostolo` das checks de auth
- Botao "Voltar" na pagina `/analise-risco`
- Card de boas-vindas com "Nao mostrar novamente" (localStorage + Supabase)
- Toggle de reativacao no Profile
- 14 componentes admin atualizados, 6 rotas API reescritas

### Fix cadastro sem vinculo (commit `8193733c`)
- Removidas todas as travas que exigiam `church_id`/`community_id` para cadastrar
- `StepComunidade`: community_id opcional, permite pular
- `StepFinalizacao`: sem validacao de community_id
- `create-member/route.ts`: church_id opcional, admin vincula depois
- `MembersAdmin`: sem check obrigatorio de church_id
- `pipeline.ts`: community_id opcional na interface
- `schemas`: wizardStep3Schema community_id opcional

### Revert de commit fracassado
- Commit `ebafed0d` revertido para `f7a1304d` (antes de "show rights school courses")
- Arquivos problematicos removidos: `lgMeetingRoles.ts` (duplicado), `test` (vazio)

## Problemas Conhecidos e Pendencias

### Build (URGENTE)
- **`next build` falha localmente** com SIGBUS (erro de memoria/mmap)
- **Vercel**: erro "No serverless pages were built" — o worker do webpack crasha silenciosamente
- **Workaround local**: `npm run dev` funciona normalmente
- `next.config.mjs` tem `ignoreBuildErrors: true` + `experimental: { webpackBuildWorker: false }`
- **Causa provavel**: dependencias com binarios nativos (ex: `unrs-resolver`) nao instaladas corretamente via `allow-scripts`

### Variavel de Ambiente
- `SUPABASE_SERVICE_ROLE_KEY` precisa estar configurada no Vercel (Settings -> Environment Variables)
- Sem ela, qualquer operacao admin (criar membro, etc.) retorna erro

### Notas Tecnicas
- `isolatedModules: true` no tsconfig.json
- `incremental: true` no tsconfig.json
- Git branch local: `temp-reset` (baseada em `f7a1304d` + fix de cadastro)
- Remote `origin/main`: `8193733c`
- Node.js: v18.20.8 (compativel com Next.js 14.2.5)
