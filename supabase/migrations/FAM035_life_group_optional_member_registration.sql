-- FAM035 — Life Group/Grupo opcional no cadastro de membros
-- ================================================================
-- Regra estrutural:
--   * Igreja/Comunidade é o escopo institucional mínimo do cadastro
--   * life_group_id é opcional na criação e pode ser preenchido depois
--   * nenhum registro existente é removido ou desvinculado
-- ================================================================

do $$
begin
  if to_regclass('public.members') is not null then
    alter table public.members
      alter column life_group_id drop not null;

    comment on column public.members.life_group_id is
      'Vínculo opcional com Life Group/Grupo; pode ser associado posteriormente pela liderança.';
  end if;
end
$$;

-- Mantém a regra opcional também em pipelines de acolhimento, quando a tabela existir.
do $$
begin
  if to_regclass('public.visitor_pipeline') is not null then
    alter table public.visitor_pipeline
      alter column life_group_id drop not null;

    comment on column public.visitor_pipeline.life_group_id is
      'Vínculo opcional com Life Group/Grupo; pode ser definido após o acolhimento.';
  end if;
end
$$;

-- Índice parcial continua permitindo consultas de membros sem grupo.
create index if not exists members_without_life_group_idx
  on public.members (church_id, created_at)
  where life_group_id is null;

-- Verificação opcional em ambientes onde a tabela já existe.
do $$
begin
  if to_regclass('public.members') is not null then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'members'
        and column_name = 'life_group_id'
        and is_nullable = 'NO'
    ) then
      raise exception 'FAM035: life_group_id ainda está NOT NULL em public.members';
    end if;
  end if;
end
$$;
