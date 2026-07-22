-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COMMENT', 'LIKE');

-- AlterTable
ALTER TABLE "UserPreferences" ADD COLUMN "notifyInAppComments" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserPreferences" ADD COLUMN "notifyInAppLikes" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserPreferences" ADD COLUMN "notifyEmailComments" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "UserPreferences" ADD COLUMN "notifyEmailLikes" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "recipientId" INTEGER NOT NULL,
    "actorId" INTEGER,
    "type" "NotificationType" NOT NULL,
    "resourceType" "ResourceType" NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "message" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_idx" ON "Notification"("recipientId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_recipientId_readAt_idx" ON "Notification"("recipientId", "readAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
