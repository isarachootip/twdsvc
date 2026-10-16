-- Phase 3.1: Add reversible isTest flag to jobs table
-- Safe to run multiple times (idempotent)

-- Forward migration:
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "isTest" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "jobs_isTest_idx" ON "jobs"("isTest");

-- Rollback (if ever needed):
-- DROP INDEX IF EXISTS "jobs_isTest_idx";
-- ALTER TABLE "jobs" DROP COLUMN IF EXISTS "isTest";
