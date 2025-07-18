-- Create onboarding progress tracking tables
-- Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4

-- Create onboarding_progress table for detailed step tracking
CREATE TABLE public.onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Step tracking
    current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 4),
    completed_steps INTEGER[] DEFAULT '{}',
    is_complete BOOLEAN DEFAULT false,
    
    -- Step completion timestamps
    step_1_completed_at TIMESTAMPTZ,
    step_2_completed_at TIMESTAMPTZ,
    step_3_completed_at TIMESTAMPTZ,
    step_4_completed_at TIMESTAMPTZ,
    
    -- Step-specific data
    profile_setup_data JSONB,
    stripe_kyc_data JSONB,
    bank_connection_data JSONB,
    payment_data JSONB,
    
    -- Progress metadata
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Error tracking
    last_error JSONB,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    UNIQUE(user_id)
);

-- Create onboarding_step_logs table for detailed audit trail
CREATE TABLE public.onboarding_step_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Step information
    step_number INTEGER NOT NULL CHECK (step_number >= 1 AND step_number <= 4),
    step_name TEXT NOT NULL,
    action TEXT NOT NULL, -- 'started', 'completed', 'failed', 'retried'
    
    -- Status and data
    status TEXT NOT NULL, -- 'success', 'error', 'pending'
    data JSONB,
    error_details JSONB,
    
    -- Context
    session_id TEXT,
    user_agent TEXT,
    ip_address INET,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create onboarding_analytics table for completion rate tracking
CREATE TABLE public.onboarding_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time period
    date DATE NOT NULL,
    hour INTEGER CHECK (hour >= 0 AND hour <= 23),
    
    -- Metrics
    total_started INTEGER DEFAULT 0,
    step_1_completed INTEGER DEFAULT 0,
    step_2_completed INTEGER DEFAULT 0,
    step_3_completed INTEGER DEFAULT 0,
    step_4_completed INTEGER DEFAULT 0,
    total_completed INTEGER DEFAULT 0,
    
    -- Completion rates (calculated)
    step_1_completion_rate DECIMAL(5,2),
    step_2_completion_rate DECIMAL(5,2),
    step_3_completion_rate DECIMAL(5,2),
    step_4_completion_rate DECIMAL(5,2),
    overall_completion_rate DECIMAL(5,2),
    
    -- Average times
    avg_step_1_time_minutes INTEGER,
    avg_step_2_time_minutes INTEGER,
    avg_step_3_time_minutes INTEGER,
    avg_step_4_time_minutes INTEGER,
    avg_total_time_minutes INTEGER,
    
    -- Error tracking
    total_errors INTEGER DEFAULT 0,
    step_1_errors INTEGER DEFAULT 0,
    step_2_errors INTEGER DEFAULT 0,
    step_3_errors INTEGER DEFAULT 0,
    step_4_errors INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    UNIQUE(date, hour)
);

-- Enable Row Level Security
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for onboarding_progress
CREATE POLICY "Users can view their own onboarding progress"
ON public.onboarding_progress
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress"
ON public.onboarding_progress
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress"
ON public.onboarding_progress
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all onboarding progress"
ON public.onboarding_progress
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Create policies for onboarding_step_logs
CREATE POLICY "Users can view their own step logs"
ON public.onboarding_step_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert step logs"
ON public.onboarding_step_logs
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all step logs"
ON public.onboarding_step_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Create policies for onboarding_analytics
CREATE POLICY "Admins can view onboarding analytics"
ON public.onboarding_analytics
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "System can manage onboarding analytics"
ON public.onboarding_analytics
FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX idx_onboarding_progress_user_id ON public.onboarding_progress(user_id);
CREATE INDEX idx_onboarding_progress_current_step ON public.onboarding_progress(current_step);
CREATE INDEX idx_onboarding_progress_is_complete ON public.onboarding_progress(is_complete);
CREATE INDEX idx_onboarding_progress_last_activity ON public.onboarding_progress(last_activity_at);

CREATE INDEX idx_onboarding_step_logs_user_id ON public.onboarding_step_logs(user_id);
CREATE INDEX idx_onboarding_step_logs_step_number ON public.onboarding_step_logs(step_number);
CREATE INDEX idx_onboarding_step_logs_action ON public.onboarding_step_logs(action);
CREATE INDEX idx_onboarding_step_logs_status ON public.onboarding_step_logs(status);
CREATE INDEX idx_onboarding_step_logs_created_at ON public.onboarding_step_logs(created_at);

CREATE INDEX idx_onboarding_analytics_date ON public.onboarding_analytics(date);
CREATE INDEX idx_onboarding_analytics_date_hour ON public.onboarding_analytics(date, hour);

-- Create function to update onboarding progress
CREATE OR REPLACE FUNCTION public.update_onboarding_progress(
    p_user_id UUID,
    p_step_number INTEGER,
    p_step_data JSONB DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_progress RECORD;
    v_step_name TEXT;
    v_completed_steps INTEGER[];
    v_is_complete BOOLEAN := false;
    v_current_step INTEGER;
BEGIN
    -- Get step name
    v_step_name := CASE p_step_number
        WHEN 1 THEN 'Profile & Service Setup'
        WHEN 2 THEN 'Stripe Connect KYC'
        WHEN 3 THEN 'Bank Account Connection'
        WHEN 4 THEN 'Onboarding Fee Payment'
        ELSE 'Unknown Step'
    END;
    
    -- Get or create onboarding progress record
    SELECT * INTO v_progress
    FROM public.onboarding_progress
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- Create new progress record
        INSERT INTO public.onboarding_progress (
            user_id,
            current_step,
            completed_steps,
            started_at,
            last_activity_at
        ) VALUES (
            p_user_id,
            1,
            '{}',
            now(),
            now()
        ) RETURNING * INTO v_progress;
    END IF;
    
    -- Update completed steps if not already completed
    v_completed_steps := v_progress.completed_steps;
    IF NOT (p_step_number = ANY(v_completed_steps)) THEN
        v_completed_steps := array_append(v_completed_steps, p_step_number);
    END IF;
    
    -- Determine current step and completion status
    v_current_step := GREATEST(v_progress.current_step, p_step_number + 1);
    v_is_complete := array_length(v_completed_steps, 1) = 4;
    
    -- Update progress record
    UPDATE public.onboarding_progress SET
        current_step = CASE WHEN v_is_complete THEN 4 ELSE v_current_step END,
        completed_steps = v_completed_steps,
        is_complete = v_is_complete,
        completed_at = CASE WHEN v_is_complete AND completed_at IS NULL THEN now() ELSE completed_at END,
        last_activity_at = now(),
        updated_at = now(),
        -- Update step-specific timestamps and data
        step_1_completed_at = CASE WHEN p_step_number = 1 AND step_1_completed_at IS NULL THEN now() ELSE step_1_completed_at END,
        step_2_completed_at = CASE WHEN p_step_number = 2 AND step_2_completed_at IS NULL THEN now() ELSE step_2_completed_at END,
        step_3_completed_at = CASE WHEN p_step_number = 3 AND step_3_completed_at IS NULL THEN now() ELSE step_3_completed_at END,
        step_4_completed_at = CASE WHEN p_step_number = 4 AND step_4_completed_at IS NULL THEN now() ELSE step_4_completed_at END,
        -- Update step-specific data
        profile_setup_data = CASE WHEN p_step_number = 1 AND p_step_data IS NOT NULL THEN p_step_data ELSE profile_setup_data END,
        stripe_kyc_data = CASE WHEN p_step_number = 2 AND p_step_data IS NOT NULL THEN p_step_data ELSE stripe_kyc_data END,
        bank_connection_data = CASE WHEN p_step_number = 3 AND p_step_data IS NOT NULL THEN p_step_data ELSE bank_connection_data END,
        payment_data = CASE WHEN p_step_number = 4 AND p_step_data IS NOT NULL THEN p_step_data ELSE payment_data END
    WHERE user_id = p_user_id;
    
    -- Log the step completion
    INSERT INTO public.onboarding_step_logs (
        user_id,
        step_number,
        step_name,
        action,
        status,
        data,
        session_id
    ) VALUES (
        p_user_id,
        p_step_number,
        v_step_name,
        'completed',
        'success',
        p_step_data,
        p_session_id
    );
    
    -- Return updated progress
    RETURN jsonb_build_object(
        'success', true,
        'currentStep', v_current_step,
        'completedSteps', v_completed_steps,
        'isComplete', v_is_complete,
        'message', 'Step ' || p_step_number || ' (' || v_step_name || ') completed successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    -- Log the error
    INSERT INTO public.onboarding_step_logs (
        user_id,
        step_number,
        step_name,
        action,
        status,
        error_details,
        session_id
    ) VALUES (
        p_user_id,
        p_step_number,
        v_step_name,
        'failed',
        'error',
        jsonb_build_object(
            'error_message', SQLERRM,
            'error_code', SQLSTATE
        ),
        p_session_id
    );
    
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log onboarding step actions
CREATE OR REPLACE FUNCTION public.log_onboarding_step(
    p_user_id UUID,
    p_step_number INTEGER,
    p_action TEXT,
    p_status TEXT DEFAULT 'success',
    p_data JSONB DEFAULT NULL,
    p_error_details JSONB DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_step_name TEXT;
BEGIN
    -- Get step name
    v_step_name := CASE p_step_number
        WHEN 1 THEN 'Profile & Service Setup'
        WHEN 2 THEN 'Stripe Connect KYC'
        WHEN 3 THEN 'Bank Account Connection'
        WHEN 4 THEN 'Onboarding Fee Payment'
        ELSE 'Unknown Step'
    END;
    
    -- Insert log entry
    INSERT INTO public.onboarding_step_logs (
        user_id,
        step_number,
        step_name,
        action,
        status,
        data,
        error_details,
        session_id
    ) VALUES (
        p_user_id,
        p_step_number,
        v_step_name,
        p_action,
        p_status,
        p_data,
        p_error_details,
        p_session_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get onboarding progress
CREATE OR REPLACE FUNCTION public.get_onboarding_progress(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_progress RECORD;
    v_result JSONB;
BEGIN
    -- Get progress record
    SELECT * INTO v_progress
    FROM public.onboarding_progress
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- Return default progress for new users
        RETURN jsonb_build_object(
            'currentStep', 1,
            'completedSteps', '[]'::jsonb,
            'isComplete', false,
            'startedAt', null,
            'completedAt', null,
            'lastActivityAt', null
        );
    END IF;
    
    -- Build result object
    v_result := jsonb_build_object(
        'currentStep', v_progress.current_step,
        'completedSteps', to_jsonb(v_progress.completed_steps),
        'isComplete', v_progress.is_complete,
        'startedAt', v_progress.started_at,
        'completedAt', v_progress.completed_at,
        'lastActivityAt', v_progress.last_activity_at,
        'stepCompletionTimes', jsonb_build_object(
            'step1', v_progress.step_1_completed_at,
            'step2', v_progress.step_2_completed_at,
            'step3', v_progress.step_3_completed_at,
            'step4', v_progress.step_4_completed_at
        ),
        'stepData', jsonb_build_object(
            'profileSetup', v_progress.profile_setup_data,
            'stripeKyc', v_progress.stripe_kyc_data,
            'bankConnection', v_progress.bank_connection_data,
            'payment', v_progress.payment_data
        ),
        'retryCount', v_progress.retry_count,
        'lastError', v_progress.last_error
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.onboarding_progress IS 'Tracks detailed onboarding progress for washers through 4-step process';
COMMENT ON TABLE public.onboarding_step_logs IS 'Audit trail for all onboarding step actions and status changes';
COMMENT ON TABLE public.onboarding_analytics IS 'Aggregated analytics for onboarding completion rates and performance';

COMMENT ON FUNCTION public.update_onboarding_progress IS 'Updates onboarding progress when a step is completed';
COMMENT ON FUNCTION public.log_onboarding_step IS 'Logs onboarding step actions for audit trail';
COMMENT ON FUNCTION public.get_onboarding_progress IS 'Retrieves comprehensive onboarding progress for a user';