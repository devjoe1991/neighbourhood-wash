import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  getOnboardingProgress,
  updateOnboardingProgress,
  logOnboardingStep,
  getOnboardingStats,
  initializeOnboardingProgress,
  resetOnboardingProgress
} from '../onboarding-progress'

// Mock Supabase client
const mockSupabaseClient = {
  rpc: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        order: vi.fn(() => ({
          limit: vi.fn()
        })),
        limit: vi.fn(),
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn()
            }))
          }))
        }))
      })),
      upsert: vi.fn(),
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }))
}

vi.mock('@/utils/supabase/server', () => ({
  createSupabaseServerClient: () => mockSupabaseClient
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('Onboarding Progress Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getOnboardingProgress', () => {
    it('should return progress data for valid user', async () => {
      const mockProgressData = {
        currentStep: 2,
        completedSteps: [1],
        isComplete: false,
        startedAt: '2024-01-01T00:00:00Z',
        stepCompletionTimes: { step1: '2024-01-01T01:00:00Z' },
        stepData: { profileSetup: { name: 'Test User' } },
        retryCount: 0
      }

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: mockProgressData,
        error: null
      })

      const result = await getOnboardingProgress('test-user-id')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        currentStep: 2,
        completedSteps: [1],
        isComplete: false,
        startedAt: '2024-01-01T00:00:00Z',
        completedAt: undefined,
        lastActivityAt: undefined,
        stepCompletionTimes: { step1: '2024-01-01T01:00:00Z' },
        stepData: { profileSetup: { name: 'Test User' } },
        retryCount: 0,
        lastError: undefined
      })

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_onboarding_progress', {
        p_user_id: 'test-user-id'
      })
    })

    it('should return error for invalid user ID', async () => {
      const result = await getOnboardingProgress('')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid user ID is required')
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      })

      const result = await getOnboardingProgress('test-user-id')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('database_error')
    })
  })

  describe('updateOnboardingProgress', () => {
    it('should update progress for valid step', async () => {
      const mockUpdateResult = {
        success: true,
        currentStep: 2,
        completedSteps: [1],
        isComplete: false,
        message: 'Step 1 completed successfully'
      }

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: mockUpdateResult,
        error: null
      })

      // Mock the getOnboardingProgress call
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: {
          currentStep: 2,
          completedSteps: [1],
          isComplete: false
        },
        error: null
      })

      const stepData = { name: 'Test User', email: 'test@example.com' }
      const result = await updateOnboardingProgress('test-user-id', 1, stepData, 'session-123')

      expect(result.success).toBe(true)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('update_onboarding_progress', {
        p_user_id: 'test-user-id',
        p_step_number: 1,
        p_step_data: JSON.stringify(stepData),
        p_session_id: 'session-123'
      })
    })

    it('should return error for invalid step number', async () => {
      const result = await updateOnboardingProgress('test-user-id', 5)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Step number must be between 1 and 4')
    })

    it('should handle database update failures', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: { success: false, error: 'Update failed' },
        error: null
      })

      const result = await updateOnboardingProgress('test-user-id', 1)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('update_error')
    })
  })

  describe('logOnboardingStep', () => {
    it('should log step action successfully', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: null
      })

      const result = await logOnboardingStep(
        'test-user-id',
        1,
        'started',
        'success',
        { data: 'test' },
        null,
        'session-123'
      )

      expect(result.success).toBe(true)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('log_onboarding_step', {
        p_user_id: 'test-user-id',
        p_step_number: 1,
        p_action: 'started',
        p_status: 'success',
        p_data: JSON.stringify({ data: 'test' }),
        p_error_details: null,
        p_session_id: 'session-123'
      })
    })

    it('should handle logging errors gracefully', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Logging failed' }
      })

      const result = await logOnboardingStep('test-user-id', 1, 'started')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('database_error')
    })
  })

  describe('getOnboardingStats', () => {
    it('should return comprehensive statistics', async () => {
      const mockStatsData = [
        { current_step: 4, completed_steps: [1, 2, 3, 4], is_complete: true, started_at: '2024-01-01', completed_at: '2024-01-02' },
        { current_step: 2, completed_steps: [1], is_complete: false, started_at: '2024-01-01', completed_at: null },
        { current_step: 3, completed_steps: [1, 2], is_complete: false, started_at: '2024-01-01', completed_at: null }
      ]

      mockSupabaseClient.from().select().mockResolvedValueOnce({
        data: mockStatsData,
        error: null
      })

      const result = await getOnboardingStats()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        totalWashers: 3,
        completedOnboarding: 1,
        inProgress: 2,
        completionRate: 33.333333333333336,
        averageCompletionTime: expect.any(Number),
        stepBreakdown: {
          step1: 3,
          step2: 2,
          step3: 1,
          step4: 1
        },
        recentActivity: {
          last24Hours: expect.any(Number),
          last7Days: expect.any(Number),
          last30Days: expect.any(Number)
        }
      })
    })

    it('should handle empty data gracefully', async () => {
      mockSupabaseClient.from().select().mockResolvedValueOnce({
        data: [],
        error: null
      })

      const result = await getOnboardingStats()

      expect(result.success).toBe(true)
      expect(result.data?.totalWashers).toBe(0)
      expect(result.data?.completionRate).toBe(0)
    })
  })

  describe('initializeOnboardingProgress', () => {
    it('should initialize progress and return current status', async () => {
      // Mock the logOnboardingStep call
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: null
      })

      // Mock the getOnboardingProgress call
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: {
          currentStep: 1,
          completedSteps: [],
          isComplete: false
        },
        error: null
      })

      const result = await initializeOnboardingProgress('test-user-id', 'session-123')

      expect(result.success).toBe(true)
      expect(result.data?.currentStep).toBe(1)
      expect(result.data?.completedSteps).toEqual([])
      expect(result.data?.isComplete).toBe(false)
    })
  })

  describe('resetOnboardingProgress', () => {
    it('should reset progress for admin user', async () => {
      // Mock admin profile check
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null
      })

      // Mock delete operation
      mockSupabaseClient.from().delete().eq.mockResolvedValueOnce({
        data: null,
        error: null
      })

      // Mock logging
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: null
      })

      const result = await resetOnboardingProgress('test-user-id', 'admin-user-id', 'Test reset')

      expect(result.success).toBe(true)
    })

    it('should reject non-admin users', async () => {
      // Mock non-admin profile check
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: { role: 'user' },
        error: null
      })

      const result = await resetOnboardingProgress('test-user-id', 'regular-user-id')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('permission_error')
    })
  })
})

describe('Edge Cases and Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle network timeouts gracefully', async () => {
    mockSupabaseClient.rpc.mockRejectedValueOnce(new Error('Network timeout'))

    const result = await getOnboardingProgress('test-user-id')

    expect(result.success).toBe(false)
    expect(result.error?.type).toBe('unknown_error')
  })

  it('should validate step numbers correctly', async () => {
    const invalidSteps = [-1, 0, 5, 10]

    for (const step of invalidSteps) {
      const result = await updateOnboardingProgress('test-user-id', step)
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
    }
  })

  it('should handle malformed user IDs', async () => {
    const invalidUserIds = ['', '   ', null as any, undefined as any]

    for (const userId of invalidUserIds) {
      const result = await getOnboardingProgress(userId)
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
    }
  })
})