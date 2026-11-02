-- AlterTable
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "pausedAt" TIMESTAMP(3);
