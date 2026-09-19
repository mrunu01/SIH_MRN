-- Create storage bucket for scan images (PRIVATE)
INSERT INTO storage.buckets (id, name, public)
VALUES ('scan-images', 'scan-images', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for scan-images bucket

-- Users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'scan-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can read their own images
CREATE POLICY "Users can read own images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'scan-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own images
CREATE POLICY "Users can update own images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'scan-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own images
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'scan-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
