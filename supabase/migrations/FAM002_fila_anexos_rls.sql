-- FAM002 — fila de atendimento, anexos e RLS complementar
-- Aplicar depois de FAM001_atendimento_protecao.sql.

alter table public.fam_risk_attachments
  alter column case_id drop not null;

alter table public.fam_risk_attachments
  add column if not exists conversation_id uuid references public.fam_conversations(id) on delete cascade,
  add column if not exists uploaded_by uuid references auth.users(id) on delete set null;

create index if not exists idx_fam_risk_attachments_conversation
  on public.fam_risk_attachments(conversation_id, created_at);

create or replace function public.fam_is_active_attendant()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.fam_attendants a
    where a.profile_id = auth.uid()
      and a.status = 'active'::public.fam_attendant_status
  );
$$;

grant execute on function public.fam_is_active_attendant() to authenticated;

drop policy if exists fam_attendants_self_select on public.fam_attendants;
create policy fam_attendants_self_select on public.fam_attendants
for select to authenticated
using (profile_id = auth.uid());

drop policy if exists fam_conversations_staff_select on public.fam_conversations;
create policy fam_conversations_staff_select on public.fam_conversations
for select to authenticated
using (
  user_id = auth.uid()
  or (
    public.fam_is_active_attendant()
    and (
      assigned_attendant_id in (select id from public.fam_attendants where profile_id = auth.uid())
      or (assigned_attendant_id is null and status = 'waiting')
    )
  )
);

drop policy if exists fam_conversations_staff_update on public.fam_conversations;
create policy fam_conversations_staff_update on public.fam_conversations
for update to authenticated
using (
  assigned_attendant_id in (select id from public.fam_attendants where profile_id = auth.uid())
  or (public.fam_is_active_attendant() and assigned_attendant_id is null and status = 'waiting')
)
with check (
  assigned_attendant_id in (select id from public.fam_attendants where profile_id = auth.uid())
  or assigned_attendant_id = (select id from public.fam_attendants where profile_id = auth.uid())
);

drop policy if exists fam_messages_staff_select on public.fam_messages;
create policy fam_messages_staff_select on public.fam_messages
for select to authenticated
using (
  exists (select 1 from public.fam_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  or exists (
    select 1 from public.fam_conversations c
    join public.fam_attendants a on a.id = c.assigned_attendant_id
    where c.id = conversation_id and a.profile_id = auth.uid() and a.status = 'active'
  )
);

drop policy if exists fam_messages_staff_insert on public.fam_messages;
create policy fam_messages_staff_insert on public.fam_messages
for insert to authenticated
with check (
  (sender_user_id = auth.uid() and exists (
    select 1 from public.fam_conversations c where c.id = conversation_id and c.user_id = auth.uid()
  ))
  or sender_attendant_id in (select id from public.fam_attendants where profile_id = auth.uid() and status = 'active')
);

drop policy if exists fam_risk_attachments_owner_insert on public.fam_risk_attachments;
create policy fam_risk_attachments_owner_insert on public.fam_risk_attachments
for insert to authenticated
with check (
  uploaded_by = auth.uid()
  and (
    exists (select 1 from public.fam_risk_cases r where r.id = case_id and r.user_id = auth.uid())
    or exists (select 1 from public.fam_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  )
);

drop policy if exists fam_risk_attachments_secure_select on public.fam_risk_attachments;
create policy fam_risk_attachments_secure_select on public.fam_risk_attachments
for select to authenticated
using (
  exists (select 1 from public.fam_risk_cases r where r.id = case_id and r.user_id = auth.uid())
  or exists (select 1 from public.fam_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  or exists (
    select 1 from public.fam_conversations c
    join public.fam_attendants a on a.id = c.assigned_attendant_id
    where c.id = conversation_id and a.profile_id = auth.uid() and a.status = 'active'
  )
);

insert into storage.buckets (id, name, public)
values ('fam-attachments', 'fam-attachments', false)
on conflict (id) do nothing;

drop policy if exists fam_storage_owner_insert on storage.objects;
create policy fam_storage_owner_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'fam-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists fam_storage_owner_select on storage.objects;
create policy fam_storage_owner_select on storage.objects
for select to authenticated
using (bucket_id = 'fam-attachments' and ((storage.foldername(name))[1] = auth.uid()::text or public.fam_is_active_attendant()));

drop policy if exists fam_storage_owner_delete on storage.objects;
create policy fam_storage_owner_delete on storage.objects
for delete to authenticated
using (bucket_id = 'fam-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

comment on table public.fam_risk_attachments is 'Anexos sensíveis privados; devem passar por varredura antes de acesso operacional.';
