import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

const logFile = "/tmp/auth-debug.log";
function logPrisma(msg: string) {
    fs.appendFileSync(logFile, `[PRISMA_INIT] ${msg}\n`);
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in the environment variables.");
}

logPrisma("Initializing Prisma Client...");
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// FORCE a new instance for now to bypass any global stale cache
export const prisma = new PrismaClient({ adapter });

async function bootstrapAdmin() {
    try {
        logPrisma("Bootstrapping admin user...");
        const adminEmail = "admin@admin.com";
        // admin123 hash
        const hashedPassword = "$2b$10$zyWU381eg6AX7oxYVA5b4OyV0rr62kGJi8.CBoB0SrIzsBkmia7a2";

        // We use $executeRawUnsafe to ensure the table and user exist even if migrations haven't run
        await prisma.$executeRawUnsafe(`
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
        `).catch(e => logPrisma("Table User already exists or error: " + e.message));

        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
        `).catch(e => logPrisma("Index User_email_key already exists or error: " + e.message));

        // Use a simple query to check and insert
        const users: any[] = await prisma.$queryRawUnsafe(`SELECT id FROM "User" WHERE email = $1`, adminEmail);

        if (users.length === 0) {
            logPrisma("Admin user not found, creating...");
            await prisma.$executeRawUnsafe(`
                INSERT INTO "User" (id, email, name, password, role, "updatedAt")
                VALUES ($1, $2, $3, $4, $5, NOW())
            `, "admin-fixed", adminEmail, "Administrador", hashedPassword, "GERENTE");
            logPrisma("Admin user created successfully.");
        } else {
            logPrisma("Admin user already exists. Updating password/role to ensure access.");
            await prisma.$executeRawUnsafe(`
                UPDATE "User" SET password = $1, role = $2, "updatedAt" = NOW() WHERE email = $3
            `, hashedPassword, "GERENTE", adminEmail);
            logPrisma("Admin user updated successfully.");
        }
    } catch (error: any) {
        logPrisma("ERROR during bootstrap: " + error.message);
    }
}

// Trigger bootstrap (it's async but we don't block the export)
bootstrapAdmin();

logPrisma(`Prisma instance keys: ${Object.keys(prisma).join(", ")}`);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
