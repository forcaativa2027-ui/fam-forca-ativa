const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const CONNECTION_STRING = 'postgresql://postgres:[YOUR-PASSWORD]@db.untlbpzafiojirmpogqp.supabase.co:5432/postgres';

async function runMigration(pool, filePath, fileName) {
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    await pool.query(sql);
    console.log(`✅ ${fileName}`);
    return true;
  } catch (err) {
    console.error(`❌ ${fileName}: ${err.message}`);
    return false;
  }
}

async function main() {
  const pool = new Pool({ connectionString: CONNECTION_STRING });
  
  const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`Found ${files.length} migration files`);
  
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    await runMigration(pool, filePath, file);
  }
  
  await pool.end();
  console.log('Done!');
}

main();
