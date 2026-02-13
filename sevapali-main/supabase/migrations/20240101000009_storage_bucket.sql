-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public can view documents (or restrict to officials if needed, but for now public for simplicity of preview)
-- Ideally: authenticated users (officials) and the uploader content.
-- For this "Real Digital Counter", let's make it authenticated read.

CREATE POLICY "Authenticated users can view documents" 
ON storage.objects FOR SELECT 
TO authenticated 
USING ( bucket_id = 'documents' );

-- Policy: Citizens (authenticated) can upload
CREATE POLICY "Citizens can upload documents" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'documents' );
