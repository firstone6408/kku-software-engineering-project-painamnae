/*
  Warnings:

  - You are about to drop the column `firstName` on the `EmergencyContact` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `EmergencyContact` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[lineLinkToken]` on the table `EmergencyContact` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lineLinkToken` to the `EmergencyContact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `EmergencyContact` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmergencyContact" DROP COLUMN "firstName",
DROP COLUMN "lastName",
ADD COLUMN     "lineLinkStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "lineLinkToken" TEXT NOT NULL,
ADD COLUMN     "lineLinkedAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "lineUserId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyContact_lineLinkToken_key" ON "EmergencyContact"("lineLinkToken");

-- CreateIndex
CREATE INDEX "EmergencyContact_lineLinkToken_idx" ON "EmergencyContact"("lineLinkToken");
