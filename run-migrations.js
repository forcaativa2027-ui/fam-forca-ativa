const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://untlbpzafiojirmpogqp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudGxicHphZmlvamlybXBvZ3FwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMzMzU1NiwiZXhwIjoyMTAyOTA5NTU2fQ.PRUvUkzeVehO4bQ32vqAKHfBAaYgWBRUetgRPrENt3o';

async function runMigration(filePath, fileName) {
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ ${fileName}: ${response.status} - ${error}`);
      return false;
    }
    
    console.log(`✅ ${fileName}`);
    return true;
  } catch (err) {
    console.error(`❌ ${fileName}: ${err.message}`);
    return false;
  }
}

async function main() {
  const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`Found ${files.length} migration files`);
  
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    await runMigration(filePath, file);
  }
  
  console.log('Done!');
}

main();
