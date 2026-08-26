-- FAM009 — Evidence Lifecycle
-- Aditiva e não destrutiva. Arquivos pendentes ou não limpos permanecem indisponíveis.

alter table public.fam_risk_attachments
  add column if not exists scan_engine text,
  add column if not exists scan_attempted_at timestamptz,
  add column if not exists scanned_at timestamptz,
  add column if not exists quarantined_at timestamptz,
  add column if not exists sha256 text,
  add column if not exists retention_expires_at timestamptz,
  add column if not exists legal_hold boolean not null default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists deletion_reason text;

update public.fam_risk_attachments
set retention_expires_at = created_at + interval '180 days'
where retention_expires_at is null;

create index if not exists idx_fam_attachments_retention
  on public.fam_risk_attachments(retention_expires_at, legal_hold, deleted_at);
create index if not exists idx_fam_attachments_scan_status
  on public.fam_risk_attachments(malware_scan_status, scanned_at);

comment on column public.fam_risk_attachments.malware_scan_status is
  'pending = quarentena; clean = acesso permitido; infected/error = acesso bloqueado.';
comment on column public.fam_risk_attachments.retention_expires_at is
  'Data de expurgo lógico/operacional; legal_hold impede expurgo automático.';
comment on column public.fam_risk_attachments.legal_hold is
  'Bloqueia exclusão automática até revisão autorizada.';
