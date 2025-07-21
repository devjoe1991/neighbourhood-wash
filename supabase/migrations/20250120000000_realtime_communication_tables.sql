-- =============================================
-- REAL-TIME COMMUNICATION SYSTEM TABLES
-- Support for push notifications and scheduled notifications
-- =============================================

-- Push Subscriptions (for web push notifications)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Scheduled Notifications
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'scheduled',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Delivery Log (for tracking delivery status)
CREATE TABLE IF NOT EXISTS public.notification_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- 'push', 'email', 'sms'
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  error_message TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time Connection Log (for monitoring WebSocket connections)
CREATE TABLE IF NOT EXISTS public.realtime_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  socket_id TEXT NOT NULL,
  user_agent TEXT,
  ip_address INET,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  disconnected_at TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  connection_duration_seconds INTEGER,
  is_active BOOLEAN DEFAULT TRUE
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Push Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON public.push_subscriptions(is_active);

-- Scheduled Notifications indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON public.scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON public.scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON public.scheduled_notifications(status);

-- Notification Delivery Log indexes
CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_notification_id ON public.notification_delivery_log(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_user_id ON public.notification_delivery_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_status ON public.notification_delivery_log(status);

-- Real-time Connections indexes
CREATE INDEX IF NOT EXISTS idx_realtime_connections_user_id ON public.realtime_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_connections_active ON public.realtime_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_realtime_connections_connected_at ON public.realtime_connections(connected_at);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtime_connections ENABLE ROW LEVEL SECURITY;

-- Push Subscriptions policies
CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all push subscriptions" ON public.push_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'active'
    )
  );

-- Scheduled Notifications policies
CREATE POLICY "Users can view their own scheduled notifications" ON public.scheduled_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage scheduled notifications" ON public.scheduled_notifications
  FOR ALL USING (auth.uid() IS NULL); -- Allow system/service account access

CREATE POLICY "Admins can manage all scheduled notifications" ON public.scheduled_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'active'
    )
  );

-- Notification Delivery Log policies
CREATE POLICY "Users can view their own delivery logs" ON public.notification_delivery_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage delivery logs" ON public.notification_delivery_log
  FOR ALL USING (auth.uid() IS NULL);

CREATE POLICY "Admins can view all delivery logs" ON public.notification_delivery_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'active'
    )
  );

-- Real-time Connections policies
CREATE POLICY "Users can view their own connections" ON public.realtime_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage connections" ON public.realtime_connections
  FOR ALL USING (auth.uid() IS NULL);

CREATE POLICY "Admins can view all connections" ON public.realtime_connections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'active'
    )
  );

-- =============================================
-- FUNCTIONS FOR REAL-TIME FEATURES
-- =============================================

-- Function to clean up old connections
CREATE OR REPLACE FUNCTION public.cleanup_old_realtime_connections()
RETURNS void AS $$
BEGIN
  -- Mark connections as inactive if they haven't been active for more than 5 minutes
  UPDATE public.realtime_connections 
  SET 
    is_active = false,
    disconnected_at = NOW(),
    connection_duration_seconds = EXTRACT(EPOCH FROM (NOW() - connected_at))::INTEGER
  WHERE 
    is_active = true 
    AND last_activity < NOW() - INTERVAL '5 minutes';
    
  -- Delete connection records older than 7 days
  DELETE FROM public.realtime_connections 
  WHERE connected_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM public.notifications
  WHERE user_id = target_user_id AND is_read = false;
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(target_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET 
    is_read = true,
    read_at = NOW()
  WHERE 
    user_id = target_user_id 
    AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get notification statistics
CREATE OR REPLACE FUNCTION public.get_notification_stats(target_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  total_notifications BIGINT,
  unread_notifications BIGINT,
  notifications_today BIGINT,
  notifications_this_week BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE is_read = false) as unread_notifications,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as notifications_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as notifications_this_week
  FROM public.notifications
  WHERE (target_user_id IS NULL OR user_id = target_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS FOR AUTOMATIC CLEANUP
-- =============================================

-- Trigger to update push subscription timestamp
CREATE OR REPLACE FUNCTION public.update_push_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_push_subscription_timestamp();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE public.push_subscriptions IS 'Web push notification subscriptions for users';
COMMENT ON TABLE public.scheduled_notifications IS 'Notifications scheduled for future delivery';
COMMENT ON TABLE public.notification_delivery_log IS 'Log of notification delivery attempts and results';
COMMENT ON TABLE public.realtime_connections IS 'Log of WebSocket connections for monitoring';

COMMENT ON COLUMN public.push_subscriptions.endpoint IS 'Push service endpoint URL';
COMMENT ON COLUMN public.push_subscriptions.p256dh_key IS 'Public key for message encryption';
COMMENT ON COLUMN public.push_subscriptions.auth_key IS 'Authentication secret for push service';

COMMENT ON FUNCTION public.cleanup_old_realtime_connections() IS 'Cleans up inactive and old WebSocket connection records';
COMMENT ON FUNCTION public.get_unread_notification_count(UUID) IS 'Returns count of unread notifications for a user';
COMMENT ON FUNCTION public.mark_all_notifications_read(UUID) IS 'Marks all notifications as read for a user';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================