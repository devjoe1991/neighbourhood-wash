-- Add payment_intent_id to bookings table for Stripe integration
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- Add index for better performance on payment intent lookups
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent_id ON public.bookings(payment_intent_id);

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.payment_intent_id IS 'Stripe Payment Intent ID for the booking payment'; 