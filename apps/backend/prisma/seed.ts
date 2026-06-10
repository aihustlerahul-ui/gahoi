import { PrismaClient } from '@prisma/client';
import { seedLocations } from './seed/locations';
import { seedGotras } from './seed/gotras';
import { seedPlans } from './seed/plans';

const prisma = new PrismaClient();

async function seedSuccessStory() {
  const profile = await prisma.profile.findFirst({ where: { adminStatus: 'approved' } });
  if (!profile) return;

  const existing = await prisma.successStory.findFirst({ where: { profileId: profile.id } });
  if (existing) return;

  await prisma.successStory.create({
    data: {
      profileId: profile.id,
      testimonial:
        'Gahoi Sarthi helped us find each other within our community. We are grateful for this trusted platform.',
      status: 'pending',
    },
  });
  console.log('  ✓ Sample success story seeded');
}

async function main() {
  console.log('🌱 Starting database seed...');

  await seedLocations(prisma);
  await seedGotras(prisma);
  await seedPlans(prisma);
  await seedSuccessStory();

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
