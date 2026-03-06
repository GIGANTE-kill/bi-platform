const { PrismaClient } = require("./src/generated/prisma/index-browser.js")
    ? require("./src/generated/prisma") : require("./src/generated/prisma");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function seed() {
    console.log("Iniciando seed de usuários...");

    const passwordGerente = await bcrypt.hash("admin123", 10);
    const passwordFuncionario = await bcrypt.hash("func123", 10);

    // Criar Gerente
    await prisma.user.upsert({
        where: { email: "gerente@empresa.com" },
        update: {},
        create: {
            email: "gerente@empresa.com",
            name: "Matheus Gerente",
            password: passwordGerente,
            role: "GERENTE",
        },
    });

    // Criar Funcionário
    await prisma.user.upsert({
        where: { email: "funcionario@empresa.com" },
        update: {},
        create: {
            email: "funcionario@empresa.com",
            name: "Lucas Funcionário",
            password: passwordFuncionario,
            role: "FUNCIONARIO",
        },
    });

    console.log("Seed finalizado com sucesso!");
    console.log("Usuários criados:");
    console.log("- Gerente: gerente@empresa.com / admin123");
    console.log("- Funcionário: funcionario@empresa.com / func123");
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
