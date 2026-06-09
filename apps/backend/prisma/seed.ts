import { PrismaClient } from '@prisma/client';
import { seedLocations } from './seed/locations';
import { seedGotras } from './seed/gotras';
import { seedPlans } from './seed/plans';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  await seedLocations(prisma);
  await seedGotras(prisma);
  await seedPlans(prisma);

  console.log('✅ Seed complete.');
}


main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
