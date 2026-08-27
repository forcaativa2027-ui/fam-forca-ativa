-- FAM021 — Flags de módulos por tenant
-- Não apaga módulos nem dados; apenas controla a visibilidade por organização.

create table if not exists public.tenant_modules (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  module_key text not null,
  enabled boolean not null default true,
  updated_by uuid null references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint tenant_modules_key_not_blank check (btrim(module_key) <> '')
);

create unique index if not exists uq_tenant_modules_church_key
  on public.tenant_modules(church_id, module_key);
create index if not exists idx_tenant_modules_church
  on public.tenant_modules(church_id);

alter table public.tenant_modules enable row level security;

drop policy if exists tenant_modules_public_read on public.tenant_modules;
create policy tenant_modules_public_read
  on public.tenant_modules for select
  to anon, authenticated
  using (true);

drop policy if exists tenant_modules_admin_write on public.tenant_modules;
create policy tenant_modules_admin_write
  on public.tenant_modules for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.role::text, ''))
          in ('apostolo', 'administrador_geral', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.role::text, ''))
          in ('apostolo', 'administrador_geral', 'admin')
    )
  );

-- Perfil FAM: Cultos, Life Groups e Ministério ficam ocultos;
-- os demais módulos institucionais permanecem activos.
do $$
declare v_fam_id uuid;
declare r record;
begin
  select id into v_fam_id
  from public.churches
  where slug = 'fam-samambaia-df'
  limit 1;

  if v_fam_id is not null then
    for r in
      select * from (values
        ('services', false),
        ('life_groups', false),
        ('ministry', false),
        ('evangelism_groups', false),
        ('events', true),
        ('news', true),
        ('radio', true),
        ('videos', true),
        ('participate', true),
        ('contact', true),
        ('donations', true),
        ('discipleship', true),
        ('academy', true),
        ('kids', true),
        ('cecmais', true),
        ('partners', true),
        ('risk_analysis', true)
      ) as x(module_key, enabled)
    loop
      update public.tenant_modules
      set enabled = r.enabled, updated_at = now()
      where church_id = v_fam_id and module_key = r.module_key;
      if not found then
        insert into public.tenant_modules(church_id, module_key, enabled)
        values (v_fam_id, r.module_key, r.enabled);
      end if;
    end loop;
  end if;
end $$;

select church_id, module_key, enabled
from public.tenant_modules
where church_id = '3f440664-450c-45f8-ae6e-6ccef31f2993'
order by module_key;
