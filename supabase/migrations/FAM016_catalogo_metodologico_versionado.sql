-- FAM016 — Catálogo metodológico versionado
-- OC-04 v1.1 está marcado como minuta no baseline; por isso o seed fica em draft.

create table if not exists public.fam_risk_questionnaires (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'published', 'archived')),
  source_document text not null,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fam_risk_questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.fam_risk_questionnaires(id) on delete cascade,
  question_key text not null,
  question_text text not null,
  source_reference text not null,
  order_index integer not null,
  answer_options jsonb not null,
  created_at timestamptz not null default now(),
  unique (questionnaire_id, question_key),
  unique (questionnaire_id, order_index)
);

insert into public.fam_risk_questionnaires (version, status, source_document)
values ('OC-04-v1.1', 'draft', 'OC-04_Matriz_Situacoes_Risco_Respostas_v1.1.md')
on conflict (version) do nothing;

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
on conflict (questionnaire_id, question_key) do nothing;

alter table public.fam_risk_questionnaires enable row level security;
alter table public.fam_risk_questions enable row level security;

drop policy if exists fam_published_questionnaires_public_read on public.fam_risk_questionnaires;
create policy fam_published_questionnaires_public_read on public.fam_risk_questionnaires
  for select to anon, authenticated using (status = 'published');

drop policy if exists fam_published_questions_public_read on public.fam_risk_questions;
create policy fam_published_questions_public_read on public.fam_risk_questions
  for select to anon, authenticated using (
    exists (select 1 from public.fam_risk_questionnaires q where q.id = questionnaire_id and q.status = 'published')
  );
