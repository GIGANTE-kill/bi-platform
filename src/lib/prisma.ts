import { PrismaClient } from "@/generated/prisma";
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

// Removemos o PrismaPg adapter que estava causando os erros de "Invalid `prisma.user.findUnique()` invocation:"
export const prisma = globalForPrisma.prisma || new PrismaClient();

async function bootstrapAdmin() {
    try {
        logPrisma("Bootstrapping admin user...");
        const adminEmail = "admin@admin.com";
        // admin123 hash
        const hashedPassword = "$2b$10$zyWU381eg6AX7oxYVA5b4OyV0rr62kGJi8.CBoB0SrIzsBkmia7a2";

        // 1. User Table
        await prisma.$executeRaw`
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
        `.catch(e => logPrisma("Table User check error: " + e.message));

        // 2. ReportTemplate Table
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "ReportTemplate" (
                "id" TEXT NOT NULL,
                "nome" TEXT NOT NULL,
                "dataset" TEXT NOT NULL,
                "filtros" TEXT,
                "selectedColumns" TEXT NOT NULL,
                "emails" TEXT NOT NULL,
                "frequency" TEXT NOT NULL,
                "nextRunAt" TIMESTAMP(3),
                "lastRunAt" TIMESTAMP(3),
                "active" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
            );
        `.catch(e => logPrisma("Table ReportTemplate check error: " + e.message));

        // 3. ReportLog Table
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "ReportLog" (
                "id" TEXT NOT NULL,
                "templateId" TEXT,
                "recipient" TEXT NOT NULL,
                "subject" TEXT NOT NULL,
                "status" TEXT NOT NULL,
                "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "errorMessage" TEXT,
                CONSTRAINT "ReportLog_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "ReportLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReportTemplate"("id") ON DELETE SET NULL
            );
        `.catch(e => logPrisma("Table ReportLog check error: " + e.message));

        // 4. DashboardCache Table
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "DashboardCache" (
                "id" TEXT NOT NULL,
                "data" TEXT NOT NULL,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "DashboardCache_pkey" PRIMARY KEY ("id")
            );
        `.catch(e => logPrisma("Table DashboardCache check error: " + e.message));

        await prisma.$executeRaw`
            CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
        `.catch(e => { });

        // Use a simple query to check and insert admin
        const users = await prisma.$queryRaw`SELECT id FROM "User" WHERE email = ${adminEmail}` as any[];

        if (users.length === 0) {
            logPrisma("Admin user not found, creating...");
            await prisma.$executeRaw`
                INSERT INTO "User" (id, email, name, password, role, "updatedAt")
                VALUES ('admin-fixed', ${adminEmail}, 'Administrador', ${hashedPassword}, 'GERENTE', NOW())
            `;
            logPrisma("Admin user created successfully.");
        } else {
            logPrisma("Admin user already exists. Updating password/role to ensure access.");
            await prisma.$executeRaw`
                UPDATE "User" SET password = ${hashedPassword}, role = 'GERENTE', "updatedAt" = NOW() WHERE email = ${adminEmail}
            `;
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
