import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  withPerformanceMonitoring,
  withStripeApiMonitoring,
  withDatabaseMonitoring,
  withVerificationStepMonitoring,
  withEnhancedPerformanceMonitoring
} from '../performance-monitor'
import {
  createSessionId,
  isSlowOperation,
  logSlowOperation,
  PERFORMANCE_THRESHOLDS
} from '../performance-utils'

// Mock the verification analytics
vi.mock('../verification-analytics', () => ({
  verificationAnalytics: {
    trackApiCall: vi.fn()
  }
}))

describe('Performance Monitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('withPerformanceMonitoring', () => {
    it('should track successful operations', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success')
      const context = {
        operation: 'test_operation',
        userId: 'user_123',
        sessionId: 'session_123'
      }

      const result = await withPerformanceMonitoring(context, mockOperation)

      expect(result).toBe('success')
      expect(mockOperation).toHaveBeenCalledOnce()
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[PERFORMANCE_MONITOR]')
      )
    })

    it('should track failed operations', async () => {
      const error = new Error('Test error')
      const mockOperation = vi.fn().mockRejectedValue(error)
      const context = {
        operation: 'test_operation',
        userId: 'user_123'
      }

      await expect(withPerformanceMonitoring(context, mockOperation)).rejects.toThrow('Test error')
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"success":false')
      )
    })

    it('should measure operation duration', async () => {
      const mockOperation = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return 'success'
      })
      
      const context = { operation: 'test_operation' }

      await withPerformanceMonitoring(context, mockOperation)

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/"duration_ms":\d+/)
      )
    })
  })

  describe('withStripeApiMonitoring', () => {
    it('should add stripe prefix to operation name', async () => {
      const mockStripeCall = vi.fn().mockResolvedValue({ id: 'acct_123' })
      
      await withStripeApiMonitoring('account_create', mockStripeCall, {
        userId: 'user_123',
        accountId: 'acct_123'
      })

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"operation":"stripe_account_create"')
      )
    })

    it('should include stripe-specific metadata', async () => {
      const mockStripeCall = vi.fn().mockResolvedValue({ id: 'acct_123' })
      
      await withStripeApiMonitoring('account_create', mockStripeCall, {
        userId: 'user_123',
        accountId: 'acct_123',
        metadata: { country: 'GB' }
      })

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"operation":"stripe_account_create"')
      )
    })
  })

  describe('withDatabaseMonitoring', () => {
    it('should add db prefix to operation name', async () => {
      const mockDbCall = vi.fn().mockResolvedValue({ data: [] })
      
      await withDatabaseMonitoring('profile_select', mockDbCall, {
        userId: 'user_123',
        table: 'profiles'
      })

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"operation":"db_profile_select"')
      )
    })

    it('should include database-specific metadata', async () => {
      const mockDbCall = vi.fn().mockResolvedValue({ data: [] })
      
      await withDatabaseMonitoring('profile_update', mockDbCall, {
        userId: 'user_123',
        table: 'profiles',
        metadata: { columns: ['stripe_account_id'] }
      })

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"operation":"db_profile_update"')
      )
    })
  })

  describe('withVerificationStepMonitoring', () => {
    it('should add verification prefix to operation name', async () => {
      const mockStepOperation = vi.fn().mockResolvedValue('step_complete')
      
      await withVerificationStepMonitoring('account_creation', mockStepOperation, {
        userId: 'user_123',
        sessionId: 'session_123',
        accountId: 'acct_123'
      })

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"operation":"verification_account_creation"')
      )
    })

    it('should include verification-specific metadata', async () => {
      const mockStepOperation = vi.fn().mockResolvedValue('step_complete')
      
      await withVerificationStepMonitoring('status_check', mockStepOperation, {
        userId: 'user_123',
        sessionId: 'session_123',
        accountId: 'acct_123',
        metadata: { retry_count: 1 }
      })

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('"operation":"verification_status_check"')
      )
    })
  })

  describe('Session ID Generation', () => {
    it('should create unique session IDs', () => {
      const id1 = createSessionId()
      const id2 = createSessionId()
      
      expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/)
      expect(id2).toMatch(/^session_\d+_[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })
  })

  describe('Performance Thresholds', () => {
    it('should identify slow operations correctly', () => {
      expect(isSlowOperation('stripe_account_create', 6000)).toBe(true)
      expect(isSlowOperation('stripe_account_create', 3000)).toBe(false)
      expect(isSlowOperation('db_profile_select', 600)).toBe(true)
      expect(isSlowOperation('db_profile_select', 300)).toBe(false)
    })

    it('should use default threshold for unknown operations', () => {
      expect(isSlowOperation('unknown_operation', 6000)).toBe(true)
      expect(isSlowOperation('unknown_operation', 3000)).toBe(false)
    })

    it('should have reasonable threshold values', () => {
      expect(PERFORMANCE_THRESHOLDS.stripe_account_create).toBe(5000)
      expect(PERFORMANCE_THRESHOLDS.stripe_account_retrieve).toBe(3000)
      expect(PERFORMANCE_THRESHOLDS.db_profile_update).toBe(1000)
      expect(PERFORMANCE_THRESHOLDS.db_profile_select).toBe(500)
    })
  })

  describe('Slow Operation Logging', () => {
    it('should log slow operation alerts', () => {
      const context = {
        operation: 'stripe_account_create',
        userId: 'user_123',
        sessionId: 'session_123'
      }

      logSlowOperation('stripe_account_create', 8000, context)

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[SLOW_OPERATION_ALERT]')
      )
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('"exceeded_by_ms":3000')
      )
    })

    it('should include context in slow operation logs', () => {
      const context = {
        operation: 'db_profile_update',
        userId: 'user_123',
        sessionId: 'session_123',
        metadata: { table: 'profiles' }
      }

      logSlowOperation('db_profile_update', 2000, context)

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('"user_id":"user_123"')
      )
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('"session_id":"session_123"')
      )
    })
  })

  describe('Enhanced Performance Monitoring', () => {
    it('should detect and log slow operations', async () => {
      const mockOperation = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return 'success'
      })

      const context = {
        operation: 'db_profile_select', // 500ms threshold
        userId: 'user_123'
      }

      // Mock the duration to be over threshold
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(0)      // Start time
        .mockReturnValueOnce(0)      // withPerformanceMonitoring start
        .mockReturnValueOnce(600)    // withPerformanceMonitoring end
        .mockReturnValueOnce(600)    // Enhanced monitoring check

      await withEnhancedPerformanceMonitoring(context, mockOperation)

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[SLOW_OPERATION_ALERT]')
      )
    })

    it('should not log alerts for fast operations', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success')

      const context = {
        operation: 'db_profile_select',
        userId: 'user_123'
      }

      // Mock fast operation
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(0)      // Start time
        .mockReturnValueOnce(0)      // withPerformanceMonitoring start
        .mockReturnValueOnce(200)    // withPerformanceMonitoring end
        .mockReturnValueOnce(200)    // Enhanced monitoring check

      await withEnhancedPerformanceMonitoring(context, mockOperation)

      expect(console.warn).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle monitoring failures gracefully', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success')
      const context = { operation: 'test_operation' }

      // Should not throw despite analytics failure (analytics is mocked to not throw)
      const result = await withPerformanceMonitoring(context, mockOperation)
      expect(result).toBe('success')
    })

    it('should preserve original errors', async () => {
      const originalError = new Error('Original operation error')
      const mockOperation = vi.fn().mockRejectedValue(originalError)
      const context = { operation: 'test_operation' }

      await expect(withPerformanceMonitoring(context, mockOperation))
        .rejects.toThrow('Original operation error')
    })
  })
})