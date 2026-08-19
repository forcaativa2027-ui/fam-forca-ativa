-- ============================================================
-- CEC FAMILY — Live-360. Passo 1/2: adiciona o valor 'live360'
-- ao enum delegation_module. Precisa rodar SOZINHO primeiro
-- (o Postgres não deixa usar um valor de enum novo na mesma
-- transação que o cria) — mesmo padrão de GOV007a_add_enum_usuarios.
-- ============================================================
do $$ begin
  alter type delegation_module add value if not exists 'live360';
exception when duplicate_object then null; end $$;