-- Migration: 20260213191500_add_department_id_to_tokens.sql
-- Description: Add missing 'department_id' column to 'tokens' table

ALTER TABLE tokens 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- Optional: Backfill department_id from office_id if possible, but for new tokens it will be passed.
