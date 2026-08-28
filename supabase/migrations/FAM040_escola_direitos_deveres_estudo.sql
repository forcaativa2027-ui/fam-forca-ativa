-- FAM040 — Escola de Direitos e Deveres
-- Não remove ou altera conteúdo existente. Reutiliza o modelo Academy:
-- Escola -> Curso -> Módulo -> Lição -> lesson_progress.

insert into public.escolas (name, slug, description, icon_key, order_index, is_active)
values (
  'Escola de Direitos e Deveres',
  'escola_direitos_deveres',
  'Ambiente de aprendizagem sobre direitos, deveres, proteção, serviços e caminhos seguros.',
  'GraduationCap',
  7,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  icon_key = excluded.icon_key,
  is_active = excluded.is_active;

alter table public.courses add column if not exists course_code text;
create unique index if not exists courses_course_code_uidx
  on public.courses(course_code)
  where course_code is not null;

with school as (
  select id from public.escolas where slug = 'escola_direitos_deveres'
)
insert into public.courses (course_code, name, description, category, escola_id, is_active)
select * from (values
  ('FAM-DIR-TRAB', 'Direitos Trabalhistas', 'Conheça direitos, deveres, contratos, jornada, igualdade e caminhos de orientação no trabalho.', 'fam_direitos_trabalhistas', (select id from school), true),
  ('FAM-VDF-LMP', 'Violência Doméstica e Familiar', 'Aprenda sobre a Lei Maria da Penha, formas de violência, proteção, segurança e rede de atendimento.', 'fam_violencia_domestica', (select id from school), true),
  ('FAM-CON-SUP', 'Direitos do Consumidor e Superendividamento', 'Aprenda a reconhecer direitos do consumidor, compreender crédito e organizar caminhos de negociação segura.', 'fam_consumidor_superendividamento', (select id from school), true)
) as seed(course_code, name, description, category, escola_id, is_active)
where not exists (select 1 from public.courses c where c.course_code = seed.course_code);

-- Atualiza descrições do catálogo sem substituir conteúdo editorial posterior.
update public.courses c set escola_id = e.id
from public.escolas e
where c.course_code in ('FAM-DIR-TRAB','FAM-VDF-LMP','FAM-CON-SUP')
  and e.slug = 'escola_direitos_deveres';

-- Módulos e lições do primeiro recorte funcional. Conteúdo completo poderá ser enriquecido
-- pela curadoria em FamKnowledgeAdmin, mantendo a estrutura de progresso.
do $$
declare
  v_course uuid;
  v_module uuid;
  v_code text;
  v_module_name text;
  v_module_desc text;
  v_lesson_title text;
  v_lesson_objective text;
  v_lesson_body text;
  v_module_order int;
  v_lesson_order int;
  seed record;
begin
  for seed in select * from (values
    ('FAM-DIR-TRAB','Comece aqui','Como estudar, consultar fontes e reconhecer limites da informação.'),
    ('FAM-DIR-TRAB','Contrato, registro e remuneração','Informações essenciais sobre contratação, registro e pagamento.'),
    ('FAM-DIR-TRAB','Jornada, descanso e proteção','Jornada, férias, afastamentos e igualdade no trabalho.'),
    ('FAM-DIR-TRAB','Como buscar orientação','Documentos, canais e próximos passos.'),
    ('FAM-VDF-LMP','Acolhimento e segurança','Como usar o curso com segurança e sem necessidade de relatar sua história.'),
    ('FAM-VDF-LMP','Formas de violência','Violências física, psicológica, sexual, patrimonial e moral.'),
    ('FAM-VDF-LMP','Direitos e medidas protetivas','Proteção, assistência e caminhos institucionais.'),
    ('FAM-VDF-LMP','Rede de atendimento','190, Ligue 180 e serviços da rede.'),
    ('FAM-CON-SUP','Direitos da consumidora','Informação, escolha, segurança e práticas abusivas.'),
    ('FAM-CON-SUP','Crédito e custo total','Juros, encargos, parcelas e crédito responsável.'),
    ('FAM-CON-SUP','Superendividamento','Mínimo existencial, prevenção e repactuação.'),
    ('FAM-CON-SUP','Organização e negociação segura','Documentos, protocolos, Procon e Consumidor.gov.br.')
  ) as x(code, module_name, module_desc)
  loop
    select id into v_course from public.courses where course_code = seed.code limit 1;
    if v_course is null then continue; end if;
    select id into v_module from public.course_modules where course_id = v_course and name = seed.module_name limit 1;
    if v_module is null then
      select coalesce(max(order_index),0)+1 into v_module_order from public.course_modules where course_id = v_course;
      insert into public.course_modules(course_id,name,description,order_index)
      values(v_course,seed.module_name,seed.module_desc,v_module_order)
      returning id into v_module;
    end if;

    v_lesson_title := 'Entenda: ' || seed.module_name;
    if not exists (select 1 from public.course_lessons where module_id = v_module and title = v_lesson_title) then
      select coalesce(max(order_index),0)+1 into v_lesson_order from public.course_lessons where module_id = v_module;
      v_lesson_objective := 'Compreender os conceitos principais de ' || lower(seed.module_name) || ' e identificar fontes e caminhos seguros de orientação.';
      v_lesson_body := 'Conteúdo introdutório em linguagem simples sobre ' || lower(seed.module_name) || E'.\n\n\nAprofunde o tema consultando as fontes oficiais vinculadas pela curadoria da FAM. Este conteúdo é educativo e não substitui análise de um caso concreto ou atendimento profissional.';
      insert into public.course_lessons(module_id,title,objective,content_main,content_reflexao,content_pratica,order_index)
      values(v_module,v_lesson_title,v_lesson_objective,v_lesson_body,'O que você gostaria de revisar neste tema?','Consulte a fonte oficial e anote uma dúvida para levar a um serviço adequado.',v_lesson_order);
    end if;
  end loop;
end $$;

-- Cursos e progresso são privados para usuários autenticados pela RLS existente.
-- O catálogo da Escola, porém, é acessível apenas ao ambiente autenticado.
comment on column public.courses.course_code is 'Código estável de catálogo para cursos da Escola de Direitos e Deveres e futuras escolas.';


-- Monitoramento administrativo: somente indicadores agregados, sem nomes ou relatos.
create or replace function public.fam_school_monitoring_overview(p_since timestamptz default now() - interval '30 days')
returns table (
  total_courses int,
  total_modules int,
  total_lessons int,
  active_learners int,
  lessons_started int,
  lessons_completed int,
  completion_rate numeric
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_school uuid;
  v_total_lessons int;
  v_completed int;
begin
  if not public.is_admin() then raise exception 'Acesso administrativo necessário.'; end if;
  select id into v_school from public.escolas where slug = 'escola_direitos_deveres' limit 1;
  select count(*)::int into v_total_lessons
    from public.course_lessons l
    join public.course_modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    where c.escola_id = v_school and c.is_active;
  select count(*)::int into v_completed
    from public.lesson_progress lp
    join public.course_lessons l on l.id = lp.lesson_id
    join public.course_modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    where c.escola_id = v_school and c.is_active and lp.status = 'concluida' and lp.completed_at >= p_since;
  return query
  select
    (select count(*)::int from public.courses c where c.escola_id = v_school and c.is_active),
    (select count(*)::int from public.course_modules m join public.courses c on c.id = m.course_id where c.escola_id = v_school and c.is_active),
    v_total_lessons,
    (select count(distinct lp.profile_id)::int from public.lesson_progress lp join public.course_lessons l on l.id = lp.lesson_id join public.course_modules m on m.id = l.module_id join public.courses c on c.id = m.course_id where c.escola_id = v_school and c.is_active and lp.started_at >= p_since),
    (select count(*)::int from public.lesson_progress lp join public.course_lessons l on l.id = lp.lesson_id join public.course_modules m on m.id = l.module_id join public.courses c on c.id = m.course_id where c.escola_id = v_school and c.is_active and lp.started_at >= p_since),
    v_completed,
    case when v_total_lessons = 0 then 0 else round((v_completed::numeric / greatest(v_total_lessons, 1)) * 100, 1) end;
end $$;
grant execute on function public.fam_school_monitoring_overview(timestamptz) to authenticated;

create or replace function public.fam_school_monitoring_by_course(p_since timestamptz default now() - interval '30 days')
returns table (
  course_id uuid,
  course_code text,
  course_name text,
  total_lessons int,
  active_learners int,
  lessons_started int,
  lessons_completed int
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Acesso administrativo necessário.'; end if;
  return query
  select
    c.id,
    c.course_code,
    c.name,
    count(distinct l.id)::int,
    count(distinct lp.profile_id)::int,
    count(lp.id)::int,
    count(lp.id) filter (where lp.status = 'concluida')::int
  from public.courses c
  join public.escolas e on e.id = c.escola_id and e.slug = 'escola_direitos_deveres'
  left join public.course_modules m on m.course_id = c.id
  left join public.course_lessons l on l.module_id = m.id
  left join public.lesson_progress lp on lp.lesson_id = l.id and lp.started_at >= p_since
  where c.is_active
  group by c.id, c.course_code, c.name
  order by c.name;
end $$;
grant execute on function public.fam_school_monitoring_by_course(timestamptz) to authenticated;


-- Leitura segura do roteiro: nunca aceita profile_id arbitrário do cliente.
create or replace function public.fam_list_course_content(p_course_id uuid)
returns table (
  module_id uuid, module_name text, module_order int,
  lesson_id uuid, lesson_title text, lesson_order int,
  status text, completed_at timestamptz
)
language sql stable security invoker set search_path = public as $$
  select
    m.id, m.name, m.order_index,
    l.id, l.title, l.order_index,
    coalesce(lp.status, 'nao_iniciada'),
    lp.completed_at
  from public.course_modules m
  join public.course_lessons l on l.module_id = m.id
  left join public.lesson_progress lp on lp.lesson_id = l.id and lp.profile_id = auth.uid()
  join public.courses c on c.id = m.course_id
  join public.escolas e on e.id = c.escola_id and e.slug = 'escola_direitos_deveres'
  where m.course_id = p_course_id and c.is_active
  order by m.order_index, l.order_index;
$$;
grant execute on function public.fam_list_course_content(uuid) to authenticated;


create or replace function public.fam_get_course_lesson(p_lesson_id uuid)
returns table (
  id uuid, module_id uuid, title text, objective text, content_main text,
  content_reflexao text, content_pratica text, content_compartilhar text,
  video_url text, audio_url text
)
language sql stable security invoker set search_path = public as $$
  select l.id, l.module_id, l.title, l.objective, l.content_main,
         l.content_reflexao, l.content_pratica, l.content_compartilhar,
         l.video_url, l.audio_url
  from public.course_lessons l
  join public.course_modules m on m.id = l.module_id
  join public.courses c on c.id = m.course_id
  join public.escolas e on e.id = c.escola_id and e.slug = 'escola_direitos_deveres'
  where l.id = p_lesson_id and c.is_active;
$$;
grant execute on function public.fam_get_course_lesson(uuid) to authenticated;
