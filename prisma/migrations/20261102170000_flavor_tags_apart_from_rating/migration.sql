-- CreateTable
CREATE TABLE "FlavorTags" (
    "tastingBeerId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlavorTags_pkey" PRIMARY KEY ("tastingBeerId","participantId")
);

-- AddForeignKey
ALTER TABLE "FlavorTags" ADD CONSTRAINT "FlavorTags_tastingBeerId_fkey" FOREIGN KEY ("tastingBeerId") REFERENCES "TastingBeer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlavorTags" ADD CONSTRAINT "FlavorTags_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tags already saved with a rating move over; Rating.tags stays until the old deploy is gone
INSERT INTO "FlavorTags" ("tastingBeerId", "participantId", "tags", "updatedAt")
SELECT "tastingBeerId", "participantId", "tags", "updatedAt"
FROM "Rating"
WHERE cardinality("tags") > 0;
