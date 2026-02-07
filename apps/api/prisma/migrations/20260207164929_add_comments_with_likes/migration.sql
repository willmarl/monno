/*
  Warnings:

  - You are about to drop the column `authorId` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `parentCommentId` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `commentCount` on the `Post` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `resourceType` on the `Comment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
ALTER TYPE "ResourceType" ADD VALUE 'COMMENT';

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentCommentId_fkey";

-- DropIndex
DROP INDEX "Comment_authorId_idx";

-- DropIndex
DROP INDEX "Comment_createdAt_idx";

-- DropIndex
DROP INDEX "Comment_parentCommentId_idx";

-- DropIndex
DROP INDEX "Comment_resourceType_resourceId_parentCommentId_id_key";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "authorId",
DROP COLUMN "parentCommentId",
ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "userId" INTEGER NOT NULL,
DROP COLUMN "resourceType",
ADD COLUMN     "resourceType" "ResourceType" NOT NULL;

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "commentCount";

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '30 days';

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_resourceType_idx" ON "Comment"("resourceType");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
