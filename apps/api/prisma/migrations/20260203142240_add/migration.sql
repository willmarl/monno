-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CollectionItem" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '30 days';

-- CreateIndex
CREATE INDEX "Collection_deleted_idx" ON "Collection"("deleted");

-- CreateIndex
CREATE INDEX "CollectionItem_deleted_idx" ON "CollectionItem"("deleted");
