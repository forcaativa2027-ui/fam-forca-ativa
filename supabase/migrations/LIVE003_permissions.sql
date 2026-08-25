-- ============================================================
-- CEC FAMILY — Live-360: permissões atômicas do módulo.
-- Aditivo — não quebra o que já funciona (module-level continua
-- autorizando tudo do módulo por padrão). Mesmo padrão de GOV006.
-- ============================================================
insert into public.permissions (key, module, label, is_write) values
  ('live360.visualizar',   'live360', 'Visualizar Live-360',          false),
  ('live360.criar_sessao', 'live360', 'Criar sessões de live',        true),
  ('live360.controlar',    'live360', 'Controlar projeção ao vivo',   true),
  ('live360.gerar_token',  'live360', 'Gerar tokens de acesso',       true)
on conflict (key) do nothing;