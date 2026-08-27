-- FAM020d — Localização segura da sede FAM
-- Consulta somente de leitura. Não altera dados.
-- Usa apenas colunas básicas da tabela churches.

select
  id,
  name,
  type,
  address,
  city,
  state,
  slug,
  is_active
from public.churches
where lower(coalesce(name, '')) like any (array[
    '%fam%',
    '%força ativa%',
    '%forca ativa%',
    '%samambaia%'
  ])
   or lower(coalesce(slug, '')) like any (array[
    '%fam%',
    '%forca-ativa%',
    '%samambaia%'
  ])
   or lower(coalesce(city, '')) like '%samambaia%'
order by is_active desc nulls last, name;
