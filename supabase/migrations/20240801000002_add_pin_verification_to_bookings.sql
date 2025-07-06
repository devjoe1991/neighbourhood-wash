-- Add PIN verification columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN collection_pin TEXT,
ADD COLUMN delivery_pin TEXT,
ADD COLUMN collection_verified_at TIMESTAMPTZ,
ADD COLUMN delivery_verified_at TIMESTAMPTZ;

-- Add indexes for better performance on PIN lookups
CREATE INDEX idx_bookings_collection_pin ON public.bookings(collection_pin);
CREATE INDEX idx_bookings_delivery_pin ON public.bookings(delivery_pin);

-- Add comments for documentation
COMMENT ON COLUMN public.bookings.collection_pin IS 'Unique 4-digit PIN for collection verification';
COMMENT ON COLUMN public.bookings.delivery_pin IS 'Unique 4-digit PIN for delivery verification';
COMMENT ON COLUMN public.bookings.collection_verified_at IS 'Timestamp when collection PIN was verified';
COMMENT ON COLUMN public.bookings.delivery_verified_at IS 'Timestamp when delivery PIN was verified'; 