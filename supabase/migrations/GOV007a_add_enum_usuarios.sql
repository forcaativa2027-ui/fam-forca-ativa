-- ============================================================
-- CEC FAMILY — Passo 1/2: adiciona o valor 'usuarios' ao enum.
-- Precisa rodar SOZINHO primeiro (o Postgres não deixa usar um
-- valor de enum novo na mesma transação que o cria).
-- ============================================================
do $$ begin
  alter type delegation_module add value if not exists 'usuarios';
exception when duplicate_object then null; end $$;
