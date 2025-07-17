import { verificationAnalytics, VerificationMetrics } from './verification-analytics'
import { verificationDashboard, DashboardMetrics } from './verification-dashboard'
import { alertingSystem, Alert } from './alerting-system'
import { createSupabaseServerClient } from '@/utils/supabase/server'

/**
 * Comprehensive Monitoring API
 * Provides unified access to all verification monitoring capabilities
 * Implements Requirements 6.1, 6.2, 6.3 for task 11
 */

export interface MonitoringOverview {
  metrics: VerificationMetrics | null
  dashboard: DashboardMetrics | null
  alerts: Alert[]
  system_health: SystemHealthStatus
  recent_activity: RecentActivity[]
}

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'critical'
  checks: {
    database_connectivity: boolean
    stripe_api_connectivity: boolean
    error_rate_acceptable: boolean
    performance_acceptable: boolean
    alert_system_functional: boolean
  }
  last_check: string
  issues: string[]
}

export interface RecentActivity {
  timestamp: string
  type: 'verification_started' | 'verification_completed' | 'verification_failed' | 'alert_triggered' | 'performance_issue'
  user_id?: string
  message: string
  metadata?: Record<string, unknown>
}

export interface PerformanceReport {
  period: {
    start: string
    end: string
  }
  api_performance: {
    stripe_operations: Array<{
      operation: string
      avg_duration_ms: number
      p95_duration_ms: number
      success_rate: number
      total_calls: number
    }>
    database_operations: Array<{
      operation: string
      avg_duration_ms: number
      p95_duration_ms: number
      success_rate: number
      total_calls: number
    }>
  }
  user_journey_analysis: {
    avg_completion_time_ms: number
    completion_rate: number
    common_drop_off_points: Array<{
      step: string
      drop_off_rate: number
    }>
  }
  error_analysis: {
    total_errors: number
    error_rate: number
    error_breakdown: Array<{
      error_type: string
      count: number
      percentage: number
    }>
  }
}

export class MonitoringAPI {
  private static instance: MonitoringAPI
  private supabase = createSupabaseServerClient()

  static getInstance(): MonitoringAPI {
    if (!MonitoringAPI.instance) {
      MonitoringAPI.instance = new MonitoringAPI()
    }
    return MonitoringAPI.instance
  }

  /**
   * Get comprehensive monitoring overview
   */
  async getMonitoringOverview(
    startDate?: string,
    endDate?: string
  ): Promise<MonitoringOverview> {
    try {
      console.log('[MONITORING_API] Fetching monitoring overview')

      // Fetch all monitoring data in parallel
      const [metrics, dashboard, alerts, systemHealth, recentActivity] = await Promise.all([
        verificationAnalytics.getVerificationMetrics(startDate, endDate),
        verificationDashboard.getDashboardMetrics(startDate, endDate),
        alertingSystem.getActiveAlerts(),
        this.getSystemHealth(),
        this.getRecentActivity(50)
      ])

      return {
        metrics,
        dashboard,
        alerts,
        system_health: systemHealth,
        recent_activity: recentActivity
      }
    } catch (error) {
      console.error('[MONITORING_API] Error fetching monitoring overview:', error)
      
      // Return minimal data structure on error
      return {
        metrics: null,
        dashboard: null,
        alerts: [],
        system_health: {
          status: 'critical',
          checks: {
            database_connectivity: false,
            stripe_api_connectivity: false,
            error_rate_acceptable: false,
            performance_acceptable: false,
            alert_system_functional: false
          },
          last_check: new Date().toISOString(),
          issues: ['Failed to fetch monitoring data']
        },
        recent_activity: []
      }
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealthStatus> {
    const checks = {
      database_connectivity: false,
      stripe_api_connectivity: false,
      error_rate_acceptable: false,
      performance_acceptable: false,
      alert_system_functional: false
    }
    const issues: string[] = []

    try {
      // Check database connectivity
      const { data: dbTest } = await this.supabase
        .from('verification_events')
        .select('id')
        .limit(1)
      
      checks.database_connectivity = dbTest !== null
      if (!checks.database_connectivity) {
        issues.push('Database connectivity issues detected')
      }

      // Check error rate (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const { data: recentEvents } = await this.supabase
        .from('verification_events')
        .select('event_type')
        .gte('timestamp', oneHourAgo.toISOString())

      if (recentEvents) {
        const totalEvents = recentEvents.length
        const errorEvents = recentEvents.filter(e => e.event_type === 'verification_failed').length
        const errorRate = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0
        
        checks.error_rate_acceptable = errorRate < 20 // Less than 20% error rate
        if (!checks.error_rate_acceptable) {
          issues.push(`High error rate: ${Math.round(errorRate)}%`)
        }
      }

      // Check performance (API calls in last hour)
      const { data: apiCalls } = await this.supabase
        .from('verification_events')
        .select('duration_ms')
        .eq('event_type', 'api_call_made')
        .gte('timestamp', oneHourAgo.toISOString())

      if (apiCalls && apiCalls.length > 0) {
        const avgDuration = apiCalls.reduce((sum, call) => sum + (call.duration_ms || 0), 0) / apiCalls.length
        checks.performance_acceptable = avgDuration < 5000 // Less than 5 seconds average
        if (!checks.performance_acceptable) {
          issues.push(`Slow API performance: ${Math.round(avgDuration)}ms average`)
        }
      } else {
        checks.performance_acceptable = true // No data means no performance issues
      }

      // Check alert system functionality
      try {
        const activeAlerts = await alertingSystem.getActiveAlerts()
        checks.alert_system_functional = true
        
        // Check for critical alerts
        const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical')
        if (criticalAlerts.length > 0) {
          issues.push(`${criticalAlerts.length} critical alerts active`)
        }
      } catch (error) {
        checks.alert_system_functional = false
        issues.push('Alert system not responding')
      }

      // Determine overall status
      const criticalIssues = !checks.database_connectivity || !checks.alert_system_functional
      const majorIssues = !checks.error_rate_acceptable || !checks.performance_acceptable
      
      let status: SystemHealthStatus['status'] = 'healthy'
      if (criticalIssues) {
        status = 'critical'
      } else if (majorIssues) {
        status = 'degraded'
      }

      return {
        status,
        checks,
        last_check: new Date().toISOString(),
        issues
      }

    } catch (_error) {
      console.error('[MONITORING_API] Error checking system health:', _error)
      return {
        status: 'critical',
        checks,
        last_check: new Date().toISOString(),
        issues: [...issues, 'System health check failed']
      }
    }
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivity(limit: number = 50): Promise<RecentActivity[]> {
    try {
      const { data: events } = await this.supabase
        .from('verification_events')
        .select('timestamp, event_type, user_id, event_data, error_details')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (!events) return []

      return events.map(event => {
        let message = ''
        let type: RecentActivity['type'] = 'verification_started'

        switch (event.event_type) {
          case 'verification_started':
            message = 'User started verification process'
            type = 'verification_started'
            break
          case 'verification_completed':
            message = 'User completed verification successfully'
            type = 'verification_completed'
            break
          case 'verification_failed':
            message = `Verification failed: ${event.error_details?.message || 'Unknown error'}`
            type = 'verification_failed'
            break
          case 'api_call_made':
            if (event.event_data?.success === false) {
              message = `API call failed: ${event.event_data?.operation}`
              type = 'performance_issue'
            } else {
              message = `API call completed: ${event.event_data?.operation}`
              type = 'verification_started' // Default type for successful API calls
            }
            break
          default:
            message = `${event.event_type} event occurred`
        }

        return {
          timestamp: event.timestamp,
          type,
          user_id: event.user_id,
          message,
          metadata: {
            event_type: event.event_type,
            event_data: event.event_data,
            error_details: event.error_details
          }
        }
      })
    } catch (error) {
      console.error('[MONITORING_API] Error fetching recent activity:', error)
      return []
    }
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(
    startDate: string,
    endDate: string
  ): Promise<PerformanceReport> {
    try {
      console.log(`[MONITORING_API] Generating performance report for ${startDate} to ${endDate}`)

      // Get API performance data
      const { data: apiEvents } = await this.supabase
        .from('verification_events')
        .select('event_data, duration_ms, error_details')
        .eq('event_type', 'api_call_made')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)

      // Process API performance
      const apiPerformance = this.processApiPerformance(apiEvents || [])

      // Get user journey data
      const { data: journeys } = await this.supabase
        .from('user_journeys')
        .select('*')
        .gte('started_at', startDate)
        .lte('started_at', endDate)

      // Process user journey analysis
      const userJourneyAnalysis = this.processUserJourneyAnalysis(journeys || [])

      // Get error data
      const { data: errorEvents } = await this.supabase
        .from('verification_events')
        .select('error_details, event_data')
        .eq('event_type', 'verification_failed')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)

      // Process error analysis
      const errorAnalysis = this.processErrorAnalysis(errorEvents || [])

      return {
        period: {
          start: startDate,
          end: endDate
        },
        api_performance: apiPerformance,
        user_journey_analysis: userJourneyAnalysis,
        error_analysis: errorAnalysis
      }
    } catch (error) {
      console.error('[MONITORING_API] Error generating performance report:', error)
      throw error
    }
  }

  /**
   * Process API performance data
   */
  private processApiPerformance(events: unknown[]): PerformanceReport['api_performance'] {
    const operationStats = new Map<string, {
      durations: number[]
      successes: number
      total: number
    }>()

    events.forEach(event => {
      const operation = event.event_data?.operation || 'unknown'
      const duration = event.duration_ms || 0
      const success = !event.error_details

      if (!operationStats.has(operation)) {
        operationStats.set(operation, { durations: [], successes: 0, total: 0 })
      }

      const stats = operationStats.get(operation)!
      stats.durations.push(duration)
      stats.total++
      if (success) stats.successes++
    })

    const stripeOperations: PerformanceReport['api_performance']['stripe_operations'] = []
    const databaseOperations: PerformanceReport['api_performance']['database_operations'] = []

    operationStats.forEach((stats, operation) => {
      const avgDuration = stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length
      const sortedDurations = stats.durations.sort((a, b) => a - b)
      const p95Index = Math.floor(sortedDurations.length * 0.95)
      const p95Duration = sortedDurations[p95Index] || 0
      const successRate = (stats.successes / stats.total) * 100

      const operationData = {
        operation,
        avg_duration_ms: Math.round(avgDuration),
        p95_duration_ms: p95Duration,
        success_rate: Math.round(successRate * 100) / 100,
        total_calls: stats.total
      }

      if (operation.startsWith('stripe_')) {
        stripeOperations.push(operationData)
      } else if (operation.startsWith('db_')) {
        databaseOperations.push(operationData)
      }
    })

    return {
      stripe_operations: stripeOperations.sort((a, b) => b.total_calls - a.total_calls),
      database_operations: databaseOperations.sort((a, b) => b.total_calls - a.total_calls)
    }
  }

  /**
   * Process user journey analysis
   */
  private processUserJourneyAnalysis(journeys: unknown[]): PerformanceReport['user_journey_analysis'] {
    const completedJourneys = journeys.filter(j => j.completion_status === 'completed')
    const avgCompletionTime = completedJourneys.length > 0
      ? completedJourneys.reduce((sum, j) => sum + (j.total_duration_ms || 0), 0) / completedJourneys.length
      : 0

    const completionRate = journeys.length > 0
      ? (completedJourneys.length / journeys.length) * 100
      : 0

    // Analyze drop-off points
    const dropOffCounts = new Map<string, number>()
    journeys.filter(j => j.completion_status === 'abandoned').forEach(j => {
      const step = j.abandonment_point || j.current_step || 'unknown'
      dropOffCounts.set(step, (dropOffCounts.get(step) || 0) + 1)
    })

    const totalAbandoned = journeys.filter(j => j.completion_status === 'abandoned').length
    const commonDropOffPoints = Array.from(dropOffCounts.entries())
      .map(([step, count]) => ({
        step,
        drop_off_rate: totalAbandoned > 0 ? (count / totalAbandoned) * 100 : 0
      }))
      .sort((a, b) => b.drop_off_rate - a.drop_off_rate)
      .slice(0, 5)

    return {
      avg_completion_time_ms: Math.round(avgCompletionTime),
      completion_rate: Math.round(completionRate * 100) / 100,
      common_drop_off_points: commonDropOffPoints
    }
  }

  /**
   * Process error analysis
   */
  private processErrorAnalysis(errorEvents: unknown[]): PerformanceReport['error_analysis'] {
    const totalErrors = errorEvents.length
    const errorCounts = new Map<string, number>()

    errorEvents.forEach(event => {
      const errorType = event.error_details?.type || 'unknown_error'
      errorCounts.set(errorType, (errorCounts.get(errorType) || 0) + 1)
    })

    const errorBreakdown = Array.from(errorCounts.entries())
      .map(([error_type, count]) => ({
        error_type,
        count,
        percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)

    return {
      total_errors: totalErrors,
      error_rate: 0, // This would need to be calculated against total events
      error_breakdown: errorBreakdown
    }
  }

  /**
   * Run monitoring checks and trigger alerts
   */
  async runMonitoringChecks(): Promise<{
    alerts_triggered: number
    system_health: SystemHealthStatus
  }> {
    try {
      console.log('[MONITORING_API] Running monitoring checks')

      // Run alert checks
      const triggeredAlerts = await alertingSystem.checkAlertRules()
      
      // Get system health
      const systemHealth = await this.getSystemHealth()

      console.log(`[MONITORING_API] Monitoring checks complete: ${triggeredAlerts.length} alerts triggered, system status: ${systemHealth.status}`)

      return {
        alerts_triggered: triggeredAlerts.length,
        system_health: systemHealth
      }
    } catch (error) {
      console.error('[MONITORING_API] Error running monitoring checks:', error)
      throw error
    }
  }
}

// Export singleton instance
export const monitoringAPI = MonitoringAPI.getInstance()

// Helper functions for easy access
export const getMonitoringOverview = (startDate?: string, endDate?: string) =>
  monitoringAPI.getMonitoringOverview(startDate, endDate)

export const getSystemHealth = () =>
  monitoringAPI.getSystemHealth()

export const generatePerformanceReport = (startDate: string, endDate: string) =>
  monitoringAPI.generatePerformanceReport(startDate, endDate)

export const runMonitoringChecks = () =>
  monitoringAPI.runMonitoringChecks()