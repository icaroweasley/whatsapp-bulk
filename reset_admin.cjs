const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function reset() {
  try {
    const hashedPassword = await bcrypt.hash('C3lvl@rz1nh0', 10);
    const user = await prisma.user.update({
      where: { username: 'karu' },
      data: { password: hashedPassword }
    });
    console.log('Senha atualizada com sucesso para o usuário:', user.username);
  } catch (error) {
    if (error.code === 'P2025') {
        console.log('Usuário karu não encontrado. Criando...');
        const hashedPassword = await bcrypt.hash('C3lvl@rz1nh0', 10);
        const newUser = await prisma.user.create({
            data: {
                username: 'karu',
                password: hashedPassword,
                instances: 'Evolution,Broadcast',
                planStatus: 'active'
            }
        });
        console.log('Usuário karu criado com sucesso!');
    } else {
        console.error('Erro:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

reset();
