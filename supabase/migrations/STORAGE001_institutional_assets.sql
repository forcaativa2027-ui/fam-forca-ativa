-- ============================================================
-- Bucket de storage pra arquivos institucionais (QR Code de
-- doações, etc.) — público pra leitura, só admin escreve.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('institutional-assets', 'institutional-assets', true)
on conflict (id) do nothing;

drop policy if exists institutional_assets_read on storage.objects;
create policy institutional_assets_read on storage.objects for select
  using (bucket_id = 'institutional-assets');

drop policy if exists institutional_assets_write on storage.objects;
create policy institutional_assets_write on storage.objects for insert to authenticated
  with check (bucket_id = 'institutional-assets');

drop policy if exists institutional_assets_update on storage.objects;
create policy institutional_assets_update on storage.objects for update to authenticated
  using (bucket_id = 'institutional-assets');
