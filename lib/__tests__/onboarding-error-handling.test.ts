/**
 * Tests for onboarding error handling utilities
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import { 
  OnboardingErrorHandler, 
  OnboardingRecovery, 
  OnboardingLoadingManager,
  useOnboardingErrorHandler 
} from '../onboarding-error-handling'
import { logOnboardingStep } from '../onboarding-progress'
import { toast } from '../hooks/use-toast'

// Mock dependencies
vi.mock('../onboarding-progress', () => ({
  logOnboardingStep: vi.fn(),
}))

vi.mock('../hooks/use-toast', () => ({
  toast: vi.fn(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('OnboardingErrorHandler', () => {
  const mockUserId = 'test-user-123'
  const mockSessionId = 'session-456'
  const mockError = new Error('Test error message')

  beforeEach(() => {
    vi.clearAllMocks()
    OnboardingErrorHandler.clearAllErrors(mockUserId)
  })

  describe('handleStepError', () => {
    it('should handle step error and log it', async () => {
      const result = await OnboardingErrorHandler.handleStepError(
        mockUserId,
        1,
        mockError,
        mockSessionId
      )

      expect(result.hasError).toBe(true)
      expect(result.error?.step).toBe(1)
      expect(result.error?.stepName).toBe('Profile Setup')
      expect(result.error?.canRetry).toBe(true)
      expect(result.retryCount).toBe(0)

      expect(logOnboardingStep).toHaveBeenCalledWith(
        mockUserId,
        1,
        'error',
        'failed',
        { errorType: 'Error' },
        { error: 'Test error message' },
        mockSessionId
      )

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Profile Setup Error',
        })
      )
    })

    it('should increment retry count for repeated errors', async () => {
      // First error
      await OnboardingErrorHandler.handleStepError(mockUserId, 1, mockError)
      
      // Second error
      const result = await OnboardingErrorHandler.handleStepError(mockUserId, 1, mockError)
      
      expect(result.retryCount).toBe(1)
    })

    it('should handle different step types correctly', async () => {
      const steps = [
        { step: 1, expectedName: 'Profile Setup' },
        { step: 2, expectedName: 'Identity Verification' },
        { step: 3, expectedName: 'Bank Connection' },
        { step: 4, expectedName: 'Payment Processing' },
      ]

      for (const { step, expectedName } of steps) {
        const result = await OnboardingErrorHandler.handleStepError(mockUserId, step, mockError)
        expect(result.error?.stepName).toBe(expectedName)
      }
    })
  })

  describe('executeStepWithRetry', () => {
    it('should execute operation successfully without retry', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success')

      const result = await OnboardingErrorHandler.executeStepWithRetry(
        mockUserId,
        1,
        mockOperation
      )

      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(1)
      expect(logOnboardingStep).toHaveBeenCalledWith(
        mockUserId,
        1,
        'started',
        'in_progress',
        { stepName: 'Profile Setup' },
        null,
        undefined
      )
      expect(logOnboardingStep).toHaveBeenCalledWith(
        mockUserId,
        1,
        'completed',
        'success',
        { stepName: 'Profile Setup' },
        null,
        undefined
      )
    })

    it('should retry operation on failure and eventually succeed', async () => {
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success')

      const result = await OnboardingErrorHandler.executeStepWithRetry(
        mockUserId,
        1,
        mockOperation,
        { maxAttempts: 3, baseDelay: 10 }
      )

      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledTimes(3)
      
      // Should log retry attempts
      expect(logOnboardingStep).toHaveBeenCalledWith(
        mockUserId,
        1,
        'retry',
        'in_progress',
        expect.objectContaining({ attempt: 1 }),
        expect.any(Object),
        undefined
      )
    })

    it('should fail after max retries and handle error', async () => {
      const mockOperation = vi.fn().mockRejectedValue(mockError)

      await expect(
        OnboardingErrorHandler.executeStepWithRetry(
          mockUserId,
          1,
          mockOperation,
          { maxAttempts: 2, baseDelay: 10 }
        )
      ).rejects.toThrow('Test error message')

      expect(mockOperation).toHaveBeenCalledTimes(2)
      
      // Should handle the final error
      const errorState = OnboardingErrorHandler.getStepErrorState(mockUserId, 1)
      expect(errorState?.hasError).toBe(true)
    })
  })

  describe('canRetryStep', () => {
    it('should return true for retryable errors under limit', async () => {
      await OnboardingErrorHandler.handleStepError(mockUserId, 1, mockError)
      
      expect(OnboardingErrorHandler.canRetryStep(mockUserId, 1)).toBe(true)
    })

    it('should return false after max retries', async () => {
      // Simulate 3 retries
      for (let i = 0; i < 4; i++) {
        await OnboardingErrorHandler.handleStepError(mockUserId, 1, mockError)
      }
      
      expect(OnboardingErrorHandler.canRetryStep(mockUserId, 1)).toBe(false)
    })

    it('should return false for non-existent error state', () => {
      expect(OnboardingErrorHandler.canRetryStep(mockUserId, 1)).toBe(false)
    })
  })

  describe('clearStepError', () => {
    it('should clear error state for specific step', async () => {
      await OnboardingErrorHandler.handleStepError(mockUserId, 1, mockError)
      
      expect(OnboardingErrorHandler.getStepErrorState(mockUserId, 1)).toBeTruthy()
      
      OnboardingErrorHandler.clearStepError(mockUserId, 1)
      
      expect(OnboardingErrorHandler.getStepErrorState(mockUserId, 1)).toBeNull()
    })
  })

  describe('clearAllErrors', () => {
    it('should clear all error states for user', async () => {
      await OnboardingErrorHandler.handleStepError(mockUserId, 1, mockError)
      await OnboardingErrorHandler.handleStepError(mockUserId, 2, mockError)
      
      OnboardingErrorHandler.clearAllErrors(mockUserId)
      
      expect(OnboardingErrorHandler.getStepErrorState(mockUserId, 1)).toBeNull()
      expect(OnboardingErrorHandler.getStepErrorState(mockUserId, 2)).toBeNull()
    })
  })
})

describe('OnboardingRecovery', () => {
  const mockUserId = 'test-user-123'
  const mockRecoveryData = {
    userId: mockUserId,
    step: 2,
    data: { test: 'data' },
    timestamp: Date.now(),
    url: 'http://localhost:3000/washer/onboarding',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('saveRecoveryState', () => {
    it('should save recovery state to localStorage', () => {
      OnboardingRecovery.saveRecoveryState(mockUserId, 2, { test: 'data' })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'onboarding_recovery',
        expect.stringContaining(mockUserId)
      )
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      // Should not throw
      expect(() => {
        OnboardingRecovery.saveRecoveryState(mockUserId, 2, { test: 'data' })
      }).not.toThrow()
    })
  })

  describe('getRecoveryState', () => {
    it('should return recovery state if valid and not expired', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockRecoveryData))

      const result = OnboardingRecovery.getRecoveryState()

      expect(result).toEqual(mockRecoveryData)
    })

    it('should return null if no recovery state exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = OnboardingRecovery.getRecoveryState()

      expect(result).toBeNull()
    })

    it('should return null and clear expired recovery state', () => {
      const expiredData = {
        ...mockRecoveryData,
        timestamp: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredData))

      const result = OnboardingRecovery.getRecoveryState()

      expect(result).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('onboarding_recovery')
    })

    it('should handle JSON parse errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      const result = OnboardingRecovery.getRecoveryState()

      expect(result).toBeNull()
    })
  })

  describe('clearRecoveryState', () => {
    it('should remove recovery state from localStorage', () => {
      OnboardingRecovery.clearRecoveryState()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('onboarding_recovery')
    })
  })

  describe('hasRecoveryState', () => {
    it('should return true if valid recovery state exists', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockRecoveryData))

      expect(OnboardingRecovery.hasRecoveryState()).toBe(true)
    })

    it('should return false if no recovery state exists', () => {
      localStorageMock.getItem.mockReturnValue(null)

      expect(OnboardingRecovery.hasRecoveryState()).toBe(false)
    })
  })
})

describe('OnboardingLoadingManager', () => {
  const mockUserId = 'test-user-123'

  beforeEach(() => {
    OnboardingLoadingManager.clearLoading(mockUserId)
  })

  describe('setLoading and isLoading', () => {
    it('should set and get loading state correctly', () => {
      expect(OnboardingLoadingManager.isLoading(mockUserId, 1)).toBe(false)

      OnboardingLoadingManager.setLoading(mockUserId, 1, true)
      expect(OnboardingLoadingManager.isLoading(mockUserId, 1)).toBe(true)

      OnboardingLoadingManager.setLoading(mockUserId, 1, false)
      expect(OnboardingLoadingManager.isLoading(mockUserId, 1)).toBe(false)
    })

    it('should handle multiple steps independently', () => {
      OnboardingLoadingManager.setLoading(mockUserId, 1, true)
      OnboardingLoadingManager.setLoading(mockUserId, 2, false)

      expect(OnboardingLoadingManager.isLoading(mockUserId, 1)).toBe(true)
      expect(OnboardingLoadingManager.isLoading(mockUserId, 2)).toBe(false)
    })
  })

  describe('clearLoading', () => {
    it('should clear all loading states for user', () => {
      OnboardingLoadingManager.setLoading(mockUserId, 1, true)
      OnboardingLoadingManager.setLoading(mockUserId, 2, true)

      OnboardingLoadingManager.clearLoading(mockUserId)

      expect(OnboardingLoadingManager.isLoading(mockUserId, 1)).toBe(false)
      expect(OnboardingLoadingManager.isLoading(mockUserId, 2)).toBe(false)
    })
  })
})

describe('Error message mapping', () => {
  it('should provide appropriate error messages for each step', async () => {
    const steps = [
      { step: 1, expectedTitle: 'Profile Setup Error' },
      { step: 2, expectedTitle: 'Identity Verification Error' },
      { step: 3, expectedTitle: 'Bank Connection Error' },
      { step: 4, expectedTitle: 'Payment Processing Error' },
    ]

    for (const { step, expectedTitle } of steps) {
      await OnboardingErrorHandler.handleStepError('user', step, new Error('test'))
      
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expectedTitle,
        })
      )
    }
  })
})

describe('Integration scenarios', () => {
  const mockUserId = 'test-user-123'

  beforeEach(() => {
    vi.clearAllMocks()
    OnboardingErrorHandler.clearAllErrors(mockUserId)
  })

  it('should handle complete error recovery flow', async () => {
    // 1. Operation fails
    const mockOperation = vi.fn().mockRejectedValue(new Error('Network error'))
    
    try {
      await OnboardingErrorHandler.executeStepWithRetry(mockUserId, 1, mockOperation)
    } catch (error) {
      // Expected to fail
    }

    // 2. Check error state
    const errorState = OnboardingErrorHandler.getStepErrorState(mockUserId, 1)
    expect(errorState?.hasError).toBe(true)
    expect(OnboardingErrorHandler.canRetryStep(mockUserId, 1)).toBe(true)

    // 3. Retry succeeds
    const retryOperation = vi.fn().mockResolvedValue('success')
    await OnboardingErrorHandler.retryStep(mockUserId, 1, retryOperation)

    // 4. Error state should be cleared
    expect(OnboardingErrorHandler.getStepErrorState(mockUserId, 1)).toBeNull()
  })

  it('should handle recovery state persistence across page reloads', () => {
    // Save recovery state
    OnboardingRecovery.saveRecoveryState(mockUserId, 2, { accountId: 'acc_123' })

    // Simulate page reload by getting state
    const recoveryState = OnboardingRecovery.getRecoveryState()
    
    expect(recoveryState).toEqual(
      expect.objectContaining({
        userId: mockUserId,
        step: 2,
        data: { accountId: 'acc_123' },
      })
    )

    // Clear state after recovery
    OnboardingRecovery.clearRecoveryState()
    expect(OnboardingRecovery.getRecoveryState()).toBeNull()
  })
})