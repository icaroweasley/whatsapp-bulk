const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const usages = await prisma.dailyUsage.findMany();
  console.log(usages);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
