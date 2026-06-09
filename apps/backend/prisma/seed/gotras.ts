import type { PrismaClient } from '@prisma/client';

/**
 * Seeds placeholder Gahoi gotras.
 * The TechSpec says: "Structured so founder can replace with authoritative
 * list by updating seed file."
 *
 * These are common Gahoi Bania gotras. The founder should verify and
 * update this list before going live.
 */

const GAHOI_GOTRAS = [
  'Kashyap',
  'Bharadwaj',
  'Vashistha',
  'Atri',
  'Garg',
  'Parashar',
  'Kaushik',
  'Sandilya',
  'Agastya',
  'Gautam',
  'Jamadagni',
  'Vishwamitra',
  'Angiras',
  'Mandavya',
  'Mudgal',
  'Shandilya',
  'Upamanyu',
  'Lohit',
  'Savarna',
  'Lakulish',
  'Bhrigu',
  'Pulastya',
  'Pulaha',
  'Kratu',
  'Marichi',
  'Daksha',
  'Prachinabarhis',
  'Kapi',
  'Dalbhya',
  'Shaunaka',
  'Vatsa',
  'Harita',
  'Kaundinya',
  'Devala',
  'Maudgalya',
  'Naidhruva',
];

export async function seedGotras(prisma: PrismaClient) {
  console.log('  🔱 Seeding Gahoi gotras...');

  for (const name of GAHOI_GOTRAS) {
    await prisma.gotra.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`  ✅ ${GAHOI_GOTRAS.length} gotras seeded.`);
}
