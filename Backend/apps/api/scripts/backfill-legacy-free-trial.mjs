import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getLaunchAt() {
  return new Date(process.env.FREE_TRIAL_LAUNCH_AT || '2026-03-10T00:00:00.000Z');
}

function nextMonthlyResetAt() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

async function main() {
  const launchAt = getLaunchAt();
  console.log(`[Backfill] FREE_TRIAL_LAUNCH_AT = ${launchAt.toISOString()}`);

  const legacyUsers = await prisma.user.findMany({
    where: {
      createdAt: { lt: launchAt },
    },
    select: {
      id: true,
      email: true,
      Subscription: {
        select: {
          id: true,
          plan: true,
        },
      },
    },
  });

  const usersWithoutSubscription = legacyUsers.filter((user) => !user.Subscription);
  if (usersWithoutSubscription.length > 0) {
    await prisma.subscription.createMany({
      data: usersWithoutSubscription.map((user) => ({
        id: randomUUID(),
        userId: user.id,
        plan: 'free',
        status: 'active',
        creditsRemaining: 2,
        creditsResetAt: nextMonthlyResetAt(),
        legacyFree: true,
        requiresPayment: false,
        updatedAt: new Date(),
      })),
    });
  }

  const updateResult = await prisma.subscription.updateMany({
    where: {
      userId: { in: legacyUsers.map((user) => user.id) },
      plan: 'free',
    },
    data: {
      status: 'active',
      legacyFree: true,
      requiresPayment: false,
    },
  });

  console.log(`[Backfill] Marked ${updateResult.count} free subscriptions as legacy_free`);
  console.log(`[Backfill] Created ${usersWithoutSubscription.length} missing legacy subscriptions`);
}

main()
  .catch((error) => {
    console.error('[Backfill] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
