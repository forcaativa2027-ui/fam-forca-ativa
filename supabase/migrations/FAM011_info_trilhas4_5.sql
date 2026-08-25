-- FAM011 — INFO Trilhas 4 e 5
-- 4: Reconhecendo sinais de risco (FONAR) — integração pedagógica com Mapa
-- 5: Conhecendo a rede de proteção (OC-01 / OC-03) — reaproveita organizations/services

-- Trilha 4
insert into public.knowledge_tracks (slug, title, description, sort_order) values
  ('reconhecendo-sinais-de-risco', 'Reconhecendo sinais de risco', 'Aprenda a identificar sinais de atenção sem confundir com diagnóstico. Baseado no Guia FONAR e nas situações AR-01..AR-20 do Mapa.', 4)
on conflict (slug) do nothing;

-- Trilha 5
insert into public.knowledge_tracks (slug, title, description, sort_order) values
  ('conhecendo-a-rede-de-protecao', 'Conhecendo a rede de proteção', 'O que faz cada instituição (saúde, assistência, segurança, justiça) e quando procurar. Mesma base de organizations/services do encaminhamento.', 5)
on conflict (slug) do nothing;

-- Conteúdos Trilha 4 (4)
insert into public.knowledge_contents (slug, title, summary, content, level, topic_id, estimated_minutes, status, published_at) values
  ('sinais-risco-entenda', 'Entenda em 2 min: o que são sinais de risco?', 'Sinais são indicações que merecem atenção, não prova de crime.', 'Sinais de risco são combinações de respostas (ex: AR-07=sim + AR-08=sim = possível urgência) que o Motor classifica como atenção imediata/relevante. Não é score criminal. Cada sinal tem peso e prioridade. Exemplo: estrangulamento tem peso 10 e prioridade 100.', 'entenda_2min', (select id from public.knowledge_topics where slug='sinais-risco'), 2, 'published', now()),
  ('sinais-risco-ameacas', 'Ameaças, perseguição e controle', 'Tipos: ameaça de morte, perseguição (stalking), controle coercitivo.', 'Aprofunde: como identificar ameaças verbais, perseguição presencial/digital, controle de rotina, ciúme extremo, monitoramento de celular. Sinais AR-06, AR-09, AR-18, AR-20. Quando juntam, formam padrão de controle. Fonte: OC-04 R-06..R-09 + FONAR.', 'aprenda', (select id from public.knowledge_topics where slug='sinais-risco'), 7, 'published', now()),
  ('sinais-risco-escalada', 'A escalada da violência', 'A violência tende a aumentar em frequência e gravidade sem intervenção.', 'Padrão: tensão → explosão → lua de mel → repetição. Cada ciclo tende a ser mais grave. Por que é importante registrar mesmo sem prova material. Como romper ciclo com rede.', 'aprenda', (select id from public.knowledge_topics where slug='sinais-risco'), 6, 'published', now()),
  ('sinais-risco-armas', 'Armas, estrangulamento e risco letal', 'Acesso a arma + estrangulamento = indicadores de risco letal alto segundo FONAR.', 'Aprofunde: AR-03 (arma) + AR-07 (estrangulamento) + AR-08 (ameaça de morte). Estudos associam estrangulamento a risco 7x maior de feminicídio. Nunca confronte por arma. Priorize saída segura e 190. Fonte: Guia FONAR + OC-04.', 'aprofunde', (select id from public.knowledge_topics where slug='sinais-risco'), 8, 'published', now())
on conflict (slug) do nothing;

-- Conteúdos Trilha 5 (3)
insert into public.knowledge_contents (slug, title, summary, content, level, topic_id, estimated_minutes, status, published_at) values
  ('rede-o-que-e-cras', 'O que faz o CRAS e quando procurar?', 'Centro de Referência de Assistência Social: acolhe, orienta, encaminha, não investiga.', 'CRAS oferece proteção básica, acompanhamento familiar, benefícios (BPC, Bolsa), grupos. Quando procurar: vulnerabilidade social, necessidade de apoio socioassistencial, sem emergência policial. Onde encontrar: mapa da rede + telefone local. Não leva histórico completo — só o necessário.', 'aprenda', (select id from public.knowledge_topics where slug='rede-protecao'), 5, 'published', now()),
  ('rede-deam-delegacia', 'DEAM e Delegacia: quando e como registrar', 'Delegacia da Mulher registra ocorrência e solicita medidas protetivas em até 48h.', 'Diferença DEAM (especializada) vs delegacia comum, horários, documentos, sem advogado necessário, descumprimento é crime, tempo médio e o que esperar. Link para OC-01 e OC-03.', 'aprenda', (select id from public.knowledge_topics where slug='rede-protecao'), 6, 'published', now()),
  ('rede-fluxo-integrado', 'Fluxo integrado: saúde → assistência → segurança → justiça', 'Como os órgãos conversam e por que não precisa contar tudo várias vezes.', 'Fluxo FAM: saúde notifica, assistência apoia, segurança investiga, justiça decide, MP fiscaliza, Defensoria defende. A FAM conecta, não substitui. Evita revitimização ao limitar repetição de relato (Lei 13.431/2017).', 'aprofunde', (select id from public.knowledge_topics where slug='rede-protecao'), 9, 'published', now())
on conflict (slug) do nothing;

-- Vincular Trilha 4
insert into public.knowledge_track_items (track_id, content_id, position)
  select t.id, c.id, row_number() over (order by array_position(array['sinais-risco-entenda','sinais-risco-ameacas','sinais-risco-escalada','sinais-risco-armas'], c.slug))
  from public.knowledge_tracks t, public.knowledge_contents c
  where t.slug = 'reconhecendo-sinais-de-risco' and c.slug in ('sinais-risco-entenda','sinais-risco-ameacas','sinais-risco-escalada','sinais-risco-armas')
on conflict (track_id, content_id) do nothing;

-- Vincular Trilha 5
insert into public.knowledge_track_items (track_id, content_id, position)
  select t.id, c.id, row_number() over (order by array_position(array['rede-o-que-e-cras','rede-deam-delegacia','rede-fluxo-integrado'], c.slug))
  from public.knowledge_tracks t, public.knowledge_contents c
  where t.slug = 'conhecendo-a-rede-de-protecao' and c.slug in ('rede-o-que-e-cras','rede-deam-delegacia','rede-fluxo-integrado')
on conflict (track_id, content_id) do nothing;

-- Fontes
insert into public.knowledge_content_sources (content_id, source_id, is_primary)
  select c.id, s.id, true from public.knowledge_contents c, public.knowledge_sources s where c.slug='sinais-risco-armas' and s.title like '%FONAR%' on conflict do nothing;
insert into public.knowledge_content_sources (content_id, source_id, is_primary)
  select c.id, s.id, true from public.knowledge_contents c, public.knowledge_sources s where c.slug='rede-fluxo-integrado' and s.title like '%Viver sem Violência%' on conflict do nothing;

-- Rastreabilidade
insert into public.fam_document_sources (document_code, source_id)
  select 'OC-04', s.id from public.knowledge_sources s where s.title like '%FONAR%' on conflict do nothing;
insert into public.fam_document_sources (document_code, source_id)
  select 'OC-01', s.id from public.knowledge_sources s where s.title like '%Viver sem Violência%' on conflict do nothing;

