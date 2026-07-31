-- ============================================================
-- TASK001 — Tarefas Ministeriais (CT-020 §14) + "Relatório que
-- gera cuidado" (CT-020 §18, primeira regra automática)
-- ============================================================
-- Toda necessidade identificada deverá poder gerar uma tarefa.
-- MVP desta migration: 1 regra automática (visitante novo → tarefa
-- de acolhimento pro líder). Ausência recorrente e pedido urgente
-- ficam pra uma próxima fase (precisam de análise histórica).
-- Idempotente.
-- ============================================================

-- ---------- 1) Tabela ----------
create table if not exists public.ministerial_tasks (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null check (length(trim(title)) > 0),
  origin              text not null default 'manual' check (origin in (
                        'manual','relatorio_visitante','relatorio_ausencia','pedido_oracao'
                      )),
  life_group_id       uuid references public.life_groups(id) on delete cascade,
  related_member_id   uuid references public.members(id) on delete set null,
  responsible_id      uuid references public.profiles(id) on delete set null,
  due_date            date,
  priority            text not null default 'media' check (priority in ('baixa','media','alta','urgente')),
  status              text not null default 'pendente' check (status in (
                        'pendente','em_andamento','aguardando_retorno','concluida','cancelada'
                      )),
  notes               text,
  created_by          uuid references public.profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  completed_at        timestamptz
);

comment on table public.ministerial_tasks is
  'CT-020 §14 — Tarefas ministeriais: toda necessidade identificada (manual ou automática) pode virar uma tarefa com responsável, prazo e status.';

create index if not exists idx_ministerial_tasks_lg          on public.ministerial_tasks(life_group_id);
create index if not exists idx_ministerial_tasks_responsible  on public.ministerial_tasks(responsible_id);
create index if not exists idx_ministerial_tasks_status       on public.ministerial_tasks(status);

drop trigger if exists trg_ministerial_tasks_updated_at on public.ministerial_tasks;
create trigger trg_ministerial_tasks_updated_at before update on public.ministerial_tasks
  for each row execute function public.set_updated_at();

-- Marca completed_at automaticamente quando o status vira concluída/cancelada.
create or replace function public.ministerial_task_stamp_completion()
returns trigger language plpgsql as $$
begin
  if new.status in ('concluida','cancelada') and old.status not in ('concluida','cancelada') then
    new.completed_at := now();
  elsif new.status not in ('concluida','cancelada') then
    new.completed_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_ministerial_tasks_completion on public.ministerial_tasks;
create trigger trg_ministerial_tasks_completion before update on public.ministerial_tasks
  for each row execute function public.ministerial_task_stamp_completion();

-- ---------- 2) RLS ----------
alter table public.ministerial_tasks enable row level security;

create or replace function public.ministerial_task_visible(
  p_life_group_id uuid, p_responsible_id uuid, p_created_by uuid
) returns boolean language sql stable security definer set search_path = public as $$
  select
    public.is_apostle()
    or auth.uid() = p_responsible_id
    or auth.uid() = p_created_by
    or (p_life_group_id is not null and (
      public.lg_meeting_roles_can_manage(p_life_group_id)
      or public.relmda_lg_in_scope(p_life_group_id)
    ));
$$;
grant execute on function public.ministerial_task_visible(uuid, uuid, uuid) to authenticated;

drop policy if exists ministerial_tasks_rw on public.ministerial_tasks;
create policy ministerial_tasks_rw on public.ministerial_tasks for all to authenticated
using (public.ministerial_task_visible(life_group_id, responsible_id, created_by))
with check (public.ministerial_task_visible(life_group_id, responsible_id, created_by));

-- ---------- 3) Automação: visitante novo → tarefa de acolhimento ----------
-- CT-020 §18 "Novo visitante → registrar acolhimento, designar responsável,
-- acompanhar retorno" — o responsável inicial é o Líder do LG; ele pode
-- reatribuir depois (edição normal da tarefa).
create or replace function public.ministerial_task_from_visitor()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_lg      uuid;
  v_leader  uuid;
begin
  select r.life_group_id into v_lg from public.relmda_weekly_reports r where r.id = new.report_id;
  if v_lg is null then return new; end if;

  select leader_id into v_leader from public.life_groups where id = v_lg;

  insert into public.ministerial_tasks
    (title, origin, life_group_id, related_member_id, responsible_id, priority, notes, created_by)
  values (
    'Acolher visitante: ' || new.full_name,
    'relatorio_visitante',
    v_lg,
    null,
    v_leader,
    'media',
    nullif(concat_ws(' — ', case when new.phone is not null then 'Telefone: ' || new.phone end, new.note), ''),
    v_leader
  );
  return new;
end;
$$;

drop trigger if exists trg_ministerial_task_from_visitor on public.relmda_visitors;
create trigger trg_ministerial_task_from_visitor after insert on public.relmda_visitors
  for each row execute function public.ministerial_task_from_visitor();
