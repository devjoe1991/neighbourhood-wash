-- Quick fix to set up your washer account properly
-- Run this in your Supabase SQL editor

-- Update your profile to be a washer with approved status
UPDATE profiles 
SET 
  role = 'washer',
  washer_status = 'approved',
  updated_at = NOW()
WHERE email = 'washer25@maildrop.cc';

-- If you don't have a washer application record, create one
INSERT INTO washer_applications (
  user_id,
  status,
  phone_number,
  service_address,
  service_offerings,
  offers_collection,
  equipment_details,
  washer_bio,
  created_at
)
SELECT 
  id,
  'approved',
  '+44 7700 900000',
  'London, UK',
  ARRAY['wash_and_fold', 'dry_cleaning'],
  false,
  'Professional washing equipment',
  'Experienced laundry professional',
  NOW()
FROM profiles 
WHERE email = 'washer25@maildrop.cc'
AND NOT EXISTS (
  SELECT 1 FROM washer_applications WHERE user_id = profiles.id
);