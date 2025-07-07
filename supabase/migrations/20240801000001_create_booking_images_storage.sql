-- Create storage bucket for booking images
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking_images', 'booking_images', true);

-- Note: RLS is already enabled by default on storage.objects

-- Create policy for users to upload their own booking images
CREATE POLICY "Users can upload booking images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'booking_images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to view their own booking images
CREATE POLICY "Users can view their own booking images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'booking_images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to delete their own booking images
CREATE POLICY "Users can delete their own booking images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'booking_images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for public access to booking images (needed for display)
CREATE POLICY "Public access to booking images"
ON storage.objects FOR SELECT
USING (bucket_id = 'booking_images'); 