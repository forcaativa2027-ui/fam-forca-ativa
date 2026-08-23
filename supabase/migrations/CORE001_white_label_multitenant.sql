-- SERVO360 — CORE-001
-- White-label, multi-tenant, catálogo de módulos e Administrador Geral.
-- Reusa public.churches como entidade de tenant. Idempotente.

-- ─────────────────────────────────────────────────────────────────────
-- 1) Campos do tenant legado que faltam em instalações antigas
-- ─────────────────────────────────────────────────────────────────────
alter table if exists public.churches add column if not exists legal_name text;
alter table if exists public.churches add column if not exists display_name text;
alter table if exists public.churches add column if not exists organization_type text default 'church';
alter table if exists public.churches add column if not exists tenant_status text default 'active';
alter table if exists public.churches add column if not exists favicon_url text;
alter table if exists public.churches add column if not exists app_icon_url text;

-- ─────────────────────────────────────────────────────────────────────
-- 2) Catálogo global e templates
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.platform_modules (
  module_key text primary key,
  default_label text not null,
  category text not null,
  route text not null,
  admin_tab text,
  icon_key text,
  is_core boolean not null default false,
  is_required boolean not null default false,
  can_disable boolean not null default true,
  supports_custom_label boolean not null default true,
  supports_custom_icon boolean not null default false,
  supports_custom_order boolean not null default true,
  depends_on text[] not null default '{}',
  conflicts_with text[] not null default '{}',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_templates (
  template_key text primary key,
  label text not null,
  organization_type text not null,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────
-- 3) Configuração por tenant
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.tenant_branding (
  tenant_id uuid primary key references public.churches(id) on delete cascade,
  display_name text,
  short_name text,
  legal_name text,
  logo_primary text,
  logo_dark text,
  logo_light text,
  favicon text,
  app_icon text,
  primary_color text,
  secondary_color text,
  accent_color text,
  background_style text not null default 'solid',
  login_image text,
  welcome_image text,
  theme_mode text not null default 'light' check (theme_mode in ('light','dark','system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.churches(id) on delete cascade,
  template_key text references public.platform_templates(template_key) on delete set null,
  custom_domain text,
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_modules (
  tenant_id uuid not null references public.churches(id) on delete cascade,
  module_key text not null references public.platform_modules(module_key) on delete cascade,
  enabled boolean not null default true,
  label_override text,
  icon_override text,
  route_override text,
  sort_order integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, module_key)
);

create table if not exists public.tenant_labels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.churches(id) on delete cascade,
  key text not null,
  value text not null,
  locale text not null default 'pt-BR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, key, locale)
);

create table if not exists public.tenant_menu_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.churches(id) on delete cascade,
  module_key text not null references public.platform_modules(module_key) on delete cascade,
  label_override text,
  icon_override text,
  route_override text,
  position integer not null default 0,
  is_visible boolean not null default true,
  audience text not null default 'public' check (audience in ('public','member','admin','all')),
  parent_id uuid references public.tenant_menu_items(id) on delete set null,
  section text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, module_key, audience)
);

create table if not exists public.tenant_templates (
  tenant_id uuid primary key references public.churches(id) on delete cascade,
  template_key text not null references public.platform_templates(template_key),
  applied_by uuid references public.profiles(id) on delete set null,
  applied_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────
-- 4) Administradores da plataforma e dos tenants
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.platform_admins (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  role_key text not null default 'platform_admin',
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_admins (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.churches(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  email text,
  display_name text,
  role_key text not null default 'tenant_admin',
  status text not null default 'invited' check (status in ('invited','active','suspended','revoked')),
  can_change_branding boolean not null default false,
  can_change_menu boolean not null default false,
  can_change_labels boolean not null default false,
  can_configure_modules boolean not null default false,
  can_create_admins boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, profile_id),
  unique (tenant_id, email)
);

create index if not exists idx_tenant_modules_tenant on public.tenant_modules(tenant_id, enabled, sort_order);
create index if not exists idx_tenant_labels_tenant on public.tenant_labels(tenant_id, locale);
create index if not exists idx_tenant_menu_tenant on public.tenant_menu_items(tenant_id, audience, is_visible, position);
create index if not exists idx_tenant_admins_tenant on public.tenant_admins(tenant_id, status);

-- ─────────────────────────────────────────────────────────────────────
-- 5) Dados padrão estáveis. Labels podem ser sobrescritos sem mudar chaves.
-- ─────────────────────────────────────────────────────────────────────
insert into public.platform_templates (template_key, label, organization_type, config) values
  ('CHURCH_DEFAULT', 'Igreja', 'church', '{"modules":["core.home","core.profile","core.notifications","community.life_group","community.discipleship","education.academy","education.bible","education.kids","content.news","content.videos","content.live","content.events","content.agenda","content.radio","support.talk_to_someone","finance.giving","admin.members","admin.structure","admin.reports","admin.security"]}'::jsonb),
  ('ASSOCIATION_DEFAULT', 'Associação', 'association', '{"modules":["core.home","core.profile","core.notifications","content.news","content.videos","content.events","content.agenda","support.talk_to_someone","finance.giving","admin.members","admin.reports"]}'::jsonb),
  ('INSTITUTE_DEFAULT', 'Instituto', 'institute', '{"modules":["core.home","core.profile","core.notifications","education.academy","education.bible","content.news","content.videos","content.events","content.agenda","support.talk_to_someone","finance.giving","admin.members","admin.reports"]}'::jsonb),
  ('SOCIAL_PROJECT_DEFAULT', 'Projeto social', 'social_project', '{"modules":["core.home","core.profile","core.notifications","content.news","content.events","content.agenda","support.talk_to_someone","finance.giving","admin.members","admin.reports"]}'::jsonb),
  ('CUSTOM', 'Personalizado', 'other', '{}'::jsonb)
on conflict (template_key) do nothing;

insert into public.platform_modules
  (module_key, default_label, category, route, admin_tab, icon_key, is_core, is_required, can_disable, supports_custom_label, supports_custom_icon, supports_custom_order)
values
  ('core.home', 'Início', 'core', '/', null, 'home', true, true, false, true, false, false),
  ('core.profile', 'Perfil', 'core', '/painel', null, 'user', true, true, false, true, false, false),
  ('core.notifications', 'Notificações', 'core', '/painel', null, 'bell', true, true, false, true, false, false),
  ('core.wallet', 'Carteira', 'core', '/painel/carteira', null, 'wallet', true, false, true, true, false, true),
  ('community.life_group', 'Life Groups', 'community', '/painel', 'life-groups', 'users', false, false, true, true, false, true),
  ('community.discipleship', 'Discipulado', 'community', '/painel', 'discipleship', 'book-open', false, false, true, true, false, true),
  ('community.prayer', 'Oração', 'community', '/?tab=contato', 'prayer-requests', 'heart', false, false, true, true, false, true),
  ('community.ministry', 'Ministérios', 'community', '/painel', 'ministerios', 'mic', false, false, true, true, false, true),
  ('community.churches', 'Organizações', 'community', '/?tab=igrejas', 'communities', 'building', false, false, true, true, false, true),
  ('education.academy', 'Academy', 'education', '/painel/cecmais', 'formacao', 'graduation-cap', false, false, true, true, false, true),
  ('education.bible', 'Bíblia', 'education', '/painel/cecmais', 'conhecimento-biblico', 'book-open', false, false, true, true, false, true),
  ('education.kids', 'Kids', 'education', '/painel', 'kids-admin', 'baby', false, false, true, true, false, true),
  ('content.news', 'Notícias', 'content', '/?tab=noticias', 'news', 'newspaper', false, false, true, true, false, true),
  ('content.videos', 'Vídeos', 'content', '/?tab=videos', 'news-videos', 'video', false, false, true, true, false, true),
  ('content.live', 'Live-360', 'content', '/live', 'live360', 'video', false, false, true, true, false, true),
  ('content.events', 'Eventos', 'content', '/?tab=agenda', 'registration-events', 'calendar', false, false, true, true, false, true),
  ('content.agenda', 'Agenda', 'content', '/?tab=agenda', 'events', 'calendar-days', false, false, true, true, false, true),
  ('content.radio', 'Rádio Web', 'content', '/?tab=radio', 'radio', 'radio', false, false, true, true, true, true),
  ('support.talk_to_someone', 'Conversar', 'support', '/?tab=contato', 'visit-requests', 'message-circle', false, false, true, true, false, true),
  ('finance.giving', 'Doação', 'finance', '/?tab=ofertar', 'giving', 'hand-coins', false, false, true, true, false, true),
  ('admin.members', 'Membros', 'admin', '/admin', 'members', 'users', false, false, true, true, false, true),
  ('admin.structure', 'Estrutura', 'admin', '/admin', 'structure', 'git-branch', false, false, true, true, false, true),
  ('admin.reports', 'Relatórios', 'admin', '/admin', 'ministerial-reports', 'file-chart', false, false, true, true, false, true),
  ('admin.security', 'Segurança', 'admin', '/admin', 'permissions', 'shield', false, false, true, true, false, true)
on conflict (module_key) do update set
  default_label = excluded.default_label,
  category = excluded.category,
  route = excluded.route,
  admin_tab = excluded.admin_tab,
  icon_key = excluded.icon_key,
  is_core = excluded.is_core,
  is_required = excluded.is_required,
  can_disable = excluded.can_disable,
  supports_custom_label = excluded.supports_custom_label,
  supports_custom_icon = excluded.supports_custom_icon,
  supports_custom_order = excluded.supports_custom_order,
  updated_at = now();

-- ─────────────────────────────────────────────────────────────────────
-- 6) Helpers de autorização da camada de plataforma
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.is_platform_admin(p_profile_id uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = coalesce(p_profile_id, auth.uid())
      and p.role::text in ('apostolo', 'administrador_geral', 'platform_admin')
  ) or exists (
    select 1 from public.platform_admins pa
    where pa.profile_id = coalesce(p_profile_id, auth.uid())
      and pa.is_active
  );
$$;
grant execute on function public.is_platform_admin(uuid) to authenticated;

create or replace function public.can_manage_tenant_config(p_tenant_id uuid, p_capability text)
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare allowed boolean;
begin
  if public.is_platform_admin() then return true; end if;
  select case p_capability
    when 'branding' then can_change_branding
    when 'menu' then can_change_menu
    when 'labels' then can_change_labels
    when 'modules' then can_configure_modules
    when 'admins' then can_create_admins
    else false
  end into allowed
  from public.tenant_admins
  where tenant_id = p_tenant_id
    and profile_id = auth.uid()
    and status = 'active';
  return coalesce(allowed, false);
end; $$;
grant execute on function public.can_manage_tenant_config(uuid, text) to authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 7) Compatibilidade: materializa branding e módulo inicial para tenants atuais
-- ─────────────────────────────────────────────────────────────────────
insert into public.tenant_branding
  (tenant_id, display_name, short_name, legal_name, logo_primary, primary_color, secondary_color)
select id, coalesce(display_name, name), short_name, coalesce(legal_name, name), logo_url, primary_color, secondary_color
from public.churches
on conflict (tenant_id) do nothing;

insert into public.tenant_settings (tenant_id, template_key)
select c.id, 'CHURCH_DEFAULT'
from public.churches c
on conflict (tenant_id) do nothing;

insert into public.tenant_modules (tenant_id, module_key, enabled, sort_order)
select c.id, pm.module_key, true, row_number() over (partition by c.id order by pm.category, pm.default_label)
from public.churches c cross join public.platform_modules pm
where coalesce(c.is_active, true)
  and (pm.is_core or pm.module_key in ('community.life_group','community.discipleship','education.academy','education.bible','education.kids','content.news','content.videos','content.live','content.events','content.agenda','content.radio','support.talk_to_someone','finance.giving','admin.members','admin.structure','admin.reports','admin.security'))
on conflict (tenant_id, module_key) do nothing;

-- ─────────────────────────────────────────────────────────────────────
-- 8) RLS: catálogo global, configuração e isolamento por tenant
-- ─────────────────────────────────────────────────────────────────────
alter table public.platform_modules enable row level security;
drop policy if exists platform_modules_public_read on public.platform_modules;
create policy platform_modules_public_read on public.platform_modules for select to anon, authenticated using (true);
drop policy if exists platform_modules_platform_write on public.platform_modules;
create policy platform_modules_platform_write on public.platform_modules for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

alter table public.platform_templates enable row level security;
drop policy if exists platform_templates_read on public.platform_templates;
create policy platform_templates_read on public.platform_templates for select to authenticated using (true);
drop policy if exists platform_templates_platform_write on public.platform_templates;
create policy platform_templates_platform_write on public.platform_templates for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

alter table public.tenant_branding enable row level security;
drop policy if exists tenant_branding_public_read on public.tenant_branding;
create policy tenant_branding_public_read on public.tenant_branding for select to anon using (exists (select 1 from public.churches c where c.id = tenant_id and coalesce(c.is_active, true)));
drop policy if exists tenant_branding_scoped_read on public.tenant_branding;
create policy tenant_branding_scoped_read on public.tenant_branding for select to authenticated using (public.is_platform_admin() or tenant_id in (select public.accessible_church_ids()));
drop policy if exists tenant_branding_scoped_write on public.tenant_branding;
create policy tenant_branding_scoped_write on public.tenant_branding for all to authenticated using (public.can_manage_tenant_config(tenant_id, 'branding')) with check (public.can_manage_tenant_config(tenant_id, 'branding'));

alter table public.tenant_settings enable row level security;
drop policy if exists tenant_settings_scoped_read on public.tenant_settings;
create policy tenant_settings_scoped_read on public.tenant_settings for select to authenticated using (public.is_platform_admin() or tenant_id in (select public.accessible_church_ids()));
drop policy if exists tenant_settings_scoped_write on public.tenant_settings;
create policy tenant_settings_scoped_write on public.tenant_settings for all to authenticated using (public.can_manage_tenant_config(tenant_id, 'branding')) with check (public.can_manage_tenant_config(tenant_id, 'branding'));

alter table public.tenant_modules enable row level security;
drop policy if exists tenant_modules_public_read on public.tenant_modules;
create policy tenant_modules_public_read on public.tenant_modules for select to anon using (exists (select 1 from public.churches c where c.id = tenant_id and coalesce(c.is_active, true)));
drop policy if exists tenant_modules_scoped_read on public.tenant_modules;
create policy tenant_modules_scoped_read on public.tenant_modules for select to authenticated using (public.is_platform_admin() or tenant_id in (select public.accessible_church_ids()));
drop policy if exists tenant_modules_scoped_write on public.tenant_modules;
create policy tenant_modules_scoped_write on public.tenant_modules for all to authenticated using (public.can_manage_tenant_config(tenant_id, 'modules')) with check (public.can_manage_tenant_config(tenant_id, 'modules'));

alter table public.tenant_labels enable row level security;
drop policy if exists tenant_labels_public_read on public.tenant_labels;
create policy tenant_labels_public_read on public.tenant_labels for select to anon using (exists (select 1 from public.churches c where c.id = tenant_id and coalesce(c.is_active, true)));
drop policy if exists tenant_labels_scoped_read on public.tenant_labels;
create policy tenant_labels_scoped_read on public.tenant_labels for select to authenticated using (public.is_platform_admin() or tenant_id in (select public.accessible_church_ids()));
drop policy if exists tenant_labels_scoped_write on public.tenant_labels;
create policy tenant_labels_scoped_write on public.tenant_labels for all to authenticated using (public.can_manage_tenant_config(tenant_id, 'labels')) with check (public.can_manage_tenant_config(tenant_id, 'labels'));

alter table public.tenant_menu_items enable row level security;
drop policy if exists tenant_menu_public_read on public.tenant_menu_items;
create policy tenant_menu_public_read on public.tenant_menu_items for select to anon using (is_visible and audience in ('public','all') and exists (select 1 from public.churches c where c.id = tenant_id and coalesce(c.is_active, true)));
drop policy if exists tenant_menu_scoped_read on public.tenant_menu_items;
create policy tenant_menu_scoped_read on public.tenant_menu_items for select to authenticated using (public.is_platform_admin() or tenant_id in (select public.accessible_church_ids()));
drop policy if exists tenant_menu_scoped_write on public.tenant_menu_items;
create policy tenant_menu_scoped_write on public.tenant_menu_items for all to authenticated using (public.can_manage_tenant_config(tenant_id, 'menu')) with check (public.can_manage_tenant_config(tenant_id, 'menu'));

alter table public.tenant_templates enable row level security;
drop policy if exists tenant_templates_scoped_read on public.tenant_templates;
create policy tenant_templates_scoped_read on public.tenant_templates for select to authenticated using (public.is_platform_admin() or tenant_id in (select public.accessible_church_ids()));
drop policy if exists tenant_templates_platform_write on public.tenant_templates;
create policy tenant_templates_platform_write on public.tenant_templates for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

alter table public.platform_admins enable row level security;
drop policy if exists platform_admins_read on public.platform_admins;
create policy platform_admins_read on public.platform_admins for select to authenticated using (profile_id = auth.uid() or public.is_platform_admin());
drop policy if exists platform_admins_write on public.platform_admins;
create policy platform_admins_write on public.platform_admins for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

alter table public.tenant_admins enable row level security;
drop policy if exists tenant_admins_scoped_read on public.tenant_admins;
create policy tenant_admins_scoped_read on public.tenant_admins for select to authenticated using (public.is_platform_admin() or tenant_id in (select public.accessible_church_ids()));
drop policy if exists tenant_admins_scoped_write on public.tenant_admins;
create policy tenant_admins_scoped_write on public.tenant_admins for all to authenticated using (public.can_manage_tenant_config(tenant_id, 'admins')) with check (public.can_manage_tenant_config(tenant_id, 'admins'));

-- Evita que funções públicas de configuração sejam usadas sem sessão em escrita.
revoke insert, update, delete on public.tenant_branding from anon;
revoke insert, update, delete on public.tenant_settings from anon;
revoke insert, update, delete on public.tenant_modules from anon;
revoke insert, update, delete on public.tenant_labels from anon;
revoke insert, update, delete on public.tenant_menu_items from anon;
revoke insert, update, delete on public.tenant_templates from anon;
revoke insert, update, delete on public.platform_modules from anon;
revoke insert, update, delete on public.platform_templates from anon;
revoke insert, update, delete on public.platform_admins from anon;
revoke insert, update, delete on public.tenant_admins from anon;

-- Administrador Geral também precisa operar o catálogo de tenants já existente.
drop policy if exists churches_platform_admin_read on public.churches;
create policy churches_platform_admin_read on public.churches for select to authenticated using (public.is_platform_admin());
drop policy if exists churches_platform_admin_write on public.churches;
create policy churches_platform_admin_write on public.churches for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Grants explícitos para instalações Supabase com privilégios padrão restritos.
grant select on public.platform_modules to anon, authenticated;
grant select on public.platform_templates to authenticated;
grant select on public.tenant_branding, public.tenant_modules, public.tenant_labels, public.tenant_menu_items to anon, authenticated;
grant select on public.tenant_settings, public.tenant_templates, public.platform_admins, public.tenant_admins to authenticated;
grant insert, update, delete on public.tenant_branding, public.tenant_settings, public.tenant_modules, public.tenant_labels, public.tenant_menu_items, public.tenant_templates, public.platform_modules, public.platform_templates, public.platform_admins, public.tenant_admins to authenticated;
