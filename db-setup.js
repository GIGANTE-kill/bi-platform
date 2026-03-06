const { Client } = require('pg');

const connectionString = "postgresql://matheus:COXINHA20ma@localhost:5432/bi_platform";
const client = new Client({ connectionString });

const sql = `
INSERT INTO "User" ("id", "email", "name", "password", "role", "updatedAt")
VALUES ('admin-id', 'admin@admin.com', 'Administrador', '$2b$10$zyW381eg6AX7oxYVA5b4OyV0rr62kGJi8.CBoB0SrIzsBkmia7a2', 'GERENTE', NOW())
ON CONFLICT ("email") DO UPDATE 
SET "password" = EXCLUDED."password", "role" = EXCLUDED."role", "updatedAt" = EXCLUDED."updatedAt";
`;

async function run() {
    try {
        await client.connect();
        console.log("Connected to database.");
        const res = await client.query(sql);
        console.log("Query executed successfully:", res.rowCount, "rows affected.");
    } catch (err) {
        console.error("Error executing query:", err);
    } finally {
        await client.end();
    }
}

run();
