import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { 
  VerificationDashboard,
  verificationDashboard,
  getDashboardMetrics,
  getUserVerificationSummaries,
  getUserJourneyDetails,
  exportVerificationData
} from '../verification-dashboard'

// Mock the Supabase client import
vi.mock('@/utils/supabase/server', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        filter: vi.fn(() => ({ 
          filter: vi.fn(() => ({ data: [], error: null })),
          gte: vi.fn(() => ({ 
            lte: vi.fn(() => ({ data: [], error: null })),
            filter: vi.fn(() => ({ data: [], error: null }))
          })),
          eq: vi.fn(() => ({ 
            filter: vi.fn(() => ({ data: [], error: null })),
            order: vi.fn(() => ({ 
              limit: vi.fn(() => ({ data: [], error: null }))
            }))
          })),
          gt: vi.fn(() => ({ data: [], error: null })),
          in: vi.fn(() => ({ data: [], error: null })),
          order: vi.fn(() => ({ 
            limit: vi.fn(() => ({ data: [], error: null })),
            single: vi.fn(() => ({ data: null, error: null }))
          }))
        })),
        gte: vi.fn(() => ({ 
          lte: vi.fn(() => ({ 
            order: vi.fn(() => ({ data: [], error: null }))
          }))
        })),
        eq: vi.fn(() => ({ 
          order: vi.fn(() => ({ 
            limit: vi.fn(() => ({ 
              single: vi.fn(() => ({ data: null, error: null }))
            }))
          }))
        }))
      }))
    }))
  }
  
  return {
    createSupabaseServerClient: () => mockSupabase
  }
})

// Mock the verification analytics
vi.mock('../verification-analytics', () => ({
  verificationAnalytics: {
    getVerificationMetrics: vi.fn(),
    getUserJourney: vi.fn()
  }
}))

describe('VerificationDashboard', () => {
  let dashboard: VerificationDashboard
  let mockSupabase: any
  let mockAnalytics: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked instances
    const { createSupabaseServerClient } = await import('@/utils/supabase/server')
    const { verificationAnalytics } = await import('../verification-analytics')
    
    mockSupabase = createSupabaseServerClient()
    mockAnalytics = verificationAnalytics
    
    dashboard = VerificationDashboard.getInstance()
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Dashboard Metrics', () => {
    it('should get comprehensive dashboard metrics', async () => {
      const mockBaseMetrics = {
        total_started: 100,
        total_completed: 80,
        completion_rate: 80,
        average_completion_time_ms: 300000,
        error_rate: 10,
        common_errors: [
          { error_type: 'NetworkError', count: 5, percentage: 50 }
        ],
        abandonment_points: [
          { step: 'account_creation', count: 3, percentage: 30 }
        ],
        performance_metrics: {
          avg_api_response_time_ms: 1200,
          p95_api_response_time_ms: 2000,
          slowest_operations: []
        }
      }

      mockAnalytics.getVerificationMetrics.mockResolvedValue(mockBaseMetrics)

      // Mock today's events for realtime stats
      const mockTodayEvents = [
        { event_type: 'verification_completed', duration_ms: 250000, timestamp: new Date().toISOString() },
        { event_type: 'verification_failed', duration_ms: null, timestamp: new Date().toISOString() }
      ]

      // Mock active journeys
      const mockActiveJourneys = [
        { id: 'journey1' },
        { id: 'journey2' }
      ]

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({ data: mockTodayEvents, error: null }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ data: mockActiveJourneys, error: null }))
          }))
        })
        // Mock for trends calculation (current period)
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({ data: mockTodayEvents, error: null }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ data: mockActiveJourneys, error: null }))
          }))
        })
        // Mock for alerts
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({ data: [], error: null }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                gt: vi.fn(() => ({ data: [], error: null }))
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            gte: vi.fn(() => ({ data: [], error: null }))
          }))
        })

      const result = await dashboard.getDashboardMetrics()

      expect(result).toEqual(
        expect.objectContaining({
          ...mockBaseMetrics,
          realtime_stats: {
            active_verifications: 2,
            recent_completions: 0, // None in last hour
            recent_failures: 0, // None in last hour
            avg_completion_time_today: 250000
          },
          trends: expect.any(Object),
          alerts: expect.any(Array)
        })
      )
    })

    it('should handle null base metrics gracefully', async () => {
      mockAnalytics.getVerificationMetrics.mockResolvedValue(null)

      const result = await dashboard.getDashboardMetrics()

      expect(result).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      mockAnalytics.getVerificationMetrics.mockRejectedValue(new Error('Database error'))

      const result = await dashboard.getDashboardMetrics()

      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalledWith(
        '[VERIFICATION_DASHBOARD] Error getting dashboard metrics:',
        expect.any(Error)
      )
    })
  })

  describe('Realtime Stats', () => {
    it('should calculate realtime stats correctly', async () => {
      const mockBaseMetrics = {
        total_started: 10,
        total_completed: 8,
        completion_rate: 80,
        average_completion_time_ms: 300000,
        error_rate: 10,
        common_errors: [],
        abandonment_points: [],
        performance_metrics: {
          avg_api_response_time_ms: 1200,
          p95_api_response_time_ms: 2000,
          slowest_operations: []
        }
      }

      mockAnalytics.getVerificationMetrics.mockResolvedValue(mockBaseMetrics)

      const recentTime = new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      const mockTodayEvents = [
        { event_type: 'verification_completed', duration_ms: 250000, timestamp: recentTime },
        { event_type: 'verification_completed', duration_ms: 350000, timestamp: recentTime },
        { event_type: 'verification_failed', duration_ms: null, timestamp: recentTime }
      ]

      const mockActiveJourneys = [
        { id: 'journey1' },
        { id: 'journey2' },
        { id: 'journey3' }
      ]

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({ data: mockTodayEvents, error: null }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ data: mockActiveJourneys, error: null }))
          }))
        })
        // Additional mocks for trends and alerts
        .mockReturnValue({
          select: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({ data: [], error: null }))
            })),
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({ data: [], error: null })),
              gt: vi.fn(() => ({ data: [], error: null }))
            }))
          }))
        })

      const result = await dashboard.getDashboardMetrics()

      expect(result?.realtime_stats).toEqual({
        active_verifications: 3,
        recent_completions: 2, // 2 completions in last hour
        recent_failures: 1, // 1 failure in last hour
        avg_completion_time_today: 300000 // Average of 250000 and 350000
      })
    })
  })

  describe('Alerts', () => {
    it('should detect error spikes', async () => {
      const mockBaseMetrics = {
        total_started: 10,
        total_completed: 8,
        completion_rate: 80,
        average_completion_time_ms: 300000,
        error_rate: 10,
        common_errors: [],
        abandonment_points: [],
        performance_metrics: {
          avg_api_response_time_ms: 1200,
          p95_api_response_time_ms: 2000,
          slowest_operations: []
        }
      }

      mockAnalytics.getVerificationMetrics.mockResolvedValue(mockBaseMetrics)

      // Mock 15 recent errors (above threshold of 10)
      const mockRecentErrors = Array(15).fill({ id: 'error' })

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({ data: [], error: null }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ data: [], error: null }))
          }))
        })
        // Mock for trends calculation
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({ data: [], error: null }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ data: [], error: null }))
          }))
        })
        // Mock for alerts - error spike detection
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({ data: mockRecentErrors, error: null }))
            }))
          }))
        })
        // Mock for slow API calls
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                gt: vi.fn(() => ({ data: [], error: null }))
              }))
            }))
          }))
        })
        // Mock for abandonment rate
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            gte: vi.fn(() => ({ data: [], error: null }))
          }))
        })

      const result = await dashboard.getDashboardMetrics()

      expect(result?.alerts).toContainEqual(
        expect.objectContaining({
          type: 'error_spike',
          severity: 'high',
          message: 'High error rate detected: 15 failures in the last hour',
          count: 15,
          threshold: 10
        })
      )
    })

    it('should detect slow performance', async () => {
      const mockBaseMetrics = {
        total_started: 10,
        total_completed: 8,
        completion_rate: 80,
        average_completion_time_ms: 300000,
        error_rate: 10,
        common_errors: [],
        abandonment_points: [],
        performance_metrics: {
          avg_api_response_time_ms: 1200,
          p95_api_response_time_ms: 2000,
          slowest_operations: []
        }
      }

      mockAnalytics.getVerificationMetrics.mockResolvedValue(mockBaseMetrics)

      // Mock 8 slow API calls (above threshold of 5)
      const mockSlowApiCalls = Array(8).fill({ duration_ms: 6000, event_data: {} })

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({ data: [], error: null }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ data: [], error: null }))
          }))
        })
        // Mock for trends calculation
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({ data: [], error: null }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ data: [], error: null }))
          }))
        })
        // Mock for alerts - no error spike
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({ data: [], error: null }))
            }))
          }))
        })
        // Mock for slow API calls
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                gt: vi.fn(() => ({ data: mockSlowApiCalls, error: null }))
              }))
            }))
          }))
        })
        // Mock for abandonment rate
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            gte: vi.fn(() => ({ data: [], error: null }))
          }))
        })

      const result = await dashboard.getDashboardMetrics()

      expect(result?.alerts).toContainEqual(
        expect.objectContaining({
          type: 'slow_performance',
          severity: 'medium',
          message: 'Performance degradation detected: 8 slow API calls in the last hour',
          count: 8,
          threshold: 5000
        })
      )
    })
  })

  describe('User Verification Summaries', () => {
    it('should get user verification summaries', async () => {
      const mockJourneys = [
        {
          user_id: 'user1',
          completion_status: 'completed',
          started_at: '2024-01-01T10:00:00Z',
          completed_at: '2024-01-01T10:05:00Z',
          current_step: 'verification_completed',
          steps_completed: ['verification_started', 'account_created', 'verification_completed'],
          total_duration_ms: 300000,
          errors_encountered: 0,
          retry_attempts: 0
        },
        {
          user_id: 'user2',
          completion_status: 'in_progress',
          started_at: '2024-01-01T11:00:00Z',
          completed_at: null,
          current_step: 'account_creation',
          steps_completed: ['verification_started'],
          total_duration_ms: null,
          errors_encountered: 1,
          retry_attempts: 2
        }
      ]

      const mockAttemptCounts = [
        { user_id: 'user1' },
        { user_id: 'user2' },
        { user_id: 'user2' } // user2 has 2 attempts
      ]

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({ data: mockJourneys, error: null }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => ({ data: mockAttemptCounts, error: null }))
            }))
          }))
        })

      const result = await dashboard.getUserVerificationSummaries(50)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        user_id: 'user1',
        current_status: 'completed',
        verification_attempts: 1,
        last_attempt: '2024-01-01T10:00:00Z',
        total_time_spent: 300000,
        errors_encountered: 0,
        current_step: 'verification_completed',
        completion_percentage: 50 // 3 steps out of 6 total
      })
      expect(result[1]).toEqual({
        user_id: 'user2',
        current_status: 'in_progress',
        verification_attempts: 2,
        last_attempt: '2024-01-01T11:00:00Z',
        total_time_spent: 0,
        errors_encountered: 1,
        current_step: 'account_creation',
        completion_percentage: 17 // 1 step out of 6 total, rounded
      })
    })

    it('should filter by status when provided', async () => {
      const selectSpy = vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({ data: [], error: null }))
        })),
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({ data: [], error: null }))
          }))
        }))
      }))

      mockSupabase.from
        .mockReturnValueOnce({ select: selectSpy })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => ({ data: [], error: null }))
            }))
          }))
        })

      await dashboard.getUserVerificationSummaries(50, 'completed')

      expect(selectSpy().eq).toHaveBeenCalledWith('completion_status', 'completed')
    })
  })

  describe('User Journey Details', () => {
    it('should get detailed user journey', async () => {
      const mockJourney = {
        user_id: 'user1',
        session_id: 'session1',
        completion_status: 'completed',
        started_at: '2024-01-01T10:00:00Z'
      }

      const mockEvents = [
        {
          id: 'event1',
          user_id: 'user1',
          event_type: 'verification_started',
          timestamp: '2024-01-01T10:00:00Z'
        },
        {
          id: 'event2',
          user_id: 'user1',
          event_type: 'verification_completed',
          timestamp: '2024-01-01T10:05:00Z'
        }
      ]

      mockAnalytics.getUserJourney.mockResolvedValue(mockJourney)
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({ data: mockEvents, error: null }))
          }))
        }))
      })

      const result = await dashboard.getUserJourneyDetails('user1', 'session1')

      expect(result).toEqual({
        journey: mockJourney,
        events: mockEvents
      })
      expect(mockAnalytics.getUserJourney).toHaveBeenCalledWith('user1', 'session1')
    })

    it('should return null when journey not found', async () => {
      mockAnalytics.getUserJourney.mockResolvedValue(null)

      const result = await dashboard.getUserJourneyDetails('user1')

      expect(result).toBeNull()
    })
  })

  describe('Data Export', () => {
    it('should export data in JSON format', async () => {
      const mockEvents = [
        {
          id: 'event1',
          user_id: 'user1',
          event_type: 'verification_started',
          timestamp: '2024-01-01T10:00:00Z'
        }
      ]

      const mockJourneys = [
        {
          id: 'journey1',
          user_id: 'user1',
          completion_status: 'completed',
          started_at: '2024-01-01T10:00:00Z'
        }
      ]

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({ data: mockEvents, error: null }))
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({ data: mockJourneys, error: null }))
              }))
            }))
          }))
        })

      const result = await dashboard.exportVerificationData(
        '2024-01-01T00:00:00Z',
        '2024-01-02T00:00:00Z',
        'json'
      )

      expect(result).toBeTruthy()
      const parsed = JSON.parse(result!)
      expect(parsed).toEqual({
        export_info: {
          generated_at: expect.any(String),
          date_range: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-01-02T00:00:00Z'
          },
          total_events: 1,
          total_journeys: 1
        },
        events: mockEvents,
        journeys: mockJourneys
      })
    })

    it('should export data in CSV format', async () => {
      const mockEvents = [
        {
          id: 'event1',
          user_id: 'user1',
          event_type: 'verification_started',
          timestamp: '2024-01-01T10:00:00Z',
          duration_ms: 1000,
          event_data: { current_status: 'started' },
          error_details: null
        }
      ]

      const mockJourneys = [
        {
          id: 'journey1',
          user_id: 'user1',
          completion_status: 'completed',
          started_at: '2024-01-01T10:00:00Z',
          current_step: 'verification_completed',
          total_duration_ms: 300000,
          errors_encountered: 0
        }
      ]

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({ data: mockEvents, error: null }))
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({ data: mockJourneys, error: null }))
              }))
            }))
          }))
        })

      const result = await dashboard.exportVerificationData(
        '2024-01-01T00:00:00Z',
        '2024-01-02T00:00:00Z',
        'csv'
      )

      expect(result).toBeTruthy()
      const lines = result!.split('\n')
      expect(lines[0]).toBe('Type,Timestamp,User ID,Event Type,Status,Duration,Error')
      expect(lines[1]).toBe('Event,2024-01-01T10:00:00Z,user1,verification_started,started,1000,')
      expect(lines[2]).toBe('Journey,2024-01-01T10:00:00Z,user1,completed,verification_completed,300000,0')
    })
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = VerificationDashboard.getInstance()
      const instance2 = VerificationDashboard.getInstance()
      
      expect(instance1).toBe(instance2)
    })

    it('should use the exported singleton', () => {
      expect(verificationDashboard).toBe(VerificationDashboard.getInstance())
    })
  })

  describe('Helper Functions', () => {
    it('should provide helper functions for easy access', async () => {
      mockAnalytics.getVerificationMetrics.mockResolvedValue({
        total_started: 10,
        total_completed: 8,
        completion_rate: 80,
        average_completion_time_ms: 300000,
        error_rate: 10,
        common_errors: [],
        abandonment_points: [],
        performance_metrics: {
          avg_api_response_time_ms: 1200,
          p95_api_response_time_ms: 2000,
          slowest_operations: []
        }
      })

      // Mock all the required database calls
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({ data: [], error: null }))
          })),
          eq: vi.fn(() => ({ data: [], error: null }))
        }))
      })

      const result = await getDashboardMetrics()
      expect(result).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully in all methods', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const dashboardResult = await dashboard.getDashboardMetrics()
      const summariesResult = await dashboard.getUserVerificationSummaries()
      const journeyResult = await dashboard.getUserJourneyDetails('user1')
      const exportResult = await dashboard.exportVerificationData('2024-01-01', '2024-01-02')

      expect(dashboardResult).toBeNull()
      expect(summariesResult).toEqual([])
      expect(journeyResult).toBeNull()
      expect(exportResult).toBeNull()

      expect(console.error).toHaveBeenCalledTimes(4)
    })
  })
})