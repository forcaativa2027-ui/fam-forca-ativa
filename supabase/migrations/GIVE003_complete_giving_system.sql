-- ============================================================
-- GIVE003 — Completa o sistema "Momento da Generosidade"
-- ============================================================
-- Esse sistema (GivingAdmin.tsx + services/giving.ts) já existia
-- no repositório, mas estava incompleto: faltava o tipo TypeScript,
-- o item de menu, e possivelmente a tabela/bucket no banco. Esta
-- migration garante que a tabela e o bucket de upload existem.
-- Idempotente — segura de rodar mesmo se já existirem.
-- ============================================================

create table if not exists public.church_giving_info (
  church_id    uuid primary key references public.churches(id) on delete cascade,
  qr_code_url  text,
  pix_key      text,
  razao_social text,
  cnpj         text,
  banco        text,
  updated_at   timestamptz not null default now()
);
comment on table public.church_giving_info is '"Momento da Generosidade" — PIX/QR/dados bancários por igreja, exibidos na Home pública.';

alter table public.church_giving_info enable row level security;

drop policy if exists giving_public_read on public.church_giving_info;
create policy giving_public_read on public.church_giving_info for select to anon, authenticated
  using (true);

drop policy if exists giving_staff_write on public.church_giving_info;
create policy giving_staff_write on public.church_giving_info for all to authenticated
  using (public.is_apostle() or church_id in (select public.accessible_church_ids()))
  with check (public.is_apostle() or church_id in (select public.accessible_church_ids()));

-- ---------- Bucket de upload do QR Code ----------
insert into storage.buckets (id, name, public)
values ('institutional-assets', 'institutional-assets', true)
on conflict (id) do nothing;

drop policy if exists institutional_assets_upload on storage.objects;
create policy institutional_assets_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'institutional-assets');

drop policy if exists institutional_assets_update on storage.objects;
create policy institutional_assets_update on storage.objects for update to authenticated
  using (bucket_id = 'institutional-assets');
