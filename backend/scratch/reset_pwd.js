const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function reset() {
  const email = 'suryanshsrivastava215@gmail.com';
  const hashedPassword = await bcrypt.hash('123456', 12);
  
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });
  
  console.log(`✅ Password reset for ${email} to: 123456`);
  process.exit(0);
}

reset();
