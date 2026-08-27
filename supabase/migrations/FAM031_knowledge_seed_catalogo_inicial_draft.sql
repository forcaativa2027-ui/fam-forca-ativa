-- FAM031 — Catálogo inicial P7 da Jornada do Conhecimento
-- Insere referências nacionais e distritais em draft.
-- Não publica conteúdo e não altera registros existentes.
-- Revisão jurídica e aprovação institucional são obrigatórias antes de publicar.

begin;

do $$
declare
  v_admin uuid := '8ac98955-58c2-4691-ba73-efea96b86e58';
  v_content_id uuid;
begin
  insert into public.fam_knowledge_contents (
    tenant_key, content_key, content_type, title, summary, body,
    language, audience, classification, purpose, stage, status, version,
    owner_profile_id, author_profile_id, review_date
  ) values (
    'FAM',
    'legislacao-lei-maria-da-penha-001',
    'referencia',
    'Lei Maria da Penha: proteção e enfrentamento da violência doméstica',
    'Apresentação educativa da Lei nº 11.340/2006 e de sua finalidade de prevenção, assistência e proteção às mulheres.',
    'Este conteúdo apresenta, em linguagem informativa, a finalidade da Lei nº 11.340, de 7 de agosto de 2006. A lei cria mecanismos para coibir e prevenir a violência doméstica e familiar contra a mulher e estabelece medidas de assistência e proteção. Este material não substitui orientação jurídica individualizada. Consulte a fonte oficial e procure os serviços públicos competentes para orientação sobre cada situação.',
    'pt-BR', array['publico'], 'publico',
    array['informar'], array['descobrir','compreender'], 'draft', '1.0',
    v_admin, v_admin, current_date + 180
  ) on conflict (tenant_key, content_key, version) do nothing;

  insert into public.fam_knowledge_contents (
    tenant_key, content_key, content_type, title, summary, body,
    language, audience, classification, purpose, stage, status, version,
    owner_profile_id, author_profile_id, review_date
  ) values (
    'FAM',
    'servico-ligue-180-001',
    'formulario_servico',
    'Ligue 180: orientação e atendimento à mulher',
    'Informações oficiais sobre o canal nacional de orientação, denúncias e encaminhamento para a rede de atendimento.',
    'O Ligue 180 é um serviço público de utilidade pública para orientação sobre leis, direitos e serviços da rede de atendimento, além de registro e encaminhamento de denúncias. A ligação é gratuita e o serviço funciona 24 horas. Em emergência, acione a Polícia Militar pelo 190. Este conteúdo é informativo e não substitui avaliação profissional ou atendimento de emergência.',
    'pt-BR', array['publico'], 'publico',
    array['informar','orientar'], array['agir'], 'draft', '1.0',
    v_admin, v_admin, current_date + 180
  ) on conflict (tenant_key, content_key, version) do nothing;

  insert into public.fam_knowledge_contents (
    tenant_key, content_key, content_type, title, summary, body,
    language, audience, classification, purpose, stage, status, version,
    owner_profile_id, author_profile_id, review_date
  ) values (
    'FAM',
    'servico-denunciar-buscar-ajuda-001',
    'procedimento',
    'Como buscar ajuda e denunciar violência contra mulheres',
    'Orientações oficiais sobre canais de atendimento, denúncia e acompanhamento pelo Ligue 180.',
    'A Central de Atendimento à Mulher orienta sobre direitos, informa serviços especializados, registra denúncias e encaminha os relatos aos órgãos competentes. A página oficial também informa formas de acompanhamento com o número de protocolo. Verifique os canais oficiais antes de compartilhar dados pessoais e, em situação de emergência, utilize o 190.',
    'pt-BR', array['publico'], 'publico',
    array['informar','orientar'], array['compreender','agir'], 'draft', '1.0',
    v_admin, v_admin, current_date + 180
  ) on conflict (tenant_key, content_key, version) do nothing;

  insert into public.fam_knowledge_contents (
    tenant_key, content_key, content_type, title, summary, body,
    language, audience, classification, purpose, stage, status, version,
    owner_profile_id, author_profile_id, review_date
  ) values (
    'FAM',
    'legislacao-pdcv-mulher-df-001',
    'decreto',
    'Distrito Federal: Plano de Combate à Violência e de Proteção à Mulher',
    'Referência ao Decreto nº 48.878/2026 e ao PDCV-MULHER, com foco informativo na política distrital.',
    'Este conteúdo apresenta, de forma educativa, o Decreto nº 48.878, de 1º de julho de 2026, que institui o Plano Distrital de Combate à Violência e de Proteção à Mulher (PDCV-MULHER). O material resume a finalidade e a governança do plano, sem substituir o texto normativo oficial ou orientar decisões jurídicas individuais.',
    'pt-BR', array['publico'], 'publico',
    array['informar'], array['descobrir','compreender'], 'draft', '1.0',
    v_admin, v_admin, current_date + 180
  ) on conflict (tenant_key, content_key, version) do nothing;

  for v_content_id in
    select id from public.fam_knowledge_contents
    where tenant_key = 'FAM'
      and content_key in ('legislacao-lei-maria-da-penha-001','servico-ligue-180-001','servico-denunciar-buscar-ajuda-001','legislacao-pdcv-mulher-df-001')
      and version = '1.0'
  loop
    if not exists (
      select 1 from public.fam_knowledge_sources
      where tenant_key = 'FAM' and content_id = v_content_id
        and source_reference in ('Lei nº 11.340/2006','Ligue 180 — Central de Atendimento à Mulher','Denunciar e buscar ajuda a vítimas de violência contra mulheres','Decreto nº 48.878/2026 — PDCV-MULHER')
    ) then
      insert into public.fam_knowledge_sources (
        tenant_key, content_id, source_type, source_title, source_reference,
        source_url, issuing_authority, publication_date, verified_by
      )
      select
        'FAM', c.id,
        case c.content_key
          when 'legislacao-lei-maria-da-penha-001' then 'lei'
          when 'servico-ligue-180-001' then 'servico_publico'
          when 'servico-denunciar-buscar-ajuda-001' then 'servico_publico'
          else 'decreto'
        end,
        case c.content_key
          when 'legislacao-lei-maria-da-penha-001' then 'Lei nº 11.340, de 7 de agosto de 2006'
          when 'servico-ligue-180-001' then 'Ligue 180 — Central de Atendimento à Mulher'
          when 'servico-denunciar-buscar-ajuda-001' then 'Denunciar e buscar ajuda a vítimas de violência contra mulheres'
          else 'Decreto nº 48.878, de 1º de julho de 2026'
        end,
        case c.content_key
          when 'legislacao-lei-maria-da-penha-001' then 'Lei nº 11.340/2006'
          when 'servico-ligue-180-001' then 'Ligue 180 — Central de Atendimento à Mulher'
          when 'servico-denunciar-buscar-ajuda-001' then 'Denunciar e buscar ajuda a vítimas de violência contra mulheres'
          else 'Decreto nº 48.878/2026 — PDCV-MULHER'
        end,
        case c.content_key
          when 'legislacao-lei-maria-da-penha-001' then 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm'
          when 'servico-ligue-180-001' then 'https://www.gov.br/mulheres/pt-br/ligue180'
          when 'servico-denunciar-buscar-ajuda-001' then 'https://www.gov.br/pt-br/servicos/denunciar-e-buscar-ajuda-a-vitimas-de-violencia-contra-mulheres'
          else 'https://www.sinj.df.gov.br/sinj/Norma/3fcea62e0d4f4cd9af87bb69da8ca2c4/Decreto_48878_01_07_2026.html'
        end,
        case c.content_key
          when 'legislacao-lei-maria-da-penha-001' then 'Presidência da República — Planalto'
          when 'servico-ligue-180-001' then 'Ministério das Mulheres'
          when 'servico-denunciar-buscar-ajuda-001' then 'Ministério das Mulheres — Gov.br'
          else 'Sistema Integrado de Normas Jurídicas do Distrito Federal (SINJ-DF)'
        end,
        case c.content_key
          when 'legislacao-lei-maria-da-penha-001' then date '2006-08-07'
          when 'servico-ligue-180-001' then null
          when 'servico-denunciar-buscar-ajuda-001' then date '2025-12-15'
          else date '2026-07-01'
        end,
        v_admin
      from public.fam_knowledge_contents c
      where c.id = v_content_id;
    end if;
  end loop;
end $$;

commit;

select c.content_key, c.title, c.status, c.version, s.source_reference, s.source_url
from public.fam_knowledge_contents c
left join public.fam_knowledge_sources s on s.content_id = c.id and s.tenant_key = 'FAM'
where c.tenant_key = 'FAM'
  and c.content_key in ('legislacao-lei-maria-da-penha-001','servico-ligue-180-001','servico-denunciar-buscar-ajuda-001','legislacao-pdcv-mulher-df-001')
order by c.content_key;
