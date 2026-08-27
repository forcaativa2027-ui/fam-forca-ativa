-- FAM022c — versionamento e prioridade das regras legadas
-- Executar somente depois de FAM022b.
-- Não altera condition/actions/signals e não desativa regras.

update public.fam_risk_rules
set
  rule_version = 'FAM-LEGACY-1.0',
  source_document = coalesce(source_document, 'DEV-00_Contextualizacao_Tecnica_FAM_Mapa_de_Risco_INFO.md'),
  priority = case code
    when 'RULE-LETHAL-COMBO-001' then 10
    when 'RULE-STRANGULATION-001' then 10
    when 'RULE-DEATH-THREAT-001' then 20
    when 'RULE-MEDICAL-001' then 20
    when 'RULE-HEALTH-EMERGENCY-001' then 20
    when 'RULE-WEAPON-001' then 30
    when 'RULE-CHILDREN-VIOLENCE-001' then 30
    when 'RULE-SEXUAL-001' then 40
    when 'RULE-CONTROL-001' then 40
    when 'RULE-CHILD-DIGITAL-001' then 40
    when 'RULE-DIGITAL-001' then 40
    when 'RULE-CHILDREN-001' then 50
    else priority
  end,
  updated_at = now()
where code in (
  'RULE-CHILD-DIGITAL-001',
  'RULE-CHILDREN-001',
  'RULE-CHILDREN-VIOLENCE-001',
  'RULE-CONTROL-001',
  'RULE-DEATH-THREAT-001',
  'RULE-DIGITAL-001',
  'RULE-HEALTH-EMERGENCY-001',
  'RULE-LETHAL-COMBO-001',
  'RULE-MEDICAL-001',
  'RULE-SEXUAL-001',
  'RULE-STRANGULATION-001',
  'RULE-WEAPON-001'
);

-- Fotografia das regras legadas após a normalização.
insert into public.fam_risk_rule_versions
  (rule_id, code, version, name, description, priority, condition, actions, signals, signal_priority, special_flows, source_document, is_current)
select
  r.id, r.code, r.rule_version, r.name, r.description, r.priority,
  r.condition, r.actions, r.signals, r.signal_priority, r.special_flows, r.source_document, true
from public.fam_risk_rules r
where r.rule_version = 'FAM-LEGACY-1.0'
and not exists (
  select 1 from public.fam_risk_rule_versions v
  where v.code = r.code and v.version = r.rule_version
);

select code, name, priority, rule_version, is_active
from public.fam_risk_rules
where code in (
  'RULE-CHILD-DIGITAL-001', 'RULE-CHILDREN-001', 'RULE-CHILDREN-VIOLENCE-001',
  'RULE-CONTROL-001', 'RULE-DEATH-THREAT-001', 'RULE-DIGITAL-001',
  'RULE-HEALTH-EMERGENCY-001', 'RULE-LETHAL-COMBO-001', 'RULE-MEDICAL-001',
  'RULE-SEXUAL-001', 'RULE-STRANGULATION-001', 'RULE-WEAPON-001'
)
order by priority, code;
