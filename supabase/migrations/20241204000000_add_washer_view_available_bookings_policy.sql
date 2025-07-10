-- This policy allows any authenticated user with the 'washer' role to view bookings
-- that are unassigned and available for the taking. This is essential for the
-- "Available Bookings" page to function correctly.

CREATE POLICY "Washers can view available bookings."
  ON public.bookings FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'washer' AND profiles.washer_status = 'approved'
      )
    ) AND (
      status = 'pending_washer_assignment'
    )
  ); 