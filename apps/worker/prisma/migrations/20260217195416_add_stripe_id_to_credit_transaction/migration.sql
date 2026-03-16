-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN     "stripeId" TEXT;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '30 days';
