-- ============================================================
-- REG001 — Cadastro completo (estilo app Universal) — Fase 2
-- ============================================================
-- Adiciona campos de "história de fé" ao visitor_pipeline (tudo
-- opcional/nullable — não afeta nenhum registro existente) e cria
-- uma função NOVA (visitor_pipeline_create_v2) que os grava.
--
-- Não mexi em visitor_pipeline_create (a função antiga) nem em
-- nenhuma outra já existente — não tenho o corpo dela neste
-- repositório (foi criada direto no Supabase antes deste projeto)
-- e alterar uma função sem ver o código de dentro é arriscado demais.
-- A v2 é aditiva: convive com a antiga, nada que já usa a v1 quebra.
-- Idempotente.
-- ============================================================

alter table public.visitor_pipeline add column if not exists cpf text;
alter table public.visitor_pipeline add column if not exists gender text;
alter table public.visitor_pipeline add column if not exists marital_status text;
alter table public.visitor_pipeline add column if not exists birth_date date;
alter table public.visitor_pipeline add column if not exists country text;
alter table public.visitor_pipeline add column if not exists address text;
alter table public.visitor_pipeline add column if not exists neighborhood text;
alter table public.visitor_pipeline add column if not exists baptized boolean;
alter table public.visitor_pipeline add column if not exists baptism_date date;
alter table public.visitor_pipeline add column if not exists last_church text;
alter table public.visitor_pipeline add column if not exists holy_spirit_baptized boolean;
alter table public.visitor_pipeline add column if not exists holy_spirit_baptism_date date;
alter table public.visitor_pipeline add column if not exists seeking_reason text;
alter table public.visitor_pipeline add column if not exists life_before_church text;
alter table public.visitor_pipeline add column if not exists testimony text;
alter table public.visitor_pipeline add column if not exists belongs_to_group boolean;
alter table public.visitor_pipeline add column if not exists group_name text;

comment on column public.visitor_pipeline.testimony is 'Testemunho compartilhado livremente pela pessoa no cadastro (opcional).';

-- ---------- Função nova: cadastro completo (não substitui a antiga) ----------
create or replace function public.visitor_pipeline_create_v2(
  p_community_id uuid, p_intent text, p_full_name text, p_phone text,
  p_email text default null, p_state text default null, p_city text default null,
  p_cep text default null, p_life_group_id uuid default null,
  p_cpf text default null, p_gender text default null, p_marital_status text default null,
  p_birth_date date default null, p_country text default null,
  p_address text default null, p_neighborhood text default null,
  p_baptized boolean default null, p_baptism_date date default null, p_last_church text default null,
  p_holy_spirit_baptized boolean default null, p_holy_spirit_baptism_date date default null,
  p_seeking_reason text default null, p_life_before_church text default null,
  p_testimony text default null, p_belongs_to_group boolean default null, p_group_name text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  insert into public.visitor_pipeline (
    community_id, intent, full_name, phone, email, state, city, cep, life_group_id,
    cpf, gender, marital_status, birth_date, country, address, neighborhood,
    baptized, baptism_date, last_church, holy_spirit_baptized, holy_spirit_baptism_date,
    seeking_reason, life_before_church, testimony, belongs_to_group, group_name,
    stage, source
  ) values (
    p_community_id, p_intent, p_full_name, p_phone, p_email, p_state, p_city, p_cep, p_life_group_id,
    p_cpf, p_gender, p_marital_status, p_birth_date, p_country, p_address, p_neighborhood,
    p_baptized, p_baptism_date, p_last_church, p_holy_spirit_baptized, p_holy_spirit_baptism_date,
    p_seeking_reason, p_life_before_church, p_testimony, p_belongs_to_group, p_group_name,
    'novo', 'cadastro_publico'
  )
  returning id into v_id;

  begin
    perform public.audit_log('insert', 'visitor_pipeline', v_id, jsonb_build_object('origem', 'cadastro_publico_v2'));
  exception when others then null;
  end;

  return v_id;
end;
$$;
grant execute on function public.visitor_pipeline_create_v2(
  uuid, text, text, text, text, text, text, text, uuid, text, text, text, date, text, text, text,
  boolean, date, text, boolean, date, text, text, text, boolean, text
) to authenticated;
