-- ============================================================
-- CEC FAMILY — Fix definitivo: existia um SEGUNDO gatilho (trigger)
-- antigo em module_delegations — mod_del_fill_critical, chamando
-- fill_is_critical() — que compara new.module (agora enum
-- delegation_module) contra a tabela critical_modules.module (texto
-- puro). Como os dois gatilhos disparam juntos em todo INSERT, essa
-- comparação quebrava com "operator does not exist: text =
-- delegation_module".
--
-- O gatilho novo (trg_module_delegations_critical /
-- default_is_critical) já calcula is_critical corretamente — esse
-- antigo é redundante e pode ser removido com segurança.
-- ============================================================

drop trigger if exists mod_del_fill_critical on public.module_delegations;
