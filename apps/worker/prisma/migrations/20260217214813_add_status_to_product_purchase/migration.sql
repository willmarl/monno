-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'REFUNDED');

-- AlterTable
ALTER TABLE "ProductPurchase" ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '30 days';
