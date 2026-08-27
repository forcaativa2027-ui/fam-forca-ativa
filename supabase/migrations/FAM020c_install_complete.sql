-- FAM020c — Instalador completo da terminologia por tenant
-- Executar este arquivo inteiro no SQL Editor do Supabase.
-- É não destrutivo e pode ser executado novamente.

create table if not exists public.org_terminology (
  id uuid primary key default gen_random_uuid(),
  church_id uuid null references public.churches(id) on delete cascade,
  concept_key text not null,
  label text not null,
  updated_by uuid null references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint org_terminology_label_not_blank check (btrim(label) <> '')
);

create unique index if not exists uq_org_terminology_scope_key
  on public.org_terminology (coalesce(church_id, '00000000-0000-0000-0000-000000000000'::uuid), concept_key);

create index if not exists idx_org_terminology_church
  on public.org_terminology(church_id);

alter table public.org_terminology enable row level security;

drop policy if exists org_terminology_public_read on public.org_terminology;
create policy org_terminology_public_read
  on public.org_terminology for select
  to anon, authenticated
  using (true);

drop policy if exists org_terminology_authenticated_write on public.org_terminology;
create policy org_terminology_authenticated_write
  on public.org_terminology for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.role::text, ''))
          in ('apostolo', 'administrador_geral', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.role::text, ''))
          in ('apostolo', 'administrador_geral', 'admin')
    )
  );

-- Defaults globais neutros. O bloco evita duplicação porque NULL não participa
-- de conflitos normais de UNIQUE em PostgreSQL.
do $$
declare r record;
begin
  for r in
    select * from (values
      ('event', 'Evento'),
      ('events', 'Eventos'),
      ('meeting', 'Reunião'),
      ('meetings', 'Reuniões'),
      ('service', 'Atividade'),
      ('services', 'Atividades'),
      ('communion', 'Evento especial'),
      ('church', 'Organização'),
      ('community', 'Comunicação'),
      ('discipleship', 'Acompanhamento'),
      ('life_group', 'Grupo'),
      ('evangelism_group', 'Grupo de Voluntários'),
      ('member_id', 'Membro ID')
    ) as x(concept_key, label)
  loop
    if not exists (
      select 1 from public.org_terminology
      where church_id is null and org_terminology.concept_key = r.concept_key
    ) then
      insert into public.org_terminology(church_id, concept_key, label)
      values (null, r.concept_key, r.label);
    end if;
  end loop;
end $$;

-- Configuração da FAM somente se a sede já existir; nenhuma sede é criada aqui.
do $$
declare v_fam_id uuid;
begin
  select id into v_fam_id
  from public.churches
  where lower(coalesce(slug, '')) = 'fam-samambaia-df'
     or lower(coalesce(name, '')) like '%força ativa da mulher%'
     or lower(coalesce(name, '')) like '%forca ativa da mulher%'
  order by case when lower(coalesce(slug, '')) = 'fam-samambaia-df' then 0 else 1 end
  limit 1;

  if v_fam_id is not null then
    insert into public.org_terminology(church_id, concept_key, label)
    select v_fam_id, x.concept_key, x.label
    from (values
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
    where not exists (
      select 1 from public.org_terminology current
      where current.church_id = v_fam_id
        and current.concept_key = x.concept_key
    );

    update public.org_terminology current
    set label = x.label, updated_at = now()
    from (values
      ('event', 'Evento'), ('events', 'Eventos'), ('meeting', 'Reunião'),
      ('meetings', 'Reuniões'), ('service', 'Reunião'), ('services', 'Reuniões'),
      ('communion', 'Evento'), ('church', 'Parceiros'), ('community', 'Comunicação'),
      ('discipleship', 'Acompanhamento'), ('life_group', 'Grupo'),
      ('evangelism_group', 'Grupo de Voluntários'), ('member_id', 'Membro ID')
    ) as x(concept_key, label)
    where current.church_id = v_fam_id
      and current.concept_key = x.concept_key;
  end if;
end $$;

comment on table public.org_terminology is
  'Rótulos por tenant; não altera chaves técnicas nem remove dados legados.';
comment on column public.org_terminology.concept_key is
  'Chave semântica estável usada pelo código; nunca deve conter o label exibido.';

-- Verificação final
select church_id, concept_key, label
from public.org_terminology
order by church_id nulls first, concept_key;
