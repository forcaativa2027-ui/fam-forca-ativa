-- FAM020e — Terminologia específica da FAM
-- Tenant confirmado: FAM-Samambaia-DF
-- church_id: 3f440664-450c-45f8-ae6e-6ccef31f2993
-- Não altera defaults globais nem registros da CEC.

insert into public.org_terminology (church_id, concept_key, label)
values
  ('3f440664-450c-45f8-ae6e-6ccef31f2993', 'event', 'Evento'),
  ('3f440664-450c-45f8-ae6e-6ccef31f2993', 'events', 'Eventos'),
  ('3f440664-450c-45f8-ae6e-6ccef31f2993', 'meeting', 'Reunião'),
  ('3f440664-450c-45f8-ae6e-6ccef31f2993', 'meetings', 'Reuniões'),
  ('3f440664-450c-45f8-ae6e-6ccef31f2993', 'service', 'Reunião'),
  ('3f440664-450c-45f8-ae6e-6ccef31f2993', 'services', 'Reuniões'),
  ('3f440664-450c-45f8-ae6e-6ccef31f2993', 'communion', 'Evento'),
  ('3f440664-450c-45f8-ae6e-6ccef31f2993', 'church', 'Parceiros'),
  ('3f440664-450c-45f8-ae6e-6ccef31f2993', 'community', 'Comunicação'),
  ('3f440664-450c-45f8-ae6e-6ccef31f2993', 'discipleship', 'Acompanhamento'),
  ('3f440664-450c-45f8-ae6e-6ccef31f2993', 'life_group', 'Grupo'),
  ('3f440664-450c-45f8-ae6e-6ccef31f2993', 'evangelism_group', 'Grupo de Voluntários'),
  ('3f440664-450c-45f8-ae6e-6ccef31f2993', 'member_id', 'Membro ID')
on conflict (church_id, concept_key) do update
set label = excluded.label, updated_at = now();

select church_id, concept_key, label
from public.org_terminology
where church_id = '3f440664-450c-45f8-ae6e-6ccef31f2993'
order by concept_key;
