-- ============================================================
-- UX-004 §6.1/§9.4 — MFA obrigatório pra contas administrativas.
-- "Administrativa" aqui significa: Apóstolo/Pastor, ou qualquer
-- pessoa com pelo menos uma delegação ativa (módulo/escopo).
-- ============================================================

create or replace function public.profile_requires_mfa(p_profile_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select
    exists (
      select 1 from public.profiles p
      where p.id = p_profile_id and p.role in ('apostolo', 'pastor')
    )
    or exists (
      select 1 from public.module_delegations md
      where md.profile_id = p_profile_id and md.status = 'ativo'::delegation_status
    );
$$;
grant execute on function public.profile_requires_mfa(uuid) to authenticated;
