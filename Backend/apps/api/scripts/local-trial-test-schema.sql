CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE IF NOT EXISTS public."User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON public."User"("email");

CREATE TABLE IF NOT EXISTS public."Subscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "plan" TEXT NOT NULL DEFAULT 'free',
  "status" TEXT NOT NULL DEFAULT 'active',
  "creditsRemaining" INTEGER NOT NULL DEFAULT 1,
  "creditsResetAt" TIMESTAMP(3),
  "trialStartedAt" TIMESTAMP(3),
  "trialEndsAt" TIMESTAMP(3),
  "trialConsumedAt" TIMESTAMP(3),
  "legacyFree" BOOLEAN NOT NULL DEFAULT false,
  "requiresPayment" BOOLEAN NOT NULL DEFAULT false,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "currentPeriodEnd" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_key" ON public."Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_status_trialEndsAt_idx" ON public."Subscription"("status", "trialEndsAt");

CREATE TABLE IF NOT EXISTS public."LifecycleEmailLog" (
  "id" TEXT NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "emailType" TEXT NOT NULL,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'pending',
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LifecycleEmailLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LifecycleEmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "LifecycleEmailLog_dedupeKey_key" ON public."LifecycleEmailLog"("dedupeKey");
CREATE INDEX IF NOT EXISTS "LifecycleEmailLog_userId_emailType_idx" ON public."LifecycleEmailLog"("userId", "emailType");
CREATE INDEX IF NOT EXISTS "LifecycleEmailLog_status_scheduledFor_idx" ON public."LifecycleEmailLog"("status", "scheduledFor");

CREATE TABLE IF NOT EXISTS public.presentations (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  theme TEXT,
  status TEXT NOT NULL DEFAULT 'ready',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL,
  share_token TEXT,
  shared_with_user_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  view_only_token TEXT,
  view_only_user_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "orgId" TEXT,
  CONSTRAINT "presentations_pkey" PRIMARY KEY (id)
);
