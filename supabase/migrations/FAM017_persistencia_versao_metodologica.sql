-- FAM017 — Persistência explícita da versão metodológica da avaliação
-- Migration aditiva e não destrutiva.
-- Avaliações anteriores à adoção do versionamento não são reclassificadas:
-- recebem LEGACY-UNVERSIONED até eventual reconciliação autorizada.

alter table if exists public.fam_risk_cases
  add column if not exists methodology_version text not null default 'LEGACY-UNVERSIONED',
  add column if not exists questionnaire_version text not null default 'LEGACY-UNVERSIONED',
  add column if not exists methodology_source_document text;

create index if not exists idx_fam_risk_cases_methodology_version
  on public.fam_risk_cases(methodology_version, created_at);

create index if not exists idx_fam_risk_cases_questionnaire_version
  on public.fam_risk_cases(questionnaire_version, created_at);

comment on column public.fam_risk_cases.methodology_version is
  'Versão metodológica capturada no início da avaliação; avaliações legadas permanecem LEGACY-UNVERSIONED até reconciliação autorizada.';

comment on column public.fam_risk_cases.questionnaire_version is
  'Versão do questionário usada na avaliação; não misturar respostas entre versões.';

comment on column public.fam_risk_cases.methodology_source_document is
  'Documento de origem da metodologia capturada na avaliação.';
