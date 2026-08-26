-- GOV-011 — Elevação confirmada da conta técnica ao administrador geral
-- Conta-alvo: tecnologiaagilize@gmail.com
-- Não altera senha, não cria usuário e não remove dados.
-- Executar no SQL Editor do Supabase com a conta proprietária do projeto.

BEGIN;

DO $$
DECLARE
  v_user_id uuid;
  v_old_role text;
BEGIN
  SELECT id
    INTO v_user_id
    FROM auth.users
   WHERE lower(email) = lower('tecnologiaagilize@gmail.com')
   LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário tecnologiaagilize@gmail.com não encontrado em auth.users';
  END IF;

  SELECT role::text
    INTO v_old_role
    FROM public.profiles
   WHERE id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil público não encontrado para o usuário %', v_user_id;
  END IF;

  UPDATE public.profiles
     SET role = 'apostolo'
   WHERE id = v_user_id
     AND role IS DISTINCT FROM 'apostolo';

  RAISE NOTICE 'Perfil atualizado: % -> apostolo para %', coalesce(v_old_role, '[nulo]'), v_user_id;
END $$;

-- Verificação final: deve retornar exatamente a conta-alvo com role = apostolo.
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role,
  p.full_name
FROM auth.users AS u
JOIN public.profiles AS p ON p.id = u.id
WHERE lower(u.email) = lower('tecnologiaagilize@gmail.com');

COMMIT;
