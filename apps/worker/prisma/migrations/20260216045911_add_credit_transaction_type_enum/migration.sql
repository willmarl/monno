/*
  Warnings:

  - Changed the type of `type` on the `CreditTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('PURCHASE', 'SPEND', 'REFUND', 'ADMIN_ADJUST');

-- AlterTable
ALTER TABLE "CreditTransaction" DROP COLUMN "type",
ADD COLUMN     "type" "CreditTransactionType" NOT NULL;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '30 days';
