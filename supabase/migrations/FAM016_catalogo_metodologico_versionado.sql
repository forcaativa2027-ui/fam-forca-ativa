-- FAM016 — Catálogo metodológico versionado
-- Compatível com tabelas legadas já existentes no remoto.
-- OC-04 v1.1 está marcado como minuta; o seed permanece em draft.

create table if not exists public.fam_risk_questionnaires (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text,
  version text,
  text_version text,
  questionnaire_version text,
  methodology_version text,
  status text default 'draft',
  source_document text,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.fam_risk_questionnaires add column if not exists code text;
alter table public.fam_risk_questionnaires add column if not exists name text;
alter table public.fam_risk_questionnaires add column if not exists version text;
alter table public.fam_risk_questionnaires add column if not exists text_version text;
alter table public.fam_risk_questionnaires add column if not exists questionnaire_version text;
alter table public.fam_risk_questionnaires add column if not exists methodology_version text;
alter table public.fam_risk_questionnaires add column if not exists status text default 'draft';
alter table public.fam_risk_questionnaires add column if not exists source_document text;
alter table public.fam_risk_questionnaires add column if not exists approved_at timestamptz;
alter table public.fam_risk_questionnaires add column if not exists approved_by uuid;
alter table public.fam_risk_questionnaires add column if not exists created_at timestamptz default now();
alter table public.fam_risk_questionnaires add column if not exists updated_at timestamptz default now();

update public.fam_risk_questionnaires
set code = 'FAM-RISK-LEGACY-' || id::text
where code is null or btrim(code) = '';

update public.fam_risk_questionnaires
set name = 'Questionário de sinais de atenção FAM'
where name is null or btrim(name) = '';

update public.fam_risk_questionnaires
set text_version = coalesce(nullif(version, ''), 'OC-04-v1.1')
where text_version is null or btrim(text_version) = '';

update public.fam_risk_questionnaires
set questionnaire_version = coalesce(nullif(version, ''), 'OC-04-v1.1')
where questionnaire_version is null or btrim(questionnaire_version) = '';

update public.fam_risk_questionnaires
set methodology_version = coalesce(nullif(version, ''), 'OC-04-v1.1')
where methodology_version is null or btrim(methodology_version) = '';

update public.fam_risk_questionnaires
set status = 'draft'
where status is null or status not in ('draft', 'in_review', 'published', 'archived');

update public.fam_risk_questionnaires
set source_document = 'legacy-fam-risk-questionnaire'
where source_document is null or btrim(source_document) = '';

create unique index if not exists fam_risk_questionnaires_code_uidx
  on public.fam_risk_questionnaires (code)
  where code is not null;

create unique index if not exists fam_risk_questionnaires_version_uidx
  on public.fam_risk_questionnaires (version)
  where version is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'fam_risk_questionnaires_status_check'
      and conrelid = 'public.fam_risk_questionnaires'::regclass
  ) then
    alter table public.fam_risk_questionnaires
      add constraint fam_risk_questionnaires_status_check
      check (status in ('draft', 'in_review', 'published', 'archived'));
  end if;
end $$;

create table if not exists public.fam_risk_questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid,
  question_key text,
  question_text text,
  source_reference text,
  order_index integer,
  answer_options jsonb,
  created_at timestamptz default now()
);

alter table public.fam_risk_questions add column if not exists questionnaire_id uuid;
alter table public.fam_risk_questions add column if not exists question_key text;
alter table public.fam_risk_questions add column if not exists question_text text;
alter table public.fam_risk_questions add column if not exists source_reference text;
alter table public.fam_risk_questions add column if not exists order_index integer;
alter table public.fam_risk_questions add column if not exists answer_options jsonb;
alter table public.fam_risk_questions add column if not exists created_at timestamptz default now();

create unique index if not exists fam_risk_questions_question_uidx
  on public.fam_risk_questions (questionnaire_id, question_key)
  where questionnaire_id is not null and question_key is not null;

create unique index if not exists fam_risk_questions_order_uidx
  on public.fam_risk_questions (questionnaire_id, order_index)
  where questionnaire_id is not null and order_index is not null;

insert into public.fam_risk_questionnaires (code, name, version, text_version, questionnaire_version, methodology_version, status, source_document)
select 'FAM-RISK-MAP', 'Questionário de sinais de atenção FAM', 'OC-04-v1.1', 'OC-04-v1.1', 'OC-04-v1.1', 'OC-04-v1.1', 'draft', 'OC-04_Matriz_Situacoes_Risco_Respostas_v1.1.md'
where not exists (
  select 1 from public.fam_risk_questionnaires
  where version = 'OC-04-v1.1' or code = 'FAM-RISK-MAP'
);

insert into public.fam_risk_questions (questionnaire_id, question_key, question_text, source_reference, order_index, answer_options)
select q.id, v.question_key, v.question_text, v.source_reference, v.order_index,
  '[{"value":"YES","label":"Sim"},{"value":"NO","label":"Não"},{"value":"PREFER_NOT_TO_ANSWER","label":"Prefiro não responder"}]'::jsonb
from public.fam_risk_questionnaires q
cross join (values
  ('danger_now', 'Existe perigo ou ameaça acontecendo agora?', 'OC-04-v1.1/AR-01', 1),
  ('injury', 'Você precisa de atendimento médico ou está ferida?', 'OC-04-v1.1/AR-02', 2),
  ('weapon', 'A pessoa que ameaça você tem acesso a uma arma?', 'OC-04-v1.1/AR-03', 3),
  ('sexual', 'Houve violência sexual ou coerção?', 'OC-04-v1.1/AR-04', 4),
  ('children', 'Há crianças ou adolescentes em situação de risco?', 'OC-04-v1.1/AR-05', 5)
) as v(question_key, question_text, source_reference, order_index)
where q.version = 'OC-04-v1.1'
  and not exists (
    select 1 from public.fam_risk_questions x
    where x.questionnaire_id = q.id and x.question_key = v.question_key
  );

alter table public.fam_risk_questionnaires enable row level security;
alter table public.fam_risk_questions enable row level security;

drop policy if exists fam_published_questionnaires_public_read on public.fam_risk_questionnaires;
create policy fam_published_questionnaires_public_read on public.fam_risk_questionnaires
  for select to anon, authenticated using (status = 'published');

drop policy if exists fam_published_questions_public_read on public.fam_risk_questions;
create policy fam_published_questions_public_read on public.fam_risk_questions
  for select to anon, authenticated using (
    exists (
      select 1 from public.fam_risk_questionnaires q
      where q.id = questionnaire_id and q.status = 'published'
    )
  );
