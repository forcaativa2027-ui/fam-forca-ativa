-- Bucket 'content-library' no Supabase Storage para uploads reais

-- Cria bucket se não existir
insert into storage.buckets (id, name, public)
values ('content-library', 'content-library', true)
on conflict (id) do nothing;

-- Política: autenticados podem fazer upload
drop policy if exists "Authenticated users can upload to content-library" on storage.objects;
create policy "Authenticated users can upload to content-library"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'content-library');

-- Política: qualquer pessoa pode ver arquivos públicos
drop policy if exists "Public can view content-library files" on storage.objects;
create policy "Public can view content-library files"
  on storage.objects for select to public
  using (bucket_id = 'content-library');

-- Política: quem criou pode deletar
drop policy if exists "Authenticated can delete own content-library files" on storage.objects;
create policy "Authenticated can delete own content-library files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'content-library');
