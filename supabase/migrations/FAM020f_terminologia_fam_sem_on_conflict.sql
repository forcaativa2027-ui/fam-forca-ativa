-- FAM020f — Terminologia FAM sem ON CONFLICT incompatível
-- Tenant: FAM-Samambaia-DF
-- church_id: 3f440664-450c-45f8-ae6e-6ccef31f2993
-- Não apaga dados e pode ser executado novamente.

do $$
declare v_fam_id uuid := '3f440664-450c-45f8-ae6e-6ccef31f2993';
declare r record;
begin
  for r in
    select * from (values
      ('event', 'Evento'),
      ('events', 'Eventos'),
      ('meeting', 'Reunião'),
      ('meetings', 'Reuniões'),
      ('service', 'Reunião'),
      ('services', 'Reuniões'),
      ('communion', 'Evento'),
      ('church', 'Parceiros'),
      ('community', 'Comunicação'),
      ('discipleship', 'Acompanhamento'),
      ('life_group', 'Grupo'),
      ('evangelism_group', 'Grupo de Voluntários'),
      ('member_id', 'Membro ID')
    ) as x(concept_key, label)
  loop
    update public.org_terminology
    set label = r.label, updated_at = now()
    where church_id = v_fam_id
      and concept_key = r.concept_key;

    if not found then
      insert into public.org_terminology (church_id, concept_key, label)
      values (v_fam_id, r.concept_key, r.label);
    end if;
  end loop;
end $$;

select church_id, concept_key, label
from public.org_terminology
where church_id = '3f440664-450c-45f8-ae6e-6ccef31f2993'
order by concept_key;
