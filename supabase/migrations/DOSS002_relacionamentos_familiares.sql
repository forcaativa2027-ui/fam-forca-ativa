-- ============================================================
-- CEC FAMILY — UX-003 §6.29/6.53: Relacionamentos familiares.
-- Registra vínculos de família — quando o familiar também é da
-- Comunidade, pode ser ligado ao CEC ID dele; senão, fica só como
-- referência (nome/telefone).
-- ============================================================

do $$ begin
  create type family_relationship_type as enum ('pai','mae','conjuge','filho','irmao','responsavel_legal','outro');
exception when duplicate_object then null; end $$;

create table if not exists public.member_relationships (
  id                uuid primary key default gen_random_uuid(),
  member_id         uuid not null references public.members(id) on delete cascade,
  related_member_id uuid references public.members(id) on delete set null,  -- preenchido quando o familiar tem CEC ID
  relationship_type family_relationship_type not null,
  related_name      text not null,   -- sempre preenchido (mesmo quando vinculado, pra exibição rápida)
  related_phone     text,
  notes             text,
  created_at        timestamptz not null default now(),
  created_by        uuid references public.profiles(id) on delete set null
);

create index if not exists idx_member_relationships_member on public.member_relationships(member_id);

alter table public.member_relationships enable row level security;

drop policy if exists member_relationships_read on public.member_relationships;
create policy member_relationships_read on public.member_relationships for select to authenticated
  using (
    exists (select 1 from public.members m where m.id = member_id and m.church_id in (select public.accessible_church_ids()))
  );
drop policy if exists member_relationships_write on public.member_relationships;
create policy member_relationships_write on public.member_relationships for all to authenticated
  using (
    is_admin() and exists (select 1 from public.members m where m.id = member_id and m.church_id in (select public.accessible_church_ids()))
  )
  with check (
    is_admin() and exists (select 1 from public.members m where m.id = member_id and m.church_id in (select public.accessible_church_ids()))
  );

grant select, insert, update, delete on public.member_relationships to authenticated;
