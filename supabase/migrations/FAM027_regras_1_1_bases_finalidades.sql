-- FAM027 — FAM-RULES-1.1 e catálogo de finalidades/bases
-- Não apaga versões anteriores nem activa bases jurídicas sem aprovação.

begin;

-- Preserva a fotografia anterior e marca a nova versão como actual
-- somente para as regras que já possuem versão remota FAM-RULES-1.0.
update public.fam_risk_rule_versions
set is_current = false
where version = 'FAM-RULES-1.0'
  and code in (
    'RULE-EMERGENCY-001',
    'RULE-EMERGENCY-002',
    'RULE-SPECIAL-CHILDREN-001',
    'RULE-COMBINED-001'
  );

update public.fam_risk_rules
set
  rule_version = 'FAM-RULES-1.1',
  source_document = coalesce(source_document, 'OC-04_Matriz_Situacoes_Risco_Respostas_v1.1.md'),
  updated_at = now()
where code in (
  'RULE-EMERGENCY-001',
  'RULE-EMERGENCY-002',
  'RULE-SPECIAL-CHILDREN-001',
  'RULE-COMBINED-001'
)
  and is_active = true;

insert into public.fam_risk_rule_versions
  (rule_id, code, version, name, description, priority, condition, actions, signals, signal_priority, special_flows, source_document, is_current)
select
  r.id, r.code, r.rule_version, r.name, r.description, r.priority,
  r.condition, r.actions, r.signals, r.signal_priority, r.special_flows,
  coalesce(r.source_document, 'OC-04_Matriz_Situacoes_Risco_Respostas_v1.1.md'), true
from public.fam_risk_rules r
where r.rule_version = 'FAM-RULES-1.1'
  and not exists (
    select 1
    from public.fam_risk_rule_versions v
    where v.code = r.code
      and v.version = 'FAM-RULES-1.1'
  );

-- Catálogo versionado para JUR-02. Registros são inactivos até validação jurídica.
create table if not exists public.fam_legal_purpose_catalog (
  id uuid primary key default gen_random_uuid(),
  purpose_code text not null,
  data_category text not null,
  legal_basis text not null,
  recipient_type text not null,
  retention_class text not null,
  version text not null,
  effective_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  is_active boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique (purpose_code, data_category, recipient_type, version)
);

create index if not exists idx_fam_legal_purpose_active
  on public.fam_legal_purpose_catalog (purpose_code, data_category, recipient_type, is_active);

alter table public.fam_legal_purpose_catalog enable row level security;

drop policy if exists fam_legal_purpose_authenticated_read
  on public.fam_legal_purpose_catalog;
create policy fam_legal_purpose_authenticated_read
  on public.fam_legal_purpose_catalog
  for select to authenticated
  using (is_active = true);

insert into public.fam_legal_purpose_catalog
  (purpose_code, data_category, legal_basis, recipient_type, retention_class, version, is_active, notes)
values
  ('ORIENTACAO_INICIAL', 'respostas_triagem', 'VALIDAR_JURIDICO', 'FAM_ATENDIMENTO', 'R1', 'JUR-02-v1.0', false, 'Rascunho para validação jurídica; não habilitar automaticamente.'),
  ('PROTECAO_IMEDIATA', 'sinais_urgencia', 'PROTECAO_VIDA_INTEGRIDADE', 'EMERGENCIA_COMPETENTE', 'R3', 'JUR-02-v1.0', false, 'Aplicar somente quando presentes os requisitos legais.'),
  ('PROTECAO_CRIANCA_ADOLESCENTE', 'sinais_protecao_especial', 'VALIDAR_JURIDICO', 'REDE_PROTECAO', 'R3', 'JUR-02-v1.0', false, 'Não autoriza investigação nem compartilhamento automático.'),
  ('ATENDIMENTO_SAUDE', 'sinais_saude', 'TUTELA_SAUDE_VALIDAR', 'SERVICO_SAUDE', 'R3', 'JUR-02-v1.0', false, 'Restrito aos limites legais aplicáveis.'),
  ('AUDITORIA_SEGURANCA', 'metadados_auditoria', 'OBRIGACAO_LEGAL_VALIDAR', 'FAM_GOVERNANCA', 'R4', 'JUR-02-v1.0', false, 'Preferir metadados mínimos e sem conteúdo de caso.')
on conflict (purpose_code, data_category, recipient_type, version) do nothing;

commit;

select code, version, is_current
from public.fam_risk_rule_versions
where version in ('FAM-RULES-1.0', 'FAM-RULES-1.1')
order by code, version;

select purpose_code, data_category, legal_basis, recipient_type, retention_class, version, is_active
from public.fam_legal_purpose_catalog
order by purpose_code;

-- Metadados mínimos do encaminhamento, para manter rastreabilidade JUR-02/JUR-03.
alter table public.fam_referral_requests
  add column if not exists purpose_code text,
  add column if not exists legal_basis text,
  add column if not exists retention_class text,
  add column if not exists legal_catalog_version text;

-- FAM027 não activa bases jurídicas: requer aprovação formal antes de is_active=true.
-- FAM027 não substitui parecer jurídico nem autoriza compartilhamento automático.

-- rollback documental (não executar automaticamente):
-- update public.fam_risk_rules set rule_version = 'FAM-RULES-1.0' where ...;
-- update public.fam_risk_rule_versions set is_current = true where version = 'FAM-RULES-1.0' and ...;
