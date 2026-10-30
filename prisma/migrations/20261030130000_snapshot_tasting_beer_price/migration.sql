-- AlterTable
ALTER TABLE "TastingBeer" ADD COLUMN IF NOT EXISTS "priceISK" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "pricePerLiter" DOUBLE PRECISION;

-- Backfill existing tastings with the catalog price they were run with
UPDATE "TastingBeer" tb
SET "priceISK" = b."priceISK", "pricePerLiter" = b."pricePerLiter"
FROM "Beer" b
WHERE tb."beerId" = b.id AND tb."priceISK" IS NULL AND tb."pricePerLiter" IS NULL;
