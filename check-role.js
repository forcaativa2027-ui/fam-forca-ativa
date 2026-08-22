const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const SUPABASE_URL = 'https://untlbpzafiojirmpogqp.supabase.co';
const ANON_KEY = 'sb_publishable_h2fwlxIyDy5JaslAFl4ojg_bFXgTd00';

const client = createClient(SUPABASE_URL, ANON_KEY, {
  realtime: { transport: ws }
});

async function checkRole() {
  const email = 'tecnologiaagilize@gmail.com';
  const password = 'Perola74';

  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) { console.log('Login error:', error.message); return; }
    
    console.log('User ID:', data.user.id);
    
    // Get profile
    const { data: profile, error: pError } = await client
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
    
    if (pError) { console.log('Profile error:', pError.message); return; }
    console.log('Profile:', profile);
    
    // Check user_role enum values
    const { data: enumData, error: enumError } = await client.rpc('exec_sql', {
      sql: "SELECT enumlabel FROM pg_enum WHERE enumtypid = 'user_role'::regtype ORDER BY enumsortorder;"
    });
    if (enumError) { console.log('Enum error:', enumError.message); }
    else { console.log('user_role enum values:', enumData); }
    
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

checkRole();
