-- =============================================
-- DATA MIGRATION SCRIPT
-- Migrate existing data to new architecture
-- =============================================

-- =============================================
-- STEP 1: MIGRATE USER ROLES
-- =============================================

-- Migrate existing roles from profiles table to user_roles table
INSERT INTO public.user_roles (user_id, role, status, assigned_at)
SELECT 
  id as user_id,
  CASE 
    WHEN role = 'user' THEN 'customer'
    WHEN role = 'washer' THEN 'washer'
    WHEN role = 'admin' THEN 'admin'
    ELSE 'customer'
  END as role,
  'active' as status,
  created_at as assigned_at
FROM public.profiles 
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- For users who are washers, also give them customer role (they can book services too)
INSERT INTO public.user_roles (user_id, role, status, assigned_at)
SELECT 
  id as user_id,
  'customer' as role,
  'active' as status,
  created_at as assigned_at
FROM public.profiles 
WHERE role = 'washer'
ON CONFLICT (user_id, role) DO NOTHING;

-- =============================================
-- STEP 2: MIGRATE WASHER DATA
-- =============================================

-- Create washer profiles from existing profiles and washer_applications
INSERT INTO public.washer_profiles (
  user_id,
  onboarding_status,
  bio,
  service_areas,
  service_types,
  equipment_details,
  stripe_account_id,
  stripe_account_status,
  approval_status,
  onboarding_started_at,
  onboarding_completed_at,
  created_at,
  updated_at
)
SELECT DISTINCT
  p.id as user_id,
  CASE 
    WHEN p.washer_status = 'pending_application' THEN 'profile_setup'
    WHEN p.washer_status = 'pending_verification' THEN 'verification_pending'
    WHEN p.washer_status = 'approved' AND p.onboarding_fee_paid = true THEN 'completed'
    WHEN p.washer_status = 'approved' AND p.onboarding_fee_paid = false THEN 'payment_setup'
    WHEN p.washer_status = 'rejected' THEN 'not_started'
    ELSE 'not_started'
  END as onboarding_status,
  COALESCE(wa.washer_bio, '') as bio,
  CASE 
    WHEN wa.service_address IS NOT NULL THEN ARRAY[wa.service_address]
    ELSE ARRAY[]::TEXT[]
  END as service_areas,
  COALESCE(wa.service_offerings, ARRAY[]::TEXT[]) as service_types,
  COALESCE(wa.equipment_details, '') as equipment_details,
  p.stripe_account_id,
  p.stripe_account_status,
  CASE 
    WHEN p.washer_status = 'approved' THEN 'approved'
    WHEN p.washer_status = 'rejected' THEN 'rejected'
    ELSE 'pending'
  END as approval_status,
  CASE 
    WHEN wa.created_at IS NOT NULL THEN wa.created_at
    WHEN p.washer_status IS NOT NULL THEN p.created_at
    ELSE NULL
  END as onboarding_started_at,
  CASE 
    WHEN p.washer_status = 'approved' AND p.onboarding_fee_paid = true THEN p.updated_at
    ELSE NULL
  END as onboarding_completed_at,
  p.created_at,
  p.updated_at
FROM public.profiles p
LEFT JOIN public.washer_applications wa ON p.id = wa.user_id
WHERE p.role = 'washer' OR p.washer_status IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  onboarding_status = EXCLUDED.onboarding_status,
  bio = EXCLUDED.bio,
  service_areas = EXCLUDED.service_areas,
  service_types = EXCLUDED.service_types,
  equipment_details = EXCLUDED.equipment_details,
  stripe_account_id = EXCLUDED.stripe_account_id,
  stripe_account_status = EXCLUDED.stripe_account_status,
  approval_status = EXCLUDED.approval_status,
  onboarding_started_at = EXCLUDED.onboarding_started_at,
  onboarding_completed_at = EXCLUDED.onboarding_completed_at,
  updated_at = NOW();

-- =============================================
-- STEP 3: MIGRATE CUSTOMER DATA
-- =============================================

-- Create customer profiles for all users (everyone can be a customer)
INSERT INTO public.customer_profiles (
  user_id,
  total_bookings,
  completed_bookings,
  stripe_customer_id,
  status,
  created_at,
  updated_at
)
SELECT 
  p.id as user_id,
  COALESCE(booking_counts.total_bookings, 0) as total_bookings,
  COALESCE(booking_counts.completed_bookings, 0) as completed_bookings,
  NULL as stripe_customer_id, -- Will be populated when customers make payments
  'active' as status,
  p.created_at,
  p.updated_at
FROM public.profiles p
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings
  FROM public.bookings
  GROUP BY user_id
) booking_counts ON p.id = booking_counts.user_id
ON CONFLICT (user_id) DO UPDATE SET
  total_bookings = EXCLUDED.total_bookings,
  completed_bookings = EXCLUDED.completed_bookings,
  updated_at = NOW();

-- =============================================
-- STEP 4: MIGRATE BOOKING DATA
-- =============================================

-- Update existing bookings with customer_id references
UPDATE public.bookings 
SET customer_id = cp.id
FROM public.customer_profiles cp
WHERE bookings.user_id = cp.user_id
AND bookings.customer_id IS NULL;

-- Set base_price from total_price for existing bookings
UPDATE public.bookings 
SET 
  base_price = total_price,
  service_type = 'laundry', -- Default service type
  requested_date = collection_date::DATE,
  pickup_address = jsonb_build_object(
    'address', 'Legacy booking address',
    'coordinates', jsonb_build_object('lat', 0, 'lng', 0)
  )
WHERE base_price IS NULL;

-- =============================================
-- STEP 5: CREATE BOOKING ITEMS FROM SERVICES_CONFIG
-- =============================================

-- Extract booking items from services_config JSONB
INSERT INTO public.booking_items (
  booking_id,
  item_type,
  quantity,
  price_per_item
)
SELECT 
  b.id as booking_id,
  'mixed_laundry' as item_type, -- Generic item type for legacy bookings
  1 as quantity,
  b.total_price as price_per_item
FROM public.bookings b
WHERE b.services_config IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.booking_items bi WHERE bi.booking_id = b.id
);

-- =============================================
-- STEP 6: CREATE INITIAL BOOKING STATUS HISTORY
-- =============================================

-- Create initial status history entries for existing bookings
INSERT INTO public.booking_status_history (
  booking_id,
  from_status,
  to_status,
  notes,
  created_at
)
SELECT 
  id as booking_id,
  NULL as from_status,
  status as to_status,
  'Initial status from migration' as notes,
  created_at
FROM public.bookings
WHERE NOT EXISTS (
  SELECT 1 FROM public.booking_status_history bsh WHERE bsh.booking_id = bookings.id
);

-- =============================================
-- STEP 7: MIGRATE REVIEWS DATA
-- =============================================

-- Note: If there are existing reviews in other tables, migrate them here
-- For now, we'll create the structure for future reviews

-- =============================================
-- STEP 8: UPDATE WASHER PERFORMANCE METRICS
-- =============================================

-- Update washer performance metrics based on existing bookings
UPDATE public.washer_profiles 
SET 
  total_jobs = washer_stats.total_jobs,
  completed_jobs = washer_stats.completed_jobs,
  rating = COALESCE(washer_stats.avg_rating, 0.00),
  updated_at = NOW()
FROM (
  SELECT 
    wp.id as washer_profile_id,
    COUNT(b.id) as total_jobs,
    COUNT(b.id) FILTER (WHERE b.status = 'completed') as completed_jobs,
    COALESCE(AVG(5.0), 0.00) as avg_rating -- Default rating until real reviews exist
  FROM public.washer_profiles wp
  LEFT JOIN public.bookings b ON wp.user_id = b.washer_id
  GROUP BY wp.id
) washer_stats
WHERE washer_profiles.id = washer_stats.washer_profile_id;

-- =============================================
-- STEP 9: CLEAN UP AND VALIDATION
-- =============================================

-- Ensure all users have at least a customer role
INSERT INTO public.user_roles (user_id, role, status, assigned_at)
SELECT 
  p.id as user_id,
  'customer' as role,
  'active' as status,
  NOW() as assigned_at
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = p.id AND ur.role = 'customer'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Ensure all users have customer profiles
INSERT INTO public.customer_profiles (user_id, status, created_at, updated_at)
SELECT 
  p.id as user_id,
  'active' as status,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.customer_profiles cp WHERE cp.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- STEP 10: CREATE ADMIN USER IF NEEDED
-- =============================================

-- Ensure there's at least one admin user
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count 
  FROM public.user_roles 
  WHERE role = 'admin' AND status = 'active';
  
  IF admin_count = 0 THEN
    -- Find the first user and make them admin
    INSERT INTO public.user_roles (user_id, role, status, assigned_at)
    SELECT 
      id as user_id,
      'admin' as role,
      'active' as status,
      NOW() as assigned_at
    FROM public.profiles 
    ORDER BY created_at ASC 
    LIMIT 1
    ON CONFLICT (user_id, role) DO UPDATE SET status = 'active';
  END IF;
END $$;

-- =============================================
-- MIGRATION VALIDATION
-- =============================================

-- Log migration statistics
DO $$
DECLARE
  total_users INTEGER;
  total_washers INTEGER;
  total_customers INTEGER;
  total_bookings INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  SELECT COUNT(*) INTO total_washers FROM public.washer_profiles;
  SELECT COUNT(*) INTO total_customers FROM public.customer_profiles;
  SELECT COUNT(*) INTO total_bookings FROM public.bookings;
  
  RAISE NOTICE 'Migration completed successfully:';
  RAISE NOTICE '- Total users: %', total_users;
  RAISE NOTICE '- Total washers: %', total_washers;
  RAISE NOTICE '- Total customers: %', total_customers;
  RAISE NOTICE '- Total bookings: %', total_bookings;
END $$;