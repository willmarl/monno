/*
  Warnings:

  - You are about to drop the column `postId` on the `Like` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,resourceType,resourceId]` on the table `Like` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `resourceId` to the `Like` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resourceType` to the `Like` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('POST', 'VIDEO', 'ARTICLE');

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_postId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_userId_fkey";

-- DropIndex
DROP INDEX "Like_userId_postId_key";

-- AlterTable
ALTER TABLE "Like" DROP COLUMN "postId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "resourceId" INTEGER NOT NULL,
ADD COLUMN     "resourceType" "ResourceType" NOT NULL;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '30 days';

-- CreateIndex
CREATE INDEX "Like_resourceType_idx" ON "Like"("resourceType");

-- CreateIndex
CREATE INDEX "Like_userId_idx" ON "Like"("userId");

-- CreateIndex
CREATE INDEX "Like_resourceId_idx" ON "Like"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_resourceType_resourceId_key" ON "Like"("userId", "resourceType", "resourceId");

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
