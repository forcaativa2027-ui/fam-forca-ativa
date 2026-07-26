-- ============================================================
-- CEC FAMILY — Passo 2/2: agora que 'usuarios' já existe (rodado
-- no GOV007a), reclassifica as permissões e cria as novas.
-- ============================================================

update public.permissions set module = 'usuarios'::delegation_module
where key in ('usuarios.visualizar','usuarios.criar','usuarios.editar','usuarios.inativar',
              'convites.criar','convites.cancelar');

insert into public.permissions (key, module, label, is_write) values
  ('usuarios.delegar',        'usuarios', 'Conceder/revogar delegações de outros usuários', true),
  ('usuarios.redefinir_senha','usuarios', 'Enviar redefinição de senha',                     true)
on conflict (key) do nothing;
