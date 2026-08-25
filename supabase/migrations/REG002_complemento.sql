-- ============================================================
-- CEC FAMILY — REG002: campo Complemento no cadastro público
-- (Etapa 4 de 9 — Localização). Opcional, não bloqueia cadastro.
-- Idempotente.
-- ============================================================

alter table public.visitor_pipeline add column if not exists complemento text;

drop function if exists public.visitor_pipeline_create_v2(
  uuid, text, text, text, text, text, text, text, uuid, text, text, text, date, text, text, text,
  boolean, date, text, boolean, date, text, text, text, boolean, text
);

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
  p_testimony text default null, p_belongs_to_group boolean default null, p_group_name text default null,
  p_complemento text default null
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
    complemento, stage, source
  ) values (
    p_community_id, p_intent, p_full_name, p_phone, p_email, p_state, p_city, p_cep, p_life_group_id,
    p_cpf, p_gender, p_marital_status, p_birth_date, p_country, p_address, p_neighborhood,
    p_baptized, p_baptism_date, p_last_church, p_holy_spirit_baptized, p_holy_spirit_baptism_date,
    p_seeking_reason, p_life_before_church, p_testimony, p_belongs_to_group, p_group_name,
    p_complemento, 'novo', 'cadastro_publico'
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
  boolean, date, text, boolean, date, text, text, text, boolean, text, text
) to authenticated;
