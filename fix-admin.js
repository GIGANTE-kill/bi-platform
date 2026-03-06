const { PrismaClient } = require("./src/generated/prisma");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    console.log("Setting up admin user...");
    const adminEmail = "admin@admin.com";
    const adminPassword = "admin123";

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const user = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password: hashedPassword,
            role: "GERENTE"
        },
        create: {
            email: adminEmail,
            name: "Administrador",
            password: hashedPassword,
            role: "GERENTE",
        },
    });

    console.log("Admin user updated/created:", user.email);
}

main()
    .catch((e) => {
        console.error("Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
