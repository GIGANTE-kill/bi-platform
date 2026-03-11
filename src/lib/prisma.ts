import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

const logFile = "C:\\tmp\\auth-debug.log";
function logPrisma(msg: string) {
    const timestamp = new Date().toISOString();
    const formattedMsg = `[${timestamp}] [PRISMA_INIT] ${msg}\n`;
    try {
        fs.appendFileSync(logFile, formattedMsg);
    } catch (e) {
        console.error("Failed to write to log file:", e);
    }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in the environment variables.");
}

logPrisma("Initializing standard Prisma Client 6.4.1 with Driver Adapter...");
console.log("[PRISMA] Initializing standard Client with pg adapter...");

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

async function bootstrapAdmin() {
    try {
        console.log("[PRISMA] Starting admin bootstrap...");
        logPrisma("Bootstrapping admin user...");
        
        // Wait a bit to ensure DB is ready if it's still starting
        await new Promise(resolve => setTimeout(resolve, 2000));

        const adminEmail = "admin@admin.com";
        const hashedPassword = "$2b$10$zyWU381eg6AX7oxYVA5b4OyV0rr62kGJi8.CBoB0SrIzsBkmia7a2"; // admin123

        logPrisma(`Attempting to upsert admin: ${adminEmail}`);

        // Using standard Prisma methods is safer and better supported by adapters
        const admin = await prisma.user.upsert({
            where: { email: adminEmail },
            update: {
                password: hashedPassword,
                role: 'GERENTE',
            },
            create: {
                id: 'admin-fixed',
                email: adminEmail,
                name: 'Administrador',
                password: hashedPassword,
                role: 'GERENTE',
            },
        });

        logPrisma(`Admin bootstrap successful. User ID: ${admin.id}`);
        console.log("[PRISMA] Admin user bootstrapped successfully.");

    } catch (error: any) {
        logPrisma("ERROR during bootstrap: " + error.message);
        console.error("[PRISMA] Bootstrap ERROR:", error);
    }
}

// Run bootstrap
bootstrapAdmin();
