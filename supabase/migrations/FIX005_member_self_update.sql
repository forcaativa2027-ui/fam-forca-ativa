-- ============================================================
-- FIX005 — Membro não conseguia salvar o próprio cadastro complementar
-- ============================================================
-- PROBLEMA: CompleteProfileCard.tsx (painel do próprio membro) chama
-- updateMember() pra salvar endereço/documentos/foto/LGPD direto na
-- tabela `members`. A policy members_scoped_write só libera escrita
-- pra quem tem escopo territorial (church_id in accessible_church_ids())
-- ou é apóstolo — NUNCA para o próprio membro editando o próprio
-- registro. Resultado: o UPDATE roda, não dá erro, mas não altera
-- NADA (RLS bloqueia silenciosamente, igual já vimos com delete/estrutura).
-- Por isso "não está funcionando" — parecia salvar, mas nunca salvava.
--
-- CORREÇÃO:
--   1) Libera UPDATE quando profile_id = auth.uid() (o próprio membro).
--   2) Trigger de segurança: se quem está editando NÃO é staff (nem
--      apóstolo, nem dentro do escopo territorial), bloqueia qualquer
--      tentativa de mudar church_id / life_group_id / journey_stage /
--      status por essa via — só a liderança pode mudar isso, exatamente
--      como já diz o Manual Prático do Usuário (seção 2).
-- Idempotente.
-- ============================================================

drop policy if exists members_scoped_write on public.members;
create policy members_scoped_write on public.members for all to authenticated
  using (public.is_apostle() or church_id in (select public.accessible_church_ids()) or profile_id = auth.uid())
  with check (public.is_apostle() or church_id in (select public.accessible_church_ids()) or profile_id = auth.uid());

create or replace function public.prevent_self_scope_change()
returns trigger language plpgsql as $$
declare
  v_is_staff boolean;
begin
  v_is_staff := public.is_apostle()
    or (old.church_id is not null and old.church_id in (select public.accessible_church_ids()));

  if not v_is_staff then
    if new.church_id is distinct from old.church_id
      or new.life_group_id is distinct from old.life_group_id
      or new.journey_stage is distinct from old.journey_stage
      or new.status is distinct from old.status
    then
      raise exception 'Apenas a liderança pode alterar Igreja, Life Group, situação ministerial ou status do membro.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_members_prevent_self_scope_change on public.members;
create trigger trg_members_prevent_self_scope_change before update on public.members
  for each row execute function public.prevent_self_scope_change();
