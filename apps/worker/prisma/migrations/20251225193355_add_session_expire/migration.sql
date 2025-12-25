-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "country" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT NOW() + interval '30 days',
ADD COLUMN     "isNewDevice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isNewLocation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "riskScore" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
