CREATE TABLE "public"."ProductEvent" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductEvent_eventName_occurredAt_idx" ON "public"."ProductEvent"("eventName", "occurredAt");
CREATE INDEX "ProductEvent_userId_eventName_occurredAt_idx" ON "public"."ProductEvent"("userId", "eventName", "occurredAt");

ALTER TABLE "public"."ProductEvent"
ADD CONSTRAINT "ProductEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
