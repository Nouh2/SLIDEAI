ALTER TABLE "public"."brand_kits"
ADD COLUMN IF NOT EXISTS "org_id" TEXT;

CREATE INDEX IF NOT EXISTS "brand_kits_org_id_idx"
ON "public"."brand_kits"("org_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'brand_kits_org_id_fkey'
  ) THEN
    ALTER TABLE "public"."brand_kits"
    ADD CONSTRAINT "brand_kits_org_id_fkey"
    FOREIGN KEY ("org_id")
    REFERENCES "public"."Org"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;
END $$;
