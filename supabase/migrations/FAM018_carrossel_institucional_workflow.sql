-- ============================================================
-- FAM018 — Carrossel Institucional e Workflow Editorial
--
-- Evolução aditiva da tabela public.banners.
-- Não remove colunas, dados ou versões anteriores.
-- A paleta é conteúdo configurável, mas os valores padrão usam os
-- tokens cromáticos FAM já aprovados; nenhum token de CSS é alterado.
-- ============================================================

-- Compatibilidade com instalações onde a tabela legacy banners foi criada
-- parcialmente. Todas as adições são NULL/default-safe e não removem dados.
alter table public.banners add column if not exists title text;
alter table public.banners add column if not exists subtitle text;
alter table public.banners add column if not exists image_url text;
alter table public.banners add column if not exists cta_label text;
alter table public.banners add column if not exists cta_url text;
alter table public.banners add column if not exists sort_order integer not null default 0;
alter table public.banners add column if not exists is_active boolean not null default true;
alter table public.banners add column if not exists starts_at timestamptz;
alter table public.banners add column if not exists ends_at timestamptz;
alter table public.banners add column if not exists created_at timestamptz not null default now();
alter table public.banners add column if not exists updated_at timestamptz not null default now();
alter table public.banners add column if not exists created_by uuid;

alter table public.banners add column if not exists tenant_key text not null default 'FAM';
alter table public.banners add column if not exists desktop_image_url text;
alter table public.banners add column if not exists mobile_image_url text;
alter table public.banners add column if not exists image_alt text;
alter table public.banners add column if not exists institutional_label text;
alter table public.banners add column if not exists background_color text not null default 'fam-plum';
alter table public.banners add column if not exists text_color text not null default 'white';
alter table public.banners add column if not exists cta_kind text not null default 'internal';
alter table public.banners add column if not exists priority integer not null default 0;
alter table public.banners add column if not exists audience text not null default 'publico_geral';
alter table public.banners add column if not exists campaign_key text;
alter table public.banners add column if not exists workflow_status text not null default 'publicado';
alter table public.banners add column if not exists review_note text;
alter table public.banners add column if not exists approved_by uuid references public.profiles(id) on delete set null;
alter table public.banners add column if not exists approved_at timestamptz;
alter table public.banners add column if not exists published_at timestamptz;
alter table public.banners add column if not exists paused_at timestamptz;
alter table public.banners add column if not exists archived_at timestamptz;

update public.banners
set tenant_key = coalesce(nullif(tenant_key, ''), 'FAM'),
    workflow_status = case when coalesce(is_active, false) then 'publicado' else 'arquivado' end,
    published_at = coalesce(published_at, case when is_active then created_at else null end),
    desktop_image_url = coalesce(desktop_image_url, image_url),
    institutional_label = coalesce(institutional_label, 'FAM · FORÇA ATIVA DA MULHER'),
    background_color = coalesce(nullif(background_color, ''), 'fam-plum'),
    text_color = coalesce(nullif(text_color, ''), 'white'),
    cta_kind = coalesce(nullif(cta_kind, ''), case when cta_url like 'http%' then 'externo' else 'internal' end),
    audience = coalesce(nullif(audience, ''), 'publico_geral'),
    priority = coalesce(priority, sort_order)
where tenant_key is null or tenant_key = '' or workflow_status is null or desktop_image_url is null
   or institutional_label is null or background_color is null or text_color is null
   or cta_kind is null or audience is null;

alter table public.banners drop constraint if exists banners_cta_kind_check;
alter table public.banners add constraint banners_cta_kind_check
  check (cta_kind in ('internal','ancora','formulario','externo','telefone','emergencia'));

alter table public.banners drop constraint if exists banners_workflow_status_check;
alter table public.banners add constraint banners_workflow_status_check
  check (workflow_status in ('rascunho','em_revisao','aprovado','agendado','publicado','pausado','expirado','arquivado','rejeitado'));

alter table public.banners drop constraint if exists banners_audience_check;
alter table public.banners add constraint banners_audience_check
  check (audience in ('publico_geral','beneficiarias','voluntarias','equipe'));

create index if not exists idx_fam_banners_eligibility
  on public.banners(tenant_key, workflow_status, is_active, priority, sort_order, starts_at, ends_at);
create index if not exists idx_fam_banners_campaign on public.banners(tenant_key, campaign_key);

-- O público só recebe banners FAM publicados/agendados e dentro da validade.
drop policy if exists banners_public_read on public.banners;
create policy banners_public_read on public.banners for select to anon
  using (
    tenant_key = 'FAM'
    and is_active
    and workflow_status in ('publicado','agendado')
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

create or replace function public.get_active_banners()
returns setof public.banners
language sql stable security definer set search_path=public as $$
  select b.* from public.banners b
  where b.tenant_key = 'FAM'
    and b.is_active
    and b.workflow_status in ('publicado','agendado')
    and (b.starts_at is null or b.starts_at <= now())
    and (b.ends_at is null or b.ends_at >= now())
  order by b.priority desc, b.sort_order asc, b.updated_at desc;
$$;
grant execute on function public.get_active_banners() to anon, authenticated;

create table if not exists public.fam_banner_events (
  id uuid primary key default gen_random_uuid(),
  tenant_key text not null default 'FAM',
  banner_id uuid not null references public.banners(id) on delete cascade,
  event_type text not null check (event_type in ('impressao','cta_click','avanço_manual','pausa','erro_imagem','erro_link')),
  session_hash text,
  device_type text,
  occurred_at timestamptz not null default now(),
  metadata_minimal jsonb not null default '{}'::jsonb
);
alter table public.fam_banner_events enable row level security;
drop policy if exists fam_banner_events_public_insert on public.fam_banner_events;
create policy fam_banner_events_public_insert on public.fam_banner_events for insert to anon
  with check (tenant_key = 'FAM' and length(coalesce(session_hash,'')) <= 128 and metadata_minimal ?| array['route','source']);
drop policy if exists fam_banner_events_admin_read on public.fam_banner_events;
create policy fam_banner_events_admin_read on public.fam_banner_events for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'apostolo'));
create index if not exists idx_fam_banner_events_banner_time on public.fam_banner_events(banner_id, occurred_at desc);

create table if not exists public.fam_banner_audit_events (
  id uuid primary key default gen_random_uuid(),
  banner_id uuid not null references public.banners(id) on delete cascade,
  action text not null check (action in ('criado','editado','enviado_revisao','aprovado','reprovado','publicado','pausado','arquivado','reativado')),
  actor_id uuid references public.profiles(id) on delete set null,
  before_data jsonb,
  after_data jsonb,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.fam_banner_audit_events enable row level security;
drop policy if exists fam_banner_audit_admin_read on public.fam_banner_audit_events;
create policy fam_banner_audit_admin_read on public.fam_banner_audit_events for select to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'apostolo'));
create index if not exists idx_fam_banner_audit_banner_time on public.fam_banner_audit_events(banner_id, created_at desc);

comment on table public.fam_banner_events is 'Métricas agregadas e minimizadas do carrossel FAM; não armazena dados de atendimento.';
comment on table public.fam_banner_audit_events is 'Auditoria imutável de alterações e transições editoriais do carrossel FAM.';
comment on column public.banners.background_color is 'Referência visual FAM aprovada; não altera tokens CSS do produto.';
comment on column public.banners.text_color is 'Referência visual FAM aprovada; deve ser validada por contraste antes da publicação.';
