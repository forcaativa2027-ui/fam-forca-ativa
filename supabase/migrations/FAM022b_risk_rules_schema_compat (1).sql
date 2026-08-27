-- FAM022b — adaptação ao schema remoto já existente
-- Não executar FAM022_risk_rules_state_audit.sql neste banco.
-- Esta migration é aditiva e não destrutiva.

alter table if exists public.fam_risk_cases
  add column if not exists rules_version text;

alter table if exists public.fam_risk_rules
  add column if not exists rule_version text;

alter table if exists public.fam_risk_rules
  add column if not exists source_document text;

create table if not exists public.fam_risk_rule_versions (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.fam_risk_rules(id) on delete cascade,
  code text not null,
  version text not null,
  name text not null,
  description text,
  priority integer not null,
  condition jsonb not null,
  actions jsonb not null,
  signals jsonb,
  signal_priority integer,
  special_flows text[],
  source_document text,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  unique (code, version)
);

create index if not exists idx_fam_risk_rule_versions_current
  on public.fam_risk_rule_versions(code, is_current, version);

alter table public.fam_risk_rule_versions enable row level security;

drop policy if exists fam_risk_rule_versions_public_read on public.fam_risk_rule_versions;
create policy fam_risk_rule_versions_public_read on public.fam_risk_rule_versions
  for select to anon, authenticated using (is_current = true);

-- Reutiliza a tabela remota existente. A constraint fam_risk_rules_code_key é respeitada.
insert into public.fam_risk_rules
  (code, name, description, priority, condition, actions, signals, signal_priority, special_flows, is_active, rule_version, source_document)
values
  ('RULE-EMERGENCY-001', 'Perigo actual', 'Sinal de perigo acontecendo agora.', 100,
   '{"kind":"condition","questionKey":"danger_now","operator":"equals","value":"YES"}'::jsonb,
   '{"orientationCode":"ORIENT-EMERGENCY-001","attention":"immediate"}'::jsonb,
   '["danger_now"]'::jsonb, 100, null, true, 'FAM-RULES-1.0', 'DEV-00_Contextualizacao_Tecnica_FAM_Mapa_de_Risco_INFO.md'),
  ('RULE-EMERGENCY-002', 'Perigo físico imediato', 'Lesão ou arma identificada na triagem.', 100,
   '{"kind":"any","conditions":[{"kind":"condition","questionKey":"injury","operator":"equals","value":"YES"},{"kind":"condition","questionKey":"weapon","operator":"equals","value":"YES"}]}'::jsonb,
   '{"orientationCode":"ORIENT-EMERGENCY-001","attention":"immediate"}'::jsonb,
   '["immediate_danger_signal"]'::jsonb, 100, null, true, 'FAM-RULES-1.0', 'DEV-00_Contextualizacao_Tecnica_FAM_Mapa_de_Risco_INFO.md'),
  ('RULE-SPECIAL-SEXUAL-001', 'Violência sexual', 'Sinal que pode exigir fluxo especializado.', 80,
   '{"kind":"condition","questionKey":"sexual","operator":"equals","value":"YES"}'::jsonb,
   '{"orientationCode":"ORIENT-SPECIALIZED-001","attention":"specialized"}'::jsonb,
   '["sexual"]'::jsonb, 80, '{sexual}', true, 'FAM-RULES-1.0', 'DEV-00_Contextualizacao_Tecnica_FAM_Mapa_de_Risco_INFO.md'),
  ('RULE-SPECIAL-CHILDREN-001', 'Criança ou adolescente', 'Sinal que pode exigir proteção especializada.', 80,
   '{"kind":"condition","questionKey":"children","operator":"equals","value":"YES"}'::jsonb,
   '{"orientationCode":"ORIENT-SPECIALIZED-001","attention":"specialized"}'::jsonb,
   '["children"]'::jsonb, 80, '{children}', true, 'FAM-RULES-1.0', 'DEV-00_Contextualizacao_Tecnica_FAM_Mapa_de_Risco_INFO.md'),
  ('RULE-COMBINED-001', 'Perigo com lesão', 'Combinação de perigo actual e lesão.', 100,
   '{"kind":"all","conditions":[{"kind":"condition","questionKey":"danger_now","operator":"equals","value":"YES"},{"kind":"condition","questionKey":"injury","operator":"equals","value":"YES"}]}'::jsonb,
   '{"orientationCode":"ORIENT-EMERGENCY-001","attention":"immediate"}'::jsonb,
   '["danger_with_injury"]'::jsonb, 100, null, true, 'FAM-RULES-1.0', 'DEV-00_Contextualizacao_Tecnica_FAM_Mapa_de_Risco_INFO.md')
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  priority = excluded.priority,
  condition = excluded.condition,
  actions = excluded.actions,
  signals = excluded.signals,
  signal_priority = excluded.signal_priority,
  special_flows = excluded.special_flows,
  is_active = excluded.is_active,
  rule_version = excluded.rule_version,
  source_document = excluded.source_document,
  updated_at = now();

-- Mantém uma fotografia versionada do catálogo actual para rastreabilidade.
insert into public.fam_risk_rule_versions
  (rule_id, code, version, name, description, priority, condition, actions, signals, signal_priority, special_flows, source_document, is_current)
select
  r.id, r.code, coalesce(r.rule_version, 'FAM-RULES-1.0'), r.name, r.description, r.priority,
  r.condition, r.actions, r.signals, r.signal_priority, r.special_flows, r.source_document, true
from public.fam_risk_rules r
where r.code in (
  'RULE-EMERGENCY-001', 'RULE-EMERGENCY-002', 'RULE-SPECIAL-SEXUAL-001',
  'RULE-SPECIAL-CHILDREN-001', 'RULE-COMBINED-001'
)
and not exists (
  select 1 from public.fam_risk_rule_versions v
  where v.code = r.code and v.version = coalesce(r.rule_version, 'FAM-RULES-1.0')
);
