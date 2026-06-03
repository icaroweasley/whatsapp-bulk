import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getUser() {
  try {
    const user = await prisma.user.findUnique({ where: { username: 'ithalobrandao' } });
    console.log(user);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

getUser();
