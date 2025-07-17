/**
 * Task 11 Verification Tests
 * Tests for monitoring and analytics implementation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({ error: null })),
    select: jest.fn(() => ({ 
      filter: jest.fn(() => ({ 
        filter: jest.fn(() => ({ data: [], error: null }))
      }))
    })),
    update: jest.fn(() => ({ 
      eq: jest.fn(() => ({ error: null }))
    })),
    eq: jest.fn(() => ({ error: null })),
    gte: jest.fn(() => ({ error: null })),
    lte: jest.fn(() => ({ error: null }))
  }))
}

jest.mock('@/utils/supabase/server', () => ({
  createSupabaseServerClient: () => mockSupabase
}))

// Import after mocking
import { verificationAnalytics } from '../verification-analytics'
import { alertingSystem } from '../alerting-system'
import { verificationDashboard } from '../verification-dashboard'
import { runScheduledMonitoringJob } from '../scheduled-monitoring'

describe('Task 11: Monitoring and Analytics Implementation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Verification Analytics', () => {
    it('should track verification events', async () => {
      const event = {
        user_id: 'test-user',
        event_type: 'verification_started' as const,
        event_data: { test: 'data' },
        session_id: 'test-session'
      }

      await verificationAnalytics.trackEvent(event)

      expect(mockSupabase.from).toHaveBeenCalledWith('verification_events')
    })

    it('should track verification started event', async () => {
      await verificationAnalytics.trackVerificationStarted('user-123', 'session-456', {
        component: 'test'
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('verification_events')
      expect(mockSupabase.from).toHaveBeenCalledWith('user_journeys')
    })

    it('should track account creation', async () => {
      await verificationAnalytics.trackAccountCreated(
        'user-123', 
        'acct_123', 
        'session-456', 
        1000,
        { test: 'metadata' }
      )

      expect(mockSupabase.from).toHaveBeenCalledWith('verification_events')
      expect(mockSupabase.from).toHaveBeenCalledWith('user_journeys')
    })

    it('should track verification completion', async () => {
      await verificationAnalytics.trackVerificationCompleted(
        'user-123',
        'acct_123',
        'session-456',
        5000,
        { success: true }
      )

      expect(mockSupabase.from).toHaveBeenCalledWith('verification_events')
      expect(mockSupabase.from).toHaveBeenCalledWith('user_journeys')
    })

    it('should track verification failures', async () => {
      const error = new Error('Test error')
      
      await verificationAnalytics.trackVerificationFailed(
        'user-123',
        'acct_123',
        'session-456',
        error,
        'test_step',
        { component: 'test' }
      )

      expect(mockSupabase.from).toHaveBeenCalledWith('verification_events')
      expect(mockSupabase.from).toHaveBeenCalledWith('user_journeys')
    })

    it('should track API call performance', async () => {
      await verificationAnalytics.trackApiCall(
        'stripe_account_create',
        2500,
        true,
        'user-123',
        'session-456',
        undefined,
        { operation: 'test' }
      )

      expect(mockSupabase.from).toHaveBeenCalledWith('verification_events')
    })

    it('should get verification metrics', async () => {
      // Mock return data for metrics calculation
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          filter: jest.fn(() => ({
            filter: jest.fn(() => ({ 
              data: [
                { event_type: 'verification_started' },
                { event_type: 'verification_completed' }
              ], 
              error: null 
            }))
          }))
        }))
      })

      const metrics = await verificationAnalytics.getVerificationMetrics()

      expect(metrics).toBeDefined()
      expect(metrics?.total_started).toBe(1)
      expect(metrics?.total_completed).toBe(1)
      expect(metrics?.completion_rate).toBe(100)
    })
  })

  describe('Alerting System', () => {
    it('should check alert rules', async () => {
      const alerts = await alertingSystem.checkAlertRules()
      
      expect(Array.isArray(alerts)).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalled()
    })

    it('should get active alerts', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({ data: [], error: null }))
            }))
          }))
        }))
      })

      const alerts = await alertingSystem.getActiveAlerts()
      
      expect(Array.isArray(alerts)).toBe(true)
    })

    it('should resolve alerts', async () => {
      await alertingSystem.resolveAlert('test-alert-id')
      
      expect(mockSupabase.from).toHaveBeenCalledWith('verification_alerts')
    })
  })

  describe('Verification Dashboard', () => {
    it('should get dashboard metrics', async () => {
      // Mock various database calls for dashboard
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          filter: jest.fn(() => ({
            filter: jest.fn(() => ({ data: [], error: null }))
          })),
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({ data: [], error: null }))
          })),
          eq: jest.fn(() => ({ data: [], error: null })),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({ data: [], error: null }))
          }))
        }))
      })

      const metrics = await verificationDashboard.getDashboardMetrics()
      
      expect(metrics).toBeDefined()
      expect(metrics?.realtime_stats).toBeDefined()
      expect(metrics?.trends).toBeDefined()
      expect(metrics?.alerts).toBeDefined()
    })

    it('should get user verification summaries', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({ data: [], error: null }))
          })),
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({ data: [], error: null }))
            }))
          })),
          in: jest.fn(() => ({ data: [], error: null }))
        }))
      })

      const summaries = await verificationDashboard.getUserVerificationSummaries(10)
      
      expect(Array.isArray(summaries)).toBe(true)
    })

    it('should export verification data', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              order: jest.fn(() => ({ data: [], error: null }))
            }))
          }))
        }))
      })

      const exportData = await verificationDashboard.exportVerificationData(
        '2024-01-01',
        '2024-01-31',
        'json'
      )
      
      expect(typeof exportData).toBe('string')
      expect(() => JSON.parse(exportData!)).not.toThrow()
    })
  })

  describe('Scheduled Monitoring', () => {
    it('should run scheduled monitoring job', async () => {
      const result = await runScheduledMonitoringJob()
      
      expect(result).toBeDefined()
      expect(result.job_name).toBe('scheduled_monitoring_check')
      expect(result.executed_at).toBeDefined()
      expect(result.duration_ms).toBeGreaterThan(0)
      expect(typeof result.success).toBe('boolean')
      expect(result.results).toBeDefined()
    })

    it('should handle monitoring job failures gracefully', async () => {
      // Mock a failure in one of the monitoring checks
      mockSupabase.from.mockImplementationOnce(() => {
        throw new Error('Database connection failed')
      })

      const result = await runScheduledMonitoringJob()
      
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete verification flow tracking', async () => {
      const userId = 'test-user-integration'
      const sessionId = 'test-session-integration'
      const accountId = 'acct_test_integration'

      // Track complete flow
      await verificationAnalytics.trackVerificationStarted(userId, sessionId)
      await verificationAnalytics.trackAccountCreated(userId, accountId, sessionId, 1000)
      await verificationAnalytics.trackOnboardingLinkGenerated(userId, accountId, sessionId, 500)
      await verificationAnalytics.trackStripeRedirect(userId, accountId, sessionId)
      await verificationAnalytics.trackCallbackReceived(
        userId, accountId, sessionId, 'incomplete', 'complete', true, 2000
      )
      await verificationAnalytics.trackVerificationCompleted(userId, accountId, sessionId, 5000)

      // Verify all events were tracked
      expect(mockSupabase.from).toHaveBeenCalledWith('verification_events')
      expect(mockSupabase.from).toHaveBeenCalledWith('user_journeys')
    })

    it('should handle error scenarios in tracking', async () => {
      // Mock database error
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn(() => ({ error: { message: 'Database error' } }))
      })

      // Should not throw error - analytics failures shouldn't break main flow
      await expect(
        verificationAnalytics.trackVerificationStarted('user', 'session')
      ).resolves.not.toThrow()
    })
  })

  describe('Performance Monitoring', () => {
    it('should track slow operations', async () => {
      // Track a slow API call
      await verificationAnalytics.trackApiCall(
        'stripe_account_create',
        8000, // 8 seconds - above threshold
        true,
        'user-123',
        'session-456'
      )

      expect(mockSupabase.from).toHaveBeenCalledWith('verification_events')
    })

    it('should track retry attempts', async () => {
      const error = new Error('Network timeout')
      
      await verificationAnalytics.trackRetryAttempt(
        'user-123',
        'session-456',
        'stripe_account_create',
        2,
        error,
        { component: 'test' }
      )

      expect(mockSupabase.from).toHaveBeenCalledWith('verification_events')
      expect(mockSupabase.from).toHaveBeenCalledWith('user_journeys')
    })
  })
})

describe('Task 11 Requirements Verification', () => {
  it('should implement logging for verification flow events (Requirement 6.2)', async () => {
    // Verify that events are logged with comprehensive information
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    
    await verificationAnalytics.trackVerificationStarted('user', 'session', { test: true })
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[VERIFICATION_ANALYTICS]')
    )
    
    consoleSpy.mockRestore()
  })

  it('should track completion rates and performance metrics (Requirement 6.3)', async () => {
    const metrics = await verificationAnalytics.getVerificationMetrics()
    
    expect(metrics).toHaveProperty('completion_rate')
    expect(metrics).toHaveProperty('error_rate')
    expect(metrics).toHaveProperty('average_completion_time_ms')
    expect(metrics).toHaveProperty('performance_metrics')
  })

  it('should provide error monitoring for verification failures (Requirement 6.1)', async () => {
    const alerts = await alertingSystem.checkAlertRules()
    
    expect(Array.isArray(alerts)).toBe(true)
    // Alerts should be generated based on error thresholds
  })

  it('should track user journey through verification process', async () => {
    const journey = await verificationAnalytics.getUserJourney('test-user')
    
    // Should return journey data or null (depending on mock)
    expect(journey === null || typeof journey === 'object').toBe(true)
  })

  it('should provide performance monitoring for Stripe API calls', async () => {
    await verificationAnalytics.trackApiCall(
      'stripe_account_create',
      2500,
      true,
      'user-123'
    )

    // Verify API performance is tracked
    expect(mockSupabase.from).toHaveBeenCalledWith('verification_events')
  })
})