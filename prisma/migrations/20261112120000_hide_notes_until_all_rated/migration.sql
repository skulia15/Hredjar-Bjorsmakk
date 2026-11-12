-- AlterTable
ALTER TABLE "Tasting" ADD COLUMN IF NOT EXISTS "hideNotesUntilAllRated" BOOLEAN NOT NULL DEFAULT false;

-- Notes used to be hidden exactly when scores were, so existing tastings keep that behaviour
UPDATE "Tasting" SET "hideNotesUntilAllRated" = "hideScoresUntilAllRated";
