import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminExists = await prisma.user.findUnique({
    where: { username: 'charlie' }
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('charlie2026', 10);
    const user = await prisma.user.create({
      data: {
        username: 'charlie',
        password: hashedPassword,
        instances: 'karuk'
      }
    });
    console.log(`User created: ${user.username} with instance ${user.instances}`);
  } else {
    console.log('User charlie already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
