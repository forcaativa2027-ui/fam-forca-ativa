-- FAM036 — P01/P02: configuração institucional por organização
-- ================================================================
-- Não altera nem remove dados de public.churches. A configuração nova é
-- armazenada separadamente e vinculada à organização existente.

create table if not exists public.organization_configs (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  organization_type text not null default 'church',
  setup_status text not null default 'setup_required',
  official_name text,
  display_name text,
  short_name text,
  document text,
  address jsonb not null default '{}'::jsonb,
  contacts jsonb not null default '{}'::jsonb,
  social jsonb not null default '{}'::jsonb,
  features jsonb not null default '{}'::jsonb,
  navigation jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_configs_type_check
    check (organization_type in ('church', 'institute', 'association')),
  constraint organization_configs_status_check
    check (setup_status in ('setup_required', 'setup_in_progress', 'ready_for_review', 'active', 'suspended', 'archived')),
  constraint organization_configs_name_check
    check (btrim(coalesce(display_name, official_name, '')) <> '')
);

create unique index if not exists organization_configs_church_uidx
  on public.organization_configs(church_id);
create index if not exists organization_configs_status_idx
  on public.organization_configs(setup_status);

alter table public.organization_configs enable row level security;

drop policy if exists organization_configs_public_read on public.organization_configs;
create policy organization_configs_public_read
  on public.organization_configs for select
  to anon, authenticated
  using (is_public = true and setup_status = 'active');

drop policy if exists organization_configs_admin_read on public.organization_configs;
create policy organization_configs_admin_read
  on public.organization_configs for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          lower(coalesce(p.role::text, '')) in ('apostolo', 'administrador_geral', 'admin', 'pastor')
          or p.church_id = organization_configs.church_id
        )
    )
  );

drop policy if exists organization_configs_admin_insert on public.organization_configs;
create policy organization_configs_admin_insert
  on public.organization_configs for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          lower(coalesce(p.role::text, '')) in ('apostolo', 'administrador_geral', 'admin', 'pastor')
          or p.church_id = organization_configs.church_id
        )
    )
  );

drop policy if exists organization_configs_admin_update on public.organization_configs;
create policy organization_configs_admin_update
  on public.organization_configs for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          lower(coalesce(p.role::text, '')) in ('apostolo', 'administrador_geral', 'admin', 'pastor')
          or p.church_id = organization_configs.church_id
        )
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          lower(coalesce(p.role::text, '')) in ('apostolo', 'administrador_geral', 'admin', 'pastor')
          or p.church_id = organization_configs.church_id
        )
    )
  );

comment on table public.organization_configs is
  'Configuração institucional por tenant; mantém a lógica técnica e os dados legados estáveis.';
comment on column public.organization_configs.organization_type is
  'Identificador técnico: church, institute ou association.';
comment on column public.organization_configs.setup_status is
  'Estado do onboarding: setup_required, setup_in_progress, ready_for_review, active, suspended ou archived.';
comment on column public.organization_configs.features is
  'Overrides de módulos e funcionalidades por organização.';
comment on column public.organization_configs.navigation is
  'Overrides de navegação; chaves de rota permanecem técnicas e estáveis.';

-- Seed somente quando a FAM existente for encontrada e ainda não houver config.
do $$
declare
  v_fam_id uuid;
begin
  select id into v_fam_id
  from public.churches
  where lower(coalesce(slug, '')) = 'fam-samambaia-df'
     or lower(coalesce(name, '')) like '%força ativa da mulher%'
     or lower(coalesce(name, '')) like '%forca ativa da mulher%'
  order by case when lower(coalesce(slug, '')) = 'fam-samambaia-df' then 0 else 1 end
  limit 1;

  if v_fam_id is not null then
    insert into public.organization_configs (
      church_id, organization_type, setup_status,
      official_name, display_name, short_name,
      features, navigation, is_public
    )
    select
      v_fam_id, 'association', 'setup_in_progress',
      'Força Ativa da Mulher', 'FAM', 'FAM',
      '{"knowledge_journey": true}'::jsonb,
      '{}'::jsonb, false
    where not exists (
      select 1 from public.organization_configs where church_id = v_fam_id
    );
  end if;
end
$$;
