-- Add department_id to tokens table to enable efficient routing
ALTER TABLE tokens 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- Create index for faster filtering by department
CREATE INDEX IF NOT EXISTS idx_tokens_department_id ON tokens(department_id);

-- Optional: Backfill department_id for existing tokens based on service or office
-- (Skip for now as we don't have historical data mapping easily without complex logic)
