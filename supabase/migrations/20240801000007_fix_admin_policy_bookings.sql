-- Fix admin policy for bookings table to use profiles instead of auth.users
-- This resolves the "permission denied for table users" error during booking creation

-- Drop the existing problematic admin policy
DROP POLICY IF EXISTS "Admins can manage all bookings." ON public.bookings;

-- Create a new admin policy that uses the profiles table (which is accessible)
CREATE POLICY "Admins can manage all bookings."
  ON public.bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Also fix the similar policy in washer_applications table
DROP POLICY IF EXISTS "Admins can manage all applications." ON public.washer_applications;

CREATE POLICY "Admins can manage all applications."
  ON public.washer_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "Admins can manage all bookings." ON public.bookings 
IS 'Allows users with admin role in profiles table to manage all bookings';

COMMENT ON POLICY "Admins can manage all applications." ON public.washer_applications 
IS 'Allows users with admin role in profiles table to manage all washer applications'; 