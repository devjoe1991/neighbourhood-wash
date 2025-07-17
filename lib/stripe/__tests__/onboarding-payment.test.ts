import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the modules first
vi.mock('@/lib/stripe/server', () => ({
  stripe: {
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
  },
}))

vi.mock('@/utils/supabase/server', () => ({
  createSupabaseServerClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  }),
}))

vi.mock('../actions', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getOnboardingStatus: vi.fn(),
  }
})

// Import after mocking
import { processOnboardingPayment, confirmOnboardingPayment, completeOnboarding } from '../actions'
import { stripe } from '@/lib/stripe/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

describe('Onboarding Payment Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('processOnboardingPayment', () => {
    it('should create payment intent for valid washer', async () => {
      const mockSupabase = vi.mocked(createSupabaseServerClient())
      const mockStripe = vi.mocked(stripe)
      
      // Mock profile data
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          role: 'washer',
          onboarding_fee_paid: false,
          email: 'test@example.com',
        },
        error: null,
      })

      // Mock Stripe payment intent creation
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_test',
        amount: 1500,
        currency: 'gbp',
      })

      const result = await processOnboardingPayment('user123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        clientSecret: 'pi_test123_secret_test',
        paymentIntentId: 'pi_test123',
        amount: 1500,
      })

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1500,
        currency: 'gbp',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          type: 'onboarding_fee',
          user_id: 'user123',
          user_email: 'test@example.com',
        },
        description: 'Neighbourhood Wash - Washer Onboarding Fee',
      })
    })

    it('should reject non-washer users', async () => {
      const mockSupabase = vi.mocked(createSupabaseServerClient())
      
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          role: 'user',
          onboarding_fee_paid: false,
          email: 'test@example.com',
        },
        error: null,
      })

      const result = await processOnboardingPayment('user123')

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Only washers can pay the onboarding fee')
    })

    it('should reject users who already paid', async () => {
      const mockSupabase = vi.mocked(createSupabaseServerClient())
      
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          role: 'washer',
          onboarding_fee_paid: true,
          email: 'test@example.com',
        },
        error: null,
      })

      const result = await processOnboardingPayment('user123')

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Onboarding fee has already been paid')
    })

    it('should handle invalid user ID', async () => {
      const result = await processOnboardingPayment('')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid user ID is required')
    })

    it('should handle profile not found', async () => {
      const mockSupabase = vi.mocked(createSupabaseServerClient())
      
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' },
      })

      const result = await processOnboardingPayment('user123')

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('User profile not found')
    })

    it('should handle Stripe payment intent creation failure', async () => {
      const mockSupabase = vi.mocked(createSupabaseServerClient())
      const mockStripe = vi.mocked(stripe)
      
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          role: 'washer',
          onboarding_fee_paid: false,
          email: 'test@example.com',
        },
        error: null,
      })

      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test123',
        client_secret: null, // Simulate failure
      })

      const result = await processOnboardingPayment('user123')

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Failed to create payment intent')
    })
  })

  describe('confirmOnboardingPayment', () => {
    it('should confirm successful payment and update profile', async () => {
      const mockSupabase = vi.mocked(createSupabaseServerClient())
      const mockStripe = vi.mocked(stripe)
      
      // Mock Stripe payment intent retrieval
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
        metadata: {
          user_id: 'user123',
        },
      })

      // Mock profile update
      mockSupabase.from().update().eq.mockResolvedValue({
        error: null,
      })

      const result = await confirmOnboardingPayment('user123', 'pi_test123')

      expect(result.success).toBe(true)
      expect(result.data?.completed).toBe(true)

      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_test123')
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ onboarding_fee_paid: true })
    })

    it('should reject incomplete payments', async () => {
      const mockStripe = vi.mocked(stripe)
      
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test123',
        status: 'requires_payment_method',
        metadata: {
          user_id: 'user123',
        },
      })

      const result = await confirmOnboardingPayment('user123', 'pi_test123')

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Payment not completed. Status: requires_payment_method')
    })

    it('should reject payment for wrong user', async () => {
      const mockStripe = vi.mocked(stripe)
      
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
        metadata: {
          user_id: 'different_user',
        },
      })

      const result = await confirmOnboardingPayment('user123', 'pi_test123')

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Payment does not belong to this user')
    })

    it('should handle invalid parameters', async () => {
      const result1 = await confirmOnboardingPayment('', 'pi_test123')
      expect(result1.success).toBe(false)
      expect(result1.error?.message).toBe('Valid user ID is required')

      const result2 = await confirmOnboardingPayment('user123', '')
      expect(result2.success).toBe(false)
      expect(result2.error?.message).toBe('Valid payment intent ID is required')
    })

    it('should handle profile update failure', async () => {
      const mockSupabase = vi.mocked(createSupabaseServerClient())
      const mockStripe = vi.mocked(stripe)
      
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
        metadata: {
          user_id: 'user123',
        },
      })

      mockSupabase.from().update().eq.mockResolvedValue({
        error: { message: 'Database error' },
      })

      const result = await confirmOnboardingPayment('user123', 'pi_test123')

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Failed to update payment status')
    })
  })

  describe('completeOnboarding', () => {
    it('should complete onboarding when all steps are done', async () => {
      const { getOnboardingStatus } = await import('../actions')
      
      // Mock complete onboarding status
      vi.mocked(getOnboardingStatus).mockResolvedValue({
        success: true,
        data: {
          currentStep: 4,
          completedSteps: [1, 2, 3, 4],
          isComplete: true,
        },
      })

      const result = await completeOnboarding('user123')

      expect(result.success).toBe(true)
      expect(result.data?.unlocked).toBe(true)
      expect(result.message).toBe('Onboarding completed successfully. All features unlocked.')
    })

    it('should reject incomplete onboarding', async () => {
      const { getOnboardingStatus } = await import('../actions')
      
      // Mock incomplete onboarding status
      vi.mocked(getOnboardingStatus).mockResolvedValue({
        success: true,
        data: {
          currentStep: 3,
          completedSteps: [1, 2],
          isComplete: false,
        },
      })

      const result = await completeOnboarding('user123')

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Onboarding not complete. Completed steps: 2/4')
    })

    it('should handle invalid user ID', async () => {
      const result = await completeOnboarding('')

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Valid user ID is required')
    })

    it('should handle onboarding status check failure', async () => {
      const { getOnboardingStatus } = await import('../actions')
      
      vi.mocked(getOnboardingStatus).mockResolvedValue({
        success: false,
        error: {
          type: 'unknown_error',
          message: 'Failed to check status',
        },
      })

      const result = await completeOnboarding('user123')

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Failed to check status')
    })
  })
})