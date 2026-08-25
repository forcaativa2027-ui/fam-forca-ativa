-- Execute no Supabase Dashboard → SQL Editor
-- Cria o atendente admin (tecnologiaagilize@gmail.com) como ativo

-- 1. Pega o user_id do admin
SELECT id, email FROM auth.users WHERE email = 'tecnologiaagilize@gmail.com';

-- 2. Insere/atualiza o atendente (substitua USER_ID_AQUI pelo ID retornado acima)
-- Exemplo:
INSERT INTO public.fam_attendants (
  profile_id,
  role_label,
  status,
  training_accepted_at
) VALUES (
  'USER_ID_AQUI',  -- <-- substitua pelo ID do passo 1
  'Admin Geral FAM',
  'active',
  now()
) ON CONFLICT (profile_id) DO UPDATE SET
  role_label = 'Admin Geral FAM',
  status = 'active',
  training_accepted_at = now();
