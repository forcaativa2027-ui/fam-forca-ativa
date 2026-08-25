-- FAM012 — INFO Trilhas 6 a 11 (restantes)
-- 6: Violência sexual | 7: Crianças e adolescentes | 8: Pessoa idosa
-- 9: Mulher com deficiência | 10: Violência digital | 11: Minha privacidade também é um direito

-- Trilhas 6-11
insert into public.knowledge_tracks (slug, title, description, sort_order) values
  ('violencia-sexual', 'Violência sexual', 'Entender, reconhecer direitos, atendimento, possibilidades e fontes oficiais. Sem revitimização.', 6),
  ('criancas-adolescentes', 'Crianças e adolescentes', 'Proteção integral, Conselho Tutelar, escuta especializada e depoimento especial (Lei 13.431/2017).', 7),
  ('pessoa-idosa', 'Pessoa idosa', 'Direitos, negligência, violência física/psicológica, patrimonial, abandono e canais.', 8),
  ('mulher-com-deficiencia', 'Mulher com deficiência', 'Igualdade, acessibilidade, autonomia, barreiras e acesso à rede (Lei Brasileira de Inclusão).', 9),
  ('violencia-digital', 'Violência digital', 'Perseguição digital, invasão, exposição, golpes e preservação de registros.', 10),
  ('minha-privacidade-tambem-e-direito', 'Minha privacidade também é um direito', 'LGPD e ANPD: o que é dado pessoal/sensível, por que protegemos, retenção e direitos.', 11)
on conflict (slug) do nothing;

-- Conteúdos Trilha 6: Violência sexual (3)
insert into public.knowledge_contents (slug, title, summary, content, level, topic_id, estimated_minutes, status, published_at) values
  ('vs-entenda', 'Entenda em 2 min: o que é violência sexual?', 'Qualquer ato sexual sem consentimento, coerção ou aproveitamento de vulnerabilidade.', 'Violência sexual não se resume a força física. Inclui coerção, ameaça, chantagem emocional, impedir anticoncepção, forçar gravidez/aborto. Você não precisa narrar detalhes para receber orientação. O foco inicial é segurança e saúde. Fonte: Lei Maria da Penha art. 7º, III + Guia Saúde 2025.', 'entenda_2min', (select id from public.knowledge_topics where slug='violencia-sexual'), 2, 'published', now()),
  ('vs-direitos-atendimento', 'Seus direitos e onde buscar atendimento', 'Saúde em até 72h, profilaxia, rede de proteção, sem exigir boletim para atendimento.', 'Direitos: atendimento de saúde humanizado, profilaxia IST/gravidez, apoio psicológico, registro se desejar. Onde: hospital/UPA com protocolo, DEAM, Defensoria. Não precisa levar prova. Leve documento e, se quiser, acompanhante de confiança.', 'aprenda', (select id from public.knowledge_topics where slug='violencia-sexual'), 7, 'published', now()),
  ('vs-fonte-oficial', 'Fonte oficial: atendimento à violência sexual', 'Protocolos e guias governamentais.', 'Documento oficial: Guia Prático de Cuidado à Mulher em Situação de Violência (MS 2025) — capítulo violência sexual, e cartilhas do Ministério das Mulheres. Links oficiais, data e versão.', 'fonte_oficial', (select id from public.knowledge_topics where slug='violencia-sexual'), 12, 'published', now())
on conflict (slug) do nothing;

-- Trilha 7: Crianças e adolescentes (3)
insert into public.knowledge_contents (slug, title, summary, content, level, topic_id, estimated_minutes, status, published_at) values
  ('ca-entenda', 'Entenda em 2 min: proteção integral', 'Toda criança/adolescente tem direito a proteção contra violência e revitimização.', 'Lei 13.431/2017: criança/adolescente vítima/testemunha tem direito a escuta especializada (rede de proteção) limitada ao necessário e depoimento especial (polícia/justiça) sem repetição. O papel da FAM é acolher revelação espontânea sem interrogar e encaminhar à rede.', 'entenda_2min', (select id from public.knowledge_topics where slug='criancas-adolescentes'), 2, 'published', now()),
  ('ca-conselho-tutelar', 'Conselho Tutelar e escuta especializada', 'Quando e como acionar, sem transformar família em investigadora.', 'Aprenda: fluxo — revelação → acolher → não pressionar → registrar mínimo → Conselho Tutelar/autoridade → Ministério Público é comunicado. Perguntas proibidas: “conte tudo, onde, quando, quantas vezes?”. Pergunta permitida: “há criança em risco agora?”', 'aprenda', (select id from public.knowledge_topics where slug='criancas-adolescentes'), 6, 'published', now()),
  ('ca-fonte-13431', 'Fonte oficial: Lei 13.431/2017', 'Texto integral e guia de implementação.', 'Link oficial Planalto + guia CNJ de escuta especializada, última verificação e status current.', 'fonte_oficial', (select id from public.knowledge_topics where slug='criancas-adolescentes'), 14, 'published', now())
on conflict (slug) do nothing;

-- Trilha 8: Pessoa idosa (3)
insert into public.knowledge_contents (slug, title, summary, content, level, topic_id, estimated_minutes, status, published_at) values
  ('idosa-entenda', 'Entenda em 2 min: violência contra pessoa idosa', 'Negligência, violência física/psicológica, abuso financeiro, abandono.', 'Estatuto da Pessoa Idosa (10.741/2003): é dever de todos prevenir ameaça/violação. Tipos: física, psicológica, negligência (falta de cuidado), patrimonial (recolher cartão/senha), abandono. Idade não presume incapacidade.', 'entenda_2min', (select id from public.knowledge_topics where slug='pessoa-idosa'), 2, 'published', now()),
  ('idosa-autonomia', 'Autonomia e pedido de ajuda', 'A pessoa idosa decide; apoio não é tutela automática.', 'A plataforma não deve presumir que familiar/cuidador decide pela idosa. Oferecer ajuda para preencher ≠ autorizar acesso aos dados. Linguagem simples, fonte ampliada, sem cronômetro. Pergunta operacional: “há pessoa idosa em risco? há perigo agora?”', 'aprenda', (select id from public.knowledge_topics where slug='pessoa-idosa'), 6, 'published', now()),
  ('idosa-fonte-estatuto', 'Fonte oficial: Estatuto da Pessoa Idosa', 'Texto e canais Disque 100, Ligue 180.', 'Link oficial + notificação compulsória em serviços de saúde vs papel da FAM (não é serviço de saúde). Última verificação.', 'fonte_oficial', (select id from public.knowledge_topics where slug='pessoa-idosa'), 12, 'published', now())
on conflict (slug) do nothing;

-- Trilha 9: Mulher com deficiência (3)
insert into public.knowledge_contents (slug, title, summary, content, level, topic_id, estimated_minutes, status, published_at) values
  ('pcd-entenda', 'Entenda em 2 min: igualdade e acessibilidade', 'Lei Brasileira de Inclusão garante autonomia, adaptações razoáveis e proteção.', 'LBI 13.146/2015: igualdade de oportunidades, não discriminação, recusa de adaptação é violação. Pessoas com necessidades complexas de comunicação têm direito a recursos alternativos/aumentativos (Lei 15.249/2025).', 'entenda_2min', (select id from public.knowledge_topics where slug='mulher-deficiencia'), 2, 'published', now()),
  ('pcd-acessibilidade', 'Acessibilidade na prática', 'Leitor de tela, teclado, contraste, legendas, tempo estendido.', 'Requisitos: linguagem simples, foco visível, navegação teclado, leitor de tela, contraste, textos alternativos, legendas, tempo suficiente, comunicação alternativa quando aplicável. Apoio de pessoa de confiança ≠ autorização irrestrita.', 'aprenda', (select id from public.knowledge_topics where slug='mulher-deficiencia'), 6, 'published', now()),
  ('pcd-fonte-lbi', 'Fonte oficial: LBI e comunicação alternativa', 'Lei 13.146/2015 + 15.249/2025.', 'Links oficiais, versão e verificação.', 'fonte_oficial', (select id from public.knowledge_topics where slug='mulher-deficiencia'), 10, 'published', now())
on conflict (slug) do nothing;

-- Trilha 10: Violência digital (3)
insert into public.knowledge_contents (slug, title, summary, content, level, topic_id, estimated_minutes, status, published_at) values
  ('digital-entenda', 'Entenda em 2 min: violência digital', 'Quando tecnologia vira meio de controle, ameaça ou exposição.', 'Tipos: perseguição online, invasão de contas, exposição íntima, ameaça por mensagem, golpes com dados. Não apague conversas antes de orientação — prints com data/hora ajudam. Fortaleça senhas, MFA, verifique sessões ativas.', 'entenda_2min', (select id from public.knowledge_topics where slug='violencia-digital'), 2, 'published', now()),
  ('digital-preservar', 'Como preservar registros com segurança', 'Prints, metadados, backup e por que não confrontar.', 'Aprenda: como fazer captura com data/hora, guardar original + hash, não alterar, não confrontar agressor, registrar boletim se desejar. Links não públicos para anexos (storage privado, URL temporária).', 'aprenda', (select id from public.knowledge_topics where slug='violencia-digital'), 7, 'published', now()),
  ('digital-fonte-marco', 'Fonte oficial: Marco Civil e LGPD', 'Direitos na internet e proteção de dados.', 'Links oficiais, ANPD orientações de segurança.', 'fonte_oficial', (select id from public.knowledge_topics where slug='violencia-digital'), 8, 'published', now())
on conflict (slug) do nothing;

-- Trilha 11: Privacidade (3)
insert into public.knowledge_contents (slug, title, summary, content, level, topic_id, estimated_minutes, status, published_at) values
  ('privacidade-o-que-e-dado', 'O que é dado pessoal e sensível?', 'Dado pessoal identifica você; sensível revela saúde, vida sexual, etc., e tem proteção reforçada.', 'LGPD: dado pessoal (nome, CPF) vs sensível (saúde, vida sexual, biometria) — hipótese específica para tratar (consentimento destacado, proteção da vida, tutela da saúde). Por que a FAM coleta só o necessário e vincula a finalidade.', 'entenda_2min', (select id from public.knowledge_topics where slug='privacidade'), 3, 'published', now()),
  ('privacidade-por-que-protegemos', 'Por que a FAM protege suas informações?', 'Acesso restrito por função/necessidade, sem acesso por cargo.', 'Quem pode acessar: atendente ativo apenas casos atribuídos, supervisora, profissional conforme escopo. Quem não pode: direção/voluntário/associado/TI por padrão (JUR-05). Toda visualização gera auditoria. Dados não vão para logs/URL/push.', 'aprenda', (select id from public.knowledge_topics where slug='privacidade'), 6, 'published', now()),
  ('privacidade-fonte-lgpd', 'Fonte oficial: LGPD e ANPD', 'Lei 13.709/2018 + guias ANPD.', 'Links oficiais, direitos (acesso, correção, eliminação), retenção por finalidade e relatório de impacto. Última verificação.', 'fonte_oficial', (select id from public.knowledge_topics where slug='privacidade'), 10, 'published', now())
on conflict (slug) do nothing;

-- Vincular todas (ordem fixa por lista)
-- Trilha 6
insert into public.knowledge_track_items (track_id, content_id, position)
  select t.id, c.id, row_number() over (order by array_position(array['vs-entenda','vs-direitos-atendimento','vs-fonte-oficial'], c.slug))
  from public.knowledge_tracks t, public.knowledge_contents c where t.slug='violencia-sexual' and c.slug in ('vs-entenda','vs-direitos-atendimento','vs-fonte-oficial')
on conflict (track_id, content_id) do nothing;
-- Trilha 7
insert into public.knowledge_track_items (track_id, content_id, position)
  select t.id, c.id, row_number() over (order by array_position(array['ca-entenda','ca-conselho-tutelar','ca-fonte-13431'], c.slug))
  from public.knowledge_tracks t, public.knowledge_contents c where t.slug='criancas-adolescentes' and c.slug in ('ca-entenda','ca-conselho-tutelar','ca-fonte-13431')
on conflict (track_id, content_id) do nothing;
-- Trilha 8
insert into public.knowledge_track_items (track_id, content_id, position)
  select t.id, c.id, row_number() over (order by array_position(array['idosa-entenda','idosa-autonomia','idosa-fonte-estatuto'], c.slug))
  from public.knowledge_tracks t, public.knowledge_contents c where t.slug='pessoa-idosa' and c.slug in ('idosa-entenda','idosa-autonomia','idosa-fonte-estatuto')
on conflict (track_id, content_id) do nothing;
-- Trilha 9
insert into public.knowledge_track_items (track_id, content_id, position)
  select t.id, c.id, row_number() over (order by array_position(array['pcd-entenda','pcd-acessibilidade','pcd-fonte-lbi'], c.slug))
  from public.knowledge_tracks t, public.knowledge_contents c where t.slug='mulher-com-deficiencia' and c.slug in ('pcd-entenda','pcd-acessibilidade','pcd-fonte-lbi')
on conflict (track_id, content_id) do nothing;
-- Trilha 10
insert into public.knowledge_track_items (track_id, content_id, position)
  select t.id, c.id, row_number() over (order by array_position(array['digital-entenda','digital-preservar','digital-fonte-marco'], c.slug))
  from public.knowledge_tracks t, public.knowledge_contents c where t.slug='violencia-digital' and c.slug in ('digital-entenda','digital-preservar','digital-fonte-marco')
on conflict (track_id, content_id) do nothing;
-- Trilha 11
insert into public.knowledge_track_items (track_id, content_id, position)
  select t.id, c.id, row_number() over (order by array_position(array['privacidade-o-que-e-dado','privacidade-por-que-protegemos','privacidade-fonte-lgpd'], c.slug))
  from public.knowledge_tracks t, public.knowledge_contents c where t.slug='minha-privacidade-tambem-e-direito' and c.slug in ('privacidade-o-que-e-dado','privacidade-por-que-protegemos','privacidade-fonte-lgpd')
on conflict (track_id, content_id) do nothing;

-- Fontes vinculadas (exemplos)
insert into public.knowledge_content_sources (content_id, source_id, is_primary) select c.id, s.id, true from public.knowledge_contents c, public.knowledge_sources s where c.slug='vs-fonte-oficial' and s.title like '%Saúde%' on conflict do nothing;
insert into public.knowledge_content_sources (content_id, source_id, is_primary) select c.id, s.id, true from public.knowledge_contents c, public.knowledge_sources s where c.slug='ca-fonte-13431' and s.title like '%13.431%' on conflict do nothing;
insert into public.knowledge_content_sources (content_id, source_id, is_primary) select c.id, s.id, true from public.knowledge_contents c, public.knowledge_sources s where c.slug='idosa-fonte-estatuto' and s.title like '%Idosa%' on conflict do nothing;
insert into public.knowledge_content_sources (content_id, source_id, is_primary) select c.id, s.id, true from public.knowledge_contents c, public.knowledge_sources s where c.slug='pcd-fonte-lbi' and s.title like '%Inclusão%' on conflict do nothing;
insert into public.knowledge_content_sources (content_id, source_id, is_primary) select c.id, s.id, true from public.knowledge_contents c, public.knowledge_sources s where c.slug='privacidade-fonte-lgpd' and s.title like '%LGPD%' on conflict do nothing;

