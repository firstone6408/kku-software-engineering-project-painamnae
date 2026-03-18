-- CreateEnum
CREATE TYPE "SharingStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'STOPPED');

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "lineUserId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationSharingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "intervalMinutes" INTEGER NOT NULL DEFAULT 10,
    "status" "SharingStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLatitude" DOUBLE PRECISION,
    "lastLongitude" DOUBLE PRECISION,
    "lastAddress" TEXT,
    "lastSentAt" TIMESTAMP(3),
    "nextSendAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "stoppedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationSharingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EmergencyContactToLocationSharingSession" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "EmergencyContact_userId_idx" ON "EmergencyContact"("userId");

-- CreateIndex
CREATE INDEX "LocationSharingSession_userId_idx" ON "LocationSharingSession"("userId");

-- CreateIndex
CREATE INDEX "LocationSharingSession_status_idx" ON "LocationSharingSession"("status");

-- CreateIndex
CREATE INDEX "LocationSharingSession_nextSendAt_idx" ON "LocationSharingSession"("nextSendAt");

-- CreateIndex
CREATE UNIQUE INDEX "_EmergencyContactToLocationSharingSession_AB_unique" ON "_EmergencyContactToLocationSharingSession"("A", "B");

-- CreateIndex
CREATE INDEX "_EmergencyContactToLocationSharingSession_B_index" ON "_EmergencyContactToLocationSharingSession"("B");

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationSharingSession" ADD CONSTRAINT "LocationSharingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmergencyContactToLocationSharingSession" ADD CONSTRAINT "_EmergencyContactToLocationSharingSession_A_fkey" FOREIGN KEY ("A") REFERENCES "EmergencyContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmergencyContactToLocationSharingSession" ADD CONSTRAINT "_EmergencyContactToLocationSharingSession_B_fkey" FOREIGN KEY ("B") REFERENCES "LocationSharingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
