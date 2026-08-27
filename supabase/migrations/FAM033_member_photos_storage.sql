-- ============================================================
-- FAM033 — Storage das fotos de membros
-- ============================================================
-- O frontend usa exatamente:
--   supabase.storage.from('member-photos')
--   path = `${auth.uid()}/${member_id}.${ext}`
--
-- Esta migration é idempotente e não remove arquivos existentes.
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'member-photos',
  'member-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set name = excluded.name,
    public = true;

-- Leitura pública é necessária porque o frontend grava photo_url usando
-- getPublicUrl(). Os nomes dos arquivos continuam protegidos para escrita.
drop policy if exists fam_member_photos_public_read on storage.objects;
create policy fam_member_photos_public_read
  on storage.objects
  for select
  using (bucket_id = 'member-photos');

-- Cada usuário somente pode enviar arquivos dentro de sua própria pasta:
-- member-photos/<auth.uid()>/<member_id>.<ext>
drop policy if exists fam_member_photos_owner_insert on storage.objects;
create policy fam_member_photos_owner_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'member-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists fam_member_photos_owner_update on storage.objects;
create policy fam_member_photos_owner_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'member-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'member-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists fam_member_photos_owner_delete on storage.objects;
create policy fam_member_photos_owner_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'member-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

comment on table storage.buckets is
  'FAM033: o bucket member-photos deve permanecer público para leitura das fotos de carteirinha; escrita é protegida por policies em storage.objects.';
