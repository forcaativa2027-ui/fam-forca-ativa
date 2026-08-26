-- FAM011 — Endurecimento RLS das evidências FAM
-- Não altera registros e não remove arquivos; somente reduz acesso a objetos órfãos.

-- O atendente só pode ler um objeto que tenha registro correspondente em
-- fam_risk_attachments. O serviço getAttachmentUrl ainda exige malware_scan_status=clean.
drop policy if exists fam_storage_owner_select on storage.objects;
create policy fam_storage_owner_select on storage.objects
for select to authenticated
using (
  bucket_id = 'fam-attachments'
  and exists (
    select 1 from public.fam_risk_attachments a
    where a.storage_path = storage.objects.name
      and a.deleted_at is null
      and a.malware_scan_status = 'clean'
      and (
        (storage.foldername(name))[1] = auth.uid()::text
        or public.fam_is_active_attendant()
      )
  )
);

-- Metadados de anexos são imutáveis para o cliente. Apenas o scanner
-- server-side e o processo de retenção usam a service role para atualizar status.
drop policy if exists fam_risk_attachments_owner_update on public.fam_risk_attachments;

-- A exclusão física é feita somente pelo processo server-side de retenção.
drop policy if exists fam_storage_owner_delete on storage.objects;
create policy fam_storage_owner_delete on storage.objects
for delete to authenticated
using (false);

comment on policy fam_storage_owner_select on storage.objects is
  'Leitura FAM exige dono do objeto ou atendente ativo com metadado de anexo não excluído.';
