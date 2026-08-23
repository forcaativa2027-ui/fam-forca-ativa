-- ============================================================
-- CEC FAMILY — UX-003 Cap. 3 Parte 7: Painel de Usuários. Reúne
-- indicadores que já existiam espalhados (sessões, delegações,
-- convites, auditoria) numa função só, escopada territorialmente.
-- ============================================================

create or replace function public.dashboard_usuarios_scoped()
returns table (
  total_cadastrados int, total_ativos int, total_inativos int, total_afastados int,
  sessoes_ativas int, convites_usados_30d int, delegacoes_ativas int, eventos_auditoria_7d int
)
language sql stable security definer set search_path = public as $$
  select
    (select count(*)::int from public.members m where m.profile_id is not null
       and m.church_id in (select public.accessible_church_ids())),
    (select count(*)::int from public.members m where m.status = 'ativo'
       and m.church_id in (select public.accessible_church_ids())),
    (select count(*)::int from public.members m where m.status = 'inativo'
       and m.church_id in (select public.accessible_church_ids())),
    (select count(*)::int from public.members m where m.status = 'afastado'
       and m.church_id in (select public.accessible_church_ids())),
    (select count(*)::int from public.user_sessions s where s.is_active
       and s.user_id in (select p.id from public.profiles p where p.church_id in (select public.accessible_church_ids()))),
    (select count(*)::int from public.invite_link_uses ilu
       where ilu.created_at > now() - interval '30 days'
       and ilu.used_by in (select p.id from public.profiles p where p.church_id in (select public.accessible_church_ids()))),
    (select count(*)::int from public.module_delegations md where md.status = 'ativo'::delegation_status
       and md.profile_id in (select p.id from public.profiles p where p.church_id in (select public.accessible_church_ids()))),
    (select count(*)::int from public.audit_logs al
       where al.created_at > now() - interval '7 days'
       and (al.church_id is null or al.church_id in (select public.accessible_church_ids())));
$$;
grant execute on function public.dashboard_usuarios_scoped() to authenticated;
