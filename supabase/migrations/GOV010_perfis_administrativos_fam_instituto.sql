-- GOV-010 — Perfis administrativos do Instituto e da FAM
-- Não destrutiva: apenas cria/atualiza presets em role_delegations.
-- A atribuição a uma pessoa continua exigindo aprovação explícita na governança.

insert into public.role_delegations (role_name, module, trust_level, scope, description)
values
  ('Administrador FAM', 'administrativo', 4, 'nacional', 'Administra a operação FAM, sem conceder automaticamente o perfil amplo de apóstolo.'),
  ('Administrador FAM', 'usuarios', 4, 'nacional', 'Gerencia acessos e delegações necessárias à operação FAM.'),
  ('Administrador FAM', 'documentacao', 4, 'nacional', 'Administra conteúdos INFO, fontes e versões aprovadas.'),
  ('Administrador FAM', 'supervisao', 3, 'nacional', 'Acompanha indicadores operacionais e fluxos FAM autorizados.'),
  ('Administrador Instituto', 'administrativo', 5, 'nacional', 'Administração geral do Instituto com aprovação e rastreabilidade.'),
  ('Administrador Instituto', 'usuarios', 5, 'nacional', 'Gestão institucional de usuários e delegações.'),
  ('Administrador Instituto', 'documentacao', 5, 'nacional', 'Gestão institucional de documentação e comunicação formal.'),
  ('Administrador Instituto', 'finance', 5, 'nacional', 'Gestão financeira institucional, conforme aprovação específica.'),
  ('Administrador Instituto', 'patrimony', 5, 'nacional', 'Gestão patrimonial institucional, conforme aprovação específica.'),
  ('Administrador Instituto', 'reports', 5, 'nacional', 'Relatórios consolidados institucionais.'),
  ('Administrador Instituto', 'supervisao', 5, 'nacional', 'Supervisão institucional consolidada.')
on conflict (role_name, module) do update
set trust_level = excluded.trust_level,
    scope = excluded.scope,
    description = excluded.description;

comment on table public.role_delegations is 'Presets de delegação institucional; a existência do preset não atribui acesso a nenhuma pessoa.';

-- Procedimento operacional:
-- 1. Provisionar tecnologiaagilize@gmail.com pelo painel GOV-002.
-- 2. Aprovar explicitamente a delegação pendente de suporte técnico.
-- 3. Usar a Ficha do Usuário para aplicar o preset Administrador FAM ou Administrador Instituto.
-- 4. Revisar escopo, nível e expiração antes da confirmação.
-- O perfil de negócio "apostolo" não é concedido automaticamente por esta migration.
