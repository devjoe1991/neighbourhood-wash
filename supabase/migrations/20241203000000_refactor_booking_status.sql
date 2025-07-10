-- Create a new table for booking statuses
CREATE TABLE public.booking_statuses (
  status_id TEXT PRIMARY KEY,
  description TEXT
);

-- Populate the booking_statuses table
INSERT INTO public.booking_statuses (status_id, description) VALUES
  ('awaiting_assignment', 'Booking created, waiting for any washer to accept.'),
  ('pending_washer_assignment', 'Booking is available for washers to accept.'),
  ('washer_assigned', 'A washer has accepted the booking.'),
  ('collection_in_progress', 'The washer is on the way to collect the laundry.'),
  ('in_progress', 'The laundry is being washed.'),
  ('delivery_in_progress', 'The washer is on the way to deliver the clean laundry.'),
  ('completed', 'The booking is complete.'),
  ('cancelled_by_user', 'The booking was cancelled by the user.'),
  ('cancelled_by_washer', 'The booking was cancelled by the washer.'),
  ('disputed', 'The booking is under review due to an issue.');

-- Add a temporary status column to bookings
ALTER TABLE public.bookings ADD COLUMN status_text TEXT;
UPDATE public.bookings SET status_text = status;

-- Drop the old status column
ALTER TABLE public.bookings DROP COLUMN status;

-- Add the new foreign key column for status
ALTER TABLE public.bookings
ADD COLUMN status TEXT REFERENCES public.booking_statuses(status_id);

-- Populate the new status column from the temporary one
UPDATE public.bookings SET status = status_text;

-- Set a default for the new status column
ALTER TABLE public.bookings
ALTER COLUMN status SET DEFAULT 'pending_washer_assignment',
ALTER COLUMN status SET NOT NULL;

-- Drop the temporary column
ALTER TABLE public.bookings DROP COLUMN status_text;

-- Update the existing RLS policy to use the new status system if needed
-- (No change needed for existing policies based on the file content) 