-- ============================================================
-- CEC FAMILY — Bucket de fotos de membro (base pra Carteirinha)
-- Cada pessoa só pode enviar/trocar a própria foto; leitura pública
-- (necessária pra exibir a foto na carteirinha/crachá depois).
-- Idempotente.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', true)
on conflict (id) do nothing;

drop policy if exists member_photos_read on storage.objects;
create policy member_photos_read on storage.objects for select
  using (bucket_id = 'member-photos');

drop policy if exists member_photos_upload on storage.objects;
create policy member_photos_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'member-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists member_photos_update on storage.objects;
create policy member_photos_update on storage.objects for update to authenticated
  using (bucket_id = 'member-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists member_photos_delete on storage.objects;
create policy member_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'member-photos' and (storage.foldername(name))[1] = auth.uid()::text);
