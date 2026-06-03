import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixInstance() {
  try {
    await prisma.user.update({
      where: { username: 'ithalobrandao' },
      data: { instances: 'ithalobrandao_instance' }
    });
    console.log('Instance fixed!');
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixInstance();
