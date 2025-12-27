-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '30 days';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
