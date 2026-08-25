-- FAM004 — Questionário de Risco Parametrizado
-- Define perguntas versionadas, opções e regras do motor de risco.

-- 1. Tipos enumerados para questionário
do $$ begin
  create type public.fam_question_type as enum ('single_choice', 'multiple_choice', 'scale', 'boolean');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fam_question_group as enum ('initial', 'emergency', 'violence', 'context', 'health', 'children', 'assets', 'digital');
exception when duplicate_object then null; end $$;

-- 2. Questionários versionados
create table if not exists public.fam_risk_questionnaires (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  version text not null,
  name text not null,
  description text,
  methodology_version text not null,
  questionnaire_version text not null,
  text_version text not null,
  policy_version text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code, version)
);

-- 3. Perguntas parametrizadas
create table if not exists public.fam_risk_questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.fam_risk_questionnaires(id) on delete cascade,
  code text not null, -- Ex: AR-01, AR-02
  text text not null,
  explanation text,
  question_type public.fam_question_type not null default 'single_choice',
  question_group public.fam_question_group not null default 'initial',
  order_index integer not null default 0,
  is_required boolean not null default true,
  is_active boolean not null default true,
  -- Condições de exibição (JSON logic)
  display_conditions jsonb,
  -- Metadados metodológicos
  methodology_reference text,
  signal_weight numeric default 1.0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (questionnaire_id, code)
);

create index if not exists idx_fam_risk_questions_questionnaire on public.fam_risk_questions(questionnaire_id, order_index);
create index if not exists idx_fam_risk_questions_group on public.fam_risk_questions(question_group);

-- 4. Opções de resposta
create table if not exists public.fam_risk_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.fam_risk_questions(id) on delete cascade,
  value text not null, -- 'sim', 'nao', 'prefiro_nao_responder'
  label text not null,
  order_index integer not null default 0,
  -- Peso do sinal para o motor de risco
  signal_weight numeric default 1.0,
  -- Mapeamento para sinais de atenção
  signal_mapping jsonb,
  created_at timestamptz not null default now(),
  unique (question_id, value)
);

create index if not exists idx_fam_risk_question_options_question on public.fam_risk_question_options(question_id);

-- 5. Regras do motor de risco
create table if not exists public.fam_risk_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- Ex: RULE-001
  name text not null,
  description text,
  priority integer not null default 100,
  -- Condição da regra (JSON logic)
  condition jsonb not null,
  -- Ações quando regra é acionada
  actions jsonb not null,
  -- Sinais gerados
  signals jsonb,
  -- Prioridade do sinal gerado
  signal_priority integer default 0,
  -- Fluxos especiais acionados
  special_flows text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_fam_risk_rules_priority on public.fam_risk_rules(priority);

-- 6. Histórico de estados da avaliação
create table if not exists public.fam_assessment_state_history (
  id uuid primary key default gen_random_uuid(),
  risk_case_id uuid not null references public.fam_risk_cases(id) on delete cascade,
  from_state text,
  to_state text not null,
  reason_code text,
  rule_code text,
  triggered_by text, -- 'user_answer', 'rule_engine', 'manual', 'system'
  metadata jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_fam_assessment_state_history_case on public.fam_assessment_state_history(risk_case_id, occurred_at);

-- 7. Sinais de atenção gerados
create table if not exists public.fam_risk_signals (
  id uuid primary key default gen_random_uuid(),
  risk_case_id uuid not null references public.fam_risk_cases(id) on delete cascade,
  rule_code text not null,
  signal_code text not null,
  signal_name text not null,
  priority integer not null default 0,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_fam_risk_signals_case on public.fam_risk_signals(risk_case_id);

-- 8. Resultado da avaliação expandido
alter table public.fam_risk_cases
  add column if not exists methodology_version text,
  add column if not exists questionnaire_version text,
  add column if not exists text_version text,
  add column if not exists policy_version text,
  add column if not exists state text not null default 'initial',
  add column if not exists triggered_rules jsonb default '[]'::jsonb,
  add column if not exists signals jsonb default '[]'::jsonb,
  add column if not exists special_flows text[] default '{}',
  add column if not exists emergency_flag boolean not null default false,
  add column if not exists completed_at timestamptz;

-- 9. Inserir questionário base versão 1.0
insert into public.fam_risk_questionnaires (code, version, name, description, methodology_version, questionnaire_version, text_version, policy_version, is_active)
values ('AR-FAM', '1.0', 'Análise de Risco FAM', 'Questionário padrão de análise de risco FAM', '1.0', '1.0', '1.0', '1.0', true)
on conflict (code, version) do nothing;

-- 9. Inserir perguntas base (AR-01 a AR-05 + adicionais)
with q as (
  select id as questionnaire_id from public.fam_risk_questionnaires where code = 'AR-FAM' and version = '1.0'
)
insert into public.fam_risk_questions (questionnaire_id, code, text, explanation, question_type, question_group, order_index, is_required, is_active, methodology_reference, signal_weight)
select questionnaire_id, code, text, explanation, question_type::public.fam_question_type, question_group::public.fam_question_group, order_index, is_required, true, methodology_reference, signal_weight
from q
cross join (values
  -- Perguntas iniciais (AR-01 a AR-05)
  ('AR-01', 'Existe perigo ou ameaça acontecendo agora?', 'Perigo imediato significa risco de vida ou integridade física neste momento.', 'single_choice', 'emergency', 1, true, 'OC-04:AR-01', 10.0),
  ('AR-02', 'Você precisa de atendimento médico ou está ferida?', 'Ferimentos que precisam de cuidado médico imediato.', 'single_choice', 'emergency', 2, true, 'OC-04:AR-02', 9.0),
  ('AR-03', 'A pessoa que ameaça você tem acesso a arma?', 'Arma de fogo, branca ou outro objeto que possa causar ferimento grave.', 'single_choice', 'emergency', 3, true, 'OC-04:AR-03', 10.0),
  ('AR-04', 'Houve violência sexual ou coerção?', 'Qualquer ato sexual forçado ou sem consentimento.', 'single_choice', 'violence', 4, true, 'OC-04:AR-04', 10.0),
  ('AR-05', 'Há crianças ou adolescentes em situação de risco?', 'Crianças ou adolescentes expostos à violência ou em perigo.', 'single_choice', 'children', 5, true, 'OC-04:AR-05', 10.0),
  
  -- Perguntas de contexto de violência
  ('AR-06', 'A pessoa que ameaça você controla sua vida diária?', 'Controla onde vai, com quem fala, como gasta dinheiro, etc.', 'single_choice', 'violence', 6, true, 'OC-04:AR-06', 8.0),
  ('AR-07', 'A pessoa já tentou estrangular ou sufocar você?', 'Estrangulamento é um indicador de risco letal alto.', 'single_choice', 'violence', 7, true, 'OC-04:AR-07', 10.0),
  ('AR-08', 'A pessoa já ameaçou matar você ou seus filhos?', 'Ameaças de morte são indicadores graves.', 'single_choice', 'violence', 8, true, 'OC-04:AR-08', 9.0),
  ('AR-09', 'A pessoa persegue ou vigia você?', 'Perseguição (stalking) presencial ou digital.', 'single_choice', 'violence', 9, true, 'OC-04:AR-09', 7.0),
  ('AR-10', 'A pessoa controla seu dinheiro ou documentos?', 'Violência patrimonial e controle financeiro.', 'single_choice', 'assets', 10, true, 'OC-04:AR-10', 6.0),
  
  -- Perguntas de contexto familiar/social
  ('AR-11', 'Há dependência financeira da pessoa que ameaça?', 'Dependência que dificulta sair da situação.', 'single_choice', 'context', 11, true, 'OC-04:AR-11', 5.0),
  ('AR-12', 'Você tem rede de apoio (família, amigos, vizinhos)?', 'Rede de apoio facilita a saída da situação de risco.', 'single_choice', 'context', 12, false, 'OC-04:AR-12', 3.0),
  ('AR-13', 'A pessoa já quebrou objetos ou destruiu suas coisas?', 'Destruição de bens como forma de intimidação.', 'single_choice', 'violence', 13, true, 'OC-04:AR-13', 6.0),
  ('AR-14', 'A pessoa ameaça tirar seus filhos?', 'Ameaça de alienação parental ou perda de guarda.', 'single_choice', 'children', 14, true, 'OC-04:AR-14', 8.0),
  ('AR-15', 'Você tem medo de voltar para casa?', 'Medo de retornar ao ambiente de risco.', 'single_choice', 'context', 15, true, 'OC-04:AR-15', 7.0),
  
  -- Perguntas de saúde
  ('AR-16', 'Você precisou de atendimento médico por causa da violência?', 'Atendimento médico por ferimentos causados pela violência.', 'single_choice', 'health', 16, true, 'OC-04:AR-16', 8.0),
  ('AR-17', 'Você tem problemas de saúde agravados pela situação?', 'Problemas físicos ou mentais piorados pela violência.', 'single_choice', 'health', 17, false, 'OC-04:AR-17', 4.0),
  
  -- Perguntas digitais
  ('AR-18', 'A pessoa monitora seu celular ou redes sociais?', 'Monitoramento digital, invasão de privacidade.', 'single_choice', 'digital', 18, true, 'OC-04:AR-18', 6.0),
  ('AR-19', 'A pessoa ameaça divulgar fotos ou informações íntimas?', 'Ameaça de exposição não consentida (sexting, revenge porn).', 'single_choice', 'digital', 19, true, 'OC-04:AR-19', 8.0),
  ('AR-20', 'A pessoa controla suas contas bancárias ou senhas?', 'Controle financeiro e digital.', 'single_choice', 'digital', 20, true, 'OC-04:AR-20', 7.0)
) as v(code, text, explanation, question_type, question_group, order_index, is_required, methodology_reference, signal_weight)
on conflict (questionnaire_id, code) do nothing;

-- 10. Opções de resposta para perguntas single_choice (sim, não, prefiro não responder)
insert into public.fam_risk_question_options (question_id, value, label, order_index, signal_weight, signal_mapping)
select q.id, v.value, v.label, v.order_index, v.signal_weight, v.signal_mapping::jsonb
from public.fam_risk_questions q
cross join (values
  ('sim', 'Sim', 1, 1.0, '{"signal": "affirmative"}'::jsonb),
  ('nao', 'Não', 2, 0.0, '{"signal": "negative"}'::jsonb),
  ('prefiro_nao_responder', 'Prefiro não responder', 3, 0.0, '{"signal": "prefer_not_answer"}'::jsonb)
) as v(value, label, order_index, signal_weight, signal_mapping)
where q.questionnaire_id = (select id from public.fam_risk_questionnaires where code = 'AR-FAM' and version = '1.0')
on conflict (question_id, value) do nothing;

-- 11. Regras do motor de risco (exemplos baseados em OC-04)
insert into public.fam_risk_rules (code, name, description, priority, condition, actions, signals, signal_priority, special_flows) values
-- Regra de Emergência Imediata (AR-01 = sim)
('RULE-EMERGENCY-001', 'Perigo Imediato', 'Perigo ou ameaça acontecendo agora', 10,
 '{"all": [{"var": "AR-01"}, {"==": [{"var": "AR-01"}, "sim"]}]}',
 '{"set_state": "emergency", "set_emergency_flag": true, "priority_action": "show_emergency_resources"}',
 '[{"code": "SIG-EMERGENCY", "name": "Perigo Imediato", "priority": 100}]',
 100,
 '["emergency"]'),

-- Regra de Atendimento Médico Necessário (AR-02 = sim)
('RULE-MEDICAL-001', 'Atendimento Médico Necessário', 'Necessidade de atendimento médico imediato', 20,
 '{"all": [{"var": "AR-02"}, {"==": [{"var": "AR-02"}, "sim"]}]}',
 '{"add_signal": "SIG-MEDICAL", "action": "recommend_medical_care"}',
 '[{"code": "SIG-MEDICAL", "name": "Necessidade de Atendimento Médico", "priority": 90}]',
 90,
 '[]'),

-- Regra de Acesso a Arma (AR-03 = sim)
('RULE-WEAPON-001', 'Acesso a Arma', 'Agressor tem acesso a arma', 30,
 '{"all": [{"var": "AR-03"}, {"==": [{"var": "AR-03"}, "sim"]}]}',
 '{"add_signal": "SIG-WEAPON", "action": "increase_risk_level"}',
 '[{"code": "SIG-WEAPON", "name": "Acesso a Arma", "priority": 95}]',
 95,
 '[]'),

-- Regra de Violência Sexual (AR-04 = sim)
('RULE-SEXUAL-001', 'Violência Sexual', 'Violência sexual ou coerção identificada', 40,
 '{"all": [{"var": "AR-04"}, {"==": [{"var": "AR-04"}, "sim"]}]}',
 '{"set_special_flow": "sexual_violence", "add_signal": "SIG-SEXUAL", "priority_action": "specialized_support"}',
 '[{"code": "SIG-SEXUAL", "name": "Violência Sexual", "priority": 100}]',
 100,
 '["sexual_violence"]'),

-- Regra de Crianças em Risco (AR-05 = sim)
('RULE-CHILDREN-001', 'Crianças em Risco', 'Crianças ou adolescentes em situação de risco', 50,
 '{"all": [{"var": "AR-05"}, {"==": [{"var": "AR-05"}, "sim"]}]}',
 '{"set_special_flow": "children_at_risk", "add_signal": "SIG-CHILDREN", "priority_action": "child_protection_referral"}',
 '[{"code": "SIG-CHILDREN", "name": "Crianças em Risco", "priority": 95}]',
 95,
 '["children_at_risk"]'),

-- Regra de Estrangulamento (AR-07 = sim)
('RULE-STRANGULATION-001', 'Estrangulamento', 'Tentativa de estrangulamento - alto risco letal', 10,
 '{"all": [{"var": "AR-07"}, {"==": [{"var": "AR-07"}, "sim"]}]}',
 '{"set_emergency_flag": true, "add_signal": "SIG-STRANGULATION", "priority_action": "immediate_protection"}',
 '[{"code": "SIG-STRANGULATION", "name": "Estrangulamento", "priority": 100}]',
 100,
 '["emergency"]'),

-- Regra de Ameaça de Morte (AR-08 = sim)
('RULE-DEATH-THREAT-001', 'Ameaça de Morte', 'Ameaça de matar a vítima ou filhos', 20,
 '{"all": [{"var": "AR-08"}, {"==": [{"var": "AR-08"}, "sim"]}]}',
 '{"set_emergency_flag": true, "add_signal": "SIG-DEATH-THREAT", "priority_action": "immediate_protection"}',
 '[{"code": "SIG-DEATH-THREAT", "name": "Ameaça de Morte", "priority": 95}]',
 95,
 '[]'),

-- Regra de Estrangulamento + Ameaça de Morte (combinação)
('RULE-LETHAL-COMBO-001', 'Combo Letal: Estrangulamento + Ameaça de Morte', 'Combinação de estrangulamento e ameaça de morte', 5,
 '{"all": [{"var": "AR-07"}, {"==": [{"var": "AR-07"}, "sim"]}, {"var": "AR-08"}, {"==": [{"var": "AR-08"}, "sim"]}]}',
 '{"set_emergency_flag": true, "set_state": "emergency", "add_signal": "SIG-LETHAL-COMBO", "priority_action": "maximum_protection"}',
 '[{"code": "SIG-LETHAL-COMBO", "name": "Combo Letal", "priority": 100}]',
 100,
 '["emergency"]'),

-- Regra de Crianças + Violência (AR-05 + AR-04)
('RULE-CHILDREN-VIOLENCE-001', 'Crianças + Violência', 'Crianças expostas a violência sexual', 30,
 '{"all": [{"var": "AR-04"}, {"==": [{"var": "AR-04"}, "sim"]}, {"var": "AR-05"}, {"==": [{"var": "AR-05"}, "sim"]}]}',
 '{"set_special_flow": "children_sexual_violence", "add_signal": "SIG-CHILD-SEXUAL", "priority_action": "specialized_child_protection"}',
 '[{"code": "SIG-CHILD-SEXUAL", "name": "Crianças + Violência Sexual", "priority": 100}]',
 100,
 '["children_at_risk", "sexual_violence"]'),

-- Regra de Controle Extremo (AR-06 + AR-09 + AR-10 + AR-20)
('RULE-CONTROL-001', 'Controle Extremo', 'Múltiplos indicadores de controle coercitivo', 40,
 '{"any": [{"all": [{"var": "AR-06"}, {"==": [{"var": "AR-06"}, "sim"]}, {"var": "AR-09"}, {"==": [{"var": "AR-09"}, "sim"]}]}, {"all": [{"var": "AR-10"}, {"==": [{"var": "AR-10"}, "sim"]}, {"var": "AR-20"}, {"==": [{"var": "AR-20"}, "sim"]}]}]}',
 '{"add_signal": "SIG-COERCIVE-CONTROL", "action": "high_risk_coercive_control"}',
 '[{"code": "SIG-COERCIVE-CONTROL", "name": "Controle Coercitivo Extremo", "priority": 85}]',
 85,
 '[]'),

-- Regra de Emergência por Saúde (AR-02 + AR-16)
('RULE-HEALTH-EMERGENCY-001', 'Emergência de Saúde', 'Ferimento atual + histórico de atendimento médico por violência', 30,
 '{"all": [{"var": "AR-02"}, {"==": [{"var": "AR-02"}, "sim"]}, {"var": "AR-16"}, {"==": [{"var": "AR-16"}, "sim"]}]}',
 '{"set_emergency_flag": true, "add_signal": "SIG-HEALTH-EMERGENCY", "priority_action": "immediate_medical_care"}',
 '[{"code": "SIG-HEALTH-EMERGENCY", "name": "Emergência de Saúde", "priority": 95}]',
 95,
 '[]'),

-- Regra de Violência Digital (AR-18 + AR-19 + AR-20)
('RULE-DIGITAL-001', 'Violência Digital', 'Múltiplos indicadores de violência digital', 50,
 '{"any": [{"var": "AR-18"}, {"==": [{"var": "AR-18"}, "sim"]}, {"var": "AR-19"}, {"==": [{"var": "AR-19"}, "sim"]}, {"var": "AR-20"}, {"==": [{"var": "AR-20"}, "sim"]}]}',
 '{"set_special_flow": "digital_violence", "add_signal": "SIG-DIGITAL", "action": "digital_safety_plan"}',
 '[{"code": "SIG-DIGITAL", "name": "Violência Digital", "priority": 70}]',
 70,
 '["digital_violence"]'),

-- Regra de Crianças + Violência Digital
('RULE-CHILD-DIGITAL-001', 'Crianças + Digital', 'Crianças expostas a violência digital', 40,
 '{"all": [{"var": "AR-05"}, {"==": [{"var": "AR-05"}, "sim"]}, {"any": [{"var": "AR-18"}, {"==": [{"var": "AR-18"}, "sim"]}, {"var": "AR-19"}, {"==": [{"var": "AR-19"}, "sim"]}, {"var": "AR-20"}, {"==": [{"var": "AR-20"}, "sim"]}]}]}',
 '{"set_special_flow": "children_digital_violence", "add_signal": "SIG-CHILD-DIGITAL", "priority_action": "child_digital_protection"}',
 '[{"code": "SIG-CHILD-DIGITAL", "name": "Crianças + Violência Digital", "priority": 90}]',
 90,
 '["children_at_risk", "digital_violence"]');

-- 12. Índices adicionais para performance
create index if not exists idx_fam_risk_cases_state on public.fam_risk_cases(state);
create index if not exists idx_fam_risk_cases_emergency on public.fam_risk_cases(emergency_flag);
create index if not exists idx_fam_risk_cases_user_created on public.fam_risk_cases(user_id, created_at desc);

-- 13. Comentários
comment on table public.fam_risk_questionnaires is 'Questionários de risco versionados (ex: AR-FAM v1.0)';
comment on table public.fam_risk_questions is 'Perguntas parametrizadas do questionário de risco (AR-01, AR-02, etc.)';
comment on table public.fam_risk_question_options is 'Opções de resposta para cada pergunta';
comment on table public.fam_risk_rules is 'Regras do motor de risco (condição -> ação/sinal)';
comment on table public.fam_assessment_state_history is 'Histórico de transições de estado da avaliação';
comment on table public.fam_risk_signals is 'Sinais de atenção gerados pelo motor de risco';

comment on column public.fam_risk_questions.display_conditions is 'Condições JSON para exibição condicional da pergunta';
comment on column public.fam_risk_questions.signal_weight is 'Peso do sinal para cálculo de risco';
comment on column public.fam_risk_question_options.signal_mapping is 'Mapeamento da opção para sinais de atenção';
comment on column public.fam_risk_rules.condition is 'Condição JSON Logic para avaliação da regra';
comment on column public.fam_risk_rules.actions is 'Ações a executar quando regra é acionada';
comment on column public.fam_risk_rules.signals is 'Sinais gerados quando regra é acionada';
