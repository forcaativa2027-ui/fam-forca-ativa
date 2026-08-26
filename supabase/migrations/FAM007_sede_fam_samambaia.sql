-- FAM007 — Catálogo público da sede FAM-Samambaia-DF
-- Idempotente. Não altera dados privados nem apaga registros históricos.

-- As sedes abaixo foram inseridas pela migration legada FAM006 para o CEC.
-- Elas deixam de ser opções públicas no cadastro FAM, mas permanecem preservadas.
update public.churches
set is_active = false
where slug in ('manaus', 'brasilia')
  and name in ('CEC Manaus - Sede', 'CEC Brasilia');

insert into public.churches (
  name, type, parent_id, slug, address, city, state, is_active, short_description
)
select
  'FAM-Samambaia-DF', 'sede', null, 'fam-samambaia-df', null,
  'Samambaia', 'DF', true,
  'Sede atual da Força Ativa da Mulher (FAM)'
where not exists (
  select 1 from public.churches where slug = 'fam-samambaia-df'
);

update public.churches
set
  name = 'FAM-Samambaia-DF',
  type = 'sede',
  city = 'Samambaia',
  state = 'DF',
  is_active = true,
  short_description = 'Sede atual da Força Ativa da Mulher (FAM)'
where slug = 'fam-samambaia-df';

select id, name, slug, city, state, is_active
from public.churches
where slug = 'fam-samambaia-df';
