-- =============================================
-- ONBOARDING PROGRESS TRACKING TABLES
-- Support for washer onboarding state machine
-- =============================================

-- Onboarding Progress Tracking
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Step Information
  step TEXT NOT NULL CHECK (step IN (
    'not_started',
    'profile_setup', 
    'verification_pending', 
    'verification_complete', 
    'payment_setup',
    'completed'
  )),
  
  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN (
    'started',
    'in_progress', 
    'completed', 
    'failed'
  )),
  
  -- Timing Information
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- Duration in seconds
  
  -- Data and Error Tracking
  step_data JSONB DEFAULT '{}',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onboarding Step Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS public.onboarding_step_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Step Transition Information
  from_step TEXT CHECK (from_step IN (
    'not_started',
    'profile_setup', 
    'verification_pending', 
    'verification_complete', 
    'payment_setup',
    'completed'
  )),
  to_step TEXT NOT NULL CHECK (to_step IN (
    'not_started',
    'profile_setup', 
    'verification_pending', 
    'verification_complete', 
    'payment_setup',
    'completed'
  )),
  
  -- Change Information
  changed_by UUID REFERENCES public.profiles(id),
  step_data JSONB DEFAULT '{}',
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onboarding Analytics (Aggregated Data)
CREATE TABLE IF NOT EXISTS public.onboarding_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time Period
  date DATE NOT NULL,
  
  -- Metrics
  users_started INTEGER DEFAULT 0,
  users_completed INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  average_completion_time INTEGER DEFAULT 0, -- In seconds
  
  -- Step-specific Metrics
  step_metrics JSONB DEFAULT '{}', -- { "profile_setup": { "started": 10, "completed": 8, "failed": 2 } }
  
  -- Common Failure Points
  failure_analysis JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(date)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Onboarding Progress indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON public.onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_step ON public.onboarding_progress(step);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_status ON public.onboarding_progress(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_started_at ON public.onboarding_progress(started_at);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_completed_at ON public.onboarding_progress(completed_at);

-- Step Logs indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_step_logs_user_id ON public.onboarding_step_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_step_logs_to_step ON public.onboarding_step_logs(to_step);
CREATE INDEX IF NOT EXISTS idx_onboarding_step_logs_created_at ON public.onboarding_step_logs(created_at);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_date ON public.onboarding_analytics(date);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_analytics ENABLE ROW LEVEL SECURITY;

-- Onboarding Progress policies
CREATE POLICY "Users can view their own onboarding progress" ON public.onboarding_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress" ON public.onboarding_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress" ON public.onboarding_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all onboarding progress" ON public.onboarding_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'active'
    )
  );

-- Step Logs policies
CREATE POLICY "Users can view their own step logs" ON public.onboarding_step_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own step logs" ON public.onboarding_step_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = changed_by);

CREATE POLICY "Admins can view all step logs" ON public.onboarding_step_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage all step logs" ON public.onboarding_step_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'active'
    )
  );

-- Analytics policies (admin only)
CREATE POLICY "Admins can view onboarding analytics" ON public.onboarding_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage onboarding analytics" ON public.onboarding_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'active'
    )
  );

-- =============================================
-- FUNCTIONS FOR ANALYTICS
-- =============================================

-- Function to update daily analytics
CREATE OR REPLACE FUNCTION public.update_onboarding_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
  users_started_count INTEGER;
  users_completed_count INTEGER;
  completion_rate_calc DECIMAL(5,2);
  avg_completion_time INTEGER;
  step_metrics_data JSONB;
BEGIN
  -- Calculate users who started onboarding on target date
  SELECT COUNT(DISTINCT user_id) INTO users_started_count
  FROM public.onboarding_progress
  WHERE DATE(started_at) = target_date
  AND step = 'profile_setup'
  AND status = 'started';
  
  -- Calculate users who completed onboarding on target date
  SELECT COUNT(DISTINCT wp.user_id) INTO users_completed_count
  FROM public.washer_profiles wp
  WHERE DATE(wp.onboarding_completed_at) = target_date
  AND wp.onboarding_status = 'completed';
  
  -- Calculate completion rate
  completion_rate_calc := CASE 
    WHEN users_started_count > 0 THEN (users_completed_count::DECIMAL / users_started_count::DECIMAL) * 100
    ELSE 0
  END;
  
  -- Calculate average completion time
  SELECT AVG(EXTRACT(EPOCH FROM (wp.onboarding_completed_at - wp.onboarding_started_at)))::INTEGER
  INTO avg_completion_time
  FROM public.washer_profiles wp
  WHERE DATE(wp.onboarding_completed_at) = target_date
  AND wp.onboarding_status = 'completed'
  AND wp.onboarding_started_at IS NOT NULL;
  
  -- Build step metrics
  SELECT jsonb_object_agg(
    step,
    jsonb_build_object(
      'started', started_count,
      'completed', completed_count,
      'failed', failed_count
    )
  ) INTO step_metrics_data
  FROM (
    SELECT 
      step,
      COUNT(*) FILTER (WHERE status = 'started') as started_count,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
      COUNT(*) FILTER (WHERE status = 'failed') as failed_count
    FROM public.onboarding_progress
    WHERE DATE(started_at) = target_date
    GROUP BY step
  ) step_stats;
  
  -- Insert or update analytics record
  INSERT INTO public.onboarding_analytics (
    date,
    users_started,
    users_completed,
    completion_rate,
    average_completion_time,
    step_metrics,
    updated_at
  ) VALUES (
    target_date,
    users_started_count,
    users_completed_count,
    completion_rate_calc,
    COALESCE(avg_completion_time, 0),
    COALESCE(step_metrics_data, '{}'::jsonb),
    NOW()
  )
  ON CONFLICT (date) DO UPDATE SET
    users_started = EXCLUDED.users_started,
    users_completed = EXCLUDED.users_completed,
    completion_rate = EXCLUDED.completion_rate,
    average_completion_time = EXCLUDED.average_completion_time,
    step_metrics = EXCLUDED.step_metrics,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old progress entries
CREATE OR REPLACE FUNCTION public.cleanup_old_onboarding_progress(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.onboarding_progress
  WHERE created_at < (CURRENT_DATE - INTERVAL '1 day' * days_to_keep)
  AND status IN ('completed', 'failed');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Trigger to update analytics when washer completes onboarding
CREATE OR REPLACE FUNCTION public.trigger_update_onboarding_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update analytics for the completion date
  IF NEW.onboarding_status = 'completed' AND OLD.onboarding_status != 'completed' THEN
    PERFORM public.update_onboarding_analytics(DATE(NEW.onboarding_completed_at));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_analytics_trigger
  AFTER UPDATE ON public.washer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_onboarding_analytics();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE public.onboarding_progress IS 'Tracks individual user progress through onboarding steps with timing and error information';
COMMENT ON TABLE public.onboarding_step_logs IS 'Audit trail for onboarding step transitions and changes';
COMMENT ON TABLE public.onboarding_analytics IS 'Daily aggregated analytics for onboarding performance and completion rates';

COMMENT ON FUNCTION public.update_onboarding_analytics IS 'Updates daily onboarding analytics for a specific date';
COMMENT ON FUNCTION public.cleanup_old_onboarding_progress IS 'Removes old completed/failed onboarding progress entries to maintain performance';

-- Migration completed successfully