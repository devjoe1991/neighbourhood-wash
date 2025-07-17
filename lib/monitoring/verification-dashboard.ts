import { verificationAnalytics, VerificationMetrics } from './verification-analytics'
import { createSupabaseServerClient } from '@/utils/supabase/server'

/**
 * Verification Dashboard Service
 * Provides comprehensive monitoring and analytics dashboard functionality
 * Implements Requirements 6.1, 6.2, 6.3
 */

export interface DashboardMetrics extends VerificationMetrics {
  realtime_stats: {
    active_verifications: number
    recent_completions: number
    recent_failures: number
    avg_completion_time_today: number
  }
  trends: {
    completion_rate_trend: number // percentage change from previous period
    error_rate_trend: number
    performance_trend: number
  }
  alerts: Array<{
    type: 'error_spike' | 'slow_performance' | 'high_abandonment' | 'system_issue'
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    count?: number
    threshold?: number
    timestamp: string
  }>
}

export interface UserVerificationSummary {
  user_id: string
  current_status: string
  verification_attempts: number
  last_attempt: string
  total_time_spent: number
  errors_encountered: number
  current_step: string
  completion_percentage: number
}

export class VerificationDashboard {
  private static instance: VerificationDashboard
  private supabase = createSupabaseServerClient()

  static getInstance(): VerificationDashboard {
    if (!VerificationDashboard.instance) {
      VerificationDashboard.instance = new VerificationDashboard()
    }
    return VerificationDashboard.instance
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(
    startDate?: string,
    endDate?: string
  ): Promise<DashboardMetrics | null> {
    try {
      // Get base metrics from analytics service
      const baseMetrics = await verificationAnalytics.getVerificationMetrics(startDate, endDate)
      
      if (!baseMetrics) {
        return null
      }

      // Get real-time stats
      const realtimeStats = await this.getRealtimeStats()
      
      // Get trends
      const trends = await this.getTrends(startDate, endDate)
      
      // Get alerts
      const alerts = await this.getActiveAlerts()

      return {
        ...baseMetrics,
        realtime_stats: realtimeStats,
        trends,
        alerts
      }
    } catch (error) {
      console.error('[VERIFICATION_DASHBOARD] Error getting dashboard metrics:', error)
      return null
    }
  }

  /**
   * Get real-time verification statistics
   */
  private async getRealtimeStats(): Promise<DashboardMetrics['realtime_stats']> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get today's events
      const { data: todayEvents } = await this.supabase
        .from('verification_events')
        .select('event_type, duration_ms, timestamp')
        .gte('timestamp', `${today}T00:00:00Z`)
        .lte('timestamp', `${today}T23:59:59Z`)

      // Get active journeys (in progress)
      const { data: activeJourneys } = await this.supabase
        .from('user_journeys')
        .select('id')
        .eq('completion_status', 'in_progress')

      const events = todayEvents || []
      const activeCount = activeJourneys?.length || 0

      const recentCompletions = events.filter(e => 
        e.event_type === 'verification_completed' && 
        new Date(e.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
      ).length

      const recentFailures = events.filter(e => 
        e.event_type === 'verification_failed' && 
        new Date(e.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
      ).length

      const completedToday = events.filter(e => e.event_type === 'verification_completed')
      const avgCompletionTimeToday = completedToday.length > 0
        ? completedToday.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / completedToday.length
        : 0

      return {
        active_verifications: activeCount,
        recent_completions: recentCompletions,
        recent_failures: recentFailures,
        avg_completion_time_today: avgCompletionTimeToday
      }
    } catch (error) {
      console.error('[VERIFICATION_DASHBOARD] Error getting realtime stats:', error)
      return {
        active_verifications: 0,
        recent_completions: 0,
        recent_failures: 0,
        avg_completion_time_today: 0
      }
    }
  }

  /**
   * Get trend analysis comparing current period to previous period
   */
  private async getTrends(startDate?: string, endDate?: string): Promise<DashboardMetrics['trends']> {
    try {
      const end = endDate ? new Date(endDate) : new Date()
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const periodLength = end.getTime() - start.getTime()
      
      const previousStart = new Date(start.getTime() - periodLength)
      const previousEnd = new Date(start.getTime())

      // Get current period metrics
      const currentMetrics = await verificationAnalytics.getVerificationMetrics(
        start.toISOString(),
        end.toISOString()
      )

      // Get previous period metrics
      const previousMetrics = await verificationAnalytics.getVerificationMetrics(
        previousStart.toISOString(),
        previousEnd.toISOString()
      )

      if (!currentMetrics || !previousMetrics) {
        return {
          completion_rate_trend: 0,
          error_rate_trend: 0,
          performance_trend: 0
        }
      }

      const completionRateTrend = previousMetrics.completion_rate > 0
        ? ((currentMetrics.completion_rate - previousMetrics.completion_rate) / previousMetrics.completion_rate) * 100
        : 0

      const errorRateTrend = previousMetrics.error_rate > 0
        ? ((currentMetrics.error_rate - previousMetrics.error_rate) / previousMetrics.error_rate) * 100
        : 0

      const performanceTrend = previousMetrics.average_completion_time_ms > 0
        ? ((currentMetrics.average_completion_time_ms - previousMetrics.average_completion_time_ms) / previousMetrics.average_completion_time_ms) * 100
        : 0

      return {
        completion_rate_trend: Math.round(completionRateTrend * 100) / 100,
        error_rate_trend: Math.round(errorRateTrend * 100) / 100,
        performance_trend: Math.round(performanceTrend * 100) / 100
      }
    } catch (error) {
      console.error('[VERIFICATION_DASHBOARD] Error calculating trends:', error)
      return {
        completion_rate_trend: 0,
        error_rate_trend: 0,
        performance_trend: 0
      }
    }
  }

  /**
   * Get active alerts based on current system state
   */
  private async getActiveAlerts(): Promise<DashboardMetrics['alerts']> {
    try {
      const alerts: DashboardMetrics['alerts'] = []
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      // Check for error spikes (more than 10 errors in the last hour)
      const { data: recentErrors } = await this.supabase
        .from('verification_events')
        .select('id')
        .eq('event_type', 'verification_failed')
        .gte('timestamp', oneHourAgo.toISOString())

      if (recentErrors && recentErrors.length > 10) {
        alerts.push({
          type: 'error_spike',
          severity: recentErrors.length > 20 ? 'critical' : 'high',
          message: `High error rate detected: ${recentErrors.length} failures in the last hour`,
          count: recentErrors.length,
          threshold: 10,
          timestamp: now.toISOString()
        })
      }

      // Check for slow performance (API calls taking longer than thresholds)
      const { data: slowApiCalls } = await this.supabase
        .from('verification_events')
        .select('duration_ms, event_data')
        .eq('event_type', 'api_call_made')
        .gte('timestamp', oneHourAgo.toISOString())
        .gt('duration_ms', 5000) // Slower than 5 seconds

      if (slowApiCalls && slowApiCalls.length > 5) {
        alerts.push({
          type: 'slow_performance',
          severity: 'medium',
          message: `Performance degradation detected: ${slowApiCalls.length} slow API calls in the last hour`,
          count: slowApiCalls.length,
          threshold: 5000,
          timestamp: now.toISOString()
        })
      }

      // Check for high abandonment rate
      const { data: recentJourneys } = await this.supabase
        .from('user_journeys')
        .select('completion_status')
        .gte('started_at', oneHourAgo.toISOString())

      if (recentJourneys && recentJourneys.length > 0) {
        const abandonedCount = recentJourneys.filter(j => j.completion_status === 'abandoned').length
        const abandonmentRate = (abandonedCount / recentJourneys.length) * 100

        if (abandonmentRate > 30) { // More than 30% abandonment
          alerts.push({
            type: 'high_abandonment',
            severity: abandonmentRate > 50 ? 'high' : 'medium',
            message: `High abandonment rate: ${Math.round(abandonmentRate)}% of users are abandoning verification`,
            count: abandonedCount,
            threshold: 30,
            timestamp: now.toISOString()
          })
        }
      }

      return alerts
    } catch (error) {
      console.error('[VERIFICATION_DASHBOARD] Error getting alerts:', error)
      return []
    }
  }

  /**
   * Get user verification summaries for admin dashboard
   */
  async getUserVerificationSummaries(
    limit: number = 50,
    status?: string
  ): Promise<UserVerificationSummary[]> {
    try {
      let query = this.supabase
        .from('user_journeys')
        .select(`
          user_id,
          completion_status,
          started_at,
          completed_at,
          current_step,
          steps_completed,
          total_duration_ms,
          errors_encountered,
          retry_attempts
        `)
        .order('started_at', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq('completion_status', status)
      }

      const { data: journeys, error } = await query

      if (error || !journeys) {
        console.error('[VERIFICATION_DASHBOARD] Error fetching user summaries:', error)
        return []
      }

      // Get verification attempt counts
      const userIds = journeys.map(j => j.user_id)
      const { data: attemptCounts } = await this.supabase
        .from('verification_events')
        .select('user_id')
        .eq('event_type', 'verification_started')
        .in('user_id', userIds)

      const attemptCountMap = new Map<string, number>()
      attemptCounts?.forEach(event => {
        attemptCountMap.set(event.user_id, (attemptCountMap.get(event.user_id) || 0) + 1)
      })

      return journeys.map(journey => {
        const stepsCompleted = journey.steps_completed?.length || 0
        const totalSteps = 6 // Approximate total steps in verification process
        const completionPercentage = Math.round((stepsCompleted / totalSteps) * 100)

        return {
          user_id: journey.user_id,
          current_status: journey.completion_status,
          verification_attempts: attemptCountMap.get(journey.user_id) || 1,
          last_attempt: journey.started_at,
          total_time_spent: journey.total_duration_ms || 0,
          errors_encountered: journey.errors_encountered,
          current_step: journey.current_step,
          completion_percentage: Math.min(completionPercentage, 100)
        }
      })
    } catch (error) {
      console.error('[VERIFICATION_DASHBOARD] Error getting user summaries:', error)
      return []
    }
  }

  /**
   * Get detailed user journey for specific user
   */
  async getUserJourneyDetails(userId: string, sessionId?: string): Promise<{
    journey: any
    events: any[]
  } | null> {
    try {
      // Get user journey
      const journey = await verificationAnalytics.getUserJourney(userId, sessionId)
      
      if (!journey) {
        return null
      }

      // Get all events for this user/session
      let eventsQuery = this.supabase
        .from('verification_events')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: true })

      if (sessionId) {
        eventsQuery = eventsQuery.eq('session_id', sessionId)
      }

      const { data: events } = await eventsQuery

      return {
        journey,
        events: events || []
      }
    } catch (error) {
      console.error('[VERIFICATION_DASHBOARD] Error getting user journey details:', error)
      return null
    }
  }

  /**
   * Export verification data for analysis
   */
  async exportVerificationData(
    startDate: string,
    endDate: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<string | null> {
    try {
      // Get all events in date range
      const { data: events } = await this.supabase
        .from('verification_events')
        .select('*')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .order('timestamp', { ascending: true })

      // Get all journeys in date range
      const { data: journeys } = await this.supabase
        .from('user_journeys')
        .select('*')
        .gte('started_at', startDate)
        .lte('started_at', endDate)
        .order('started_at', { ascending: true })

      const exportData = {
        export_info: {
          generated_at: new Date().toISOString(),
          date_range: { start: startDate, end: endDate },
          total_events: events?.length || 0,
          total_journeys: journeys?.length || 0
        },
        events: events || [],
        journeys: journeys || []
      }

      if (format === 'json') {
        return JSON.stringify(exportData, null, 2)
      } else {
        // Convert to CSV format (simplified)
        const csvLines = [
          'Type,Timestamp,User ID,Event Type,Status,Duration,Error',
          ...(events || []).map(event => 
            `Event,${event.timestamp},${event.user_id},${event.event_type},${event.event_data?.current_status || ''},${event.duration_ms || ''},${event.error_details?.message || ''}`
          ),
          ...(journeys || []).map(journey =>
            `Journey,${journey.started_at},${journey.user_id},${journey.completion_status},${journey.current_step},${journey.total_duration_ms || ''},${journey.errors_encountered}`
          )
        ]
        return csvLines.join('\n')
      }
    } catch (error) {
      console.error('[VERIFICATION_DASHBOARD] Error exporting data:', error)
      return null
    }
  }
}

// Export singleton instance
export const verificationDashboard = VerificationDashboard.getInstance()

// Helper functions for easy access
export const getDashboardMetrics = (startDate?: string, endDate?: string) =>
  verificationDashboard.getDashboardMetrics(startDate, endDate)

export const getUserVerificationSummaries = (limit?: number, status?: string) =>
  verificationDashboard.getUserVerificationSummaries(limit, status)

export const getUserJourneyDetails = (userId: string, sessionId?: string) =>
  verificationDashboard.getUserJourneyDetails(userId, sessionId)

export const exportVerificationData = (startDate: string, endDate: string, format?: 'json' | 'csv') =>
  verificationDashboard.exportVerificationData(startDate, endDate, format)