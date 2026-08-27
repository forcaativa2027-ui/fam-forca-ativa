-- FAM025 — Governança de arquivos, retenção por classe e legal hold
-- Aditiva e não destrutiva. Não remove arquivos nem define prazo universal.

create table if not exists public.fam_retention_policies (
  retention_class text primary key,
  label text not null,
  default_retention_days integer,
  requires_legal_hold_review boolean not null default true,
  policy_version text not null default 'POL-ARQ-01-v1.1',
  approved_at timestamptz,
  approved_by uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fam_retention_policies_class_ck check (retention_class in ('R1','R2','R3','R4','R5')),
  constraint fam_retention_policies_days_ck check (default_retention_days is null or default_retention_days > 0)
);

insert into public.fam_retention_policies
  (retention_class, label, default_retention_days, requires_legal_hold_review, policy_version)
values
  ('R1', 'Respostas da ferramenta sem atendimento continuado', 30, true, 'POL-ARQ-01-v1.1'),
  ('R2', 'Arquivos enviados', null, true, 'POL-ARQ-01-v1.1'),
  ('R3', 'Atendimento e encaminhamento', null, true, 'POL-ARQ-01-v1.1'),
  ('R4', 'Segurança e auditoria', null, true, 'POL-ARQ-01-v1.1'),
  ('R5', 'Incidentes e violações', null, true, 'POL-ARQ-01-v1.1')
on conflict (retention_class) do nothing;

alter table public.fam_risk_attachments
  add column if not exists retention_class text,
  add column if not exists retention_policy_version text,
  add column if not exists retention_reason text,
  add column if not exists legal_hold_reason text,
  add column if not exists legal_hold_set_by uuid,
  add column if not exists legal_hold_set_at timestamptz;

-- Arquivos já existentes permanecem intactos e não recebem expiração nova automaticamente.
-- A classe deve ser definida pelo fluxo que conhece a finalidade.
comment on column public.fam_risk_attachments.retention_class is
  'POL-ARQ-01/DEC-03: R1 respostas, R2 arquivos, R3 atendimento, R4 auditoria, R5 incidentes.';
comment on column public.fam_risk_attachments.retention_policy_version is
  'Versão da política aplicada ao arquivo.';
comment on column public.fam_risk_attachments.legal_hold_reason is
  'Justificativa mínima para suspender expurgo automático.';

create index if not exists idx_fam_attachments_retention_class
  on public.fam_risk_attachments(retention_class, retention_expires_at, legal_hold, deleted_at);

create table if not exists public.fam_file_governance_events (
  id uuid primary key default gen_random_uuid(),
  attachment_id uuid not null,
  actor_user_id uuid,
  event_type text not null,
  retention_class text,
  purpose text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.fam_file_governance_events enable row level security;
drop policy if exists fam_file_governance_events_manager_read on public.fam_file_governance_events;
create policy fam_file_governance_events_manager_read
on public.fam_file_governance_events
for select to authenticated
using (public.fam_is_credential_manager());

revoke all on public.fam_file_governance_events from anon;
grant select on public.fam_file_governance_events to authenticated;

create or replace function public.fam_set_attachment_legal_hold(
  p_attachment_id uuid,
  p_enabled boolean,
  p_reason text,
  p_retention_class text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  changed boolean := false;
begin
  if auth.uid() is null or not public.fam_is_credential_manager() then
    raise exception 'FORBIDDEN';
  end if;
  if p_enabled and (p_reason is null or length(btrim(p_reason)) < 10) then
    raise exception 'LEGAL_HOLD_REASON_REQUIRED';
  end if;
  if p_retention_class is not null and p_retention_class not in ('R1','R2','R3','R4','R5') then
    raise exception 'INVALID_RETENTION_CLASS';
  end if;

  update public.fam_risk_attachments
  set legal_hold = p_enabled,
      legal_hold_reason = case when p_enabled then left(btrim(p_reason), 500) else null end,
      legal_hold_set_by = case when p_enabled then auth.uid() else null end,
      legal_hold_set_at = case when p_enabled then now() else null end,
      retention_class = coalesce(p_retention_class, retention_class),
      retention_policy_version = case when p_retention_class is not null then 'POL-ARQ-01-v1.1' else retention_policy_version end
  where id = p_attachment_id;

  changed := found;
  if changed then
    insert into public.fam_file_governance_events(attachment_id, actor_user_id, event_type, retention_class, metadata)
    select p_attachment_id, auth.uid(), case when p_enabled then 'LEGAL_HOLD_ENABLED' else 'LEGAL_HOLD_RELEASED' end,
      retention_class, jsonb_build_object('reason_provided', p_enabled, 'policy_version', 'POL-ARQ-01-v1.1')
    from public.fam_risk_attachments where id = p_attachment_id;
  end if;
  return changed;
end;
$$;

grant execute on function public.fam_set_attachment_legal_hold(uuid, boolean, text, text) to authenticated;

comment on function public.fam_set_attachment_legal_hold(uuid, boolean, text, text) is
  'POL-ARQ-01/DEC-03: activa ou libera legal hold com justificativa e auditoria; não exclui dados.';
