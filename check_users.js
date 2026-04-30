const prisma = require('./backend/config/db');
async function main() {
  const users = await prisma.user.findMany();
  console.log('Total users:', users.length);
  users.forEach(u => console.log(`- ${u.name} (${u.email})`));
  process.exit(0);
}
main();
