-- FAM016 — Verificação remota pós-implantação
-- Uso: executar no SQL Editor do Supabase.
-- Natureza: somente leitura; não altera tabelas, dados ou políticas.

-- 1. Conferência do catálogo canônico e das versões obrigatórias.
select
  q.id,
  q.code,
  q.name,
  q.version,
  q.text_version,
  q.policy_version,
  q.questionnaire_version,
  q.methodology_version,
  q.status,
  q.source_document,
  count(r.id) as total_perguntas
from public.fam_risk_questionnaires q
left join public.fam_risk_questions r
  on r.questionnaire_id = q.id
where q.code = 'FAM-RISK-MAP'
   or q.version = 'OC-04-v1.1'
group by
  q.id,
  q.code,
  q.name,
  q.version,
  q.text_version,
  q.policy_version,
  q.questionnaire_version,
  q.methodology_version,
  q.status,
  q.source_document
order by q.created_at;

-- 2. Lista das perguntas canônicas e validação dos campos essenciais.
select
  q.code as questionnaire_code,
  q.version as questionnaire_version,
  r.id,
  r.code,
  r.question_key,
  r.text,
  r.question_text,
  r.source_reference,
  r.order_index,
  r.answer_options,
  (r.code is not null and btrim(r.code) <> '') as code_ok,
  (r.text is not null and btrim(r.text) <> '') as text_ok,
  (r.question_text is not null and btrim(r.question_text) <> '') as question_text_ok
from public.fam_risk_questions r
join public.fam_risk_questionnaires q
  on q.id = r.questionnaire_id
where q.code = 'FAM-RISK-MAP'
   or q.version = 'OC-04-v1.1'
order by r.order_index nulls last, r.code;

-- 3. Contagem de falhas de preenchimento nas perguntas canônicas.
select
  count(*) filter (where r.code is null or btrim(r.code) = '') as sem_code,
  count(*) filter (where r.text is null or btrim(r.text) = '') as sem_text,
  count(*) filter (where r.question_text is null or btrim(r.question_text) = '') as sem_question_text,
  count(*) filter (where r.source_reference is null or btrim(r.source_reference) = '') as sem_source_reference,
  count(*) filter (where r.answer_options is null) as sem_answer_options
from public.fam_risk_questions r
join public.fam_risk_questionnaires q
  on q.id = r.questionnaire_id
where q.code = 'FAM-RISK-MAP'
   or q.version = 'OC-04-v1.1';

-- 4. Verificação de códigos e ordens duplicados no catálogo canônico.
select r.code, count(*) as ocorrencias
from public.fam_risk_questions r
join public.fam_risk_questionnaires q
  on q.id = r.questionnaire_id
where q.code = 'FAM-RISK-MAP'
   or q.version = 'OC-04-v1.1'
group by r.code
having count(*) > 1;

select order_index, count(*) as ocorrencias
from public.fam_risk_questions r
join public.fam_risk_questionnaires q
  on q.id = r.questionnaire_id
where q.code = 'FAM-RISK-MAP'
   or q.version = 'OC-04-v1.1'
group by order_index
having count(*) > 1;

-- 5. Confirmação das políticas RLS públicas esperadas.
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('fam_risk_questionnaires', 'fam_risk_questions')
order by tablename, policyname;

-- Resultado esperado:
-- * um catálogo FAM-RISK-MAP / OC-04-v1.1 em draft;
-- * cinco perguntas;
-- * sem_code = 0, sem_text = 0, sem_question_text = 0;
-- * sem_source_reference = 0, sem_answer_options = 0;
-- * nenhuma linha nas consultas de duplicidade;
-- * políticas públicas limitadas a registros publicados.

-- Próximo passo: executar os testes locais da Fase 2 e registrar o resultado no relatório de aceite.

-- Referência: docs/CADERNO_TECNICO_DESENVOLVIMENTO_IMPLANTACAO_FAM.md
-- Requisito metodológico: FAM-DEV-001 / OC-04-v1.1
-- Rastreamento: DATA/FAM016, TEST/FAM016-REMOTE

-- Nota: este script não deve ser convertido em migration de alteração.
-- Ele é um artefato de conferência pós-implantação.
