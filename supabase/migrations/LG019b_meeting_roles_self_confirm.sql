-- ============================================================
-- LG019b — Confirmação/Indisponibilidade pelo próprio membro
-- (CT-019 §4.3 "o membro poderá confirmar participação")
-- ============================================================
-- A escrita direta em lg_meeting_roles continua exclusiva de
-- Líder/Colíder (LG019). Esta migration adiciona uma função
-- SECURITY DEFINER estreita: o próprio responsável por um momento
-- pode confirmar ou sinalizar indisponibilidade *só naquele registro
-- que é dele*, sem ganhar permissão de reatribuir ou editar qualquer
-- outro campo/linha da escala.
-- Idempotente.
-- ============================================================

create or replace function public.lg_meeting_roles_confirm_own(
  p_role_id uuid, p_confirmed boolean, p_note text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ok boolean;
begin
  select exists (
    select 1 from public.lg_meeting_roles r
    join public.members m on m.id = r.responsible_member_id
    where r.id = p_role_id and m.profile_id = auth.uid()
  ) into v_ok;

  if not v_ok then
    raise exception 'não autorizado a confirmar este momento';
  end if;

  update public.lg_meeting_roles
    set confirmed = p_confirmed, notes = coalesce(p_note, notes)
    where id = p_role_id;
end;
$$;

comment on function public.lg_meeting_roles_confirm_own(uuid, boolean, text) is
  'CT-019 — permite ao membro responsável confirmar/sinalizar indisponibilidade no próprio momento da escala, sem acesso de edição geral (que continua exclusivo de Líder/Colíder).';

grant execute on function public.lg_meeting_roles_confirm_own(uuid, boolean, text) to authenticated;
