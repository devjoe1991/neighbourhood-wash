import { createSupabaseServerClient } from '@/utils/supabase/server'

// Types for verification analytics
export interface VerificationEvent {
  id?: string
  user_id: string
  stripe_account_id?: string
  event_type: VerificationEventType
  event_data: Record<string, any>
  timestamp: string
  session_id?: string
  user_agent?: string
  ip_address?: string
  duration_ms?: number
  error_details?: {
    type: string
    message: string
    code?: string
    stack?: string
  }
}

export type VerificationEventType = 
  | 'verification_started'
  | 'account_created'
  | 'onboarding_link_generated'
  | 'stripe_redirect'
  | 'callback_received'
  | 'status_updated'
  | 'verification_completed'
  | 'verification_failed'
  | 'error_occurred'
  | 'retry_attempted'
  | 'user_abandoned'
  | 'api_call_made'
  | 'performance_metric'

export interface VerificationMetrics {
  total_started: number
  total_completed: number
  completion_rate: number
  average_completion_time_ms: number
  error_rate: number
  common_errors: Array<{
    error_type: string
    count: number
    percentage: number
  }>
  abandonment_points: Array<{
    step: string
    count: number
    percentage: number
  }>
  performance_metrics: {
    avg_api_response_time_ms: number
    p95_api_response_time_ms: number
    slowest_operations: Array<{
      operation: string
      avg_duration_ms: number
    }>
  }
}

export interface UserJourney {
  user_id: string
  session_id: string
  started_at: string
  completed_at?: string
  current_step: string
  steps_completed: string[]
  total_duration_ms?: number
  errors_encountered: number
  retry_attempts: number
  abandonment_point?: string
  completion_status: 'in_progress' | 'completed' | 'failed' | 'abandoned'
}

/**
 * Core analytics service for verification monitoring
 * Implements Requirements 6.1, 6.2, 6.3
 */
class VerificationAnalytics {
  private static instance: VerificationAnalytics
  private supabase = createSupabaseServerClient()

  static getInstance(): VerificationAnalytics {
    if (!VerificationAnalytics.instance) {
      VerificationAnalytics.instance = new VerificationAnalytics()
    }
    return VerificationAnalytics.instance
  }

  /**
   * Track a verification event with comprehensive logging
   * Requirement 6.2: Log verification events for audit purposes
   */
  async trackEvent(event: Omit<VerificationEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const eventWithTimestamp: VerificationEvent = {
        ...event,
        timestamp: new Date().toISOString(),
      }

      // Structured logging for immediate visibility
      console.log(`[VERIFICATION_ANALYTICS] ${JSON.stringify({
        type: 'verification_event',
        event_type: event.event_type,
        user_id: event.user_id,
        stripe_account_id: event.stripe_account_id,
        timestamp: eventWithTimestamp.timestamp,
        duration_ms: event.duration_ms,
        error: event.error_details?.message,
        data: event.event_data
      })}`)

      // Store in database for historical analysis
      const { error } = await this.supabase
        .from('verification_events')
        .insert(eventWithTimestamp)

      if (error) {
        console.error('[VERIFICATION_ANALYTICS] Failed to store event:', error)
        // Don't throw - analytics failures shouldn't break main flow
      }
    } catch (error) {
      console.error('[VERIFICATION_ANALYTICS] Error tracking event:', error)
      // Don't throw - analytics failures shouldn't break main flow
    }
  }

  /**
   * Track verification start event
   */
  async trackVerificationStarted(
    userId: string, 
    sessionId: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent({
      user_id: userId,
      event_type: 'verification_started',
      event_data: {
        session_id: sessionId,
        ...metadata
      },
      session_id: sessionId
    })

    // Initialize user journey tracking
    await this.initializeUserJourney(userId, sessionId)
  }

  /**
   * Track Stripe account creation
   */
  async trackAccountCreated(
    userId: string,
    accountId: string,
    sessionId: string,
    duration: number,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent({
      user_id: userId,
      stripe_account_id: accountId,
      event_type: 'account_created',
      event_data: {
        session_id: sessionId,
        is_new_account: true,
        ...metadata
      },
      session_id: sessionId,
      duration_ms: duration
    })

    await this.updateUserJourney(userId, sessionId, 'account_created')
  }

  /**
   * Track onboarding link generation
   */
  async trackOnboardingLinkGenerated(
    userId: string,
    accountId: string,
    sessionId: string,
    duration: number,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent({
      user_id: userId,
      stripe_account_id: accountId,
      event_type: 'onboarding_link_generated',
      event_data: {
        session_id: sessionId,
        ...metadata
      },
      session_id: sessionId,
      duration_ms: duration
    })

    await this.updateUserJourney(userId, sessionId, 'onboarding_link_generated')
  }

  /**
   * Track redirect to Stripe
   */
  async trackStripeRedirect(
    userId: string,
    accountId: string,
    sessionId: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent({
      user_id: userId,
      stripe_account_id: accountId,
      event_type: 'stripe_redirect',
      event_data: {
        session_id: sessionId,
        redirect_url: metadata.url || 'stripe_onboarding',
        ...metadata
      },
      session_id: sessionId
    })

    await this.updateUserJourney(userId, sessionId, 'stripe_redirect')
  }

  /**
   * Track verification callback received
   */
  async trackCallbackReceived(
    userId: string,
    accountId: string,
    sessionId: string,
    previousStatus: string,
    currentStatus: string,
    statusChanged: boolean,
    duration: number,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent({
      user_id: userId,
      stripe_account_id: accountId,
      event_type: 'callback_received',
      event_data: {
        session_id: sessionId,
        previous_status: previousStatus,
        current_status: currentStatus,
        status_changed: statusChanged,
        ...metadata
      },
      session_id: sessionId,
      duration_ms: duration
    })

    await this.updateUserJourney(userId, sessionId, 'callback_received')
  }

  /**
   * Track status update
   */
  async trackStatusUpdated(
    userId: string,
    accountId: string,
    sessionId: string,
    previousStatus: string,
    currentStatus: string,
    requirements: any,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent({
      user_id: userId,
      stripe_account_id: accountId,
      event_type: 'status_updated',
      event_data: {
        session_id: sessionId,
        previous_status: previousStatus,
        current_status: currentStatus,
        requirements,
        ...metadata
      },
      session_id: sessionId
    })

    await this.updateUserJourney(userId, sessionId, 'status_updated')
  }

  /**
   * Track verification completion
   */
  async trackVerificationCompleted(
    userId: string,
    accountId: string,
    sessionId: string,
    totalDuration: number,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent({
      user_id: userId,
      stripe_account_id: accountId,
      event_type: 'verification_completed',
      event_data: {
        session_id: sessionId,
        total_duration_ms: totalDuration,
        ...metadata
      },
      session_id: sessionId,
      duration_ms: totalDuration
    })

    await this.completeUserJourney(userId, sessionId, 'completed', totalDuration)
  }

  /**
   * Track verification failure
   */
  async trackVerificationFailed(
    userId: string,
    accountId: string | undefined,
    sessionId: string,
    error: Error,
    step: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent({
      user_id: userId,
      stripe_account_id: accountId,
      event_type: 'verification_failed',
      event_data: {
        session_id: sessionId,
        failed_at_step: step,
        ...metadata
      },
      session_id: sessionId,
      error_details: {
        type: error.constructor.name,
        message: error.message,
        stack: error.stack
      }
    })

    await this.completeUserJourney(userId, sessionId, 'failed', undefined, step)
  }

  /**
   * Track API call performance
   */
  async trackApiCall(
    operation: string,
    duration: number,
    success: boolean,
    userId?: string,
    sessionId?: string,
    error?: Error,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent({
      user_id: userId || 'system',
      event_type: 'api_call_made',
      event_data: {
        operation,
        success,
        session_id: sessionId,
        ...metadata
      },
      session_id: sessionId,
      duration_ms: duration,
      error_details: error ? {
        type: error.constructor.name,
        message: error.message,
        stack: error.stack
      } : undefined
    })
  }

  /**
   * Track retry attempts
   */
  async trackRetryAttempt(
    userId: string,
    sessionId: string,
    operation: string,
    attemptNumber: number,
    error: Error,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent({
      user_id: userId,
      event_type: 'retry_attempted',
      event_data: {
        session_id: sessionId,
        operation,
        attempt_number: attemptNumber,
        ...metadata
      },
      session_id: sessionId,
      error_details: {
        type: error.constructor.name,
        message: error.message,
        stack: error.stack
      }
    })

    await this.incrementUserJourneyRetries(userId, sessionId)
  }

  /**
   * Initialize user journey tracking
   */
  private async initializeUserJourney(userId: string, sessionId: string): Promise<void> {
    try {
      const journey: UserJourney = {
        user_id: userId,
        session_id: sessionId,
        started_at: new Date().toISOString(),
        current_step: 'verification_started',
        steps_completed: ['verification_started'],
        errors_encountered: 0,
        retry_attempts: 0,
        completion_status: 'in_progress'
      }

      const { error } = await this.supabase
        .from('user_journeys')
        .insert(journey)

      if (error) {
        console.error('[VERIFICATION_ANALYTICS] Failed to initialize user journey:', error)
      }
    } catch (error) {
      console.error('[VERIFICATION_ANALYTICS] Error initializing user journey:', error)
    }
  }

  /**
   * Update user journey with new step
   */
  private async updateUserJourney(userId: string, sessionId: string, step: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_journeys')
        .update({
          current_step: step,
          steps_completed: this.supabase.rpc('array_append', {
            arr: 'steps_completed',
            elem: step
          })
        })
        .eq('user_id', userId)
        .eq('session_id', sessionId)

      if (error) {
        console.error('[VERIFICATION_ANALYTICS] Failed to update user journey:', error)
      }
    } catch (error) {
      console.error('[VERIFICATION_ANALYTICS] Error updating user journey:', error)
    }
  }

  /**
   * Complete user journey
   */
  private async completeUserJourney(
    userId: string, 
    sessionId: string, 
    status: 'completed' | 'failed' | 'abandoned',
    totalDuration?: number,
    abandonmentPoint?: string
  ): Promise<void> {
    try {
      const updateData: Partial<UserJourney> = {
        completion_status: status,
        completed_at: new Date().toISOString(),
        total_duration_ms: totalDuration,
        abandonment_point: abandonmentPoint
      }

      const { error } = await this.supabase
        .from('user_journeys')
        .update(updateData)
        .eq('user_id', userId)
        .eq('session_id', sessionId)

      if (error) {
        console.error('[VERIFICATION_ANALYTICS] Failed to complete user journey:', error)
      }
    } catch (error) {
      console.error('[VERIFICATION_ANALYTICS] Error completing user journey:', error)
    }
  }

  /**
   * Increment retry count for user journey
   */
  private async incrementUserJourneyRetries(userId: string, sessionId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_journeys')
        .update({
          retry_attempts: this.supabase.rpc('increment_retry_attempts'),
          errors_encountered: this.supabase.rpc('increment_errors_encountered')
        })
        .eq('user_id', userId)
        .eq('session_id', sessionId)

      if (error) {
        console.error('[VERIFICATION_ANALYTICS] Failed to increment retries:', error)
      }
    } catch (error) {
      console.error('[VERIFICATION_ANALYTICS] Error incrementing retries:', error)
    }
  }

  /**
   * Get verification metrics for analysis
   * Requirement 6.3: Track completion rates and performance metrics
   */
  async getVerificationMetrics(
    startDate?: string,
    endDate?: string
  ): Promise<VerificationMetrics | null> {
    try {
      const dateFilter = startDate && endDate 
        ? `timestamp >= '${startDate}' AND timestamp <= '${endDate}'`
        : `timestamp >= NOW() - INTERVAL '30 days'`

      // Get basic counts
      const { data: eventCounts } = await this.supabase
        .from('verification_events')
        .select('event_type')
        .filter('timestamp', 'gte', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .filter('timestamp', 'lte', endDate || new Date().toISOString())

      if (!eventCounts) {
        // Return empty metrics instead of null
        return {
          total_started: 0,
          total_completed: 0,
          completion_rate: 0,
          average_completion_time_ms: 0,
          error_rate: 0,
          common_errors: [],
          abandonment_points: [],
          performance_metrics: {
            avg_api_response_time_ms: 0,
            p95_api_response_time_ms: 0,
            slowest_operations: []
          }
        }
      }

      const totalStarted = eventCounts.filter(e => e.event_type === 'verification_started').length
      const totalCompleted = eventCounts.filter(e => e.event_type === 'verification_completed').length
      const totalErrors = eventCounts.filter(e => e.event_type === 'verification_failed').length

      // Get completion times
      const { data: journeys } = await this.supabase
        .from('user_journeys')
        .select('total_duration_ms, completion_status, abandonment_point')
        .filter('started_at', 'gte', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .filter('started_at', 'lte', endDate || new Date().toISOString())

      const completedJourneys = journeys?.filter(j => j.completion_status === 'completed') || []
      const avgCompletionTime = completedJourneys.length > 0
        ? completedJourneys.reduce((sum, j) => sum + (j.total_duration_ms || 0), 0) / completedJourneys.length
        : 0

      // Get error breakdown
      const { data: errors } = await this.supabase
        .from('verification_events')
        .select('error_details')
        .eq('event_type', 'verification_failed')
        .filter('timestamp', 'gte', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .filter('timestamp', 'lte', endDate || new Date().toISOString())

      const errorCounts = new Map<string, number>()
      errors?.forEach(e => {
        if (e.error_details?.type) {
          errorCounts.set(e.error_details.type, (errorCounts.get(e.error_details.type) || 0) + 1)
        }
      })

      const totalErrorEvents = errors?.length || 0
      const commonErrors = Array.from(errorCounts.entries())
        .map(([type, count]) => ({
          error_type: type,
          count,
          percentage: totalErrorEvents > 0 ? (count / totalErrorEvents) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Get abandonment points
      const abandonmentCounts = new Map<string, number>()
      journeys?.filter(j => j.completion_status === 'abandoned').forEach(j => {
        if (j.abandonment_point) {
          abandonmentCounts.set(j.abandonment_point, (abandonmentCounts.get(j.abandonment_point) || 0) + 1)
        }
      })

      const abandonmentPoints = Array.from(abandonmentCounts.entries())
        .map(([step, count]) => ({
          step,
          count,
          percentage: totalStarted > 0 ? (count / totalStarted) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)

      // Get API performance metrics
      const { data: apiCalls } = await this.supabase
        .from('verification_events')
        .select('event_data, duration_ms')
        .eq('event_type', 'api_call_made')
        .filter('timestamp', 'gte', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .filter('timestamp', 'lte', endDate || new Date().toISOString())

      const apiDurations = apiCalls?.map(call => call.duration_ms).filter(d => d != null) || []
      const avgApiResponseTime = apiDurations.length > 0
        ? apiDurations.reduce((sum, d) => sum + d, 0) / apiDurations.length
        : 0

      const sortedDurations = apiDurations.sort((a, b) => a - b)
      const p95Index = Math.floor(sortedDurations.length * 0.95)
      const p95ApiResponseTime = sortedDurations[p95Index] || 0

      return {
        total_started: totalStarted,
        total_completed: totalCompleted,
        completion_rate: totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0,
        average_completion_time_ms: avgCompletionTime,
        error_rate: totalStarted > 0 ? (totalErrors / totalStarted) * 100 : 0,
        common_errors: commonErrors,
        abandonment_points: abandonmentPoints,
        performance_metrics: {
          avg_api_response_time_ms: avgApiResponseTime,
          p95_api_response_time_ms: p95ApiResponseTime,
          slowest_operations: [] // Could be enhanced with more detailed tracking
        }
      }
    } catch (error) {
      console.error('[VERIFICATION_ANALYTICS] Error getting metrics:', error)
      return null
    }
  }

  /**
   * Get user journey details
   */
  async getUserJourney(userId: string, sessionId?: string): Promise<UserJourney | null> {
    try {
      let query = this.supabase
        .from('user_journeys')
        .select('*')
        .eq('user_id', userId)

      if (sessionId) {
        query = query.eq('session_id', sessionId)
      }

      const { data, error } = await query
        .order('started_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('[VERIFICATION_ANALYTICS] Error getting user journey:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('[VERIFICATION_ANALYTICS] Error getting user journey:', error)
      return null
    }
  }
}

// Export singleton instance
export const verificationAnalytics = VerificationAnalytics.getInstance()