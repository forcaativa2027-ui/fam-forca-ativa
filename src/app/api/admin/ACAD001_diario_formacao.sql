-- ============================================================
-- CEC Academy — Diário de Formação. Espaço pessoal do membro pra
-- versículos, orações, reflexões, testemunhos, aprendizados,
-- dúvidas e missões cumpridas — opcionalmente ligado a um curso.
-- ============================================================

create table if not exists public.formation_journal_entries (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  entry_type  text not null check (entry_type in ('versiculo','oracao','reflexao','testemunho','aprendizado','duvida','missao_cumprida')),
  content     text not null,
  course_id   uuid references public.courses(id) on delete set null,
  is_private  boolean not null default true,  -- só o próprio membro e o discipulador dele veem
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_formation_journal_profile on public.formation_journal_entries(profile_id, created_at desc);

alter table public.formation_journal_entries enable row level security;

drop policy if exists formation_journal_own on public.formation_journal_entries;
create policy formation_journal_own on public.formation_journal_entries for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Discipulador consegue ver (só leitura) as entradas não-privadas do discípulo dele.
-- discipleship guarda member_id, não profile_id — por isso o join via members.
drop policy if exists formation_journal_discipler_read on public.formation_journal_entries;
create policy formation_journal_discipler_read on public.formation_journal_entries for select to authenticated
  using (
    not is_private
    and exists (
      select 1 from public.discipleship d
      join public.members disciple_m on disciple_m.id = d.disciple_id
      join public.members discipler_m on discipler_m.id = d.discipler_id
      where disciple_m.profile_id = formation_journal_entries.profile_id
        and discipler_m.profile_id = auth.uid()
        and d.status = 'ativo'
    )
  );

grant select, insert, update, delete on public.formation_journal_entries to authenticated;

-- ============================================================
-- CEC Academy — Metodologia de 5 dimensões por curso (Conhecer,
-- Refletir, Orar, Praticar, Compartilhar). Guardadas como texto
-- longo — cada curso preenche o que fizer sentido pro tema dele.
-- ============================================================
alter table public.courses add column if not exists content_conhecer text;
alter table public.courses add column if not exists content_refletir text;
alter table public.courses add column if not exists content_orar text;
alter table public.courses add column if not exists content_praticar text;
alter table public.courses add column if not exists content_compartilhar text;

-- ============================================================
-- CEC Academy — 3 Indicadores de Crescimento (substituem "%
-- concluído"). Escala 0-3: 0 não iniciado, 1 iniciado, 2 em
-- progresso, 3 consolidado.
-- ============================================================
alter table public.course_enrollments add column if not exists knowledge_level smallint not null default 0 check (knowledge_level between 0 and 3);
alter table public.course_enrollments add column if not exists practice_level smallint not null default 0 check (practice_level between 0 and 3);
alter table public.course_enrollments add column if not exists sharing_level smallint not null default 0 check (sharing_level between 0 and 3);
