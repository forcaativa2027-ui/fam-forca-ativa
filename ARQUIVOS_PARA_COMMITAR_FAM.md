# Arquivos para commitar — FAM

Use a raiz do projeto como referência: `fam-current/`.

## 1. Arquivos que devem ser enviados

### Raiz

```text
LEIA-ME.md
README_UPLOAD_FAM.md
```

### `docs/`

```text
docs/FAM_AUDITORIA_BANCO_LEGADO.md
```

### `public/`

```text
public/manifest.json
public/brand/fam-logo.jpg
```

### `supabase/migrations/`

```text
supabase/migrations/FAM003_noticias_editoriais.sql
```

### `src/app/`

```text
src/app/layout.tsx
src/app/globals.css
src/app/privacidade/page.tsx
src/app/termos/page.tsx
src/app/certificado/[codigo]/page.tsx
src/app/painel/carteira/page.tsx
src/app/(public)/noticias/[slug]/page.tsx
src/app/(workspaces)/WorkspaceShell.tsx
```

### `src/components/`

```text
src/components/AdminSidebar.tsx
src/components/admin/NewsAdmin.tsx
src/components/admin/panel/TabRouter.tsx
src/components/public/FamSupportCenter.tsx
src/components/public/ForgotPasswordForm.tsx
src/components/public/InviteRegisterForm.tsx
src/components/public/LoginForm.tsx
src/components/public/NotificationsPanel.tsx
src/components/public/PublicContactForms.tsx
src/components/public/PublicHome.tsx
src/components/public/PublicNewsSection.tsx
src/components/public/PublicParticipateSection.tsx
src/components/public/RegisterWizard.tsx
src/components/public/ResetPasswordForm.tsx
src/components/public/register-wizard/RegisterWizardHelpers.tsx
src/components/public/register-wizard/RegisterWizardTypes.ts
src/components/public/register-wizard/StepComunidade.tsx
src/components/public/register-wizard/StepFe.tsx
src/components/public/register-wizard/StepJornada.tsx
src/components/public/register-wizard/StepLocalizacao.tsx
src/components/public/register-wizard/StepPessoal.tsx
src/components/public/register-wizard/StepTipoCadastro.tsx
src/components/radio/RadioPage.tsx
src/components/shared/AccessibilityOnboarding.tsx
src/components/shared/CommunityIdentity.tsx
src/components/shared/DarkBlueTheme.tsx
src/components/shared/LivingLogo.tsx
```

### `src/schemas/`, `src/services/` e `src/types/`

```text
src/schemas/index.ts
src/services/institutional.ts
src/services/news.ts
src/types/domain.ts
```

## 2. O que não deve ser enviado

Não envie estes itens:

```text
node_modules/
.next/
.git/
.env
.env.local
.env.*
*.pem
*.key
tsconfig.tsbuildinfo
```

O arquivo `tsconfig.tsbuildinfo` apareceu como modificado somente porque o TypeScript o gera durante a validação. Ele é cache local e **não deve ser commitado**.

## 3. Estrutura para upload manual

No GitHub, abra o repositório e selecione **Add file → Upload files**. Extraia o pacote e entre na pasta `fam-current`. Envie o conteúdo mantendo a estrutura original. Por exemplo:

```text
fam-current/
├── public/
│   ├── brand/fam-logo.jpg
│   └── manifest.json
├── src/
│   ├── app/
│   ├── components/
│   ├── schemas/
│   ├── services/
│   └── types/
├── supabase/migrations/
├── docs/
├── package.json
├── next.config.mjs
└── tsconfig.json
```

Se o repositório já contém os arquivos de configuração e as alterações anteriores, envie somente os arquivos listados na seção 1. Se o repositório estiver vazio, envie toda a estrutura do projeto, sempre mantendo fora os itens da seção 2.

## 4. Commit sugerido

```text
feat(fam): atualiza notícias, rádio web, navegação e identidade institucional
```

A migration `FAM003_noticias_editoriais.sql` deve ser aplicada separadamente no Supabase, depois de backup e homologação. O upload para o GitHub não executa essa migration.
