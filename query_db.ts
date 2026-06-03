import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { username: 'b' } });
  console.log(user);
}
main().finally(() => prisma.$disconnect());
