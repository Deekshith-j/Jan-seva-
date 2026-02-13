-- Create States table
CREATE TABLE IF NOT EXISTS states (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Districts table
CREATE TABLE IF NOT EXISTS districts (
  id TEXT PRIMARY KEY,
  state_id TEXT REFERENCES states(id) NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add district_id to offices if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offices' AND column_name = 'district_id') THEN
        ALTER TABLE offices ADD COLUMN district_id TEXT REFERENCES districts(id);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "States are viewable by everyone" ON states FOR SELECT USING (true);
CREATE POLICY "Districts are viewable by everyone" ON districts FOR SELECT USING (true);
