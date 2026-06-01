import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const newPass = await bcrypt.hash('123456', 10);
    const user = await prisma.user.update({
      where: { username: 'ithalobrandao ' },
      data: { password: newPass }
    });
    console.log('Senha resetada para 123456 para o usuário ithalobrandao ');
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
