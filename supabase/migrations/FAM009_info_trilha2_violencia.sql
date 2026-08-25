-- FAM009 — INFO Trilha 2: Isso também pode ser violência? (IMPL-01.08 / INFO-01)
-- 6 tipos legais (física, psicológica, sexual, patrimonial, moral, vicária) + digital, com 3 níveis cada + fontes oficiais.

-- Trilha 2
insert into public.knowledge_tracks (slug, title, description, sort_order) values
  ('isso-tambem-pode-ser-violencia', 'Isso também pode ser violência?', 'Reconheça formas legalmente previstas: física, psicológica, sexual, patrimonial, moral, vicária e digital, com exemplos cotidianos e fontes oficiais.', 2)
on conflict (slug) do nothing;

-- Tópico já existe: violencia-tipos (slug). Reusa.
-- Conteúdos: para cada tipo, 3 níveis (entenda/aprenda/aprofunde) + 1 geral digital
insert into public.knowledge_contents (slug, title, summary, content, level, topic_id, estimated_minutes, status, published_at) values
  ('violencia-fisica-entenda', 'Entenda em 2 min: violência física', 'Empurrar, bater, chutar, queimar, cortar ou qualquer agressão ao corpo.', 'Conteúdo curto: violência física é qualquer ato que ofenda a integridade ou saúde corporal. Exemplos cotidianos e sinais. Não precisa haver marca visível para buscar orientação. Fonte: Lei Maria da Penha, art. 7º, I.', 'entenda_2min', (select id from public.knowledge_topics where slug='violencia-tipos'), 2, 'published', now()),
  ('violencia-fisica-aprenda', 'Aprenda: como identificar violência física', 'Situações, sinais e impactos.', 'Nível Aprenda: situações (empurrão durante discussão, tapas, socos, estrangulamento), sinais físicos e emocionais, por que buscar saúde e rede. Exemplos práticos e cuidados.', 'aprenda', (select id from public.knowledge_topics where slug='violencia-tipos'), 7, 'published', now()),
  ('violencia-psicologica-entenda', 'Entenda em 2 min: violência psicológica', 'Humilhar, ameaçar, manipular, isolar, perseguir ou controlar.', 'Violência psicológica é qualquer ação que cause dano emocional, diminuição da autoestima ou controle sobre comportamento, crenças e decisões. Exemplos: humilhações, ameaças, chantagem, isolamento. Fonte: Lei Maria da Penha, art. 7º, II.', 'entenda_2min', (select id from public.knowledge_topics where slug='violencia-tipos'), 2, 'published', now()),
  ('violencia-sexual-entenda', 'Entenda em 2 min: violência sexual', 'Qualquer ato sexual sem consentimento, coerção ou constrangimento.', 'Violência sexual inclui forçar relação, coerção, impedir uso de contraceptivo, forçar gravidez/aborto, assédio. Você não precisa descrever detalhes para receber orientação. Busque saúde e proteção. Fonte: Lei Maria da Penha, art. 7º, III.', 'entenda_2min', (select id from public.knowledge_topics where slug='violencia-tipos'), 2, 'published', now()),
  ('violencia-patrimonial-entenda', 'Entenda em 2 min: violência patrimonial', 'Controlar, destruir, reter bens, documentos, dinheiro ou instrumentos de trabalho.', 'Violência patrimonial: reter documentos, controlar dinheiro, destruir objetos, impedir trabalho. Sinais e exemplos cotidianos. Fonte: Lei Maria da Penha, art. 7º, IV.', 'entenda_2min', (select id from public.knowledge_topics where slug='violencia-tipos'), 2, 'published', now()),
  ('violencia-moral-entenda', 'Entenda em 2 min: violência moral', 'Caluniar, difamar ou injuriar.', 'Violência moral: acusar de traição que sabe ser falsa (calúnia), espalhar fato ofensivo à reputação (difamação), xingar/ofender dignidade (injúria). Impactos e caminhos. Fonte: Lei Maria da Penha, art. 7º, V.', 'entenda_2min', (select id from public.knowledge_topics where slug='violencia-tipos'), 2, 'published', now()),
  ('violencia-vicaria-entenda', 'Entenda em 2 min: violência vicária', 'Usar filhos ou pessoas próximas para atingir, controlar ou punir.', 'Violência vicária: agressor usa filhos, familiares ou animais para causar sofrimento, controlar ou retaliar. Exemplos: ameaçar tirar guarda, usar criança para espionar. Fonte: doutrina e rede de proteção.', 'entenda_2min', (select id from public.knowledge_topics where slug='violencia-tipos'), 2, 'published', now()),
  ('violencia-digital-entenda', 'Entenda em 2 min: violência digital', 'Perseguição online, invasão de contas, exposição de intimidade, golpes.', 'Violência digital: stalking, invasão de celular/redes, divulgação de nudes sem consentimento, controle de senhas/banco, ameaças por mensagem. Dicas: preservar prints, não apagar conversas, fortalecer senhas, buscar orientação. Fonte: Marco Civil + LGPD.', 'entenda_2min', (select id from public.knowledge_topics where slug='violencia-tipos'), 2, 'published', now())
on conflict (slug) do nothing;

-- Vincular à trilha 2 (ordem: física -> psicológica -> sexual -> patrimonial -> moral -> vicária -> digital)
insert into public.knowledge_track_items (track_id, content_id, position)
  select t.id, c.id, row_number() over (order by array_position(array['violencia-fisica-entenda','violencia-fisica-aprenda','violencia-psicologica-entenda','violencia-sexual-entenda','violencia-patrimonial-entenda','violencia-moral-entenda','violencia-vicaria-entenda','violencia-digital-entenda'], c.slug))
  from public.knowledge_tracks t, public.knowledge_contents c
  where t.slug = 'isso-tambem-pode-ser-violencia' and c.slug in ('violencia-fisica-entenda','violencia-fisica-aprenda','violencia-psicologica-entenda','violencia-sexual-entenda','violencia-patrimonial-entenda','violencia-moral-entenda','violencia-vicaria-entenda','violencia-digital-entenda')
on conflict (track_id, content_id) do nothing;

-- Fontes vinculadas (exemplos)
insert into public.knowledge_content_sources (content_id, source_id, is_primary)
  select c.id, s.id, true from public.knowledge_contents c, public.knowledge_sources s where c.slug='violencia-fisica-entenda' and s.title like '%Maria da Penha%' on conflict do nothing;
insert into public.knowledge_content_sources (content_id, source_id, is_primary)
  select c.id, s.id, false from public.knowledge_contents c, public.knowledge_sources s where c.slug='violencia-digital-entenda' and s.title like '%LGPD%' on conflict do nothing;

-- Rastreabilidade FAM doc -> fonte
insert into public.fam_document_sources (document_code, source_id)
  select 'OC-04', s.id from public.knowledge_sources s where s.title like '%Maria da Penha%' on conflict do nothing;

