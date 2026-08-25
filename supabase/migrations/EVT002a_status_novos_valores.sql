-- ============================================================
-- CEC FAMILY — EVT002a: novos valores do ciclo de vida do evento
-- (CEC-EVT-001, seção 6 — 10 status)
--
-- ATENÇÃO: este arquivo precisa rodar SOZINHO, numa transação própria,
-- antes do EVT002b. Postgres não permite usar um valor de enum recém
-- criado (ALTER TYPE ... ADD VALUE) na mesma transação em que ele foi
-- adicionado.
--
-- Mantém 'rascunho' e 'cancelado' (já existiam). 'publicado' e
-- 'encerrado' ficam no tipo (não dá pra remover valor de enum), mas
-- deixam de ser usados a partir do EVT002b — substituídos por
-- 'inscricoes_abertas' e 'inscricoes_encerradas', respectivamente.
-- ============================================================

alter type public.registration_event_status add value if not exists 'em_revisao';
alter type public.registration_event_status add value if not exists 'agendado';
alter type public.registration_event_status add value if not exists 'inscricoes_abertas';
alter type public.registration_event_status add value if not exists 'inscricoes_encerradas';
alter type public.registration_event_status add value if not exists 'lotado';
alter type public.registration_event_status add value if not exists 'em_andamento';
alter type public.registration_event_status add value if not exists 'finalizado';
alter type public.registration_event_status add value if not exists 'arquivado';
