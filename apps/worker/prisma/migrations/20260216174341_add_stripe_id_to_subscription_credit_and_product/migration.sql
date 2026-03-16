/*
  Warnings:

  - You are about to drop the column `stripeSessionId` on the `CreditPurchase` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeId]` on the table `CreditPurchase` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeId]` on the table `ProductPurchase` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CreditPurchase_stripeSessionId_key";

-- AlterTable
ALTER TABLE "CreditPurchase" DROP COLUMN "stripeSessionId",
ADD COLUMN     "stripeId" TEXT;

-- AlterTable
ALTER TABLE "ProductPurchase" ADD COLUMN     "stripeId" TEXT;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '30 days';

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "stripeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CreditPurchase_stripeId_key" ON "CreditPurchase"("stripeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPurchase_stripeId_key" ON "ProductPurchase"("stripeId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeId_key" ON "Subscription"("stripeId");
