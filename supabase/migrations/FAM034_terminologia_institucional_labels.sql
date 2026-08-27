-- ============================================================
-- FAM034 — Nomenclatura institucional parametrizável
-- ============================================================
-- A chave técnica permanece estável; apenas o label exibido é alterado.
-- Não remove registros nem altera rotas, permissões ou lógica de negócio.
-- A migration usa UPDATE + INSERT condicional porque a constraint
-- (church_id, concept_key) não torna NULL único no PostgreSQL.

-- Defaults compatíveis para tenants que ainda não possuem override.
do $$
declare
  v_row record;
begin
  for v_row in
    select * from (values
      (null::uuid, 'admin_role'::text, 'Apóstolo'::text),
      (null::uuid, 'life_group'::text, 'Grupo'::text),
      (null::uuid, 'life_group_plural'::text, 'Grupos'::text),
      (null::uuid, 'more_brand'::text, 'CEC Mais'::text),
      (null::uuid, 'member_id_brand'::text, 'CEC ID'::text)
    ) as defaults(church_id, concept_key, label)
  loop
    update public.org_terminology
       set label = v_row.label, updated_at = now()
     where church_id is not distinct from v_row.church_id
       and concept_key = v_row.concept_key;

    if not found then
      insert into public.org_terminology (church_id, concept_key, label)
      values (v_row.church_id, v_row.concept_key, v_row.label);
    end if;
  end loop;
end
$$;

do $$
declare
  v_fam_id uuid;
  v_row record;
begin
  select id into v_fam_id
    from public.churches
   where lower(coalesce(slug, '')) = 'fam-samambaia-df'
      or lower(coalesce(name, '')) like '%força ativa da mulher%'
      or lower(coalesce(name, '')) like '%forca ativa da mulher%'
   order by case when lower(coalesce(slug, '')) = 'fam-samambaia-df' then 0 else 1 end
   limit 1;

  if v_fam_id is not null then
    for v_row in
      select * from (values
        ('admin_role'::text, 'Adm'::text),
        ('life_group'::text, 'Grupo'::text),
        ('life_group_plural'::text, 'Grupos'::text),
        ('more_brand'::text, 'FAM Mais'::text),
        ('member_id_brand'::text, 'FAM ID'::text)
      ) as fam(concept_key, label)
    loop
      update public.org_terminology
         set label = v_row.label, updated_at = now()
       where church_id = v_fam_id
         and concept_key = v_row.concept_key;

      if not found then
        insert into public.org_terminology (church_id, concept_key, label)
        values (v_fam_id, v_row.concept_key, v_row.label);
      end if;
    end loop;

    -- Compatibilidade com telas legadas que ainda consultam member_id.
    update public.org_terminology
       set label = 'FAM ID', updated_at = now()
     where church_id = v_fam_id and concept_key = 'member_id';
    if not found then
      insert into public.org_terminology (church_id, concept_key, label)
      values (v_fam_id, 'member_id', 'FAM ID');
    end if;
  end if;
end
$$;

comment on column public.org_terminology.concept_key is
  'Identificador técnico estável; o texto exibido ao cliente fica em label.';
