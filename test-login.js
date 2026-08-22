const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const SUPABASE_URL = 'https://untlbpzafiojirmpogqp.supabase.co';
const ANON_KEY = 'sb_publishable_h2fwlxIyDy5JaslAFl4ojg_bFXgTd00';

const client = createClient(SUPABASE_URL, ANON_KEY, {
  realtime: { transport: ws }
});

async function testLogin() {
  const email = 'tecnologiaagilize@gmail.com';
  const password = 'Perola74';

  try {
    // Tentar login
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.log('Erro login:', error.message);
      return;
    }
    
    console.log('Login OK! User:', data.user.id);
    
    // Tentar buscar profile
    const { data: profile, error: pError } = await client
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
    
    if (pError) {
      console.log('Erro profile:', pError.message);
    } else {
      console.log('Profile:', profile);
    }
    
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

testLogin();
