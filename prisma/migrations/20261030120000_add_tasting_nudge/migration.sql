-- AlterTable
ALTER TABLE "Tasting" ADD COLUMN     "nudgedAt" TIMESTAMP(3),
ADD COLUMN     "nudgedParticipantIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
