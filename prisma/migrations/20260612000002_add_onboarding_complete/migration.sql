-- Add onboardingComplete flag to users table
ALTER TABLE "users" ADD COLUMN "onboardingComplete" BOOLEAN NOT NULL DEFAULT false;
