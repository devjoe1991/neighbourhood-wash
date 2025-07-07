-- Add access_notes column to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS access_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.access_notes IS 'Access instructions provided by the user (e.g., intercom codes, flat numbers, etc.)';

-- Create index for better performance on access notes searches (optional, but useful for admin queries)
CREATE INDEX IF NOT EXISTS idx_bookings_access_notes ON public.bookings(access_notes) WHERE access_notes IS NOT NULL; 