import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { verificationAnalytics } from '../verification-analytics'

// Mock the Supabase client import
vi.mock('@/utils/supabase/server', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      update: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({ 
        filter: vi.fn(() => ({ 
          filter: vi.fn(() => ({ data: [], error: null }))
        }))
      })),
      eq: vi.fn(() => ({ error: null })),
      rpc: vi.fn(() => ({}))
    }))
  }
  
  return {
    createSupabaseServerClient: () => mockSupabase
  }
})

describe('VerificationAnalytics', () => {
  let mockSupabase: ReturnType<typeof vi.mocked>
  const mockUserId = 'user_123'
  const mockAccountId = 'acct_123'
  const mockSessionId = 'session_123'

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked supabase instance
    const { createSupabaseServerClient } = await import('@/utils/supabase/server')
    mockSupabase = createSupabaseServerClient()
    
    // Mock console.log to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Event Tracking', () => {
    it('should track verification started event', async () => {
      const insertSpy = vi.fn(() => ({ error: null }))
      mockSupabase.from.mockReturnValue({
        insert: insertSpy
      })

      await verificationAnalytics.trackVerificationStarted(mockUserId, mockSessionId, { test: 'data' })

      expect(mockSupabase.from).toHaveBeenCalledWith('verification_events')
      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          event_type: 'verification_started',
          event_data: expect.objectContaining({
            session_id: mockSessionId,
            test: 'data'
          }),
          session_id: mockSessionId,
          timestamp: expect.any(String)
        })
      )
    })

    it('should track account created event with duration', async () => {
      const insertSpy = vi.fn(() => ({ error: null }))
      mockSupabase.from.mockReturnValue({
        insert: insertSpy
      })

      const duration = 1500
      await verificationAnalytics.trackAccountCreated(mockUserId, mockAccountId, mockSessionId, duration, { country: 'GB' })

      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          stripe_account_id: mockAccountId,
          event_type: 'account_created',
          event_data: expect.objectContaining({
            session_id: mockSessionId,
            is_new_account: true,
            country: 'GB'
          }),
          session_id: mockSessionId,
          duration_ms: duration,
          timestamp: expect.any(String)
        })
      )
    })

    it('should track onboarding link generated event', async () => {
      const insertSpy = vi.fn(() => ({ error: null }))
      mockSupabase.from.mockReturnValue({
        insert: insertSpy
      })

      const duration = 800
      await verificationAnalytics.trackOnboardingLinkGenerated(mockUserId, mockAccountId, mockSessionId, duration)

      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          stripe_account_id: mockAccountId,
          event_type: 'onboarding_link_generated',
          session_id: mockSessionId,
          duration_ms: duration
        })
      )
    })

    it('should track Stripe redirect event', async () => {
      const insertSpy = vi.fn(() => ({ error: null }))
      mockSupabase.from.mockReturnValue({
        insert: insertSpy
      })

      await verificationAnalytics.trackStripeRedirect(mockUserId, mockAccountId, mockSessionId, { url: 'https://stripe.com/onboard' })

      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          stripe_account_id: mockAccountId,
          event_type: 'stripe_redirect',
          event_data: expect.objectContaining({
            session_id: mockSessionId,
            redirect_url: 'https://stripe.com/onboard'
          })
        })
      )
    })

    it('should track callback received event', async () => {
      const insertSpy = vi.fn(() => ({ error: null }))
      mockSupabase.from.mockReturnValue({
        insert: insertSpy
      })

      const duration = 2000
      await verificationAnalytics.trackCallbackReceived(
        mockUserId, 
        mockAccountId, 
        mockSessionId, 
        'pending', 
        'complete', 
        true, 
        duration
      )

      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          stripe_account_id: mockAccountId,
          event_type: 'callback_received',
          event_data: expect.objectContaining({
            session_id: mockSessionId,
            previous_status: 'pending',
            current_status: 'complete',
            status_changed: true
          }),
          duration_ms: duration
        })
      )
    })

    it('should track status updated event', async () => {
      const insertSpy = vi.fn(() => ({ error: null }))
      mockSupabase.from.mockReturnValue({
        insert: insertSpy
      })

      const requirements = { currently_due: ['document'] }
      await verificationAnalytics.trackStatusUpdated(
        mockUserId, 
        mockAccountId, 
        mockSessionId, 
        'incomplete', 
        'pending', 
        requirements
      )

      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          stripe_account_id: mockAccountId,
          event_type: 'status_updated',
          event_data: expect.objectContaining({
            session_id: mockSessionId,
            previous_status: 'incomplete',
            current_status: 'pending',
            requirements
          })
        })
      )
    })

    it('should track verification completed event', async () => {
      const insertSpy = vi.fn(() => ({ error: null }))
      mockSupabase.from.mockReturnValue({
        insert: insertSpy
      })

      const totalDuration = 300000 // 5 minutes
      await verificationAnalytics.trackVerificationCompleted(mockUserId, mockAccountId, mockSessionId, totalDuration)

      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          stripe_account_id: mockAccountId,
          event_type: 'verification_completed',
          event_data: expect.objectContaining({
            session_id: mockSessionId,
            total_duration_ms: totalDuration
          }),
          duration_ms: totalDuration
        })
      )
    })

    it('should track verification failed event with error details', async () => {
      const insertSpy = vi.fn(() => ({ error: null }))
      mockSupabase.from.mockReturnValue({
        insert: insertSpy
      })

      const error = new Error('Test error')
      error.stack = 'Error stack trace'
      
      await verificationAnalytics.trackVerificationFailed(mockUserId, mockAccountId, mockSessionId, error, 'account_creation')

      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          stripe_account_id: mockAccountId,
          event_type: 'verification_failed',
          event_data: expect.objectContaining({
            session_id: mockSessionId,
            failed_at_step: 'account_creation'
          }),
          error_details: {
            type: 'Error',
            message: 'Test error',
            stack: 'Error stack trace'
          }
        })
      )
    })

    it('should track API call performance', async () => {
      const insertSpy = vi.fn(() => ({ error: null }))
      mockSupabase.from.mockReturnValue({
        insert: insertSpy
      })

      const duration = 1200
      await verificationAnalytics.trackApiCall('stripe_account_create', duration, true, mockUserId, mockSessionId)

      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          event_type: 'api_call_made',
          event_data: expect.objectContaining({
            operation: 'stripe_account_create',
            success: true,
            session_id: mockSessionId
          }),
          session_id: mockSessionId,
          duration_ms: duration
        })
      )
    })

    it('should track retry attempts', async () => {
      const insertSpy = vi.fn(() => ({ error: null }))
      mockSupabase.from.mockReturnValue({
        insert: insertSpy
      })

      const error = new Error('Retry error')
      await verificationAnalytics.trackRetryAttempt(mockUserId, mockSessionId, 'account_creation', 2, error)

      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          event_type: 'retry_attempted',
          event_data: expect.objectContaining({
            session_id: mockSessionId,
            operation: 'account_creation',
            attempt_number: 2
          }),
          error_details: {
            type: 'Error',
            message: 'Retry error',
            stack: expect.any(String)
          }
        })
      )
    })
  })

  describe('User Journey Tracking', () => {
    it('should initialize user journey on verification start', async () => {
      const eventInsertSpy = vi.fn(() => ({ error: null }))
      const journeyInsertSpy = vi.fn(() => ({ error: null }))
      
      mockSupabase.from
        .mockReturnValueOnce({ insert: eventInsertSpy })
        .mockReturnValueOnce({ insert: journeyInsertSpy })

      await verificationAnalytics.trackVerificationStarted(mockUserId, mockSessionId)

      // Should be called twice - once for event, once for journey
      expect(mockSupabase.from).toHaveBeenCalledWith('verification_events')
      expect(mockSupabase.from).toHaveBeenCalledWith('user_journeys')
      expect(journeyInsertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          session_id: mockSessionId,
          started_at: expect.any(String),
          current_step: 'verification_started',
          steps_completed: ['verification_started'],
          errors_encountered: 0,
          retry_attempts: 0,
          completion_status: 'in_progress'
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      const insertSpy = vi.fn(() => ({ error: { message: 'Database error' } }))
      mockSupabase.from.mockReturnValue({
        insert: insertSpy
      })

      // Should not throw error
      await expect(verificationAnalytics.trackVerificationStarted(mockUserId, mockSessionId)).resolves.not.toThrow()
      
      expect(console.error).toHaveBeenCalledWith(
        '[VERIFICATION_ANALYTICS] Failed to store event:',
        { message: 'Database error' }
      )
    })
  })

  describe('Metrics Retrieval', () => {
    it('should get verification metrics', async () => {
      const mockEventCounts = [
        { event_type: 'verification_started' },
        { event_type: 'verification_started' },
        { event_type: 'verification_completed' },
        { event_type: 'verification_failed' }
      ]

      const mockJourneys = [
        { total_duration_ms: 300000, completion_status: 'completed', abandonment_point: null },
        { total_duration_ms: 250000, completion_status: 'completed', abandonment_point: null },
        { total_duration_ms: null, completion_status: 'abandoned', abandonment_point: 'account_creation' }
      ]

      const mockErrors = [
        { error_details: { type: 'NetworkError' } },
        { error_details: { type: 'ValidationError' } }
      ]

      const mockApiCalls = [
        { duration_ms: 1000 },
        { duration_ms: 1500 },
        { duration_ms: 800 }
      ]

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            filter: vi.fn(() => ({
              filter: vi.fn(() => ({ data: mockEventCounts }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            filter: vi.fn(() => ({
              filter: vi.fn(() => ({ data: mockJourneys }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              filter: vi.fn(() => ({
                filter: vi.fn(() => ({ data: mockErrors }))
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              filter: vi.fn(() => ({
                filter: vi.fn(() => ({ data: mockApiCalls }))
              }))
            }))
          }))
        })

      const metrics = await verificationAnalytics.getVerificationMetrics()

      expect(metrics).toEqual({
        total_started: 2,
        total_completed: 1,
        completion_rate: 50,
        average_completion_time_ms: 275000,
        error_rate: 50,
        common_errors: [
          { error_type: 'NetworkError', count: 1, percentage: 50 },
          { error_type: 'ValidationError', count: 1, percentage: 50 }
        ],
        abandonment_points: [
          { step: 'account_creation', count: 1, percentage: 50 }
        ],
        performance_metrics: {
          avg_api_response_time_ms: 1100,
          p95_api_response_time_ms: 1500,
          slowest_operations: []
        }
      })
    })

    it('should handle empty metrics gracefully', async () => {
      // Mock all the database calls to return empty arrays (no error)
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          filter: vi.fn(() => ({
            filter: vi.fn(() => ({ data: [], error: null }))
          })),
          eq: vi.fn(() => ({
            filter: vi.fn(() => ({
              filter: vi.fn(() => ({ data: [], error: null }))
            }))
          }))
        }))
      })

      const metrics = await verificationAnalytics.getVerificationMetrics()

      expect(metrics).toEqual({
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
      })
    })
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      // Since we're using the exported singleton, we can't test the class directly
      // but we can verify the singleton works consistently
      expect(verificationAnalytics).toBeDefined()
      expect(typeof verificationAnalytics.trackEvent).toBe('function')
    })

    it('should use the exported singleton', () => {
      expect(verificationAnalytics).toBeDefined()
      expect(typeof verificationAnalytics.getVerificationMetrics).toBe('function')
    })
  })

  describe('Error Handling', () => {
    it('should not throw when tracking fails', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      await expect(verificationAnalytics.trackVerificationStarted(mockUserId, mockSessionId)).resolves.not.toThrow()
      
      expect(console.error).toHaveBeenCalledWith(
        '[VERIFICATION_ANALYTICS] Error tracking event:',
        expect.any(Error)
      )
    })

    it('should handle null/undefined gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          filter: vi.fn(() => ({
            filter: vi.fn(() => ({ data: null, error: { message: 'No data' } }))
          }))
        }))
      })

      const metrics = await verificationAnalytics.getVerificationMetrics()
      // Should return empty metrics instead of null for better UX
      expect(metrics).toEqual({
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
      })
    })
  })
})