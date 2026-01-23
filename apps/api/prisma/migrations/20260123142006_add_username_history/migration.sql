-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '30 days';

-- CreateTable
CREATE TABLE "UsernameHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "freedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "UsernameHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsernameHistory_userId_idx" ON "UsernameHistory"("userId");

-- CreateIndex
CREATE INDEX "UsernameHistory_username_idx" ON "UsernameHistory"("username");

-- AddForeignKey
ALTER TABLE "UsernameHistory" ADD CONSTRAINT "UsernameHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
