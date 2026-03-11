import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const prisma = new PrismaClient();

const DAY_MS = 24 * 60 * 60 * 1000;

const PLANS = {
  onboarding: [
    'signup_day1_no_presentation',
    'signup_day3_no_presentation',
    'signup_day5_activated',
  ],
  trial: [
    'trial_welcome',
    'trial_inactive_day1',
    'trial_value_day4',
    'trial_ending_day6',
    'trial_expired',
  ],
  pack: [
    'pack_purchase_confirmation',
    'pack_low_balance',
    'pack_exhausted',
  ],
  inactivity: [
    'inactive_7d',
    'inactive_14d',
    'inactive_21d_offer',
  ],
  cancel: [
    'cancel_confirmation',
    'cancel_day3_winback',
  ],
  billing: [
    'failed_payment_day0',
  ],
};

const VALID_TYPES = new Set(Object.values(PLANS).flat().concat('trial_winback_day2'));

function parseArgs(argv) {
  const args = {};

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = 'true';
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function usage() {
  console.log(`
Usage:
  node scripts/trigger-lifecycle-smoke.mjs --email <user@email> --type <emailType>
  node scripts/trigger-lifecycle-smoke.mjs --user-id <userId> --plan <plan>

Options:
  --email <email>           Resolve the public.User by email
  --user-id <id>            Resolve the public.User by id
  --send-to <email>         Override the destination inbox
  --type <emailType>        Trigger one lifecycle email immediately
  --plan <plan>             Trigger a predefined batch immediately
  --force <true|false>      Bypass normal worker conditions (default: true)
  --list                    Print available plans and email types

Plans:
  ${Object.keys(PLANS).join(', ')}

Email types:
  ${Array.from(VALID_TYPES).join(', ')}
`);
}

function getRedisUrl() {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || '6379';
  const password = process.env.REDIS_PASSWORD;

  if (password) {
    return `redis://:${password}@${host}:${port}`;
  }

  return `redis://${host}:${port}`;
}

function boolValue(value, defaultValue = true) {
  if (value == null) return defaultValue;
  return value !== 'false';
}

function buildPayload({ emailType, user, subscription, scopeKey, forceSend }) {
  const now = new Date();
  const trialStartedAt = subscription?.trialStartedAt || now;
  const trialEndsAt = subscription?.trialEndsAt || new Date(now.getTime() + 7 * DAY_MS);
  const creditsRemaining = subscription?.creditsRemaining ?? 2;

  return {
    email: user.email,
    scopeKey,
    forceSend,
    signupAt: user.createdAt.toISOString(),
    activityAt: now.toISOString(),
    trialStartedAt: trialStartedAt.toISOString(),
    trialEndsAt: trialEndsAt.toISOString(),
    legacyFree: Boolean(subscription?.legacyFree),
    canceledAt: now.toISOString(),
    invoiceId: `manual_invoice_${randomUUID()}`,
    amountDue: 2900,
    currency: 'eur',
    packType: 'manual_smoke',
    creditsPurchased: 5,
    creditsBalance: creditsRemaining,
    creditsRemaining: emailType === 'pack_exhausted' ? 0 : creditsRemaining,
  };
}

async function resolveUser(args) {
  if (args.email) {
    return prisma.user.findUnique({
      where: { email: args.email },
      include: { Subscription: true },
    });
  }

  if (args['user-id']) {
    return prisma.user.findUnique({
      where: { id: args['user-id'] },
      include: { Subscription: true },
    });
  }

  throw new Error('Provide --email or --user-id');
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.list === 'true') {
    usage();
    return;
  }

  const forceSend = boolValue(args.force, true);
  const requestedPlan = args.plan;
  const requestedType = args.type;

  if (!requestedPlan && !requestedType) {
    usage();
    throw new Error('Provide --type or --plan');
  }

  if (requestedPlan && !PLANS[requestedPlan]) {
    throw new Error(`Unknown plan "${requestedPlan}"`);
  }

  if (requestedType && !VALID_TYPES.has(requestedType)) {
    throw new Error(`Unknown email type "${requestedType}"`);
  }

  const user = await resolveUser(args);
  if (!user?.email) {
    throw new Error('User not found or user has no email');
  }

  const destination = args['send-to'] || user.email;
  const emailTypes = requestedPlan ? PLANS[requestedPlan] : [requestedType];
  const subscription = user.Subscription || null;

  const redisUrl = getRedisUrl();
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
  const queue = new Queue('lifecycle-email', { connection });

  const scheduled = [];

  for (const emailType of emailTypes) {
    const scopeKey = `manual_${Date.now()}_${emailType}_${randomUUID().slice(0, 8)}`;
    const dedupeKey = `${emailType}__${user.id}__${scopeKey}`;
    const payload = buildPayload({
      emailType,
      user,
      subscription,
      scopeKey,
      forceSend,
    });

    await prisma.lifecycleEmailLog.create({
      data: {
        dedupeKey,
        userId: user.id,
        emailType,
        scheduledFor: new Date(),
        payload: {
          ...payload,
          email: destination,
        },
      },
    });

    await queue.add(
      'lifecycle-email',
      {
        userId: user.id,
        email: destination,
        emailType,
        dedupeKey,
        ...payload,
      },
      {
        jobId: dedupeKey,
        removeOnComplete: 500,
        removeOnFail: 500,
      },
    );

    scheduled.push({
      emailType,
      dedupeKey,
      to: destination,
      forced: forceSend,
    });
  }

  console.log(JSON.stringify({
    userId: user.id,
    userEmail: user.email,
    destination,
    forceSend,
    scheduled,
  }, null, 2));

  await queue.close();
  await connection.quit();
}

main()
  .catch((error) => {
    console.error('[LifecycleSmoke] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
