-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateTable
CREATE TABLE "UserPreferences" (
    "userId" INTEGER NOT NULL,
    "theme" "ThemePreference" NOT NULL DEFAULT 'SYSTEM',
    "layout" JSONB NOT NULL DEFAULT '{}',
    "resume" JSONB NOT NULL DEFAULT '{}',
    "onboarding" JSONB NOT NULL DEFAULT '{}',
    "snoozes" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
