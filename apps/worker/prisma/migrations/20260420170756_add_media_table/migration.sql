/*
  Warnings:

  - You are about to drop the column `imagePath` on the `Article` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Article" DROP COLUMN "imagePath";

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '30 days';

-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "original" TEXT NOT NULL,
    "thumbnail" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "articleId" INTEGER,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Media_articleId_idx" ON "Media"("articleId");

-- CreateIndex
CREATE INDEX "Media_articleId_sortOrder_idx" ON "Media"("articleId", "sortOrder");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
