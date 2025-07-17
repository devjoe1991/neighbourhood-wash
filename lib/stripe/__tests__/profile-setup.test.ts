import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all dependencies first
vi.mock('@/utils/supabase/server', () => ({
  createSupabaseServerClient: vi.fn()
}))

vi.mock('@/lib/monitoring/verification-analytics', () => ({
  verificationAnalytics: {
    trackEvent: vi.fn()
  }
}))

vi.mock('@/lib/monitoring/verification-analytics-actions', () => ({
  trackApiCallAction: vi.fn(),
  trackRetryAttemptAction: vi.fn(),
  trackVerificationFailedAction: vi.fn(),
  trackAccountCreatedAction: vi.fn(),
  trackOnboardingLinkGeneratedAction: vi.fn(),
  trackCallbackReceivedAction: vi.fn(),
  trackStatusUpdatedAction: vi.fn(),
  trackVerificationCompletedAction: vi.fn(),
  trackStripeRedirectAction: vi.fn()
}))

vi.mock('@/lib/monitoring/performance-monitor', () => ({
  withStripeApiMonitoring: vi.fn((name, fn) => fn()),
  withDatabaseMonitoring: vi.fn((name, fn) => fn()),
  withVerificationStepMonitoring: vi.fn((name, fn) => fn())
}))

vi.mock('@/lib/monitoring/performance-utils', () => ({
  createSessionId: vi.fn(() => 'test-session-id')
}))

vi.mock('@/lib/stripe/server', () => ({
  stripe: {}
}))

// Now import the functions to test
import { saveProfileSetup, getOnboardingStatus, type ProfileSetupData } from '../actions'
import { createSupabaseServerClient } from '@/utils/supabase/server'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn()
    })),
    insert: vi.fn()
  }))
}

// Setup the mock implementation
vi.mocked(createSupabaseServerClient).mockReturnValue(mockSupabase as any)

describe('Profile Setup - Step 1 Implementation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('saveProfileSetup', () => {
    const validProfileData: ProfileSetupData = {
      serviceArea: 'Central London',
      availability: ['Monday Morning', 'Tuesday Afternoon'],
      serviceTypes: ['Wash & Dry', 'Ironing'],
      preferences: 'Eco-friendly detergents preferred',
      bio: 'Experienced washer with 5 years in the industry',
      phoneNumber: '+44 7123 456789'
    }

    it('should validate required fields', async () => {
      const invalidData = { ...validProfileData, serviceArea: '' }
      
      const result = await saveProfileSetup('user123', invalidData)
      
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Service area is required')
    })

    it('should validate availability is not empty', async () => {
      const invalidData = { ...validProfileData, availability: [] }
      
      const result = await saveProfileSetup('user123', invalidData)
      
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('At least one availability slot is required')
    })

    it('should validate service types is not empty', async () => {
      const invalidData = { ...validProfileData, serviceTypes: [] }
      
      const result = await saveProfileSetup('user123', invalidData)
      
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('At least one service type is required')
    })

    it('should validate phone number is provided', async () => {
      const invalidData = { ...validProfileData, phoneNumber: '' }
      
      const result = await saveProfileSetup('user123', invalidData)
      
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Phone number is required')
    })

    it('should validate bio is provided', async () => {
      const invalidData = { ...validProfileData, bio: '' }
      
      const result = await saveProfileSetup('user123', invalidData)
      
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Bio is required')
    })

    it('should validate user ID is provided', async () => {
      const result = await saveProfileSetup('', validProfileData)
      
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('validation_error')
      expect(result.error?.message).toBe('Valid user ID is required')
    })

    it('should successfully save valid profile data', async () => {
      // Mock successful profile lookup
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user123', role: 'washer' },
              error: null
            })
          }))
        }))
      })

      // Mock successful profile update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      })

      // Mock no existing washer application
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // Not found error
            })
          }))
        }))
      })

      // Mock successful washer application insert
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({ error: null })
      })

      const result = await saveProfileSetup('user123', validProfileData)
      
      expect(result.success).toBe(true)
      expect(result.data?.step).toBe(1)
      expect(result.message).toBe('Profile setup completed successfully')
    })
  })

  describe('getOnboardingStatus', () => {
    it('should return incomplete status for new washer', async () => {
      // Mock profile lookup - washer with no data
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { 
                stripe_account_id: null, 
                stripe_account_status: null, 
                role: 'washer', 
                onboarding_fee_paid: false,
                phone_number: null
              },
              error: null
            })
          }))
        }))
      })

      // Mock no washer application
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          }))
        }))
      })

      const result = await getOnboardingStatus('user123')
      
      expect(result.success).toBe(true)
      expect(result.data?.currentStep).toBe(1)
      expect(result.data?.completedSteps).toEqual([])
      expect(result.data?.isComplete).toBe(false)
    })

    it('should return step 2 for washer with completed profile', async () => {
      // Mock profile lookup
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { 
                stripe_account_id: null, 
                stripe_account_status: null, 
                role: 'washer', 
                onboarding_fee_paid: false,
                phone_number: '+44 7123 456789'
              },
              error: null
            })
          }))
        }))
      })

      // Mock completed washer application
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                phone_number: '+44 7123 456789',
                service_address: 'Central London',
                service_offerings: ['Wash & Dry', 'Ironing'],
                washer_bio: 'Experienced washer',
                equipment_details: 'Availability: Monday Morning'
              },
              error: null
            })
          }))
        }))
      })

      const result = await getOnboardingStatus('user123')
      
      expect(result.success).toBe(true)
      expect(result.data?.currentStep).toBe(2)
      expect(result.data?.completedSteps).toEqual([1])
      expect(result.data?.isComplete).toBe(false)
    })

    it('should return complete status for non-washer users', async () => {
      // Mock profile lookup - regular user
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { 
                stripe_account_id: null, 
                stripe_account_status: null, 
                role: 'user', 
                onboarding_fee_paid: false,
                phone_number: null
              },
              error: null
            })
          }))
        }))
      })

      const result = await getOnboardingStatus('user123')
      
      expect(result.success).toBe(true)
      expect(result.data?.currentStep).toBe(1)
      expect(result.data?.completedSteps).toEqual([1, 2, 3, 4])
      expect(result.data?.isComplete).toBe(true)
    })
  })
})