const { PrismaClient } = require('../src/generated/prisma');
require('dotenv').config();

const prisma = new PrismaClient();

async function test() {
  console.log('--- VANILLA PRISMA TEST ---');
  try {
    const userCount = await prisma.user.count();
    console.log('Successfully queried User table. Count:', userCount);
    
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' }
    });
    console.log('Admin user:', admin ? 'Found (ID: ' + admin.id + ')' : 'Not Found');
    
  } catch (err) {
    console.error('Vanilla Prisma test failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
