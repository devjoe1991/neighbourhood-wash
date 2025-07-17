-- Create verification analytics tables for monitoring and tracking
-- Implements Requirements 6.1, 6.2, 6.3 for verification monitoring

-- Create verification events table for detailed event tracking
CREATE TABLE IF NOT EXISTS verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_account_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'verification_started',
    'account_created',
    'onboarding_link_generated',
    'stripe_redirect',
    'callback_received',
    'status_updated',
    'verification_completed',
    'verification_failed',
    'error_occurred',
    'retry_attempted',
    'user_abandoned',
    'api_call_made',
    'performance_metric'
  )),
  event_data JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,
  duration_ms INTEGER,
  error_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user journeys table for tracking complete verification flows
CREATE TABLE IF NOT EXISTS user_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  current_step TEXT NOT NULL DEFAULT 'verification_started',
  steps_completed TEXT[] NOT NULL DEFAULT ARRAY['verification_started'],
  total_duration_ms INTEGER,
  errors_encountered INTEGER NOT NULL DEFAULT 0,
  retry_attempts INTEGER NOT NULL DEFAULT 0,
  abandonment_point TEXT,
  completion_status TEXT NOT NULL DEFAULT 'in_progress' CHECK (completion_status IN (
    'in_progress',
    'completed',
    'failed',
    'abandoned'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_events_user_id ON verification_events(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_events_event_type ON verification_events(event_type);
CREATE INDEX IF NOT EXISTS idx_verification_events_timestamp ON verification_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_verification_events_session_id ON verification_events(session_id);
CREATE INDEX IF NOT EXISTS idx_verification_events_stripe_account_id ON verification_events(stripe_account_id);

CREATE INDEX IF NOT EXISTS idx_user_journeys_user_id ON user_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_session_id ON user_journeys(session_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_completion_status ON user_journeys(completion_status);
CREATE INDEX IF NOT EXISTS idx_user_journeys_started_at ON user_journeys(started_at);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_verification_events_user_session ON verification_events(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_verification_events_type_timestamp ON verification_events(event_type, timestamp);

-- Add RLS policies for security
ALTER TABLE verification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journeys ENABLE ROW LEVEL SECURITY;

-- Policy for verification_events: Users can only see their own events
CREATE POLICY "Users can view their own verification events" ON verification_events
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for user_journeys: Users can only see their own journeys
CREATE POLICY "Users can view their own user journeys" ON user_journeys
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can access all data for analytics
CREATE POLICY "Service role can access all verification events" ON verification_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all user journeys" ON user_journeys
  FOR ALL USING (auth.role() = 'service_role');

-- Create functions for updating user journey data
CREATE OR REPLACE FUNCTION array_append_unique(arr TEXT[], elem TEXT)
RETURNS TEXT[] AS $$
BEGIN
  IF elem = ANY(arr) THEN
    RETURN arr;
  ELSE
    RETURN array_append(arr, elem);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to increment retry attempts
CREATE OR REPLACE FUNCTION increment_retry_attempts()
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(retry_attempts, 0) + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to increment errors encountered
CREATE OR REPLACE FUNCTION increment_errors_encountered()
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(errors_encountered, 0) + 1;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_journeys_updated_at
  BEFORE UPDATE ON user_journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for verification metrics
CREATE OR REPLACE VIEW verification_metrics AS
SELECT 
  DATE_TRUNC('day', timestamp) as date,
  COUNT(*) FILTER (WHERE event_type = 'verification_started') as started_count,
  COUNT(*) FILTER (WHERE event_type = 'verification_completed') as completed_count,
  COUNT(*) FILTER (WHERE event_type = 'verification_failed') as failed_count,
  COUNT(*) FILTER (WHERE event_type = 'retry_attempted') as retry_count,
  ROUND(
    (COUNT(*) FILTER (WHERE event_type = 'verification_completed')::DECIMAL / 
     NULLIF(COUNT(*) FILTER (WHERE event_type = 'verification_started'), 0)) * 100, 
    2
  ) as completion_rate_percent,
  AVG(duration_ms) FILTER (WHERE event_type = 'api_call_made') as avg_api_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) FILTER (WHERE event_type = 'api_call_made') as p95_api_duration_ms
FROM verification_events
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY date DESC;

-- Create view for error analysis
CREATE OR REPLACE VIEW verification_error_analysis AS
SELECT 
  error_details->>'type' as error_type,
  error_details->>'message' as error_message,
  COUNT(*) as occurrence_count,
  ROUND((COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM verification_events WHERE event_type = 'verification_failed')) * 100, 2) as percentage,
  MIN(timestamp) as first_occurrence,
  MAX(timestamp) as last_occurrence
FROM verification_events
WHERE event_type = 'verification_failed' 
  AND error_details IS NOT NULL
  AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY error_details->>'type', error_details->>'message'
ORDER BY occurrence_count DESC;

-- Create view for user journey analysis
CREATE OR REPLACE VIEW user_journey_analysis AS
SELECT 
  completion_status,
  COUNT(*) as journey_count,
  ROUND((COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM user_journeys)) * 100, 2) as percentage,
  AVG(total_duration_ms) as avg_duration_ms,
  AVG(errors_encountered) as avg_errors,
  AVG(retry_attempts) as avg_retries,
  MODE() WITHIN GROUP (ORDER BY abandonment_point) as common_abandonment_point
FROM user_journeys
WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY completion_status
ORDER BY journey_count DESC;

-- Grant necessary permissions
GRANT SELECT ON verification_events TO authenticated;
GRANT SELECT ON user_journeys TO authenticated;
GRANT SELECT ON verification_metrics TO authenticated;
GRANT SELECT ON verification_error_analysis TO authenticated;
GRANT SELECT ON user_journey_analysis TO authenticated;

-- Grant insert/update permissions to service role for analytics
GRANT INSERT, UPDATE ON verification_events TO service_role;
GRANT INSERT, UPDATE ON user_journeys TO service_role;

-- Add comments for documentation
COMMENT ON TABLE verification_events IS 'Tracks all verification-related events for analytics and monitoring';
COMMENT ON TABLE user_journeys IS 'Tracks complete user verification journeys from start to completion';
COMMENT ON VIEW verification_metrics IS 'Daily aggregated metrics for verification performance';
COMMENT ON VIEW verification_error_analysis IS 'Analysis of verification errors and their frequency';
COMMENT ON VIEW user_journey_analysis IS 'Analysis of user journey patterns and completion rates';