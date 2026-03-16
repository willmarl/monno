/*
  Warnings:

  - You are about to drop the column `amount` on the `ProductPurchase` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `ProductPurchase` table. All the data in the column will be lost.
  - You are about to drop the column `productName` on the `ProductPurchase` table. All the data in the column will be lost.
  - You are about to drop the column `productType` on the `ProductPurchase` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSessionId` on the `ProductPurchase` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ProductPurchase_stripeSessionId_key";

-- AlterTable
ALTER TABLE "ProductPurchase" DROP COLUMN "amount",
DROP COLUMN "currency",
DROP COLUMN "productName",
DROP COLUMN "productType",
DROP COLUMN "stripeSessionId";

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '30 days';
