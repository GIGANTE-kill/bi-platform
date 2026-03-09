const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL not found");
        process.exit(1);
    }

    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log("Connected to database. Setting up admin user...");

        const adminEmail = "admin@admin.com";
        const adminPassword = "admin123";
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // First, Ensure the table exists (simple check)
        await client.query(`
            CREATE TABLE IF NOT EXISTS "User" (
                "id" TEXT NOT NULL,
                "email" TEXT NOT NULL,
                "name" TEXT,
                "password" TEXT NOT NULL,
                "role" TEXT NOT NULL DEFAULT 'FUNCIONARIO',
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                CONSTRAINT "User_pkey" PRIMARY KEY ("id")
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
        `);

        const id = 'admin-' + Math.random().toString(36).substr(2, 9);

        await client.query(`
            INSERT INTO "User" (id, email, name, password, role, "updatedAt")
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (email) DO UPDATE 
            SET password = EXCLUDED.password, role = EXCLUDED.role, "updatedAt" = NOW()
        `, [id, adminEmail, "Administrador", hashedPassword, "GERENTE"]);

        console.log("Admin user 'admin@admin.com' updated/created successfully with password 'admin123'");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.end();
    }
}

main();
