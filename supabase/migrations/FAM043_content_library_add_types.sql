-- Atualiza constraint de type para aceitar 'arquivo' e 'carrossel'
-- Rodar apenas se CT006a já foi executada

do $$
begin
  -- Remove constraint antigo se existir
  if exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'content_library_type_check'
    and table_name = 'content_library'
  ) then
    alter table public.content_library drop constraint content_library_type_check;
  end if;

  -- Cria novo constraint com todos os tipos
  alter table public.content_library add constraint content_library_type_check
    check (type in ('imagem', 'video_youtube', 'documento', 'logo', 'outro', 'arquivo', 'carrossel'));
end $$;
