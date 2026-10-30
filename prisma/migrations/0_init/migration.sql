-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "tastingId" TEXT NOT NULL,
    "userId" TEXT,
    "code" TEXT NOT NULL,
    "rejoinToken" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brewery" TEXT NOT NULL,
    "styles" TEXT[],
    "abv" DOUBLE PRECISION,
    "country" TEXT,
    "imageUrl" TEXT,
    "description" TEXT,
    "containerSize" INTEGER,
    "containerType" TEXT,
    "productNumber" TEXT,
    "vinbudinUrl" TEXT,
    "priceISK" DOUBLE PRECISION,
    "pricePerLiter" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tasting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "currentTastingBeerId" TEXT,
    "createdBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "nudgedAt" TIMESTAMP(3),
    "nudgedParticipantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tasting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TastingBeer" (
    "id" TEXT NOT NULL,
    "tastingId" TEXT NOT NULL,
    "beerId" TEXT,
    "customName" TEXT,
    "customBrewery" TEXT,
    "customStyle" TEXT,
    "customAbv" DOUBLE PRECISION,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'untasted',
    "currentSince" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TastingBeer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "tastingId" TEXT NOT NULL,
    "tastingBeerId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_auth" (
    "id" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "admin_auth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_rejoinToken_key" ON "Participant"("rejoinToken");

-- CreateIndex
CREATE INDEX "Participant_rejoinToken_idx" ON "Participant"("rejoinToken");

-- CreateIndex
CREATE INDEX "Participant_tastingId_active_idx" ON "Participant"("tastingId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_tastingId_userId_key" ON "Participant"("tastingId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_tastingId_code_key" ON "Participant"("tastingId", "code");

-- CreateIndex
CREATE INDEX "Beer_name_idx" ON "Beer"("name");

-- CreateIndex
CREATE INDEX "Beer_brewery_idx" ON "Beer"("brewery");

-- CreateIndex
CREATE INDEX "Beer_productNumber_idx" ON "Beer"("productNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Beer_name_brewery_containerSize_containerType_key" ON "Beer"("name", "brewery", "containerSize", "containerType");

-- CreateIndex
CREATE INDEX "Tasting_status_idx" ON "Tasting"("status");

-- CreateIndex
CREATE INDEX "Tasting_createdAt_idx" ON "Tasting"("createdAt");

-- CreateIndex
CREATE INDEX "TastingBeer_tastingId_status_idx" ON "TastingBeer"("tastingId", "status");

-- CreateIndex
CREATE INDEX "TastingBeer_tastingId_orderIndex_idx" ON "TastingBeer"("tastingId", "orderIndex");

-- CreateIndex
CREATE INDEX "TastingBeer_beerId_idx" ON "TastingBeer"("beerId");

-- CreateIndex
CREATE INDEX "Rating_tastingBeerId_idx" ON "Rating"("tastingBeerId");

-- CreateIndex
CREATE INDEX "Rating_participantId_idx" ON "Rating"("participantId");

-- CreateIndex
CREATE INDEX "Rating_tastingId_idx" ON "Rating"("tastingId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_tastingBeerId_participantId_key" ON "Rating"("tastingBeerId", "participantId");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_tastingId_fkey" FOREIGN KEY ("tastingId") REFERENCES "Tasting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TastingBeer" ADD CONSTRAINT "TastingBeer_tastingId_fkey" FOREIGN KEY ("tastingId") REFERENCES "Tasting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TastingBeer" ADD CONSTRAINT "TastingBeer_beerId_fkey" FOREIGN KEY ("beerId") REFERENCES "Beer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_tastingId_fkey" FOREIGN KEY ("tastingId") REFERENCES "Tasting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_tastingBeerId_fkey" FOREIGN KEY ("tastingBeerId") REFERENCES "TastingBeer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

