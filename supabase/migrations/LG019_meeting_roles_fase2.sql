-- ============================================================
-- LG019 — Escala da Reunião do Life Group (CT-019 Fase 2)
-- ============================================================
-- Os 7 momentos oficiais da reunião (confirmados pelo usuário,
-- substituem a lista genérica do caderno original):
--   1. Oração Inicial
--   2. Louvor (duas músicas — só observação, um responsável só)
--   3. Dinâmica
--   4. Palavra
--   5. Oferta (Generosidade)
--   6. Caixinha de Oração
--   7. Avisos: CEC News
--
-- Regra de negócio (confirmada): sempre 1 responsável por momento.
-- Um mesmo membro PODE ficar responsável por mais de um momento na
-- mesma reunião — isso é tratado como exceção na interface (falta de
-- membros disponíveis), não é bloqueado no banco.
--
-- Permissões (mesma matriz do CT-019 §7):
--   Leitura  → qualquer membro do Life Group, líder, colíder, supervisor,
--              apóstolo/pastor ou quem tiver o LG no escopo territorial.
--   Escrita  → exclusiva de Líder e Colíder (e apóstolo, por segurança).
-- Idempotente.
-- ============================================================

-- ---------- 1) Tabela ----------
create table if not exists public.lg_meeting_roles (
  id                      uuid primary key default gen_random_uuid(),
  life_group_id           uuid not null references public.life_groups(id) on delete cascade,
  meeting_date            date not null,
  moment_key              text not null check (moment_key in (
                             'oracao_inicial','louvor','dinamica','palavra',
                             'oferta','caixinha_oracao','avisos_cec_news'
                           )),
  moment_order            smallint not null check (moment_order between 1 and 7),
  responsible_member_id   uuid references public.members(id) on delete set null,
  confirmed               boolean not null default false,
  notes                   text,
  created_by              uuid references public.profiles(id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (life_group_id, meeting_date, moment_key)
);

comment on table public.lg_meeting_roles is
  'CT-019 — Escala dos 7 momentos da reunião do Life Group, um responsável por momento e por data de reunião.';
comment on column public.lg_meeting_roles.responsible_member_id is
  'Pode se repetir entre momentos da mesma reunião — permitido como exceção (falta de membros disponíveis).';

create index if not exists idx_lg_meeting_roles_lg_date on public.lg_meeting_roles (life_group_id, meeting_date);
create index if not exists idx_lg_meeting_roles_member   on public.lg_meeting_roles (responsible_member_id);

drop trigger if exists trg_lg_meeting_roles_updated_at on public.lg_meeting_roles;
create trigger trg_lg_meeting_roles_updated_at before update on public.lg_meeting_roles
  for each row execute function public.set_updated_at();

-- ---------- 2) Funções de escopo ----------

-- Qualquer integrante do próprio Life Group (membro comum incluso).
create or replace function public.lg_meeting_roles_is_member(p_life_group_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.members m
    where m.life_group_id = p_life_group_id and m.profile_id = auth.uid()
  );
$$;
grant execute on function public.lg_meeting_roles_is_member(uuid) to authenticated;

-- Quem pode gerenciar a escala: só Líder e Colíder (não Supervisor — Fase 1 do CT-019 já
-- retirou o Supervisor do card de gestão operacional; ele acompanha via telas de supervisão).
create or replace function public.lg_meeting_roles_can_manage(p_life_group_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.life_groups lg
    where lg.id = p_life_group_id
      and (lg.leader_id = auth.uid() or lg.coleader_id = auth.uid())
  );
$$;
grant execute on function public.lg_meeting_roles_can_manage(uuid) to authenticated;

-- ---------- 3) RLS ----------
alter table public.lg_meeting_roles enable row level security;

drop policy if exists lg_meeting_roles_read on public.lg_meeting_roles;
create policy lg_meeting_roles_read on public.lg_meeting_roles for select to authenticated
using (
  public.is_apostle()
  or public.lg_meeting_roles_can_manage(life_group_id)
  or public.lg_meeting_roles_is_member(life_group_id)
  or public.relmda_lg_in_scope(life_group_id)
);

drop policy if exists lg_meeting_roles_write on public.lg_meeting_roles;
create policy lg_meeting_roles_write on public.lg_meeting_roles for insert to authenticated
with check (
  public.is_apostle() or public.lg_meeting_roles_can_manage(life_group_id)
);

drop policy if exists lg_meeting_roles_update on public.lg_meeting_roles;
create policy lg_meeting_roles_update on public.lg_meeting_roles for update to authenticated
using (
  public.is_apostle() or public.lg_meeting_roles_can_manage(life_group_id)
)
with check (
  public.is_apostle() or public.lg_meeting_roles_can_manage(life_group_id)
);

drop policy if exists lg_meeting_roles_delete on public.lg_meeting_roles;
create policy lg_meeting_roles_delete on public.lg_meeting_roles for delete to authenticated
using (
  public.is_apostle() or public.lg_meeting_roles_can_manage(life_group_id)
);
