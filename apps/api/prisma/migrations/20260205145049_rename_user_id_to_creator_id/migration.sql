/*
  Warnings:

  - You are about to drop the column `userId` on the `Collection` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[creatorId,name]` on the table `Collection` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `creatorId` to the `Collection` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Collection" DROP CONSTRAINT "Collection_userId_fkey";

-- DropIndex
DROP INDEX "Collection_userId_idx";

-- DropIndex
DROP INDEX "Collection_userId_name_key";

-- AlterTable
ALTER TABLE "Collection" DROP COLUMN "userId",
ADD COLUMN     "creatorId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '30 days';

-- CreateIndex
CREATE INDEX "Collection_creatorId_idx" ON "Collection"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_creatorId_name_key" ON "Collection"("creatorId", "name");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
