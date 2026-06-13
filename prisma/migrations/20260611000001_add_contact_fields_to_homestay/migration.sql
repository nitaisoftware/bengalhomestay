-- Add contact fields to homestays table
-- These are stored but only exposed via the API when isPremium = true

ALTER TABLE "homestays" ADD COLUMN "phone" TEXT;
ALTER TABLE "homestays" ADD COLUMN "contactEmail" TEXT;
