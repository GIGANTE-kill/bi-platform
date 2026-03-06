import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in the environment variables.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const adminEmail = "admin@admin.com";
    const adminPassword = "admin123";

    console.log(`Checking if admin user exists: ${adminEmail}`);

    const existingUser = await prisma.user.findUnique({
        where: { email: adminEmail }
    });

    if (existingUser) {
        console.log("Admin user already exists. Skipping creation.");
        return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const user = await prisma.user.create({
        data: {
            email: adminEmail,
            name: "Administrador",
            password: hashedPassword,
            role: "GERENTE",
        },
    });

    console.log(`Admin user created successfully: ${user.email}`);
}

main()
    .catch((e) => {
        console.error("Error during seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
