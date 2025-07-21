-- =============================================
-- DATABASE FUNCTIONS AND FINAL CLEANUP
-- =============================================

-- =============================================
-- STEP 1: CREATE DATABASE FUNCTIONS
-- =============================================

-- Function to get user with all roles
CREATE OR REPLACE FUNCTION public.get_user_with_roles(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  roles TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.phone_number,
    p.avatar_url,
    ARRAY_AGG(ur.role) FILTER (WHERE ur.role IS NOT NULL AND ur.status = 'active') as roles
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE p.id = user_uuid
  GROUP BY p.id, p.email, p.full_name, p.phone_number, p.avatar_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign role to user
CREATE OR REPLACE FUNCTION public.assign_user_role(
  user_uuid UUID,
  user_role TEXT,
  assigned_by_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (user_uuid, user_role, assigned_by_uuid)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET 
    status = 'active',
    assigned_at = NOW(),
    assigned_by = assigned_by_uuid;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION public.user_has_role(user_uuid UUID, check_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid 
    AND role = check_role 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update washer onboarding status
CREATE OR REPLACE FUNCTION public.update_washer_onboarding_status(
  user_uuid UUID,
  new_status TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.washer_profiles 
  SET 
    onboarding_status = new_status,
    last_step_completed_at = NOW(),
    updated_at = NOW(),
    onboarding_completed_at = CASE 
      WHEN new_status = 'completed' THEN NOW()
      ELSE onboarding_completed_at
    END
  WHERE user_id = user_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create booking status history entry
CREATE OR REPLACE FUNCTION public.log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.booking_status_history (
    booking_id,
    from_status,
    to_status,
    changed_by
  ) VALUES (
    NEW.id,
    OLD.status,
    NEW.status,
    auth.uid()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for booking status changes
DROP TRIGGER IF EXISTS booking_status_change_trigger ON public.bookings;
CREATE TRIGGER booking_status_change_trigger
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.log_booking_status_change();

-- Function to update profile updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_washer_profiles_updated_at ON public.washer_profiles;
CREATE TRIGGER update_washer_profiles_updated_at 
  BEFORE UPDATE ON public.washer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_profiles_updated_at ON public.customer_profiles;
CREATE TRIGGER update_customer_profiles_updated_at 
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- STEP 2: RECREATE POLICIES WITH NEW ROLE SYSTEM
-- =============================================

-- Recreate washer_applications policies
CREATE POLICY "Admins can manage all applications" ON public.washer_applications
  FOR ALL USING (
    public.user_has_role(auth.uid(), 'admin')
  );

-- Recreate bookings policies
CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (
    public.user_has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Washers can view available bookings" ON public.bookings
  FOR SELECT USING (
    public.user_has_role(auth.uid(), 'washer') AND 
    (washer_id IS NULL OR washer_id = auth.uid())
  );

-- Recreate earnings policies if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'earnings') THEN
    EXECUTE 'CREATE POLICY "Admins can view all earnings" ON public.earnings
      FOR SELECT USING (public.user_has_role(auth.uid(), ''admin''))';
    
    EXECUTE 'CREATE POLICY "Admins can update earnings" ON public.earnings
      FOR UPDATE USING (public.user_has_role(auth.uid(), ''admin''))';
  END IF;
END $$;

-- Recreate payout_requests policies if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payout_requests') THEN
    EXECUTE 'CREATE POLICY "Admins can view all payout requests" ON public.payout_requests
      FOR SELECT USING (public.user_has_role(auth.uid(), ''admin''))';
    
    EXECUTE 'CREATE POLICY "Admins can update payout requests" ON public.payout_requests
      FOR UPDATE USING (public.user_has_role(auth.uid(), ''admin''))';
  END IF;
END $$;

-- Recreate verification_alerts policies if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'verification_alerts') THEN
    EXECUTE 'CREATE POLICY "Admin users can view alerts" ON public.verification_alerts
      FOR SELECT USING (public.user_has_role(auth.uid(), ''admin''))';
    
    EXECUTE 'CREATE POLICY "Admin users can update alerts" ON public.verification_alerts
      FOR UPDATE USING (public.user_has_role(auth.uid(), ''admin''))';
  END IF;
END $$;

-- Recreate onboarding policies if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'onboarding_progress') THEN
    EXECUTE 'CREATE POLICY "Admins can view all onboarding progress" ON public.onboarding_progress
      FOR SELECT USING (public.user_has_role(auth.uid(), ''admin''))';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'onboarding_step_logs') THEN
    EXECUTE 'CREATE POLICY "Admins can view all step logs" ON public.onboarding_step_logs
      FOR SELECT USING (public.user_has_role(auth.uid(), ''admin''))';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'onboarding_analytics') THEN
    EXECUTE 'CREATE POLICY "Admins can view onboarding analytics" ON public.onboarding_analytics
      FOR SELECT USING (public.user_has_role(auth.uid(), ''admin''))';
  END IF;
END $$;

-- =============================================
-- STEP 3: RECREATE VIEWS WITH NEW ROLE SYSTEM
-- =============================================

-- Recreate washer_balances view if it was using the role column
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'earnings') THEN
    EXECUTE '
    CREATE OR REPLACE VIEW public.washer_balances AS
    SELECT 
      p.id as washer_id,
      p.full_name,
      p.email,
      COALESCE(SUM(e.washer_earnings) FILTER (WHERE e.status = ''available''), 0) as available_balance,
      COALESCE(SUM(e.washer_earnings) FILTER (WHERE e.status = ''processing''), 0) as processing_balance,
      COALESCE(SUM(e.washer_earnings) FILTER (WHERE e.status = ''paid''), 0) as total_paid_out,
      COALESCE(SUM(e.washer_earnings), 0) as total_earnings,
      COUNT(e.id) FILTER (WHERE e.status = ''available'') as available_bookings_count
    FROM public.profiles p
    INNER JOIN public.user_roles ur ON p.id = ur.user_id
    LEFT JOIN public.earnings e ON p.id = e.washer_id
    WHERE ur.role = ''washer'' AND ur.status = ''active''
    GROUP BY p.id, p.full_name, p.email';
  END IF;
END $$;

-- =============================================
-- STEP 4: FINAL CLEANUP (Remove old role column)
-- =============================================

-- Now we can safely drop the old role and washer_status columns
-- This should be done after data migration is complete
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS role,
  DROP COLUMN IF EXISTS washer_status;

-- =============================================
-- STEP 5: ADD COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON FUNCTION public.get_user_with_roles(UUID) IS 'Returns user profile with all active roles';
COMMENT ON FUNCTION public.assign_user_role(UUID, TEXT, UUID) IS 'Assigns a role to a user, creating or updating the role assignment';
COMMENT ON FUNCTION public.user_has_role(UUID, TEXT) IS 'Checks if a user has a specific active role';
COMMENT ON FUNCTION public.update_washer_onboarding_status(UUID, TEXT) IS 'Updates washer onboarding status and tracks completion';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Database functions and cleanup migration completed successfully';
END $$;