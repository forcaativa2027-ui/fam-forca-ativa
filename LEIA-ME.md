# CEC Painel — Publicar (GitHub + Vercel)

Painel web **independente** (Next.js puro, sem monorepo). Deploy direto, sem complicação.
O banco multi-tenant (Supabase) já está pronto e no ar.

## Pré-requisitos
- GitHub · Supabase · Vercel · Node.js 18+

---

## 1. GitHub
1. Descompacte → pasta `cec-painel`.
2. Crie repositório privado em https://github.com/new (nome: `cec-painel`).
3. "uploading an existing file" → arraste **o conteúdo de dentro** da pasta `cec-painel`
   (package.json, next.config.mjs, src/, etc.) → Commit.

## 2. Vercel
1. https://vercel.com → entre com GitHub → **Add New → Project** → importe `cec-painel`.
2. Framework: **Next.js** (detectado sozinho). Não precisa mexer em Build/Output.
3. **Environment Variables** — adicione as duas:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xueuilapfwbtqbmvyaxe.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_OgTidKVtbJ0Gczf2Um3Obg__I1_d2Uq` |

4. **Deploy**. Em ~2 min: link tipo `https://cec-painel.vercel.app`.

## 3. Primeiro acesso
1. Abra o link → crie uma conta.
2. Supabase → Table Editor → `profiles` → seu `role` = **pastor**;
   confirme `church_id` = CEC Manaus - Sede.
3. Recarregue → dashboard por setor + botão **Administração ✦**.

---

## Rodar local (opcional)
```bash
npm install
cp .env.example .env.local
npm run dev    # http://localhost:3000
```

## Notas
- **Multi-tenant:** o isolamento por igreja vive no banco (Supabase/RLS), já testado.
  Este painel só consome — qualquer igreja da rede aparece conforme o papel do usuário.
- O bug "supabaseUrl is required" foi corrigido (cliente criado só no navegador).
- Aviso de vulnerabilidade do Next 14.2.5 é só aviso; não impede deploy. Para atualizar:
  `npm i next@latest`.


## 4. CORE-001 — White-label e Administrador Geral

A plataforma agora separa **Servo360** (plataforma) da organização que está sendo atendida (tenant). A entidade `churches` continua sendo reutilizada como tenant para preservar o banco existente e o isolamento RLS já adotado.

Antes do primeiro deploy desta evolução, execute no SQL Editor do Supabase o arquivo:

```text
supabase/migrations/CORE001_white_label_multitenant.sql
```

A migration é idempotente. Ela cria o catálogo de módulos, templates iniciais, branding, menus, labels, administradores da plataforma e administradores locais. O Administrador Geral pode acessar `/plataforma` e configurar uma organização sem alterar código.

Os módulos continuam usando chaves técnicas estáveis, como `education.academy`, `education.kids` e `content.radio`. O que muda por organização é o label, a ordem, a visibilidade, o público e o branding. Desabilitar um módulo não remove os dados dele.

### Variáveis opcionais de resolução de tenant

| Nome | Finalidade | Exemplo |
|------|------------|---------|
| `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` | Tenant usado no domínio raiz, localhost e previews | `manaus` |
| `NEXT_PUBLIC_TENANT_BASE_DOMAIN` | Domínio-base para subdomínios por organização | `servo360.app.br` |

Links públicos também podem carregar o contexto com `?tenant=slug` ou `?church=uuid`. O fallback legado continua aceitando `cecfamily.com.br` até a migração de domínio.

### Provisionamento do administrador local

No console do Administrador Geral, abra a organização e use a aba **Administradores** para registrar o nome, o e-mail e as permissões delegadas. O convite de acesso deve ser enviado pelo fluxo **Convites** já existente, porque o mecanismo atual também realiza o aceite e o vínculo do perfil ao tenant.

### Compatibilidade

Se a migration ainda não tiver sido executada, o frontend usa defaults neutros do Servo360 e permanece navegável. Depois de executar o SQL, o sistema passa a persistir e resolver a configuração por tenant. O código não deve criar condicionais por nome de organização; deve consultar `useTenant().label(...)` e `useTenant().isModuleEnabled(...)`.
