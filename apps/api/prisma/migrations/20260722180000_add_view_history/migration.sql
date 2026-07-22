-- CreateTable
CREATE TABLE "ViewHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "resourceType" "ResourceType" NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ViewHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ViewHistory_userId_deleted_viewedAt_idx" ON "ViewHistory"("userId", "deleted", "viewedAt");

-- CreateIndex
CREATE INDEX "ViewHistory_resourceType_idx" ON "ViewHistory"("resourceType");

-- CreateIndex
CREATE INDEX "ViewHistory_resourceId_idx" ON "ViewHistory"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ViewHistory_userId_resourceType_resourceId_key" ON "ViewHistory"("userId", "resourceType", "resourceId");

-- AddForeignKey
ALTER TABLE "ViewHistory" ADD CONSTRAINT "ViewHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
