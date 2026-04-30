const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log('--- USERS IN DB ---');
  users.forEach(u => console.log(`Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`));
  process.exit(0);
}

check();
