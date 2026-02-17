/*
  Warnings:

  - You are about to drop the column `nexTier` on the `Subscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '30 days';

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "nexTier",
ADD COLUMN     "nextTier" "SubscriptionTier";
