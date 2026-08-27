-- FAM020 — Terminologia institucional por tenant
-- Não apaga dados da CEC. A chave técnica continua estável; apenas o rótulo é parametrizado.

create table if not exists public.org_terminology (
  id uuid primary key default gen_random_uuid(),
  church_id uuid null references public.churches(id) on delete cascade,
  concept_key text not null,
  label text not null,
  updated_by uuid null references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint org_terminology_label_not_blank check (btrim(label) <> ''),
  constraint org_terminology_scope_key_unique unique (church_id, concept_key)
);

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
    public.is_apostle()
    or church_id in (select public.accessible_church_ids())
  )
  with check (
    public.is_apostle()
    or church_id in (select public.accessible_church_ids())
  );

-- Defaults neutros da plataforma. Um tenant religioso pode sobrescrevê-los no próprio escopo.
insert into public.org_terminology (church_id, concept_key, label)
values
  (null, 'event', 'Evento'),
  (null, 'events', 'Eventos'),
  (null, 'meeting', 'Reunião'),
  (null, 'meetings', 'Reuniões'),
  (null, 'service', 'Atividade'),
  (null, 'services', 'Atividades'),
  (null, 'communion', 'Evento especial'),
  (null, 'church', 'Organização'),
  (null, 'community', 'Comunicação'),
  (null, 'discipleship', 'Acompanhamento'),
  (null, 'life_group', 'Grupo'),
  (null, 'evangelism_group', 'Grupo de Voluntários'),
  (null, 'member_id', 'Membro ID')
on conflict (church_id, concept_key) do nothing;

-- Configuração inicial da FAM. O bloco é condicional e não cria uma sede artificial.
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
    insert into public.org_terminology (church_id, concept_key, label)
    values
      (v_fam_id, 'event', 'Evento'),
      (v_fam_id, 'events', 'Eventos'),
      (v_fam_id, 'meeting', 'Reunião'),
      (v_fam_id, 'meetings', 'Reuniões'),
      (v_fam_id, 'service', 'Reunião'),
      (v_fam_id, 'services', 'Reuniões'),
      (v_fam_id, 'communion', 'Evento'),
      (v_fam_id, 'church', 'Parceiros'),
      (v_fam_id, 'community', 'Comunicação'),
      (v_fam_id, 'discipleship', 'Acompanhamento'),
      (v_fam_id, 'life_group', 'Grupo'),
      (v_fam_id, 'evangelism_group', 'Grupo de Voluntários'),
      (v_fam_id, 'member_id', 'Membro ID')
    on conflict (church_id, concept_key) do update
      set label = excluded.label, updated_at = now();
  end if;
end $$;

comment on table public.org_terminology is
  'Rótulos por tenant; não altera chaves técnicas nem remove dados legados.';
comment on column public.org_terminology.concept_key is
  'Chave semântica estável usada pelo código; nunca deve conter o label exibido.';
