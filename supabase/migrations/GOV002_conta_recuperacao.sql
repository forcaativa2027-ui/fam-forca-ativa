-- ============================================================
-- CEC FAMILY — GOV-002: Conta administrativa de recuperação
--
-- Objetivo: garantir que sempre exista um jeito de recuperar acesso
-- de apóstolo, mesmo que a(s) conta(s) atual(is) se percam.
--
-- Decisão de design: NÃO mexe no trigger on_auth_user_created (que já
-- existe no projeto, mas não está versionado neste repositório — regra
-- do projeto é nunca alterar função sem migration sem confirmar antes
-- o que ela faz). Em vez de "auto-promover no cadastro", isso é uma
-- função de emergência, chamável só via SQL Editor (nunca pelo app):
--
--   1. Cadastre-se normalmente no site com o e-mail de recuperação.
--   2. Rode: select public.bootstrap_recovery_apostolo();
--   3. Pronto — essa conta vira apóstolo.
--
-- Pode rodar de novo a qualquer momento (idempotente) — serve tanto
-- pra primeira ativação quanto pra recuperação futura, se essa conta
-- alguma hora perder o papel de apóstolo por engano.
--
-- Sem grant pra anon/authenticated de propósito: só quem tem acesso
-- direto ao SQL Editor do Supabase consegue rodar isso. Ninguém
-- consegue virar apóstolo chamando isso pelo app.
-- ============================================================

create or replace function public.bootstrap_recovery_apostolo()
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid;
  v_email constant text := 'tecnologiaagilize@gmail.com';
  v_had_profile boolean;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    return format(
      'Nenhuma conta encontrada com o e-mail %s. Cadastre-se normalmente no site com esse e-mail primeiro, depois rode esta função de novo.',
      v_email
    );
  end if;

  select exists(select 1 from public.profiles where id = v_user_id) into v_had_profile;

  if v_had_profile then
    update public.profiles set role = 'apostolo' where id = v_user_id;
  else
    insert into public.profiles (id, full_name, email, role)
    values (v_user_id, 'Administrador de Recuperação', v_email, 'apostolo');
  end if;

  return format('Pronto — a conta %s agora tem o papel de apóstolo.', v_email);
end;
$$;

-- Revoga explicitamente de anon/authenticated (garantia extra —
-- funções não são executáveis por essas roles por padrão, mas fica
-- explícito aqui já que essa é sensível).
revoke all on function public.bootstrap_recovery_apostolo() from public, anon, authenticated;
