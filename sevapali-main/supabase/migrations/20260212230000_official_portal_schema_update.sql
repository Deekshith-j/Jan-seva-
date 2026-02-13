-- Add new status to enum (if not exists logic is tricky for enums, so we just try/catch or assume it works in dev)
ALTER TYPE "public"."token_status" ADD VALUE IF NOT EXISTS 'checked_in';

-- Add columns for Official Portal workflow
ALTER TABLE "public"."tokens" 
ADD COLUMN IF NOT EXISTS "documents_verified" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "checked_in_at" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "counter_number" TEXT;

-- Index for realtime queue ordering
CREATE INDEX IF NOT EXISTS "idx_tokens_office_status_checkin" 
ON "public"."tokens" ("office_id", "status", "checked_in_at");
