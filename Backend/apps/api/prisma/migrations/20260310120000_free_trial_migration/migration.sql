ALTER TABLE "public"."Subscription"
ADD COLUMN "trialStartedAt" TIMESTAMP(3),
ADD COLUMN "trialEndsAt" TIMESTAMP(3),
ADD COLUMN "trialConsumedAt" TIMESTAMP(3),
ADD COLUMN "legacyFree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "requiresPayment" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Subscription_status_trialEndsAt_idx"
ON "public"."Subscription"("status", "trialEndsAt");

CREATE TABLE "public"."LifecycleEmailLog" (
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

    CONSTRAINT "LifecycleEmailLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LifecycleEmailLog_dedupeKey_key"
ON "public"."LifecycleEmailLog"("dedupeKey");

CREATE INDEX "LifecycleEmailLog_userId_emailType_idx"
ON "public"."LifecycleEmailLog"("userId", "emailType");

CREATE INDEX "LifecycleEmailLog_status_scheduledFor_idx"
ON "public"."LifecycleEmailLog"("status", "scheduledFor");

ALTER TABLE "public"."LifecycleEmailLog"
ADD CONSTRAINT "LifecycleEmailLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
