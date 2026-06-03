import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAll() {
  try {
    const users = await prisma.user.findMany();
    console.log(users.map(u => ({ username: u.username, planStatus: u.planStatus })));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAll();
