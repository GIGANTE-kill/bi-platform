const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = "postgresql://matheus:COXINHA20ma@localhost:5432/bi_platform";
const client = new Client({ connectionString });

async function run() {
    try {
        await client.connect();
        console.log("Connected to database.");

        const password = 'admin123';
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);
        console.log("Generated new hash:", hash);

        const sql = `
            UPDATE "User" 
            SET "password" = $1, "updatedAt" = NOW() 
            WHERE "email" = 'admin@admin.com'
        `;

        const res = await client.query(sql, [hash]);
        console.log("Update executed successfully:", res.rowCount, "rows affected.");

        // Verify immediately
        const verifyRes = await client.query('SELECT password FROM "User" WHERE email = $1', ['admin@admin.com']);
        const storedHash = verifyRes.rows[0].password;
        const isMatch = await bcrypt.compare(password, storedHash);
        console.log("Verification match test:", isMatch);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

run();
