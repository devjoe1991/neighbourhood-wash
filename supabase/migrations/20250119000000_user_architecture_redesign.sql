-- =============================================
-- USER ARCHITECTURE REDESIGN MIGRATION
-- Complete platform architecture redesign
-- =============================================

-- =============================================
-- STEP 1: HANDLE EXISTING DEPENDENCIES
-- =============================================

-- Drop dependent policies first
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.washer_applications;
DROP POLICY IF EXISTS "Admins can manage all bookings." ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all earnings" ON public.earnings;
DROP POLICY IF EXISTS "Admins can update earnings" ON public.earnings;
DROP POLICY IF EXISTS "Admins can view all payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Admins can update payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Washers can view available bookings." ON public.bookings;
DROP POLICY IF EXISTS "Admin users can view alerts" ON public.verification_alerts;
DROP POLICY IF EXISTS "Admin users can update alerts" ON public.verification_alerts;
DROP POLICY IF EXISTS "Admins can view all onboarding progress" ON public.onboarding_progress;
DROP POLICY IF EXISTS "Admins can view all step logs" ON public.onboarding_step_logs;
DROP POLICY IF EXISTS "Admins can view onboarding analytics" ON public.onboarding_analytics;

-- Drop dependent views
DROP VIEW IF EXISTS public.washer_balances;

-- =============================================
-- STEP 2: CREATE NEW CORE TABLES
-- =============================================

-- User Roles table (many-to-many relationship) - Create this first
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'washer', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES public.profiles(id),
  UNIQUE(user_id, role)
);

-- Temporary admin check function for policies (create early so policies can use it)
CREATE OR REPLACE FUNCTION public.temp_is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid 
    AND role = 'admin' 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced Profiles table (extends existing)
-- Note: We'll modify the existing profiles table to match new architecture
-- But we'll keep the role column temporarily for migration
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- User Roles table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'washer', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES public.profiles(id),
  UNIQUE(user_id, role)
);

-- =============================================
-- WASHER MANAGEMENT TABLES
-- =============================================

-- Comprehensive Washer Profiles
CREATE TABLE IF NOT EXISTS public.washer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Onboarding State Machine
  onboarding_status TEXT NOT NULL DEFAULT 'not_started' 
    CHECK (onboarding_status IN (
      'not_started', 
      'profile_setup', 
      'verification_pending', 
      'verification_complete', 
      'payment_setup', 
      'completed'
    )),
  
  -- Service Profile
  bio TEXT,
  service_areas TEXT[] NOT NULL DEFAULT '{}',
  service_types TEXT[] NOT NULL DEFAULT '{}',
  equipment_details TEXT,
  years_experience INTEGER DEFAULT 0,
  
  -- Availability & Scheduling
  availability_schedule JSONB DEFAULT '{}',
  max_concurrent_bookings INTEGER DEFAULT 3,
  advance_booking_days INTEGER DEFAULT 7,
  
  -- Location & Service Area
  primary_location JSONB, -- {lat, lng, address}
  service_radius_km INTEGER DEFAULT 10,
  
  -- Verification & Compliance
  stripe_account_id TEXT,
  stripe_account_status TEXT,
  stripe_onboarding_url TEXT,
  verification_documents JSONB DEFAULT '{}',
  background_check_status TEXT DEFAULT 'pending' 
    CHECK (background_check_status IN ('pending', 'approved', 'rejected')),
  
  -- Status & Approval
  approval_status TEXT DEFAULT 'pending' 
    CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended')),
  approval_notes TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Performance Metrics
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  cancellation_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Financial
  hourly_rate DECIMAL(10,2),
  commission_rate DECIMAL(5,2) DEFAULT 15.00,
  
  -- Onboarding Tracking
  onboarding_started_at TIMESTAMP WITH TIME ZONE,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  last_step_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Status Tracking
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Washer Availability (detailed scheduling)
CREATE TABLE IF NOT EXISTS public.washer_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  washer_id UUID REFERENCES public.washer_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CUSTOMER MANAGEMENT TABLES
-- =============================================

-- Customer Profiles
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Preferences
  default_address JSONB,
  laundry_preferences JSONB DEFAULT '{}',
  communication_preferences JSONB DEFAULT '{}',
  
  -- Service History
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  
  -- Payment
  default_payment_method TEXT,
  stripe_customer_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Addresses
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- 'Home', 'Work', etc.
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'GB',
  coordinates JSONB, -- {lat, lng}
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ENHANCED BOOKING SYSTEM
-- =============================================

-- Enhanced Bookings table (modify existing)
-- First, let's add new columns to existing bookings table
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customer_profiles(id),
  ADD COLUMN IF NOT EXISTS service_type TEXT,
  ADD COLUMN IF NOT EXISTS service_description TEXT,
  ADD COLUMN IF NOT EXISTS estimated_duration_hours DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS requested_date DATE,
  ADD COLUMN IF NOT EXISTS requested_time_start TIME,
  ADD COLUMN IF NOT EXISTS requested_time_end TIME,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS pickup_address JSONB,
  ADD COLUMN IF NOT EXISTS delivery_address JSONB,
  ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS additional_fees DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'authorized', 'captured', 'refunded', 'failed')),
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Update status column to include new statuses
ALTER TABLE public.bookings 
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings 
  ADD CONSTRAINT bookings_status_check 
  CHECK (status IN (
    'pending',           -- Waiting for washer assignment
    'assigned',          -- Washer assigned, not confirmed
    'confirmed',         -- Washer confirmed
    'in_progress',       -- Service in progress
    'pickup_complete',   -- Items picked up
    'washing',           -- Currently being washed
    'ready_for_delivery', -- Ready for delivery
    'out_for_delivery',  -- Out for delivery
    'completed',         -- Service completed
    'cancelled',         -- Cancelled
    'refunded',          -- Refunded
    -- Legacy statuses for backward compatibility
    'awaiting_assignment'
  ));

-- Booking Items (what's being washed)
CREATE TABLE IF NOT EXISTS public.booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id BIGINT REFERENCES public.bookings(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'shirt', 'pants', 'bedding', etc.
  quantity INTEGER NOT NULL DEFAULT 1,
  special_instructions TEXT,
  price_per_item DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking Status History (audit trail)
CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id BIGINT REFERENCES public.bookings(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MATCHING & ASSIGNMENT SYSTEM
-- =============================================

-- Washer Assignments (matching algorithm results)
CREATE TABLE IF NOT EXISTS public.washer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id BIGINT REFERENCES public.bookings(id) ON DELETE CASCADE,
  washer_id UUID REFERENCES public.washer_profiles(id) ON DELETE CASCADE,
  
  -- Assignment Details
  assignment_type TEXT DEFAULT 'auto' CHECK (assignment_type IN ('auto', 'manual')),
  match_score DECIMAL(5,2), -- Algorithm confidence score
  distance_km DECIMAL(8,2),
  estimated_travel_time_minutes INTEGER,
  
  -- Status
  status TEXT DEFAULT 'offered' CHECK (status IN (
    'offered',    -- Offered to washer
    'accepted',   -- Washer accepted
    'declined',   -- Washer declined
    'expired',    -- Offer expired
    'cancelled'   -- Assignment cancelled
  )),
  
  -- Timing
  offered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- COMMUNICATION SYSTEM
-- =============================================

-- Messages (in-app messaging)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id BIGINT REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Message Content
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications (push notifications, emails, SMS)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Notification Details
  type TEXT NOT NULL, -- 'booking_update', 'payment', 'message', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  
  -- Delivery Channels
  channels TEXT[] DEFAULT '{"push"}', -- 'push', 'email', 'sms'
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- REVIEWS & RATINGS SYSTEM
-- =============================================

-- Enhanced Reviews (modify existing table)
-- Add new columns to existing reviews table
ALTER TABLE public.reviews 
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS service_quality_rating INTEGER CHECK (service_quality_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS timeliness_rating INTEGER CHECK (timeliness_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Add reviewer_id and reviewee_id columns (mapping from existing columns)
ALTER TABLE public.reviews 
  ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS reviewee_id UUID REFERENCES public.profiles(id);

-- Update the new columns with data from existing columns
UPDATE public.reviews 
SET 
  reviewer_id = user_id,
  reviewee_id = washer_id
WHERE reviewer_id IS NULL OR reviewee_id IS NULL;

-- =============================================
-- FINANCIAL SYSTEM
-- =============================================

-- Transactions (all financial transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id BIGINT REFERENCES public.bookings(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  
  -- Transaction Details
  type TEXT NOT NULL CHECK (type IN (
    'payment',           -- Customer payment
    'payout',           -- Washer payout
    'fee',              -- Platform fee
    'refund',           -- Refund to customer
    'adjustment'        -- Manual adjustment
  )),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'GBP',
  
  -- External References
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled'
  )),
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Washer Earnings (aggregated earnings data)
CREATE TABLE IF NOT EXISTS public.washer_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  washer_id UUID REFERENCES public.washer_profiles(id) ON DELETE CASCADE,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Earnings Breakdown
  gross_earnings DECIMAL(10,2) DEFAULT 0.00,
  platform_fees DECIMAL(10,2) DEFAULT 0.00,
  net_earnings DECIMAL(10,2) DEFAULT 0.00,
  
  -- Job Statistics
  jobs_completed INTEGER DEFAULT 0,
  total_hours_worked DECIMAL(8,2) DEFAULT 0.00,
  average_hourly_rate DECIMAL(10,2) DEFAULT 0.00,
  
  -- Status
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN (
    'pending', 'processing', 'paid', 'failed'
  )),
  payout_date DATE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- User Roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_status ON public.user_roles(status);

-- Washer Profiles indexes
CREATE INDEX IF NOT EXISTS idx_washer_profiles_user_id ON public.washer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_washer_profiles_onboarding_status ON public.washer_profiles(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_washer_profiles_approval_status ON public.washer_profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_washer_profiles_is_online ON public.washer_profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_washer_profiles_service_areas ON public.washer_profiles USING GIN(service_areas);
CREATE INDEX IF NOT EXISTS idx_washer_profiles_rating ON public.washer_profiles(rating);

-- Customer Profiles indexes
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON public.customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_status ON public.customer_profiles(status);

-- Booking indexes (additional to existing ones)
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_requested_date ON public.bookings(requested_date);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);

-- Assignment indexes
CREATE INDEX IF NOT EXISTS idx_washer_assignments_booking_id ON public.washer_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_washer_assignments_washer_id ON public.washer_assignments(washer_id);
CREATE INDEX IF NOT EXISTS idx_washer_assignments_status ON public.washer_assignments(status);
CREATE INDEX IF NOT EXISTS idx_washer_assignments_offered_at ON public.washer_assignments(offered_at);

-- Communication indexes
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON public.messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);

-- Financial indexes
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON public.transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- =============================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.washer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.washer_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.washer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.washer_earnings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 4: CREATE RLS POLICIES
-- =============================================

-- User Roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.temp_is_admin(auth.uid()));

-- Washer Profiles policies
CREATE POLICY "Users can view their own washer profile" ON public.washer_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own washer profile" ON public.washer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own washer profile" ON public.washer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all washer profiles" ON public.washer_profiles
  FOR ALL USING (public.temp_is_admin(auth.uid()));

-- Customer Profiles policies
CREATE POLICY "Users can view their own customer profile" ON public.customer_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own customer profile" ON public.customer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customer profile" ON public.customer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Customer Addresses policies
CREATE POLICY "Users can manage their own addresses" ON public.customer_addresses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.customer_profiles cp
      WHERE cp.id = customer_id AND cp.user_id = auth.uid()
    )
  );

-- Booking Items policies
CREATE POLICY "Users can view booking items for their bookings" ON public.booking_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND (b.user_id = auth.uid() OR b.washer_id = auth.uid())
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages they sent or received" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Reviews policies (drop existing and recreate)
DROP POLICY IF EXISTS "Public can view all reviews." ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews." ON public.reviews;

CREATE POLICY "Users can view public reviews" ON public.reviews
  FOR SELECT USING (is_public = true OR is_public IS NULL);

CREATE POLICY "Users can view reviews they wrote or received" ON public.reviews
  FOR SELECT USING (
    auth.uid() = COALESCE(reviewer_id, user_id) OR 
    auth.uid() = COALESCE(reviewee_id, washer_id)
  );

CREATE POLICY "Users can create reviews for their bookings" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND (b.user_id = auth.uid() OR b.washer_id = auth.uid())
    )
  );

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (public.temp_is_admin(auth.uid()));

-- Washer Earnings policies
CREATE POLICY "Washers can view their own earnings" ON public.washer_earnings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.washer_profiles wp
      WHERE wp.id = washer_id AND wp.user_id = auth.uid()
    )
  );

-- =============================================
-- STEP 5: POLICIES COMPLETE
-- =============================================

-- Temporary admin check function for policies
CREATE OR REPLACE FUNCTION public.temp_is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid 
    AND role = 'admin' 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 6: ADD COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE public.user_roles IS 'Many-to-many relationship table for user roles, allowing users to have multiple roles';
COMMENT ON TABLE public.washer_profiles IS 'Comprehensive washer profiles with onboarding state machine and performance metrics';
COMMENT ON TABLE public.customer_profiles IS 'Customer-specific profile data and preferences';
COMMENT ON TABLE public.washer_assignments IS 'Smart matching algorithm results and washer assignment tracking';
COMMENT ON TABLE public.messages IS 'In-app messaging system for booking communication';
COMMENT ON TABLE public.notifications IS 'Multi-channel notification system (push, email, SMS)';
COMMENT ON TABLE public.transactions IS 'Complete financial transaction tracking for payments and payouts';

COMMENT ON COLUMN public.washer_profiles.onboarding_status IS 'State machine status: not_started -> profile_setup -> verification_pending -> verification_complete -> payment_setup -> completed';
COMMENT ON COLUMN public.washer_assignments.match_score IS 'Algorithm confidence score (0-100) for washer-booking match quality';
COMMENT ON COLUMN public.notifications.channels IS 'Array of delivery channels: push, email, sms';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- Migration completed successfully