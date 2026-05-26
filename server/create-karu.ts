import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('C3lvl@rz1nh0', 10);
  
  // Upsert to create or update if exists
  const user = await prisma.user.upsert({
    where: { username: 'karu' },
    update: {
      password: hashedPassword,
      instances: 'karuk'
    },
    create: {
      username: 'karu',
      password: hashedPassword,
      instances: 'karuk'
    }
  });
  
  console.log(`User created/updated: ${user.username}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
