ALTER TABLE "public"."LifecycleEmailLog"
ADD COLUMN "templateSlug" TEXT,
ADD COLUMN "templateVersion" INTEGER,
ADD COLUMN "flowSlug" TEXT,
ADD COLUMN "flowVersion" INTEGER,
ADD COLUMN "providerMessageId" TEXT,
ADD COLUMN "statusReason" TEXT;

CREATE TABLE "public"."OpsEmailTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "kind" TEXT NOT NULL DEFAULT 'marketing',
    "draftJson" JSONB,
    "liveJson" JSONB,
    "draftVersion" INTEGER NOT NULL DEFAULT 1,
    "liveVersion" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsEmailTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."OpsEmailFlow" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'marketing',
    "emailTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "sendWindowStart" TEXT NOT NULL DEFAULT '09:00',
    "sendWindowEnd" TEXT NOT NULL DEFAULT '18:00',
    "weekdaysOnly" BOOLEAN NOT NULL DEFAULT true,
    "draftConfig" JSONB,
    "liveConfig" JSONB,
    "draftVersion" INTEGER NOT NULL DEFAULT 1,
    "liveVersion" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsEmailFlow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."OpsEmailPreference" (
    "userId" TEXT NOT NULL,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT true,
    "marketingUnsubscribedAt" TIMESTAMP(3),
    "unsubscribeToken" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsEmailPreference_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "public"."MetricSnapshot" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "bucketStart" TIMESTAMP(3) NOT NULL,
    "bucketEnd" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OpsEmailTemplate_slug_key" ON "public"."OpsEmailTemplate"("slug");
CREATE UNIQUE INDEX "OpsEmailFlow_slug_key" ON "public"."OpsEmailFlow"("slug");
CREATE UNIQUE INDEX "OpsEmailPreference_unsubscribeToken_key" ON "public"."OpsEmailPreference"("unsubscribeToken");
CREATE UNIQUE INDEX "MetricSnapshot_key_bucket_bucketStart_bucketEnd_key" ON "public"."MetricSnapshot"("key", "bucket", "bucketStart", "bucketEnd");

CREATE INDEX "OpsEmailTemplate_category_locale_idx" ON "public"."OpsEmailTemplate"("category", "locale");
CREATE INDEX "OpsEmailFlow_category_enabled_idx" ON "public"."OpsEmailFlow"("category", "enabled");
CREATE INDEX "MetricSnapshot_key_bucketStart_idx" ON "public"."MetricSnapshot"("key", "bucketStart");

ALTER TABLE "public"."OpsEmailPreference"
ADD CONSTRAINT "OpsEmailPreference_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
