
import { createSupabaseServerClient } from '@/utils/supabase/server'

/**
 * Alerting System for Verification Process Monitoring
 * Implements real-time alerting for critical verification issues
 * Part of task 11 implementation
 */

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  metadata: Record<string, unknown>
  threshold?: number
  current_value?: number
  created_at: string
  resolved_at?: string
  status: 'active' | 'resolved' | 'acknowledged'
}

export type AlertType = 
  | 'error_spike'
  | 'slow_performance'
  | 'high_abandonment'
  | 'verification_failure_rate'
  | 'api_timeout'
  | 'database_error'
  | 'stripe_api_error'
  | 'system_health'

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface AlertRule {
  type: AlertType
  severity: AlertSeverity
  threshold: number
  timeWindow: number // minutes
  enabled: boolean
  description: string
}

/**
 * Default alert rules for verification monitoring
 */
export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    type: 'error_spike',
    severity: 'high',
    threshold: 10, // More than 10 errors in time window
    timeWindow: 60, // 1 hour
    enabled: true,
    description: 'High number of verification errors detected'
  },
  {
    type: 'slow_performance',
    severity: 'medium',
    threshold: 5000, // API calls taking longer than 5 seconds
    timeWindow: 30, // 30 minutes
    enabled: true,
    description: 'API performance degradation detected'
  },
  {
    type: 'high_abandonment',
    severity: 'medium',
    threshold: 30, // More than 30% abandonment rate
    timeWindow: 120, // 2 hours
    enabled: true,
    description: 'High verification abandonment rate'
  },
  {
    type: 'verification_failure_rate',
    severity: 'high',
    threshold: 25, // More than 25% failure rate
    timeWindow: 60, // 1 hour
    enabled: true,
    description: 'High verification failure rate detected'
  },
  {
    type: 'api_timeout',
    severity: 'critical',
    threshold: 5, // More than 5 timeouts
    timeWindow: 15, // 15 minutes
    enabled: true,
    description: 'Multiple API timeouts detected'
  }
]

export class AlertingSystem {
  private static instance: AlertingSystem
  private supabase = createSupabaseServerClient()
  private alertRules: AlertRule[] = DEFAULT_ALERT_RULES

  static getInstance(): AlertingSystem {
    if (!AlertingSystem.instance) {
      AlertingSystem.instance = new AlertingSystem()
    }
    return AlertingSystem.instance
  }

  /**
   * Check all alert rules and trigger alerts if thresholds are exceeded
   */
  async checkAlertRules(): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = []

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue

      try {
        const alert = await this.checkRule(rule)
        if (alert) {
          triggeredAlerts.push(alert)
          await this.storeAlert(alert)
          await this.notifyAlert(alert)
        }
      } catch (error) {
        console.error(`[ALERTING] Error checking rule ${rule.type}:`, error)
      }
    }

    return triggeredAlerts
  }

  /**
   * Check a specific alert rule
   */
  private async checkRule(rule: AlertRule): Promise<Alert | null> {
    const timeWindowStart = new Date(Date.now() - rule.timeWindow * 60 * 1000)
    const now = new Date()

    switch (rule.type) {
      case 'error_spike':
        return await this.checkErrorSpike(rule, timeWindowStart, now)
      
      case 'slow_performance':
        return await this.checkSlowPerformance(rule, timeWindowStart, now)
      
      case 'high_abandonment':
        return await this.checkHighAbandonment(rule, timeWindowStart, now)
      
      case 'verification_failure_rate':
        return await this.checkVerificationFailureRate(rule, timeWindowStart, now)
      
      case 'api_timeout':
        return await this.checkApiTimeouts(rule, timeWindowStart, now)
      
      default:
        return null
    }
  }

  /**
   * Check for error spikes
   */
  private async checkErrorSpike(rule: AlertRule, startTime: Date, endTime: Date): Promise<Alert | null> {
    try {
      const { data: errors } = await this.supabase
        .from('verification_events')
        .select('id')
        .eq('event_type', 'verification_failed')
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', endTime.toISOString())

      const errorCount = errors?.length || 0

      if (errorCount > rule.threshold) {
        return {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: rule.type,
          severity: rule.severity,
          title: 'Verification Error Spike Detected',
          message: `${errorCount} verification errors detected in the last ${rule.timeWindow} minutes (threshold: ${rule.threshold})`,
          metadata: {
            error_count: errorCount,
            time_window: rule.timeWindow,
            threshold: rule.threshold
          },
          threshold: rule.threshold,
          current_value: errorCount,
          created_at: new Date().toISOString(),
          status: 'active'
        }
      }

      return null
    } catch (error) {
      console.error('[ALERTING] Error checking error spike:', error)
      return null
    }
  }

  /**
   * Check for slow performance
   */
  private async checkSlowPerformance(rule: AlertRule, startTime: Date, endTime: Date): Promise<Alert | null> {
    try {
      const { data: slowCalls } = await this.supabase
        .from('verification_events')
        .select('duration_ms, event_data')
        .eq('event_type', 'api_call_made')
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', endTime.toISOString())
        .gt('duration_ms', rule.threshold)

      const slowCallCount = slowCalls?.length || 0

      if (slowCallCount > 5) { // More than 5 slow calls
        const avgDuration = (slowCalls?.reduce((sum, call) => sum + (call.duration_ms || 0), 0) || 0) / slowCallCount

        return {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: rule.type,
          severity: rule.severity,
          title: 'Performance Degradation Detected',
          message: `${slowCallCount} API calls exceeded ${rule.threshold}ms threshold in the last ${rule.timeWindow} minutes (avg: ${Math.round(avgDuration)}ms)`,
          metadata: {
            slow_call_count: slowCallCount,
            avg_duration: avgDuration,
            threshold: rule.threshold,
            time_window: rule.timeWindow
          },
          threshold: rule.threshold,
          current_value: avgDuration,
          created_at: new Date().toISOString(),
          status: 'active'
        }
      }

      return null
    } catch (error) {
      console.error('[ALERTING] Error checking slow performance:', error)
      return null
    }
  }

  /**
   * Check for high abandonment rate
   */
  private async checkHighAbandonment(rule: AlertRule, startTime: Date, endTime: Date): Promise<Alert | null> {
    try {
      const { data: journeys } = await this.supabase
        .from('user_journeys')
        .select('completion_status')
        .gte('started_at', startTime.toISOString())
        .lte('started_at', endTime.toISOString())

      if (!journeys || journeys.length === 0) return null

      const abandonedCount = journeys.filter(j => j.completion_status === 'abandoned').length
      const abandonmentRate = (abandonedCount / journeys.length) * 100

      if (abandonmentRate > rule.threshold) {
        return {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: rule.type,
          severity: rule.severity,
          title: 'High Abandonment Rate Detected',
          message: `${Math.round(abandonmentRate)}% of users abandoned verification in the last ${rule.timeWindow} minutes (threshold: ${rule.threshold}%)`,
          metadata: {
            abandonment_rate: abandonmentRate,
            abandoned_count: abandonedCount,
            total_journeys: journeys.length,
            threshold: rule.threshold,
            time_window: rule.timeWindow
          },
          threshold: rule.threshold,
          current_value: abandonmentRate,
          created_at: new Date().toISOString(),
          status: 'active'
        }
      }

      return null
    } catch (error) {
      console.error('[ALERTING] Error checking abandonment rate:', error)
      return null
    }
  }

  /**
   * Check verification failure rate
   */
  private async checkVerificationFailureRate(rule: AlertRule, startTime: Date, endTime: Date): Promise<Alert | null> {
    try {
      const { data: events } = await this.supabase
        .from('verification_events')
        .select('event_type')
        .in('event_type', ['verification_started', 'verification_failed'])
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', endTime.toISOString())

      if (!events || events.length === 0) return null

      const startedCount = events.filter(e => e.event_type === 'verification_started').length
      const failedCount = events.filter(e => e.event_type === 'verification_failed').length

      if (startedCount === 0) return null

      const failureRate = (failedCount / startedCount) * 100

      if (failureRate > rule.threshold) {
        return {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: rule.type,
          severity: rule.severity,
          title: 'High Verification Failure Rate',
          message: `${Math.round(failureRate)}% verification failure rate in the last ${rule.timeWindow} minutes (threshold: ${rule.threshold}%)`,
          metadata: {
            failure_rate: failureRate,
            failed_count: failedCount,
            started_count: startedCount,
            threshold: rule.threshold,
            time_window: rule.timeWindow
          },
          threshold: rule.threshold,
          current_value: failureRate,
          created_at: new Date().toISOString(),
          status: 'active'
        }
      }

      return null
    } catch (error) {
      console.error('[ALERTING] Error checking failure rate:', error)
      return null
    }
  }

  /**
   * Check for API timeouts
   */
  private async checkApiTimeouts(rule: AlertRule, startTime: Date, endTime: Date): Promise<Alert | null> {
    try {
      const { data: timeouts } = await this.supabase
        .from('verification_events')
        .select('event_data, error_details')
        .eq('event_type', 'api_call_made')
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', endTime.toISOString())

      const timeoutCount = timeouts?.filter(event => 
        event.error_details?.message?.includes('timeout') ||
        event.error_details?.message?.includes('ETIMEDOUT') ||
        event.error_details?.type === 'network_error'
      ).length || 0

      if (timeoutCount > rule.threshold) {
        return {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: rule.type,
          severity: rule.severity,
          title: 'API Timeout Alert',
          message: `${timeoutCount} API timeouts detected in the last ${rule.timeWindow} minutes (threshold: ${rule.threshold})`,
          metadata: {
            timeout_count: timeoutCount,
            threshold: rule.threshold,
            time_window: rule.timeWindow
          },
          threshold: rule.threshold,
          current_value: timeoutCount,
          created_at: new Date().toISOString(),
          status: 'active'
        }
      }

      return null
    } catch (error) {
      console.error('[ALERTING] Error checking API timeouts:', error)
      return null
    }
  }

  /**
   * Store alert in database
   */
  private async storeAlert(alert: Alert): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('verification_alerts')
        .insert({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          metadata: alert.metadata,
          threshold: alert.threshold,
          current_value: alert.current_value,
          created_at: alert.created_at,
          status: alert.status
        })

      if (error) {
        console.error('[ALERTING] Failed to store alert:', error)
      }
    } catch (error) {
      console.error('[ALERTING] Error storing alert:', error)
    }
  }

  /**
   * Send alert notifications
   */
  private async notifyAlert(alert: Alert): Promise<void> {
    try {
      // Log alert for immediate visibility
      const logLevel = alert.severity === 'critical' ? 'ERROR' : 
                      alert.severity === 'high' ? 'WARN' : 'INFO'
      
      console.log(`[ALERT_${logLevel}] ${JSON.stringify({
        type: 'verification_alert',
        alert_id: alert.id,
        alert_type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        threshold: alert.threshold,
        current_value: alert.current_value,
        metadata: alert.metadata,
        timestamp: alert.created_at
      })}`)

      // Here you could integrate with external alerting systems:
      // - Slack notifications
      // - Email alerts
      // - PagerDuty
      // - Discord webhooks
      // - SMS alerts for critical issues

      // Example webhook notification (commented out)
      /*
      if (alert.severity === 'critical' && process.env.ALERT_WEBHOOK_URL) {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 CRITICAL ALERT: ${alert.title}`,
            attachments: [{
              color: 'danger',
              fields: [
                { title: 'Message', value: alert.message, short: false },
                { title: 'Threshold', value: alert.threshold?.toString(), short: true },
                { title: 'Current Value', value: alert.current_value?.toString(), short: true }
              ]
            }]
          })
        })
      }
      */

    } catch (error) {
      console.error('[ALERTING] Error sending alert notification:', error)
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    try {
      const { data: alerts } = await this.supabase
        .from('verification_alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50)

      return alerts || []
    } catch (error) {
      console.error('[ALERTING] Error getting active alerts:', error)
      return []
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('verification_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId)

      if (error) {
        console.error('[ALERTING] Failed to resolve alert:', error)
      }
    } catch (error) {
      console.error('[ALERTING] Error resolving alert:', error)
    }
  }

  /**
   * Update alert rules
   */
  updateAlertRules(rules: AlertRule[]): void {
    this.alertRules = rules
  }

  /**
   * Get current alert rules
   */
  getAlertRules(): AlertRule[] {
    return [...this.alertRules]
  }
}

// Export singleton instance
export const alertingSystem = AlertingSystem.getInstance()

// Helper functions
export const checkAlertRules = () => alertingSystem.checkAlertRules()
export const getActiveAlerts = () => alertingSystem.getActiveAlerts()
export const resolveAlert = (alertId: string) => alertingSystem.resolveAlert(alertId)