-- ============================================
-- PA STORAGE STORAGE FIX V2
-- ============================================
-- Run this in Supabase SQL Editor
-- This script completely resets policies for the 'documents' bucket
-- to ensure the PA can upload voice notes and media.

-- 1. Ensure the 'documents' bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  true, 
  52428800, -- 50MB limit
  '{audio/webm,image/*,application/pdf}' -- Allowed types
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = '{audio/webm,image/*,application/pdf}';

-- 2. Drop all possibly conflicting policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "PA Storage Management" ON storage.objects;

-- 3. Create CLEAN specific policies for the 'documents' bucket
-- We use separate policies for each action to ensure clarity and proper RLS enforcement.

-- INSERT: Allow authenticated users to upload to 'documents' bucket
CREATE POLICY "authenticated_insert_documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

-- SELECT: Allow authenticated users to read from 'documents' bucket
CREATE POLICY "authenticated_select_documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

-- UPDATE: Allow authenticated users to update their own uploads in 'documents'
CREATE POLICY "authenticated_update_documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents');

-- DELETE: Allow authenticated users to delete from 'documents'
CREATE POLICY "authenticated_delete_documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents');

-- 4. Enable public read access for the bucket (since it's public: true)
-- This allows the generated public URLs to work even for non-logged in views if necessary.
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'documents');

COMMIT;
