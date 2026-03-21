import { PrismaService } from '../dist/prisma.service.js';
import { QueueService } from '../dist/queues/queue.service.js';
import { LifecycleEmailService } from '../dist/subscription/lifecycle-email.service.js';
import { SubscriptionService } from '../dist/subscription/subscription.service.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();

  const queue = new QueueService();
  const lifecycle = new LifecycleEmailService(prisma, queue);
  const service = new SubscriptionService(prisma, lifecycle);
  try {
    const launchAt = process.env.FREE_TRIAL_LAUNCH_AT || '2026-03-10T00:00:00.000Z';
    console.log(`[Test] FREE_TRIAL_LAUNCH_AT=${launchAt}`);

    const backfilledLegacy = await prisma.subscription.findUnique({
      where: { userId: 'legacy_no_sub' },
    });
    assert(backfilledLegacy?.legacyFree === true, 'legacy_no_sub should be backfilled as legacy_free');
    assert(backfilledLegacy?.plan === 'free', 'legacy_no_sub should stay on free after backfill');

    const existingLegacy = await prisma.subscription.findUnique({
      where: { userId: 'legacy_free_sub' },
    });
    assert(existingLegacy?.legacyFree === true, 'legacy_free_sub should be marked legacy_free');

    await prisma.user.upsert({
      where: { id: 'new_trial_user' },
      update: {},
      create: {
        id: 'new_trial_user',
        email: 'new-trial-user@example.com',
        createdAt: new Date('2026-03-11T09:00:00Z'),
      },
    });

    const newTrial = await service.getOrCreateSubscription('new_trial_user', 'new-trial-user@example.com');
    assert(newTrial.status === 'trialing', 'new_trial_user should start in trialing state');
    assert(newTrial.plan === 'pro', 'new_trial_user should receive pro during trial');
    assert(newTrial.accessState === 'trialing', 'new_trial_user accessState should be trialing');

    const legacyStarted = await service.startTrial('legacy_no_sub', 'legacy-no-sub@example.com');
    assert(legacyStarted.status === 'trialing', 'legacy_no_sub should become trialing after opt-in');
    assert(legacyStarted.legacyFree === true, 'legacy_no_sub should remain flagged legacyFree');

    const lifecycleLogs = await prisma.lifecycleEmailLog.count({
      where: { userId: 'legacy_no_sub' },
    });
    assert(lifecycleLogs === 6, 'legacy_no_sub should schedule 6 lifecycle emails');

    await prisma.subscription.update({
      where: { userId: 'legacy_no_sub' },
      data: {
        status: 'trialing',
        trialEndsAt: new Date('2026-03-09T00:00:00Z'),
        updatedAt: new Date(),
      },
    });

    const legacyAfterExpiry = await service.getOrCreateSubscription('legacy_no_sub', 'legacy-no-sub@example.com');
    assert(legacyAfterExpiry.plan === 'free', 'legacy_no_sub should return to free after expired legacy trial');
    assert(legacyAfterExpiry.accessState === 'legacy_free', 'legacy_no_sub should return to legacy_free access');

    await prisma.subscription.update({
      where: { userId: 'new_trial_user' },
      data: {
        status: 'trialing',
        trialEndsAt: new Date('2026-03-09T00:00:00Z'),
        requiresPayment: false,
        updatedAt: new Date(),
      },
    });

    const newAfterExpiry = await service.getOrCreateSubscription('new_trial_user', 'new-trial-user@example.com');
    assert(newAfterExpiry.accessState === 'trial_expired', 'new_trial_user should become trial_expired after the trial ends');
    assert(newAfterExpiry.requiresPayment === true, 'new_trial_user should require payment after expiry');
    assert(Array.isArray(newAfterExpiry.features) && newAfterExpiry.features.length === 0, 'trial_expired users should not expose active features');
    assert(newAfterExpiry.creditsTotal === 0, 'trial_expired users should expose 0 included credits');

    await prisma.user.upsert({
      where: { id: 'pack_user' },
      update: {},
      create: {
        id: 'pack_user',
        email: 'pack-user@example.com',
        createdAt: new Date('2026-03-11T10:00:00Z'),
      },
    });

    await service.handleStripeEvent({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_pack_test',
          client_reference_id: 'pack_user',
          customer_email: 'pack-user@example.com',
          customer: 'cus_pack_test',
          subscription: null,
          metadata: {
            userId: 'pack_user',
            packType: 'pack_decouverte',
          },
        },
      },
    });

    const packUser = await service.getOrCreateSubscription('pack_user', 'pack-user@example.com');
    assert(packUser.accessState === 'pack_active', 'pack_user should be in pack_active state after pack purchase');
    assert(packUser.packActive === true, 'pack_user should expose packActive=true');
    assert(packUser.packCreditsRemaining === 5, 'pack_user should receive the purchased pack credits');

    const packUserHasExport = await service.hasFeature('pack_user', 'export_pdf');
    assert(packUserHasExport === true, 'pack_user should unlock PDF export after a pack purchase');
    const packUserLifecycleEmails = await prisma.lifecycleEmailLog.count({
      where: { userId: 'pack_user' },
    });
    assert(packUserLifecycleEmails === 0, 'pack_user should not schedule trial lifecycle emails after a pack purchase');

    const summary = {
      backfillLegacyNoSub: {
        legacyFree: backfilledLegacy.legacyFree,
        plan: backfilledLegacy.plan,
      },
      newTrialUser: {
        status: newTrial.status,
        accessState: newTrial.accessState,
        plan: newTrial.plan,
      },
      legacyOptInTrial: {
        status: legacyStarted.status,
        lifecycleEmails: lifecycleLogs,
      },
      expiryOutcomes: {
        legacy: {
          plan: legacyAfterExpiry.plan,
          accessState: legacyAfterExpiry.accessState,
        },
        newUser: {
          plan: newAfterExpiry.plan,
          accessState: newAfterExpiry.accessState,
          requiresPayment: newAfterExpiry.requiresPayment,
        },
      },
      packUser: {
        accessState: packUser.accessState,
        packActive: packUser.packActive,
        packCreditsRemaining: packUser.packCreditsRemaining,
        exportPdfUnlocked: packUserHasExport,
        lifecycleEmails: packUserLifecycleEmails,
      },
    };

    console.log('[Test] Free-trial local integration summary:');
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await prisma.$disconnect();
    await queue.lifecycleEmailQueue.close();
    await queue.lifecycleEmailEvents.close();
    await queue.generateQueue.close();
    await queue.generateEvents.close();
    await queue.exportQueue.close();
    await queue.exportEvents.close();
    await queue.regenerateSlideQueue.close();
    await queue.regenerateSlideEvents.close();
    await queue.modifyColorPaletteQueue.close();
    await queue.modifyColorPaletteEvents.close();
    await queue.addSlideQueue.close();
    await queue.addSlideEvents.close();
    await queue.translateDeckQueue.close();
    await queue.translateDeckEvents.close();
    await queue.analyzeImageQueue.close();
    await queue.analyzeImageEvents.close();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('[Test] Failed:', error);
    process.exit(1);
  });
