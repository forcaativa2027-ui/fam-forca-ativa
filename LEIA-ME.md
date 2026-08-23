# FAM — Publicar (GitHub + Vercel)

Painel web **independente** (Next.js puro, sem monorepo). Deploy direto, sem complicação.
O banco multi-tenant (Supabase) já está pronto e no ar.

## Pré-requisitos
- GitHub · Supabase · Vercel · Node.js 18+

---

## 1. GitHub
1. Descompacte → pasta `fam-forca-ativa`.
2. Crie repositório privado em https://github.com/new (nome: `fam-forca-ativa`).
3. "uploading an existing file" → arraste **o conteúdo de dentro** da pasta `fam-forca-ativa`
   (package.json, next.config.mjs, src/, etc.) → Commit.

## 2. Vercel
1. https://vercel.com → entre com GitHub → **Add New → Project** → importe `fam-forca-ativa`.
2. Framework: **Next.js** (detectado sozinho). Não precisa mexer em Build/Output.
3. **Environment Variables** — adicione as duas:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xueuilapfwbtqbmvyaxe.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<COLE_A_CHAVE_PUBLICA_DO_SUPABASE_NAS_VARIAVEIS_DE_AMBIENTE>` |

4. **Deploy**. Em ~2 min: link tipo `https://fam-forca-ativa.vercel.app`.

## 3. Primeiro acesso
1. Abra o link → crie uma conta.
2. Supabase → Table Editor → `profiles` → seu `role` = **pastor**;
   confirme a unidade/polo FAM correspondente no perfil.
3. Recarregue → dashboard por setor + botão **Administração ✦**.

---

## Rodar local (opcional)
```bash
npm install
cp .env.example .env.local
npm run dev    # http://localhost:3000
```

## Notas
- **Multi-tenant:** o isolamento por unidade/polo vive no banco (Supabase/RLS).
  Este painel só consome — cada usuário acessa apenas os dados autorizados para seu perfil e unidade.
- O bug "supabaseUrl is required" foi corrigido (cliente criado só no navegador).
- Aviso de vulnerabilidade do Next 14.2.5 é só aviso; não impede deploy. Para atualizar:
  `npm i next@latest`.
