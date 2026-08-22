const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const SUPABASE_URL = 'https://untlbpzafiojirmpogqp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudGxicHphZmlvamlybXBvZ3FwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMzMzU1NiwiZXhwIjoyMTAyOTA5NTU2fQ.PRUvUkzeVehO4bQ32vqAKHfBAaYgWBRUetgRPrENt3o';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws }
});

async function checkTables() {
  try {
    // Tentar listar tabelas via information_schema
    const { data, error } = await admin.rpc('exec_sql', {
      sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    });
    
    if (error) {
      console.log('Erro RPC:', error.message);
      
      // Tentar via REST direto em uma tabela conhecida
      const { data: test, error: testError } = await admin
        .from('churches')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.log('Erro churches:', testError.message);
      } else {
        console.log('Churches OK:', test);
      }
    } else {
      console.log('Tabelas:', data);
    }
    
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

checkTables();
