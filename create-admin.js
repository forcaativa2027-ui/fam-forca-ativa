const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const SUPABASE_URL = 'https://untlbpzafiojirmpogqp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudGxicHphZmlvamlybXBvZ3FwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMzMzU1NiwiZXhwIjoyMTAyOTA5NTU2fQ.PRUvUkzeVehO4bQ32vqAKHfBAaYgWBRUetgRPrENt3o';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws }
});

async function createAdmin() {
  const email = 'tecnologiaagilize@gmail.com';
  const password = 'Perola74';
  const fullName = 'Admin Geral FAM';

  try {
    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) {
      // Se já existe, tenta atualizar senha
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        console.log('Usuário já existe, atualizando senha...');
        const { data: users } = await admin.auth.admin.listUsers();
        const existing = users.users.find(u => u.email === email);
        if (existing) {
          await admin.auth.admin.updateUserById(existing.id, { password });
          console.log('Senha atualizada para:', existing.id);
          
          // Atualiza profile
          await admin.from('profiles').upsert({
            id: existing.id,
            full_name: fullName,
            role: 'apostolo'
          });
          console.log('Profile atualizado para apostolo');
          return;
        }
      }
      throw authError;
    }

    const userId = authData.user.id;
    console.log('Usuário criado:', userId);

    // 2. Atualizar profile com role apostolo
    const { error: profileError } = await admin.from('profiles').upsert({
      id: userId,
      full_name: fullName,
      role: 'apostolo'
    });

    if (profileError) throw profileError;
    console.log('Profile criado com role: apostolo');

    console.log('\n✅ Admin criado com sucesso!');
    console.log('Email:', email);
    console.log('Senha:', password);
    console.log('Role: apostolo (acesso total)');

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

createAdmin();
