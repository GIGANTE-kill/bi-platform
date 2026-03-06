const { PrismaClient } = require('./src/generated/prisma');

async function main() {
    const prisma = new PrismaClient();
    console.log('Prisma Client Version:', prisma._clientVersion);
    console.log('Available Models in Client Instance:');
    const keys = Object.keys(prisma);
    const models = keys.filter(k => !k.startsWith('_') && !k.startsWith('$'));
    console.log(models);

    console.log('Checking specifically for models:');
    console.log('user:', typeof prisma.user);
    console.log('User:', typeof prisma.User);
    console.log('reportTemplate:', typeof prisma.reportTemplate);
    console.log('ReportTemplate:', typeof prisma.ReportTemplate);
    console.log('reportLog:', typeof prisma.reportLog);
    console.log('ReportLog:', typeof prisma.ReportLog);

    console.log('\nKeys found in index.js exports:');
    const prismaExports = require('./src/generated/prisma');
    console.log(Object.keys(prismaExports));
}

main().catch(err => {
    console.error('Error during inspection:', err);
});
