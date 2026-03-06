const { Pool } = require('pg');

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
    console.log('Tables in database:');
    console.log(result.rows.map(r => r.table_name));
    await pool.end();
}

main().catch(console.error);
