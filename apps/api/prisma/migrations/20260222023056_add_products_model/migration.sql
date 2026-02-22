-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MONEY', 'CREDITS');

-- DropIndex
DROP INDEX "ProductPurchase_stripeId_key";

-- DropIndex
DROP INDEX "ProductPurchase_userId_productId_key";

-- AlterTable
ALTER TABLE "ProductPurchase" ADD COLUMN     "paymentMethod" "PaymentMethod",
ALTER COLUMN "stripeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '30 days';

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "priceInCents" INTEGER,
    "priceInCredits" INTEGER,
    "requiresSubscription" BOOLEAN NOT NULL DEFAULT false,
    "requiredTier" "SubscriptionTier",
    "contentMarkdown" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_published_idx" ON "Product"("published");

-- CreateIndex
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateIndex
CREATE INDEX "ProductPurchase_paymentMethod_idx" ON "ProductPurchase"("paymentMethod");

-- AddForeignKey
ALTER TABLE "ProductPurchase" ADD CONSTRAINT "ProductPurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
