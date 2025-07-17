# Verification Monitoring System

## Overview

The verification monitoring system provides comprehensive tracking, analytics, and alerting for the washer Stripe Connect KYC verification process. It implements real-time monitoring, performance tracking, error detection, and user journey analysis.

## Architecture

### Core Components

1. **Verification Analytics** (`lib/monitoring/verification-analytics.ts`)
   - Event tracking and storage
   - User journey monitoring
   - Metrics calculation and analysis

2. **Performance Monitor** (`lib/monitoring/performance-monitor.ts`)
   - API call performance tracking
   - Database operation monitoring
   - Slow operation detection

3. **Alerting System** (`lib/monitoring/alerting-system.ts`)
   - Real-time alert generation
   - Threshold-based monitoring
   - Alert notification system

4. **Scheduled Monitoring** (`lib/monitoring/scheduled-monitoring.ts`)
   - Automated monitoring jobs
   - System health checks
   - Maintenance tasks

5. **Verification Dashboard** (`lib/monitoring/verification-dashboard.ts`)
   - Comprehensive metrics dashboard
   - User journey analysis
   - Data export functionality

## Features

### Event Tracking

The system tracks the following verification events:
- `verification_started` - User begins verification process
- `account_created` - Stripe Connect account created
- `onboarding_link_generated` - Stripe onboarding link created
- `stripe_redirect` - User redirected to Stripe
- `callback_received` - Return from Stripe onboarding
- `status_updated` - Verification status changed
- `verification_completed` - Verification successfully completed
- `verification_failed` - Verification failed
- `retry_attempted` - User retried failed operation
- `api_call_made` - API performance tracking

### Key Metrics

- **Completion Rate**: Percentage of users who complete verification
- **Average Completion Time**: Time from start to completion
- **Error Rate**: Percentage of verification attempts that fail
- **Abandonment Points**: Where users most commonly drop off
- **API Performance**: Response times for Stripe and database operations

### Real-time Alerts

The system monitors for:
- **Error Spikes**: High number of verification failures
- **Slow Performance**: API calls exceeding thresholds
- **High Abandonment**: Users dropping off at high rates
- **API Timeouts**: Network connectivity issues

## Usage

### Integration in Components

Components automatically track events using server actions:

```typescript
import { 
  trackVerificationStartedAction,
  trackVerificationFailedAction 
} from '@/lib/monitoring/verification-analytics-actions'

// Track verification start
await trackVerificationStartedAction(userId, sessionId, {
  component: 'WasherVerificationContainer',
  metadata: { /* additional data */ }
})

// Track verification failure
await trackVerificationFailedAction(userId, accountId, sessionId, error, step, {
  component: 'ComponentName',
  retry_count: 0
})
```

### Server-side Integration

Stripe actions automatically include performance monitoring:

```typescript
import { withStripeApiMonitoring } from '@/lib/monitoring/performance-monitor'

const account = await withStripeApiMonitoring(
  'account_create',
  () => stripe.accounts.create({ /* params */ }),
  { userId, sessionId, metadata }
)
```

### Dashboard Access

Get comprehensive metrics:

```typescript
import { getDashboardMetrics } from '@/lib/monitoring/verification-dashboard'

const metrics = await getDashboardMetrics(startDate, endDate)
// Returns: completion rates, error rates, performance metrics, alerts
```

### Scheduled Monitoring

Run automated monitoring checks:

```bash
# Via API endpoint
curl -X POST http://localhost:3000/api/monitoring/run-checks \
  -H "Authorization: Bearer YOUR_TOKEN"

# Or programmatically
import { runScheduledMonitoringJob } from '@/lib/monitoring/scheduled-monitoring'
const result = await runScheduledMonitoringJob()
```

## Database Schema

### Verification Events Table

```sql
CREATE TABLE verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  stripe_account_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  session_id TEXT,
  user_agent TEXT,
  ip_address TEXT,
  duration_ms INTEGER,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### User Journeys Table

```sql
CREATE TABLE user_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  current_step TEXT NOT NULL,
  steps_completed TEXT[] DEFAULT '{}',
  total_duration_ms INTEGER,
  errors_encountered INTEGER DEFAULT 0,
  retry_attempts INTEGER DEFAULT 0,
  abandonment_point TEXT,
  completion_status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Verification Alerts Table

```sql
CREATE TABLE verification_alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  threshold NUMERIC,
  current_value NUMERIC,
  created_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active'
);
```

## Configuration

### Environment Variables

```bash
# Optional: Secure monitoring API endpoint
MONITORING_API_TOKEN=your-secure-token

# Optional: Alert webhook URL (Slack, Discord, etc.)
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### Performance Thresholds

Customize performance thresholds in `lib/monitoring/performance-utils.ts`:

```typescript
export const PERFORMANCE_THRESHOLDS = {
  stripe_account_create: 5000, // 5 seconds
  stripe_account_retrieve: 3000, // 3 seconds
  db_profile_update: 1000, // 1 second
  // ... other thresholds
}
```

### Alert Rules

Customize alert rules in `lib/monitoring/alerting-system.ts`:

```typescript
export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    type: 'error_spike',
    severity: 'high',
    threshold: 10, // More than 10 errors in time window
    timeWindow: 60, // 1 hour
    enabled: true
  },
  // ... other rules
]
```

## Monitoring Best Practices

### 1. Regular Health Checks

Set up automated monitoring jobs to run every 15-30 minutes:

```bash
# Cron job example
*/15 * * * * curl -X POST http://localhost:3000/api/monitoring/run-checks
```

### 2. Alert Integration

Configure webhook notifications for critical alerts:

```typescript
// In alerting-system.ts
if (alert.severity === 'critical' && process.env.ALERT_WEBHOOK_URL) {
  await fetch(process.env.ALERT_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 CRITICAL ALERT: ${alert.title}`,
      // ... alert details
    })
  })
}
```

### 3. Data Retention

Implement data cleanup for old events:

```sql
-- Clean up events older than 90 days
DELETE FROM verification_events 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Archive completed journeys older than 30 days
UPDATE user_journeys 
SET archived = true 
WHERE completion_status IN ('completed', 'failed') 
  AND completed_at < NOW() - INTERVAL '30 days';
```

### 4. Performance Optimization

- Index frequently queried columns
- Use database functions for complex aggregations
- Cache metrics for dashboard displays
- Implement read replicas for analytics queries

## Troubleshooting

### Common Issues

1. **High Memory Usage**: Large number of events can consume memory
   - Solution: Implement data archiving and cleanup

2. **Slow Dashboard Loading**: Complex metrics calculations
   - Solution: Pre-calculate metrics and cache results

3. **Missing Events**: Analytics failures shouldn't break main flow
   - Solution: All tracking is wrapped in try-catch blocks

4. **Alert Spam**: Too many alerts can be overwhelming
   - Solution: Implement alert throttling and grouping

### Debug Logging

Enable detailed logging by checking console output:

```bash
# Look for structured log entries
grep "VERIFICATION_ANALYTICS" logs/app.log
grep "PERFORMANCE_MONITOR" logs/app.log
grep "ALERT_" logs/app.log
```

## Future Enhancements

1. **Machine Learning**: Predict verification success probability
2. **A/B Testing**: Track different verification flows
3. **Real-time Dashboard**: WebSocket-based live updates
4. **Advanced Analytics**: Cohort analysis, funnel optimization
5. **Integration**: Connect with external monitoring tools (DataDog, New Relic)

## Support

For issues with the monitoring system:

1. Check the console logs for error messages
2. Verify database connectivity and table existence
3. Ensure proper environment variables are set
4. Review alert rules and thresholds
5. Contact the development team for assistance