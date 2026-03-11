const { prisma } = require('../src/lib/prisma');

async function test() {
  console.log('--- STANDALONE PRISMA TEST ---');
  try {
    const userCount = await prisma.user.count();
    console.log('Connection successful! User count:', userCount);
    
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@admin.com' }
    });
    console.log('Admin user status:', admin ? 'Found' : 'Not Found');
    
  } catch (err) {
    console.error('Prisma test failed:', err.message);
    console.error('Full error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
