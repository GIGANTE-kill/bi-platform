const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = "postgresql://matheus:COXINHA20ma@localhost:5432/bi_platform";
const client = new Client({ connectionString });

async function run() {
    try {
        await client.connect();
        const res = await client.query('SELECT * FROM "User" WHERE email = $1', ['admin@admin.com']);
        if (res.rows.length === 0) {
            console.log("User NOT found!");
        } else {
            const user = res.rows[0];
            console.log("User found:", user.email);
            console.log("Role:", user.role);
            console.log("Hashed Password:", user.password);

            const match = await bcrypt.compare('admin123', user.password);
            console.log("Test password 'admin123' match:", match);
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

run();
