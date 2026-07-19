-- ============================================================
-- Migration: 002_storage_policies
-- Supabase Storage bucket: materials
-- ============================================================

-- 1. Create the bucket (public = true allows public URL access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materials',
  'materials',
  true,
  5242880,                          -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public            = EXCLUDED.public,
      file_size_limit   = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Public SELECT — anyone can view images
CREATE POLICY "storage_materials_public_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'materials');

-- 3. Authenticated INSERT — logged-in users can upload
CREATE POLICY "storage_materials_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'materials');

-- 4. Authenticated DELETE — logged-in users can delete
CREATE POLICY "storage_materials_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'materials');
