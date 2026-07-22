-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable Post
ALTER TABLE "Post" ADD COLUMN "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC';
CREATE INDEX "Post_visibility_idx" ON "Post"("visibility");
CREATE INDEX "Post_deleted_idx" ON "Post"("deleted");

-- AlterTable Collection (default PRIVATE — closes public-by-id IDOR)
ALTER TABLE "Collection" ADD COLUMN "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE';
CREATE INDEX "Collection_visibility_idx" ON "Collection"("visibility");
