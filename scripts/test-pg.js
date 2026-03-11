const { Pool } = require('pg');
require('dotenv').config();

async function testPostgres() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Testing connection to:', connectionString?.split('@')[1]); // Log only host/db for safety

  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL!');
    
    const res = await client.query('SELECT NOW()');
    console.log('Current Time from DB:', res.rows[0].now);
    
    client.release();
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err.message);
    if (err.code) console.error('Error Code:', err.code);
  } finally {
    await pool.end();
  }
}

testPostgres();
