-- ============================================================
-- CEC FAMILY — Fix: membro não conseguia salvar a própria
-- complementação de cadastro (Card "Complete seu cadastro").
--
-- Causa: a policy de escrita da tabela members (members_scoped_write)
-- só permitia UPDATE por quem tem abrangência administrativa sobre a
-- igreja (pastor/supervisor/apóstolo) — faltava permitir que o próprio
-- membro atualize o SEU PRÓPRIO registro.
-- ============================================================

drop policy if exists members_self_write on public.members;
create policy members_self_write on public.members for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
