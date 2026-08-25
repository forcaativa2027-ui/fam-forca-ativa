-- RADIO007 — Bucket público radio-audio (áudios e capas do Studio Remoto)
-- Substitui a criação manual do bucket no painel do Storage.

insert into storage.buckets (id, name, public, file_size_limit)
values ('radio-audio', 'radio-audio', true, 104857600)
on conflict (id) do update set public = true;

drop policy if exists "radio_audio_public_read" on storage.objects;
create policy "radio_audio_public_read" on storage.objects
  for select using (bucket_id = 'radio-audio');

drop policy if exists "radio_audio_authenticated_insert" on storage.objects;
create policy "radio_audio_authenticated_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'radio-audio');

drop policy if exists "radio_audio_authenticated_update" on storage.objects;
create policy "radio_audio_authenticated_update" on storage.objects
  for update to authenticated using (bucket_id = 'radio-audio') with check (bucket_id = 'radio-audio');

drop policy if exists "radio_audio_authenticated_delete" on storage.objects;
create policy "radio_audio_authenticated_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'radio-audio');