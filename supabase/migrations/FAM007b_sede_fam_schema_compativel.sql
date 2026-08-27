-- FAM007b — Cadastro compatível da sede FAM-Samambaia-DF
-- Não usa short_description, pois essa coluna não existe no schema remoto.
-- Não apaga registros; apenas garante a existência e activação da sede FAM.

insert into public.churches (
  name,
  type,
  parent_id,
  slug,
  city,
  state,
  is_active
)
select
  'FAM-Samambaia-DF',
  'sede',
  null,
  'fam-samambaia-df',
  'Samambaia',
  'DF',
  true
where not exists (
  select 1
  from public.churches
  where slug = 'fam-samambaia-df'
);

update public.churches
set
  name = 'FAM-Samambaia-DF',
  type = 'sede',
  city = 'Samambaia',
  state = 'DF',
  is_active = true
where slug = 'fam-samambaia-df';

select
  id,
  name,
  type,
  city,
  state,
  slug,
  is_active
from public.churches
where slug = 'fam-samambaia-df';
