# Entrega CORE-001 — Servo360 White-label Multi-tenant

## Resumo executivo

A plataforma deixou de depender exclusivamente da identidade de uma igreja e passou a possuir uma camada configurável por tenant. A implementação mantém `public.churches` como entidade física da organização para preservar compatibilidade com o banco existente, mas acrescenta um núcleo de configuração para branding, módulos, menus, nomenclaturas e administradores.

> Regra central: as **chaves técnicas permanecem estáveis**; apenas a experiência visual e textual passa a ser configurável por organização.

## O que foi implementado

| Área | Evolução |
|------|----------|
| Modelo multi-tenant | `churches` é reutilizada como tenant, com status, tipo de organização e identidade complementar. |
| White-label | Branding por tenant para nome exibido, nome curto, logo, favicon, ícone, cores, imagens e tema. |
| Catálogo de módulos | Registro estável em `platform_modules`, com módulos CORE, comunidade, educação, conteúdo, suporte, finanças e administração. |
| Templates | Templates iniciais para igreja, associação, instituto, projeto social e configuração personalizada. |
| Menu Builder | Cada tenant pode ocultar, exibir, renomear, ordenar e definir o público de seus itens de menu. |
| Nomenclaturas | `tenant_labels` permite alterar labels sem trocar chaves de código. `org_terminology` legado continua sendo lido e gravado por tenant. |
| Administrador Geral | Nova rota `/plataforma`, protegida no cliente por `is_platform_admin()` e no banco por RLS. |
| Administrador local | Cadastro do administrador do tenant e permissões delegadas de branding, menus, labels, módulos e novos administradores. |
| Rádio Web | Resolução por tenant, uso do branding geral, label configurável e ativação condicionada ao módulo `content.radio`. |
| Compatibilidade | Defaults neutros e fallback legado mantêm a aplicação navegável antes da aplicação da migration. |

## Arquivos principais

| Arquivo | Responsabilidade |
|---------|------------------|
| `supabase/migrations/CORE001_white_label_multitenant.sql` | Tabelas, seeds, funções de autorização, compatibilidade, RLS e grants. |
| `src/config/modules.ts` | Catálogo técnico, defaults, templates, labels e tipos do tenant. |
| `src/services/tenantConfig.ts` | Resolução, merge de fallback, persistência e operações administrativas. |
| `src/contexts/TenantContext.tsx` | Contexto global `useTenant()` com branding, labels, módulos, menus e tema. |
| `src/components/platform/PlatformAdmin.tsx` | Console visual do Administrador Geral. |
| `src/app/plataforma/page.tsx` | Rota `/plataforma`. |
| `src/components/public/PublicHome.tsx` | Home pública conectada a branding, labels e módulos do tenant. |
| `src/components/radio/RadioPage.tsx` | Rádio Web tenant-aware. |
| `src/components/admin/AdminSidebar.tsx` | Sidebar administrativa filtrada por módulos e labels. |
| `LEIA-ME.md` | Operação, variáveis de ambiente e ativação. |

## Ativação

1. No Supabase, execute o arquivo `supabase/migrations/CORE001_white_label_multitenant.sql` no SQL Editor.
2. Configure, se desejar, `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` e `NEXT_PUBLIC_TENANT_BASE_DOMAIN` na Vercel.
3. Faça login com um usuário `apostolo` existente ou registre o perfil na tabela `platform_admins`.
4. Acesse `/plataforma`.
5. Crie uma organização ou selecione a organização existente.
6. Configure identidade, módulos, menus, nomenclaturas e administradores locais.
7. Envie o acesso do administrador local pelo fluxo **Convites** já existente.

A resolução pública aceita `?tenant=slug`, `?tenant_slug=slug`, `?church=uuid` e subdomínios no domínio configurado. O fallback `cecfamily.com.br` permanece apenas para compatibilidade durante a transição.

## Validação executada

| Verificação | Resultado |
|-------------|-----------|
| `npm run typecheck` | Aprovado, sem erros TypeScript. |
| `npm run build` | Aprovado; a rota `/plataforma` foi gerada e o build de produção concluiu. |
| Isolamento de escrita | Implementado em RLS; depende da aplicação do SQL no Supabase para entrar em vigor. |
| Execução contra banco remoto | Não executada nesta sandbox, pois o pacote não inclui uma sessão de banco autorizada. |

## Observações de segurança e próximos passos

A migration deve ser aplicada antes de liberar o console em produção. O frontend possui fallback para facilitar desenvolvimento, mas a garantia de autorização está nas funções `is_platform_admin()` e `can_manage_tenant_config()` e nas políticas RLS.

O fluxo de convite continua separado de `/plataforma porque a base já possui um mecanismo de tokens e aceite em `/convite/[token]`. O console registra o administrador local com suas permissões; o envio do convite deve seguir o mecanismo existente para manter a criação de perfil e o vínculo com o tenant no mesmo fluxo já validado.

A etapa recomendada depois desta entrega é executar um teste de aceite no Supabase com dois tenants: verificar que cada organização vê somente sua identidade, que a Rádio Web pode ser habilitada ou desabilitada de forma independente e que um administrador local não consegue ler ou alterar a configuração de outro tenant.
