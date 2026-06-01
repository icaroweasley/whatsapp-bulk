import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUsername() {
  try {
    await prisma.user.update({
      where: { username: 'ithalobrandao ' },
      data: { username: 'ithalobrandao' }
    });
    console.log('Username trimmed e corrigido!');
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUsername();
