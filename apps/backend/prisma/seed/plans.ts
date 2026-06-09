import { PrismaClient } from '@prisma/client';

export async function seedPlans(prisma: PrismaClient) {
  console.log('💳 Seeding subscription plans...');
  const plans = [
    {
      name: 'Premium Plan (3 Months)',
      nameHi: 'प्रीमियम प्लान (3 महीने)',
      durationDays: 90,
      priceInr: 999,
      isActive: true,
    },
    {
      name: 'Premium Plan (6 Months)',
      nameHi: 'प्रीमियम प्लान (6 महीने)',
      durationDays: 180,
      priceInr: 1499,
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: {
        id: plan.name === 'Premium Plan (3 Months)' 
          ? 'e32230fa-bd4e-4f51-8d26-cc7b5d63f25c' 
          : 'b883015f-c0c5-430c-ab23-f222956cfbc8'
      },
      update: plan,
      create: {
        id: plan.name === 'Premium Plan (3 Months)' 
          ? 'e32230fa-bd4e-4f51-8d26-cc7b5d63f25c' 
          : 'b883015f-c0c5-430c-ab23-f222956cfbc8',
        ...plan,
      },
    });
  }

  console.log('✅ Subscription plans seeded.');
}
