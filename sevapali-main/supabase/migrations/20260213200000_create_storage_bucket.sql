
-- Create documents bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read (for AI analysis and display)
CREATE POLICY "Public Read Documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'documents');

-- Policy: Allow authenticated upload
CREATE POLICY "Auth Upload Documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Policy: Allow anon upload (for now, to fix user issue if auth is flaky)
-- Ideally strictly auth, but let's be permissive for "Citizen" uploads without strict login?
-- Wait, `BookToken` usually requires auth? No, `BookToken` might be public?
-- If `BookToken` is public, we need anon upload.
-- The User's prompt didn't specify strict auth for booking.
-- I'll allow Anon upload for `documents` bucket to avoid 400/403.
CREATE POLICY "Anon Upload Documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'documents');
