-- GOV-011 — Elevação confirmada da conta técnica ao administrador geral
-- Conta-alvo: tecnologiaagilize@gmail.com
-- Não altera senha, não cria usuário Auth e não remove dados.
-- Executar no SQL Editor do Supabase com a conta proprietária do projeto.

BEGIN;

DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'tecnologiaagilize@gmail.com';
  v_old_role text;
BEGIN
  SELECT id
    INTO v_user_id
    FROM auth.users
   WHERE lower(email) = lower(v_email)
   LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário % não encontrado em auth.users', v_email;
  END IF;

  SELECT role::text
    INTO v_old_role
    FROM public.profiles
   WHERE id = v_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (v_user_id, 'Administrador Geral', v_email, 'apostolo');
    RAISE NOTICE 'Perfil público criado para % com role apostolo', v_email;
  ELSE
    UPDATE public.profiles
       SET role = 'apostolo'
     WHERE id = v_user_id
       AND role IS DISTINCT FROM 'apostolo';
    RAISE NOTICE 'Perfil atualizado: % -> apostolo para %', coalesce(v_old_role, '[nulo]'), v_email;
  END IF;
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
