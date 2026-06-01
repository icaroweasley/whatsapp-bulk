import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log(users.map(u => u.username));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
