# Plano de implementação — CORE-001

## Decisões

1. `public.churches` continua sendo a entidade física do tenant, conforme a base existente e o caderno da Rádio. Não será criada uma segunda tabela `tenants` que duplique o mesmo conceito.
2. O nome da plataforma será `Servo360`, controlado por configuração global no código (`PLATFORM_CONFIG`) e, futuramente, por `tenant_settings` apenas quando houver necessidade de edição.
3. A identidade white-label será armazenada em `tenant_branding`, com fallback para os campos legados de `churches` (`name`, `short_name`, `logo_url`, `primary_color`, `secondary_color`) e depois para a marca Servo360.
4. A chave técnica dos módulos será estável em `platform_modules.module_key`. A personalização ocorrerá em `tenant_modules.label_override`, `tenant_modules.enabled`, `sort_order` e `config`.
5. A navegação administrativa continuará usando as abas existentes para preservar rotas internas. `tenant_menu_items` mapeia `module_key` para `route_key`/`tab_key`, visibilidade, público e posição.
6. `tenant_labels` será o mecanismo novo de labels. O serviço também lerá `org_terminology` legado para preservar a configuração já existente e fazer migração gradual.
7. `platform_admins` será uma tabela separada, evitando alterar o enum/texto atual de `profiles.role`. A função `is_platform_admin()` será a fonte de autorização do Administrador Geral. `tenant_admins` representará administradores locais e permissões delegadas de branding/menus/labels/módulos.
8. Todas as tabelas novas terão RLS: administrador de plataforma pode operar globalmente; administrador do tenant pode ler/alterar somente o próprio tenant, conforme permissões delegadas; leitura pública é limitada a branding, módulos habilitados e menus públicos de tenant ativo.
9. A resolução pública aceitará `?tenant=<slug>`/`?church=<id>`, subdomínio configurável por `NEXT_PUBLIC_TENANT_BASE_DOMAIN` e fallback `NEXT_PUBLIC_DEFAULT_TENANT_SLUG`/sede ativa. O legado `cecfamily.com.br` será apenas fallback de compatibilidade.
10. O novo `TenantProvider` será um contexto de frontend compatível com React Query. Se as tabelas CORE ainda não tiverem sido aplicadas, o snapshot volta para defaults e a aplicação continua funcional.

## Escopo implementado nesta entrega

- Migration idempotente `CORE001_white_label_multitenant.sql`.
- Catálogo inicial de módulos do CORE-001 com aliases para as abas já existentes.
- Serviço `tenantConfig` para resolver tenant, branding, labels, módulos e menus.
- Contexto `TenantProvider`/hook `useTenant` instalado no layout raiz.
- Metadata e visual da aplicação desacoplados de CEC.
- Sidebar administrativa com labels de módulo e filtro por módulos habilitados, preservando as delegações atuais.
- Tela `/plataforma` de Administrador Geral para listar organizações, criar/editar tenant, ativar/desativar módulos, alterar labels e branding básicos, com controle de acesso no cliente e RLS no banco.
- Integração progressiva da home pública e da Rádio com o snapshot white-label.
- Documentação de aplicação da migration e variáveis de ambiente.

## Limites conscientemente preservados

O pacote não contém credenciais nem o schema completo do Supabase em execução. Por isso a entrega não tenta executar a migration contra um banco remoto. O SQL é idempotente e o serviço tem fallback para que o build e a navegação continuem funcionando antes da aplicação do SQL. O convite real por e-mail continua usando o mecanismo de convites existente; a tela de provisionamento registra o administrador local e exibe a rota de convite para conclusão pelo fluxo já existente.
