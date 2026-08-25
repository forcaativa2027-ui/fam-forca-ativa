# S360-LIVE-000 — Caderno de Arquitetura — Servo360 Live-360 (CEC Family)

**Referência:** Especificação Servo360 LIVE (LIVE-000..016) + LIVE-DOM-001 + LIVE-ENG-000
**Plataforma alvo:** CEC Family (Next.js 14 App Router + Supabase)
**Escopo deste documento:** Arquitetura e plano de implementação (não implementação). Decisão de projeto: **Somente arquitetura/plano**.
**Tecnologias existentes:** Next.js 14, Supabase (PostgreSQL + Storage), React Query, Tailwind CSS, shadcn/ui
**Princípio:** Extensão — nunca duplicar tabelas, componentes ou serviços existentes (mesmo princípio da Rádio Web).

---

## 1. Visão Geral

O **Live-360** leva para a CEC Family o núcleo de **apresentação ao vivo** do Servo360 LIVE,
adaptado para o modelo web/Supabase da plataforma. O foco do MVP web é o que é imediatamente
utilizável na operação real da igreja:

1. **Bíblia no datashow** — exibir versículos em tela de projeção a partir da fonte canônica
   já existente (`bible_books` + `bible_verses`, tradução ACF/AA).
2. **Letras de hinos e canções** — repertório de louvor com letras prontas para projeção,
   incluindo controle de slides/estrofe, transição e visuais.
3. **Controle ao vivo** — operador (admin ou delegado) controla o que está no ar em tempo real,
   acessando com login/senha **ou sem login** (link/QR com token efêmero), conforme decisão do usuário.

Posicionamento no produto (decisão do usuário):

- **Módulo da plataforma** (governança por delegação — `delegation_module 'live360'`), com
  entrada de navegação no painel administrativo, na aba **CENTRAL DE CONTEÚDO**, em uma
  **sub-aba "Live-360"**.
- Um **link de acesso ao live** (com ou sem login/senha) para o admin ou usuário delegado
  controlar a apresentação da Bíblia no datashow e as letras de hinos.

O princípio **"cloud-enabled ≠ cloud-dependent"** do LIVE-015 é preservado conceitualmente:
neste MVP, o cloud é a fonte de verdade operacional (modo web-first). A camada de Local Node /
offline fica **fora do escopo desta primeira versão** e é registrada no backlog (ver §10).

---

## 2. Estrutura de Navegação e Registro como Módulo

O **Live-360** é registrado como **módulo da plataforma** (governança por delegação — mesma
mecânica de `delegation_module`), além de ganhar sua entrada de navegação na Central de
Conteúdo.

### 2.1 Registro do módulo Live-360 (governança/delegação)

Para que o módulo possa ser delegado a um usuário (acesso sem precisar ser Apóstolo) e apareça
corretamente nas telas de permissões/delegações, são 4 pontos de registro (mesmo padrão dos
módulos existentes):

| Camada | Arquivo | Mudança |
|---|---|---|
| **Enum PostgreSQL** | `supabase/migrations/GOV001_conselho_diretor.sql` (ou nova migração `LIVE000_governanca.sql`) | adicionar `'live360'` ao `create type delegation_module as enum (...)` |
| **Tipo TS** | `src/types/domain.ts` | adicionar `\|"live360"` ao `type DelegationModule` |
| **Rótulo** | `src/services/delegations.ts` | adicionar `live360: "🎬 Live-360"` em `DELEGATION_MODULE_LABELS` |
| **Mapa de abas** | `src/services/delegations.ts` | adicionar `live360: ["live360"]` em `DELEGATION_TAB_MAP` |

> Regra do enum PostgreSQL: o `delegation_module` usa `create type as enum` (não `alter type add value`), portanto a adição é feita **criando uma migração nova** que recria o tipo ou, seguindo o padrão `do $$ ... exception when duplicate_object then null; end $$`, registra o valor de forma idempotente.

### 2.2 Sub-aba "Live-360" na Central de Conteúdo

**Arquivo existente a modificar:** `src/components/admin/AdminSidebar.tsx`

Na seção `id: "conteudo"` (label **"Central de Conteúdo"**), adicionar o novo item logo após a
Rádio Web:

```typescript
{ key: "live360", label: "Live-360", icon: <ScreenShare size={15} /> },
```

- **Tipo `TabKey`:** adicionar `"live360"` ao union type no topo de `AdminSidebar.tsx`.
- **Roteamento:** novo `case "live360"` em `src/components/admin/panel/TabRouter.tsx`,
  renderizando `<Live360Admin />`.
- **Componente novo:** `src/components/admin/Live360Admin.tsx` (painel de gestão do Live-360,
  no mesmo padrão dos demais `*Admin.tsx`).

> Como o módulo `live360` estará em `DELEGATION_TAB_MAP`, o filtro automático do sidebar
> (`useMyActiveModules` → `allowedTabKeys`) passa a exibir a aba "Live-360" apenas para
> Apóstolos ou quem tiver delegação ativa do módulo — exatamente como os demais módulos.

### 2.3 Página pública de apresentação (datashow)

**Nova rota pública:** `src/app/(public)/live/[token]/page.tsx` (ou rota de apresentação sem token
no modo "somente exibição"). Esta rota é o destino do **link do datashow** e renderiza somente o
que estiver "no ar" (Bíblia/letra), com visual limpo para projeção.

### 2.4 Página de controle (operador)

**Nova rota:** `src/app/(public)/live/control/[token]/page.tsx` — tela de controle do operador,
acessível **com login/senha** (sessão admin/delegado) **ou sem login** (via token efêmero
compartilhado, ex.: QR code gerado no painel).

---

## 3. Camada de Dados — Modelo de Domínio

A nomenclatura segue o padrão do projeto (tabelas `radio_*`, `bible_*`, prefixo de módulo),
com `create table if not exists`, índices explícitos, trigger `set_updated_at()` e RLS
habilitada em todas as tabelas (padrão `RADIO001_radio_web.sql`).

### 3.1 Enums

```sql
do $$ begin
  create type live_session_status as enum ('offline','preview','live','frozen');
exception when duplicate_object then null; end $$;

do $$ begin
  create type live_item_kind as enum ('bible','lyric','media','blank','logo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type live_token_role as enum ('operator','viewer');
exception when duplicate_object then null; end $$;
```

### 3.2 Migração `LIVE001_core.sql` — sessão, item no ar, tokens, log de comandos

```sql
-- Sessão de live (uma igreja pode ter uma ou mais "sessões" de projeção)
create table if not exists public.live_sessions (
  id          uuid primary key default gen_random_uuid(),
  church_id   uuid references public.churches(id) on delete cascade,
  title       text not null default 'Sessão ao vivo',
  status      live_session_status not null default 'offline',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_live_sessions_church on public.live_sessions(church_id, updated_at desc);
drop trigger if exists trg_live_sessions_updated on public.live_sessions;
create trigger trg_live_sessions_updated before update on public.live_sessions
  for each row execute function public.set_updated_at();

-- Token de acesso ao controle (sem login) — substitui o "link mágico" efêmero.
-- "token" armazena o HASH (SHA-256 hex) do valor cru; o valor cru é devolvido
-- uma única vez pela RPC live_create_control_token.
create table if not exists public.live_control_tokens (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.live_sessions(id) on delete cascade,
  token       text not null unique,
  role        live_token_role not null default 'operator',
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_live_control_tokens_session on public.live_control_tokens(session_id);
create index if not exists idx_live_control_tokens_expiry on public.live_control_tokens(expires_at);

-- Item atualmente "no ar" (command pattern do LIVE-DOM-001: CurrentItem).
-- Uma linha por sessão: o que o datashow deve exibir AGORA.
create table if not exists public.live_current_item (
  session_id  uuid primary key references public.live_sessions(id) on delete cascade,
  kind        live_item_kind not null default 'blank',
  ref         text,          -- ex.: "sl 23" ou id da letra (live_lyrics.id)
  payload     jsonb,         -- dados efêmeros de render (estrofe atual, tema, etc.)
  seq         bigint not null default 0,   -- contador de versão do item (evita race)
  updated_at  timestamptz not null default now()
);

-- Histórico de comandos (auditoria + replay/idempotência, alinhado ao LIVE-DOM-001)
create table if not exists public.live_command_log (
  id          bigint generated always as identity primary key,
  session_id  uuid not null references public.live_sessions(id) on delete cascade,
  cmd         text not null,       -- ex.: 'set_bible', 'set_lyric', 'blank', 'freeze'
  payload     jsonb,
  operator    uuid,                -- profile (se logado) ou null (via token)
  token_id    uuid references public.live_control_tokens(id) on delete set null,
  client_id   text,                -- idempotency key (envelope do comando)
  created_at  timestamptz not null default now()
);
create index if not exists idx_live_command_log_session on public.live_command_log(session_id, created_at desc);
create unique index if not exists ux_live_command_log_idempotency
  on public.live_command_log(session_id, client_id) where client_id is not null;
```

### 3.3 Migração `LIVE002_lyrics.sql` — repertório de louvor

```sql
-- Repertório de louvor (hinos/canções com letra estruturada em blocos)
create table if not exists public.live_lyrics (
  id          uuid primary key default gen_random_uuid(),
  church_id   uuid references public.churches(id) on delete cascade,
  title       text not null,
  author      text,
  lyrics      jsonb not null,  -- [{type:'verse'|'chorus'|'bridge'|'ending', lines:[...]}]
  tags        text[] default '{}',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_live_lyrics_church on public.live_lyrics(church_id);
create index if not exists idx_live_lyrics_title on public.live_lyrics(church_id, lower(title));
drop trigger if exists trg_live_lyrics_updated on public.live_lyrics;
create trigger trg_live_lyrics_updated before update on public.live_lyrics
  for each row execute function public.set_updated_at();
```

### 3.4 Fontes canônicas reutilizadas (NÃO duplicar)

- **Bíblia:** `public.bible_books` + `public.bible_verses` (ACF/AA) — já com RLS de leitura
  liberada para `anon`/`authenticated` (migração `ACAD010`/`ACAD011`). O Live-360 **consome**
  a mesma fonte da tela de Bíblia já existente, sem criar cópia.
- **Igreja/comunidade:** `public.churches` (multi-tenant já existente, padrão da Rádio Web).
- **Perfis e papéis:** `public.profiles` com coluna de papel; admin via `is_admin()`.

---

## 4. RLS e Autorizações

Padrões seguidos do projeto (mesmos do módulo Rádio):

| Operação | RLS / regra |
|---|---|
| Criar/gerir sessões e repertório | `is_admin()` (autenticado admin) |
| Ler sessões | `is_admin()` ou portador de token válido para a sessão |
| Gravar comando de controle | `is_admin()` **ou** token válido não expirado (`live_control_tokens`) |
| Ler conteúdo exibido (datashow) | `anon` — leitura pública restrita ao item "no ar" (não ao repertório completo) |
| Letras do repertório | admin (criação/edição); projeção expõe somente a letra selecionada |

Policies propostas (padrão das demais migrations, com `drop policy if exists`):

```sql
alter table public.live_sessions        enable row level security;
alter table public.live_control_tokens  enable row level security;
alter table public.live_current_item    enable row level security;
alter table public.live_command_log     enable row level security;
alter table public.live_lyrics          enable row level security;

-- Sessões: somente admin gerencia; leitura de projeção vai via RPC live_get_current.
drop policy if exists live_sessions_admin_all on public.live_sessions;
create policy live_sessions_admin_all on public.live_sessions
  for all to authenticated using (is_admin()) with check (is_admin());

-- Item no ar: leitura pública (anon autenticado/anon), escrita só via RPC security definer.
drop policy if exists live_current_item_public_read on public.live_current_item;
create policy live_current_item_public_read on public.live_current_item
  for select to authenticated, anon using (true);

-- Tokens: só admin (criação/revogação). Validação/uso via RPC.
drop policy if exists live_control_tokens_admin_all on public.live_control_tokens;
create policy live_control_tokens_admin_all on public.live_control_tokens
  for all to authenticated using (is_admin()) with check (is_admin());

-- Log: auditoria legível apenas por admin.
drop policy if exists live_command_log_admin_read on public.live_command_log;
create policy live_command_log_admin_read on public.live_command_log
  for select to authenticated using (is_admin());

-- Repertório: CRUD admin; leitura de projeção expõe só a letra do item no ar (via RPC).
drop policy if exists live_lyrics_admin_all on public.live_lyrics;
create policy live_lyrics_admin_all on public.live_lyrics
  for all to authenticated using (is_admin()) with check (is_admin());
```

**Nota de segurança importante:** a projeção **não** recebe `select` direto em
`live_lyrics`/`live_command_log`/`live_control_tokens`. Todo o acesso público é mediado pelas
RPCs `security definer` (`live_get_current`, `live_validate_token`, `live_apply_command`), que
validam token/escopo e expõem o mínimo (padrão `radio_register_listener`/`radio_listener_by_token`).

Acesso **sem login** é concedido exclusivamente pelo token efêmero: o RPC de controle valida
`token` (hash) + `expires_at`/`revoked_at` e grava o comando com `token_id` (auditoria sem PII).

---

## 5. RPCs (PostgreSQL Functions)

Nomenclatura `live_*`, seguindo o padrão das funções `radio_*`. Todas com
`language plpgsql` (ou `sql` quando pura leitura) + `security definer` + `set search_path = public`
e checagem explícita de `is_admin()`/token, idênticas ao padrão de `RADIO003`/`RADIO008`/`REL001`.

### 5.1 Sessão e controle

```sql
-- Cria sessão (admin) e devolve os dados dela.
create or replace function public.live_start_session(
  p_church_id uuid,
  p_title text default 'Sessão ao vivo'
) returns table (id uuid, church_id uuid, title text, status public.live_session_status, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito';
  end if;
  return query
    insert into public.live_sessions (church_id, title, status, created_by)
    values (p_church_id, p_title, 'offline', auth.uid())
    returning id, church_id, title, status, created_at;
end $$;

-- Aplica um comando de controle (admin OU token válido) e registra no log.
-- p_client_id é a chave de idempotência: o mesmo comando reenviado não duplica.
create or replace function public.live_apply_command(
  p_session_id uuid,
  p_cmd text,
  p_kind public.live_item_kind,
  p_ref text default null,
  p_payload jsonb default '{}'::jsonb,
  p_token text default null,
  p_client_id text default null
) returns table (session_id uuid, kind public.live_item_kind, ref text, payload jsonb, seq bigint)
language plpgsql security definer set search_path = public as $$
declare
  v_token_id uuid;
  v_seq bigint;
begin
  if p_token is null then
    if not public.is_admin() then
      raise exception 'Acesso restrito';
    end if;
  else
    select t.id into v_token_id
      from public.live_control_tokens t
     where t.session_id = p_session_id
       and t.token = encode(sha256(p_token::bytea), 'hex')
       and t.expires_at > now()
       and t.revoked_at is null
       and t.role = 'operator';
    if v_token_id is null then
      raise exception 'Token inválido ou expirado';
    end if;
  end if;

  -- Idempotência: se o mesmo client_id já foi processado, retorna o estado atual.
  if p_client_id is not null and exists (
    select 1 from public.live_command_log
    where session_id = p_session_id and client_id = p_client_id
  ) then
    return query select c.session_id, c.kind, c.ref, c.payload, c.seq
      from public.live_current_item c where c.session_id = p_session_id;
    return;
  end if;

  insert into public.live_current_item (session_id, kind, ref, payload, seq)
  values (p_session_id, p_kind, p_ref, p_payload, coalesce(
    (select seq from public.live_current_item where session_id = p_session_id), 0) + 1)
  on conflict (session_id) do update
    set kind = excluded.kind,
        ref = excluded.ref,
        payload = excluded.payload,
        seq = public.live_current_item.seq + 1,
        updated_at = now()
  returning session_id, kind, ref, payload, seq into v_seq;

  insert into public.live_command_log (session_id, cmd, payload, operator, token_id, client_id)
  values (p_session_id, p_cmd, p_payload, case when v_token_id is null then auth.uid() end, v_token_id, p_client_id);

  return query select c.session_id, c.kind, c.ref, c.payload, c.seq
    from public.live_current_item c where c.session_id = p_session_id;
end $$;

-- Lê o que está no ar (usado pelo datashow, acesso público restrito).
create or replace function public.live_get_current(p_session_id uuid)
returns table (kind public.live_item_kind, ref text, payload jsonb, seq bigint, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.kind, c.ref, c.payload, c.seq, c.updated_at
    from public.live_current_item c
   where c.session_id = p_session_id;
$$;

-- Congela/descongela a tela (Session Freeze do LIVE-000).
create or replace function public.live_freeze(p_session_id uuid, p_frozen boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito';
  end if;
  update public.live_sessions
     set status = case when p_frozen then 'frozen'::public.live_session_status else 'live'::public.live_session_status end
   where id = p_session_id;
end $$;
```

### 5.2 Tokens de acesso sem login

```sql
-- Gera um token efêmero e devolve o valor CRU uma única vez (o banco guarda só o hash).
create or replace function public.live_create_control_token(
  p_session_id uuid,
  p_role public.live_token_role default 'operator',
  p_expires_in interval default interval '2 hours'
) returns table (raw_token text, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_raw text := encode(gen_random_bytes(32), 'hex');
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito';
  end if;
  insert into public.live_control_tokens (session_id, token, role, expires_at, created_by)
  values (p_session_id, encode(sha256(v_raw::bytea), 'hex'), p_role, now() + p_expires_in, auth.uid());
  return query select v_raw, now() + p_expires_in;
end $$;

-- Valida um token (usado no acesso sem login antes de abrir o controle).
create or replace function public.live_validate_token(p_session_id uuid, p_token text)
returns table (valid boolean, role public.live_token_role, session_title text)
language sql stable security definer set search_path = public as $$
  select (t.id is not null) as valid, t.role,
         case when t.id is not null then s.title end as session_title
    from public.live_sessions s
    left join public.live_control_tokens t
      on t.session_id = s.id
     and t.token = encode(sha256(p_token::bytea), 'hex')
     and t.expires_at > now()
     and t.revoked_at is null
   where s.id = p_session_id;
$$;
```

### 5.3 Repertório de louvor (admin)

```sql
-- Busca repertório por igreja + termo (admin).
create or replace function public.live_list_lyrics(p_church_id uuid, p_search text default null)
returns table (id uuid, title text, author text, tags text[], updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select l.id, l.title, l.author, l.tags, l.updated_at
    from public.live_lyrics l
   where l.church_id = p_church_id
     and (p_search is null or l.title ilike '%' || p_search || '%' or l.author ilike '%' || p_search || '%')
   order by l.title;
$$;

-- Lê a letra COMPLETA de um item que está no ar (para renderização do datashow).
-- Expõe exclusivamente a letra do item atual, nunca o repertório inteiro.
create or replace function public.live_get_onair_lyric(p_session_id uuid)
returns table (id uuid, title text, author text, lyrics jsonb)
language sql stable security definer set search_path = public as $$
  select l.id, l.title, l.author, l.lyrics
    from public.live_current_item c
    join public.live_lyrics l on l.id = c.ref::uuid
   where c.session_id = p_session_id and c.kind = 'lyric';
$$;
```

### 5.4 Resumo

| Função | Rota/uso | Acesso |
|---|---|---|
| `live_start_session` | Admin — criar sessão | `is_admin()` |
| `live_apply_command` | Controle — mandar ao ar | admin **ou** token `operator` |
| `live_get_current` | Datashow — o que exibir | `anon`/`authenticated` (restrito) |
| `live_freeze` | Admin — congelar tela | `is_admin()` |
| `live_create_control_token` | Admin — gerar link/QR sem login | `is_admin()` |
| `live_validate_token` | Controle sem login — validar acesso | `anon` (por token) |
| `live_list_lyrics` | Admin — buscar repertório | `is_admin()` |
| `live_get_onair_lyric` | Datashow — letra do item no ar | `anon`/`authenticated` (restrito) |

---

## 6. Arquitetura Web — Fluxo de Dados

### 6.1 Operador → Nuvem → Datashow

```
[Painel Admin: Central de Conteúdo > Live-360]          [Datashow]
   +-- criar sessão + gerar token/QR                       |
   +-- controle (login/senha OU token sem login)  -------> supabase (live_current_item)
                                                           |  poll/real-time subscribe
                                                        [Página de projeção /live/[token]]
```

- **Estado no ar:** tabela `live_current_item` (única fonte), atualizada somente pela RPC
  `live_apply_command`. Datashow assina mudanças via **Supabase Realtime** (ou polling leve com
  `react-query`) e renderiza.
- **Idempotência:** comandos gravados em `live_command_log` com envelope (alinhado ao
  LIVE-DOM-001); reprocessamento seguro.
- **Preview ≠ Program:** o painel de operador pode "ensaiar" (preview local) antes de mandar
  para a projeção (Program), sem afetar o que está no ar — mesmo conceito do LIVE-002.

### 6.2 Render da Bíblia (sem duplicar fonte)

- UI de busca/ref reutiliza o mesmo padrão da tela de Bíblia existente (hooks/API de
  `src/app/api/bible/*`).
- O comando `live_apply_command('set_bible', 'bible', 'sl 23:1-6')` guarda apenas a
  referência; o payload de render é resolvido na hora pelo datashow via API existente.

### 6.3 Render de letras

- Repertório em `live_lyrics` (estrutura de blocos/strofes JSON).
- O comando `live_apply_command('set_lyric', 'lyric', <live_lyrics.id>, { slide: 0 })` guarda
  `ref` + índice de estrofe no `payload`; o datashow busca a letra completa via
  `live_get_onair_lyric` (nunca acessa o repertório inteiro) e aplica transições (fade)
  conforme o tema ativo.

---

## 7. Temas / Visual (derivado do LIVE-006)

- Tema global simplificado para o MVP: plano de fundo, cor de texto, estilo de transição,
  salvo por sessão (`payload` em `live_sessions` ou tabela `live_themes` futura).
- Não será implementado o design system completo do LIVE-006 nesta versão; apenas presets
  suficientes para a projeção (branco/escuro, fonte legível, transições básicas).

---

## 8. Segurança

- Tokens: gerados com `crypto.randomBytes`/`gen_random_uuid` + hash (SHA-256) gravado na
  tabela; valor cru retornado uma única vez (padrão "link mágico").
- Expiração obrigatória (`expires_at`), revogação manual possível.
- RLS garante que `anon` nunca leia repertório completo nem tokens.
- Auditoria em `live_command_log` (operador ou `token_id`) — alinhado ao LIVE-016.

---

## 9. Backlog de Implementação — Vertical Slices (Walking Skeleton)

Cada slice entrega valor vertical completo (banco → API → UI → datashow).

### Slice 1 — Esqueleto + Sessão + Projeção Bíblica (MVP mínimo)

- Migração `LIVE001`: tabelas `live_sessions`, `live_current_item`, `live_command_log`,
  RLS.
- Migração `LIVE000_governanca` (ou edição idempotente): registrar `'live360'` no enum
  `delegation_module` + tipo TS + `DELEGATION_MODULE_LABELS` + `DELEGATION_TAB_MAP`.
- RPCs `live_start_session`, `live_apply_command`, `live_get_current`, `live_freeze`.
- Admin: sub-aba "Live-360" (sidebar + TabRouter) com criação de sessão e geração de token.
- Rota de projeção `/live/[token]` renderizando **Bíblia** (via API existente) + estado
  blank/logo.
- Rota de controle `/live/control/[token]` com **login/senha ou token sem login**.
- Realtime no datashow.

### Slice 2 — Repertório de Louvor

- Migração `LIVE002`: tabela `live_lyrics` + RLS + RPCs de CRUD.
- Admin: gestão do repertório (cadastro de hinos com letra em blocos).
- Controle: seleção de música + navegação de estrofes.
- Datashow: render de letras com transição básica.

### Slice 3 — Tokens/QR e acesso sem login

- Migração `LIVE003`: `live_control_tokens` + RPCs `live_create_control_token`,
  `live_validate_token`.
- Painel: gerar/revogar token e exibir QR code.
- Controle sem login: validação de token + sessão de operador anônima (auditável).

### Slice 4 — Preview vs Program + Freeze + Temas

- Preview local no operador (ensaiar antes de mandar ao ar).
- Botão de congelar/descongelar tela (Session Freeze).
- Presets de tema/visual por sessão.

### Slice 5 — Polimento, auditoria e operacional

- Histórico de comandos visível no admin.
- Estados de erro/resiliência (falha de polling/realtime → re-sync).
- Metadados e ajustes finos de projeção (segundo monitor, proporção 16:9).

---

## 10. Fora do Escopo (registrado para evolução futura)

- **Local Node / operação offline** (LIVE-015): o cloud é a fonte neste MVP.
- **Streaming/broadcast/gravação** (LIVE-009).
- **Áudio roteado** (LIVE-010) e **integração de som**.
- **Automação de cues** (LIVE-011) e **orquestração multi-dispositivo** (LIVE-012) completa.
- **Controle remoto multi-operador** (LIVE-014) além do token simples.
- **Engine de mídia** (LIVE-005) e **design system completo** (LIVE-006).
- **Observabilidade/health completa** (LIVE-013) — apenas logging básico no MVP.

---

## 11. Critérios de Aceite (resumo)

1. Módulo **Live-360** registrado na governança (`delegation_module 'live360'`), delegável e
   exibido no sidebar conforme permissão (Apóstolo ou delegação ativa).
2. Sub-aba **Live-360** visível na **Central de Conteúdo** do admin.
3. Admin cria sessão e gera link/QR de acesso com ou sem login.
4. Operador controla Bíblia (referência bíblica) e letras de hinos no datashow em tempo real.
5. Datashow exibe somente o item "no ar" — repertório nunca exposto a `anon`.
6. Tokens expiram e são auditáveis; comandos ficam registrados.
7. Fonte bíblica é a existente (`bible_*`); nenhuma duplicação criada.

---

## 12. Pendências operacionais da Rádio Web (fora do escopo, apenas registro)

- Rodar `RADIO004→010` no Supabase (`RADIO-migrations-COMBINADO-004-a-010.sql`).
- Configurar envs na Vercel (`RESEND_API_KEY`, `RESEND_FROM`, `SUPABASE_SERVICE_ROLE_KEY`,
  `CRON_SECRET`, `OPENAI_API_KEY`) e re-deploy.