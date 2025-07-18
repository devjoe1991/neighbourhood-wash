import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  getOnboardingStatus,
  saveProfileSetup,
  initiateStripeKYC,
  processOnboardingPayment,
  confirmOnboardingPayment,
  completeOnboarding,
  checkBankConnectionStatus
} from '../actions'
import { stripe } from '../server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

// Mock Stripe
vi.mock('../server', () => ({
  stripe: {
    accounts: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
    accountLinks: {
      create: vi.fn(),
    },
    paymentIntents: {
      create: vi.fn(),
      confirm: vi.fn(),
      retrieve: vi.fn(),
    },
  },
}))

// Mock Supabase
vi.mock('@/utils/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

// Mock onboarding progress functions
vi.mock('@/lib/onboarding-progress', () => ({
  getOnboardingProgress: vi.fn(),
  updateOnboardingProgress: vi.fn(),
  logOnboardingStep: vi.fn(),
  initializeOnboardingProgress: vi.fn(),
}))

import { 
  getOnboardingProgress,
  updateOnboardingProgress,
  logOnboardingStep,
  initializeOnboardingProgress
} from '@/lib/onboarding-progress'

describe('Onboarding Service Functions', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createSupabaseServerClient).mockReturnValue(mockSupabase as any)
  })

  describe('getOnboardingStatus', () => {
    it('should return onboarding status from progress tracking', async () => {
      const mockProgressData = {
        currentStep: 2,
        completedSteps: [1],
        isComplete: false,
        stepData: {
          profileSetup: {
            serviceArea: 'London',
            phoneNumber: '+44 7123 456789',
            bio: 'Experienced washer'
          }
        }
      }

      vi.mocked(getOnboardingProgress).mockResolvedValue({
        success: true,
        data: mockProgressData
      })

      mockSupabase.from().single.mockResolvedValue({
        data: { 
          stripe_account_id: 'acct_test123',
          role: 'washer',
          onboarding_fee_paid: false
        },
        error: null,
      })

      const result = await getOnboardingStatus('user123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        currentStep: 2,
        completedSteps: [1],
        isComplete: false,
        profileData: mockProgressData.stepData.profileSetup,
        stripeAccountId: 'acct_test123',
        bankConnected: false,
        paymentCompleted: false,
      })

      expect(vi.mocked(getOnboardingProgress)).toHaveBeenCalledWith('user123')
    })

    it('should fall back to legacy logic when progress tracking unavailable', async () => {
      vi.mocked(getOnboardingProgress).mockResolvedValue({
        success: false,
        error: { type: 'database_error', message: 'Progress not found' }
      })

      mockSupabase.from().single
        .mockResolvedValueOnce({
          data: { 
            stripe_account_id: 'acct_test123',
            stripe_account_status: 'complete',
            role: 'washer',
            onboarding_fee_paid: true
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            phone_number: '+44 7123 456789',
            service_address: 'London',
            service_offerings: ['Wash & Dry'],
            washer_bio: 'Experienced washer with 5 years experience'
          },
          error: null,
        })

      vi.mocked(stripe.accounts.retrieve).mockResolvedValue({
        id: 'acct_test123',
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: true,
        requirements: { currently_due: [], eventually_due: [], past_due: [], pending_verification: [] },
      } as any)

      const result = await getOnboardingStatus('user123')

      expect(result.success).toBe(true)
      expect(result.data?.currentStep).toBe(4)
      expect(result.data?.completedSteps).toEqual([1, 2, 3, 4])
      expect(result.data?.isComplete).toBe(true)
    })

    it('should handle non-washer users', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: { 
          role: 'customer'
        },
        error: null,
      })

      const result = await getOnboardingStatus('user123')

      expect(result.success).toBe(true)
      expect(result.data?.isComplete).toBe(true)
      expect(result.data?.completedSteps).toEqual([1, 2, 3, 4])
    })

    it('should handle invalid user ID', async () => {
      const result = await getOnboardingStatus('')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid user ID is required')
    })

    it('should handle profile not found', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' },
      })

      const result = await getOnboardingStatus('user123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('unknown_error')
      expect(result.error?.message).toBe('Failed to retrieve user profile')
    })
  })

  describe('saveProfileSetup', () => {
    const mockProfileData = {
      serviceArea: 'Central London',
      availability: ['Monday Morning', 'Tuesday Afternoon'],
      serviceTypes: ['Wash & Dry', 'Ironing'],
      preferences: 'Eco-friendly products',
      bio: 'Experienced washer with 5 years in the industry',
      phoneNumber: '+44 7123 456789'
    }

    it('should save profile setup data successfully', async () => {
      mockSupabase.from().upsert.mockResolvedValue({ error: null })
      vi.mocked(updateOnboardingProgress).mockResolvedValue({
        success: true,
        data: { currentStep: 2, completedSteps: [1], isComplete: false }
      })
      vi.mocked(logOnboardingStep).mockResolvedValue({ success: true })

      const result = await saveProfileSetup('user123', mockProfileData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Profile setup completed successfully')

      expect(mockSupabase.from().upsert).toHaveBeenCalledWith({
        user_id: 'user123',
        phone_number: '+44 7123 456789',
        service_address: 'Central London',
        service_offerings: ['Wash & Dry', 'Ironing'],
        equipment_details: 'Eco-friendly products',
        washer_bio: 'Experienced washer with 5 years in the industry',
        availability_schedule: ['Monday Morning', 'Tuesday Afternoon'],
        updated_at: expect.any(String)
      })

      expect(vi.mocked(updateOnboardingProgress)).toHaveBeenCalledWith(
        'user123',
        1,
        mockProfileData,
        undefined
      )
    })

    it('should handle invalid user ID', async () => {
      const result = await saveProfileSetup('', mockProfileData)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid user ID is required')
    })

    it('should validate required profile data', async () => {
      const invalidData = {
        serviceArea: '',
        availability: [],
        serviceTypes: [],
        preferences: '',
        bio: '',
        phoneNumber: ''
      }

      const result = await saveProfileSetup('user123', invalidData)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toContain('required')
    })

    it('should handle database save failure', async () => {
      mockSupabase.from().upsert.mockResolvedValue({ 
        error: { message: 'Database error' } 
      })

      const result = await saveProfileSetup('user123', mockProfileData)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('database_error')
    })
  })

  describe('initiateStripeKYC', () => {
    it('should create new Stripe account and return onboarding URL', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: { 
          stripe_account_id: null,
          role: 'washer'
        },
        error: null,
      })

      vi.mocked(stripe.accounts.create).mockResolvedValue({
        id: 'acct_test123',
      } as any)

      mockSupabase.from().update().eq().mockResolvedValue({ error: null })

      vi.mocked(stripe.accountLinks.create).mockResolvedValue({
        url: 'https://connect.stripe.com/setup/test',
      } as any)

      const result = await initiateStripeKYC('user123')

      expect(result.success).toBe(true)
      expect(result.data?.accountId).toBe('acct_test123')
      expect(result.data?.onboardingUrl).toBe('https://connect.stripe.com/setup/test')

      expect(vi.mocked(stripe.accounts.create)).toHaveBeenCalledWith({
        type: 'express',
        email: undefined,
        business_type: 'individual',
        country: 'GB',
      })
    })

    it('should use existing Stripe account if available', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: { 
          stripe_account_id: 'acct_existing123',
          role: 'washer'
        },
        error: null,
      })

      vi.mocked(stripe.accountLinks.create).mockResolvedValue({
        url: 'https://connect.stripe.com/setup/existing',
      } as any)

      const result = await initiateStripeKYC('user123')

      expect(result.success).toBe(true)
      expect(result.data?.accountId).toBe('acct_existing123')
      expect(result.data?.onboardingUrl).toBe('https://connect.stripe.com/setup/existing')

      expect(vi.mocked(stripe.accounts.create)).not.toHaveBeenCalled()
    })

    it('should handle non-washer user', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: { 
          role: 'customer'
        },
        error: null,
      })

      const result = await initiateStripeKYC('user123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Only washers can complete KYC verification')
    })

    it('should handle Stripe account creation failure', async () => {
      mockSupabase.from().single.mockResolvedValue({
        data: { 
          stripe_account_id: null,
          role: 'washer'
        },
        error: null,
      })

      vi.mocked(stripe.accounts.create).mockRejectedValue(new Error('Stripe error'))

      const result = await initiateStripeKYC('user123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('unknown_error')
    })
  })

  describe('processOnboardingPayment', () => {
    it('should create payment intent successfully', async () => {
      vi.mocked(stripe.paymentIntents.create).mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        amount: 1500,
        currency: 'gbp',
        status: 'requires_payment_method',
      } as any)

      const result = await processOnboardingPayment('user123')

      expect(result.success).toBe(true)
      expect(result.paymentIntentId).toBe('pi_test123')

      expect(vi.mocked(stripe.paymentIntents.create)).toHaveBeenCalledWith({
        amount: 1500, // £15 in pence
        currency: 'gbp',
        metadata: {
          user_id: 'user123',
          type: 'onboarding_fee'
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })
    })

    it('should handle invalid user ID', async () => {
      const result = await processOnboardingPayment('')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid user ID is required')
    })

    it('should handle Stripe payment intent creation failure', async () => {
      vi.mocked(stripe.paymentIntents.create).mockRejectedValue(new Error('Payment failed'))

      const result = await processOnboardingPayment('user123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('unknown_error')
    })
  })

  describe('confirmOnboardingPayment', () => {
    it('should confirm payment and update user profile', async () => {
      vi.mocked(stripe.paymentIntents.retrieve).mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
        metadata: { user_id: 'user123', type: 'onboarding_fee' },
      } as any)

      mockSupabase.from().update().eq().mockResolvedValue({ error: null })
      vi.mocked(updateOnboardingProgress).mockResolvedValue({
        success: true,
        data: { currentStep: 4, completedSteps: [1, 2, 3, 4], isComplete: true }
      })

      const result = await confirmOnboardingPayment('pi_test123')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('succeeded')

      expect(mockSupabase.from().update().eq()).toHaveBeenCalledWith('user123')
      expect(vi.mocked(updateOnboardingProgress)).toHaveBeenCalledWith('user123', 4)
    })

    it('should handle payment not succeeded', async () => {
      vi.mocked(stripe.paymentIntents.retrieve).mockResolvedValue({
        id: 'pi_test123',
        status: 'requires_payment_method',
        metadata: { user_id: 'user123', type: 'onboarding_fee' },
      } as any)

      const result = await confirmOnboardingPayment('pi_test123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('payment_error')
      expect(result.error?.message).toBe('Payment has not been completed successfully')
    })

    it('should handle invalid payment intent ID', async () => {
      const result = await confirmOnboardingPayment('')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid payment intent ID is required')
    })

    it('should handle database update failure', async () => {
      vi.mocked(stripe.paymentIntents.retrieve).mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
        metadata: { user_id: 'user123', type: 'onboarding_fee' },
      } as any)

      mockSupabase.from().update().eq().mockResolvedValue({ 
        error: { message: 'Database error' } 
      })

      const result = await confirmOnboardingPayment('pi_test123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('database_error')
    })
  })

  describe('completeOnboarding', () => {
    it('should complete onboarding and unlock features', async () => {
      mockSupabase.from().update().eq().mockResolvedValue({ error: null })
      vi.mocked(updateOnboardingProgress).mockResolvedValue({
        success: true,
        data: { currentStep: 4, completedSteps: [1, 2, 3, 4], isComplete: true }
      })
      vi.mocked(logOnboardingStep).mockResolvedValue({ success: true })

      const result = await completeOnboarding('user123')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Onboarding completed successfully')

      expect(mockSupabase.from().update().eq()).toHaveBeenCalledWith('user123')
      expect(vi.mocked(logOnboardingStep)).toHaveBeenCalledWith(
        'user123',
        4,
        'completed',
        'success',
        { onboarding_completed: true },
        null,
        undefined
      )
    })

    it('should handle invalid user ID', async () => {
      const result = await completeOnboarding('')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid user ID is required')
    })

    it('should handle database update failure', async () => {
      mockSupabase.from().update().eq().mockResolvedValue({ 
        error: { message: 'Database error' } 
      })

      const result = await completeOnboarding('user123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('database_error')
    })
  })

  describe('checkBankConnectionStatus', () => {
    it('should return bank connection status', async () => {
      vi.mocked(stripe.accounts.retrieve).mockResolvedValue({
        id: 'acct_test123',
        external_accounts: {
          data: [{ id: 'ba_test123', object: 'bank_account' }]
        },
        payouts_enabled: true,
      } as any)

      const result = await checkBankConnectionStatus('acct_test123')

      expect(result.success).toBe(true)
      expect(result.data?.bankConnected).toBe(true)
      expect(result.data?.payoutsEnabled).toBe(true)
    })

    it('should handle account without bank connection', async () => {
      vi.mocked(stripe.accounts.retrieve).mockResolvedValue({
        id: 'acct_test123',
        external_accounts: { data: [] },
        payouts_enabled: false,
      } as any)

      const result = await checkBankConnectionStatus('acct_test123')

      expect(result.success).toBe(true)
      expect(result.data?.bankConnected).toBe(false)
      expect(result.data?.payoutsEnabled).toBe(false)
    })

    it('should handle invalid account ID', async () => {
      const result = await checkBankConnectionStatus('')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid Stripe account ID is required')
    })

    it('should handle Stripe API error', async () => {
      vi.mocked(stripe.accounts.retrieve).mockRejectedValue(new Error('Account not found'))

      const result = await checkBankConnectionStatus('acct_test123')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('unknown_error')
    })
  })
})