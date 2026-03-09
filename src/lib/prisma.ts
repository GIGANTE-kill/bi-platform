import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

const logFile = path.join("/tmp", "auth-debug.log");
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

logPrisma(`Prisma instance keys: ${Object.keys(prisma).join(", ")}`);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
