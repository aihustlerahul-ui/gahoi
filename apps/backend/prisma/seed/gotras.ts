import type { PrismaClient } from '@prisma/client';
import { GAHOI_AAKNA_MASTER } from '@gahoisarthi/shared';
import { GAHOI_GOTRA_DATA } from './gahoi-gotras-data';

function gotraDisplayLabel(gotraEnglish: string, gotraHindi: string): string {
  return `${gotraEnglish} (${gotraHindi})`;
}

async function ensureAaknaMaster(
  prisma: PrismaClient,
  name: string,
  cache: Map<string, number>
): Promise<number> {
  const cached = cache.get(name);
  if (cached != null) return cached;

  const row = await prisma.aaknaMaster.upsert({
    where: { name },
    create: { name },
    update: {},
  });
  cache.set(name, row.id);
  return row.id;
}

export async function seedGotras(prisma: PrismaClient) {
  console.log('  🔱 Seeding Gahoi aakna master + gotras...');

  await prisma.profile.updateMany({ data: { gotraId: null, aaknaId: null } });
  await prisma.profileFamily.updateMany({ data: { maternalUncleAaknaId: null } });
  await prisma.gotraAakna.deleteMany({});
  await prisma.aaknaMaster.deleteMany({});
  await prisma.gotra.deleteMany({});

  const aaknaIdByName = new Map<string, number>();

  for (const name of GAHOI_AAKNA_MASTER) {
    await ensureAaknaMaster(prisma, name, aaknaIdByName);
  }
  console.log(`  ✓ ${GAHOI_AAKNA_MASTER.length} aakna master entries`);

  let junctionCount = 0;
  let addedFromGotra = 0;

  for (const entry of GAHOI_GOTRA_DATA) {
    const name = gotraDisplayLabel(entry.gotraEnglish, entry.gotraHindi);

    const gotra = await prisma.gotra.create({
      data: {
        key: entry.key,
        name,
        gotraHindi: entry.gotraHindi,
        gotraEnglish: entry.gotraEnglish,
        rishi: entry.rishi,
        kuldevi: entry.kuldevi,
      },
    });

    for (const aaknaName of entry.aakna) {
      if (!aaknaIdByName.has(aaknaName)) {
        await ensureAaknaMaster(prisma, aaknaName, aaknaIdByName);
        addedFromGotra += 1;
        console.warn(`  ⚠ Aakna "${aaknaName}" (${entry.key}) not in master list — added`);
      }

      const aaknaMasterId = aaknaIdByName.get(aaknaName)!;
      await prisma.gotraAakna.create({
        data: { gotraId: gotra.id, aaknaMasterId },
      });
      junctionCount += 1;
    }
  }

  console.log(
    `  ✅ ${GAHOI_GOTRA_DATA.length} gotras, ${aaknaIdByName.size} master aaknas, ${junctionCount} gotra↔aakna links` +
      (addedFromGotra > 0 ? ` (${addedFromGotra} from gotra-only)` : '')
  );
}
