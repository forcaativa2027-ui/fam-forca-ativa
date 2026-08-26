-- GOV-010 — Perfis administrativos do Instituto e da FAM
-- Não destrutiva: cria apenas a estrutura mínima ausente e cria/atualiza presets.
-- A migration GOV001 continua sendo a fonte completa da governança; este arquivo
-- também pode ser executado isoladamente em schema remoto legado.

DO $$
BEGIN
  CREATE TYPE delegation_module AS ENUM (
    'intelligence','reports','control_tower','finance','patrimony','audit',
    'administrativo','comunicacao','documentacao','supervisao'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.role_delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL,
  module delegation_module NOT NULL,
  trust_level int NOT NULL DEFAULT 1 CHECK (trust_level BETWEEN 1 AND 5),
  scope text NOT NULL DEFAULT 'sede',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (role_name, module)
);

GRANT SELECT, INSERT, UPDATE ON public.role_delegations TO authenticated;

INSERT INTO public.role_delegations (role_name, module, trust_level, scope, description)
VALUES
  ('Administrador FAM', 'administrativo', 4, 'nacional', 'Administra a operação FAM, sem conceder automaticamente o perfil amplo de apóstolo.'),
  ('Administrador FAM', 'documentacao', 4, 'nacional', 'Administra conteúdos INFO, fontes e versões aprovadas.'),
  ('Administrador FAM', 'supervisao', 3, 'nacional', 'Acompanha indicadores operacionais e fluxos FAM autorizados.'),
  ('Administrador Instituto', 'administrativo', 5, 'nacional', 'Administração geral do Instituto com aprovação e rastreabilidade.'),
  ('Administrador Instituto', 'documentacao', 5, 'nacional', 'Gestão institucional de documentação e comunicação formal.'),
  ('Administrador Instituto', 'finance', 5, 'nacional', 'Gestão financeira institucional, conforme aprovação específica.'),
  ('Administrador Instituto', 'patrimony', 5, 'nacional', 'Gestão patrimonial institucional, conforme aprovação específica.'),
  ('Administrador Instituto', 'reports', 5, 'nacional', 'Relatórios consolidados institucionais.'),
  ('Administrador Instituto', 'supervisao', 5, 'nacional', 'Supervisão institucional consolidada.')
ON CONFLICT (role_name, module) DO UPDATE
SET trust_level = EXCLUDED.trust_level,
    scope = EXCLUDED.scope,
    description = EXCLUDED.description;

COMMENT ON TABLE public.role_delegations IS
  'Presets de delegação institucional; a existência do preset não atribui acesso a nenhuma pessoa.';

-- Procedimento operacional:
-- 1. Provisionar tecnologiaagilize@gmail.com pelo painel GOV-002.
-- 2. Aprovar explicitamente a delegação pendente de suporte técnico.
-- 3. Usar a Ficha do Usuário para aplicar o preset Administrador FAM ou Administrador Instituto.
-- 4. Revisar escopo, nível e expiração antes da confirmação.
-- O perfil de negócio "apostolo" não é concedido automaticamente por esta migration.
