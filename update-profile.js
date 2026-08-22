const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const SUPABASE_URL = 'https://untlbpzafiojirmpogqp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudGxicHphZmlvamlybXBvZ3FwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMzMzU1NiwiZXhwIjoyMTAyOTA5NTU2fQ.PRUvUkzeVehO4bQ32vqAKHfBAaYgWBRUetgRPrENt3o';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws }
});

async function updateProfile() {
  const email = 'tecnologiaagilize@gmail.com';
  const fullName = 'Admin Geral FAM';
  const userId = '66715dcd-aa80-4d64-96d7-7a9567046cc1';

  try {
    // Tentar inserir no profiles
    const { error } = await admin.from('profiles').upsert({
      id: userId,
      full_name: fullName,
      role: 'apostolo'
    });

    if (error) {
      console.log('Erro profiles:', error.message);
      
      // Tentar via RPC SQL direto
      const { error: rpcError } = await admin.rpc('exec_sql', {
        sql: `INSERT INTO public.profiles (id, full_name, role) VALUES ('${userId}', '${fullName}', 'apostolo') ON CONFLICT (id) DO UPDATE SET full_name = '${fullName}', role = 'apostolo';`
      });
      
      if (rpcError) {
        console.log('Erro RPC:', rpcError.message);
      } else {
        console.log('Profile atualizado via RPC');
      }
    } else {
      console.log('Profile atualizado com sucesso!');
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

updateProfile();
