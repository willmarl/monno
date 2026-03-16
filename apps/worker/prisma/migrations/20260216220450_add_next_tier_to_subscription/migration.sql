/*
  Warnings:

  - Made the column `stripeId` on table `CreditPurchase` required. This step will fail if there are existing NULL values in that column.
  - Made the column `stripeId` on table `ProductPurchase` required. This step will fail if there are existing NULL values in that column.
  - Made the column `stripeId` on table `Subscription` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CreditPurchase" ALTER COLUMN "stripeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProductPurchase" ALTER COLUMN "stripeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '30 days';

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "nexTier" "SubscriptionTier",
ALTER COLUMN "stripeId" SET NOT NULL;
