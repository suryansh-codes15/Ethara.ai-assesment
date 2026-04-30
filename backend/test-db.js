const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function test() {
  try {
    const count = await prisma.chatMessage.count();
    console.log("SUCCESS: ChatMessage table exists. Count:", count);
  } catch (error) {
    console.error("FAILURE:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
